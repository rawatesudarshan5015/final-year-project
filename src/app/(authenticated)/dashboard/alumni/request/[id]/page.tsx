'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/db/types';
import { UserAvatar } from '@/components/UserAvatar';
import { getDisplayRoleName } from '@/lib/utils';
import { 
  PaperClipIcon, 
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function RequestReferralPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          // Verify this is a direct referral post
          if (data.post.category !== 'alumni_referral' || 
              data.post.details?.referral_type !== 'direct_referral') {
            router.push('/dashboard/alumni');
            return;
          }
          
          setPost(data.post);
        } else {
          throw new Error(data.error || 'Failed to fetch post');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load the referral post. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB');
        return;
      }
      
      // Check file type (PDF, DOC, DOCX)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Resume must be in PDF, DOC, or DOCX format');
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  const clearFile = () => {
    setResumeFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!message.trim()) {
        throw new Error('Please include a message with your referral request');
      }

      if (!post || !post.author_id) {
        throw new Error('Invalid post or author information');
      }

      // First, upload the resume if provided
      let resumeUrl = '';
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('type', 'resume');

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload resume');
        }

        resumeUrl = uploadData.url;
      }

      // Then, create the referral request
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          alumni_id: post.author_id,
          post_id: post._id,
          message,
          resume_url: resumeUrl
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit referral request');
      }

      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/alumni');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-gray-600">
            {error || 'The referral post could not be found. It may have been removed.'}
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard/alumni')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Alumni Referrals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Request Referral</h1>
        </div>

        <div className="p-6">
          {/* Post Information */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <UserAvatar
                imageUrl={post.author?.profile_pic_url}
                name={post.author?.name || 'Unknown'}
                size="md"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-medium text-gray-900">{post.author?.name}</h2>
                  {post.author?.role && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getDisplayRoleName(post.author.role)}
                    </span>
                  )}
                </div>
                {post.author?.current_internship && (
                  <p className="text-sm text-gray-600">
                    {post.author.current_internship.position} at {post.author.current_internship.company_name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {post.details?.position} at {post.details?.company_name}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{post.description}</p>
            </div>
          </div>

          {/* Referral Request Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message to {post.author?.name} <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={`Hi ${post.author?.name},\n\nI'm interested in the ${post.details?.position} role at ${post.details?.company_name}. I would appreciate if you could refer me for this position.\n\nThank you!`}
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Introduce yourself and explain why you're a good fit for this role. Be specific about your relevant experience and skills.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Resume (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {resumeFile ? (
                      <div>
                        <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600 mt-1">{resumeFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={clearFile}
                          className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="resume-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="resume-upload"
                              name="resume-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, or DOCX up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your referral request has been sent successfully.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/alumni')}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 