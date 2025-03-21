'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Post, User } from '@/lib/db/types';
import { PostCard } from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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
          setPost(data.post);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      router.push('/dashboard/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }, [params.id, router]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !post) {
    return <div className="text-red-600 p-4">{error || 'Post not found'}</div>;
  }

  const isAuthor = post.author_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        {isAuthor && (
          <div className="space-x-3">
            <Link
              href={`/dashboard/posts/${post._id}/edit`}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Post
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Main post content using PostCard */}
        <PostCard post={post} />

        {/* Additional details section */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Post metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full ${
                post.category === 'event' 
                  ? 'bg-green-100 text-green-800'
                  : post.category === 'contest'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </span>
            </div>
          </div>

          {/* Event/Contest specific details */}
          {(post.category === 'event' || post.category === 'contest') && post.details && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className={`mr-3 inline-flex items-center justify-center p-2 rounded-full ${
                  post.category === 'event' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {post.category === 'event' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                </span>
                {post.category === 'event' ? 'Event Details' : 'Contest Details'}
              </h2>
              
              {/* Title and description section */}
              <div className={`p-5 rounded-lg mb-6 ${post.category === 'event' ? 'bg-green-50' : 'bg-purple-50'}`}>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {post.details.event_name || post.details.contest_name}
                </h3>
                {post.description && (
                  <p className="text-gray-700">{post.description}</p>
                )}
              </div>
              
              {/* Key details section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-4 text-lg">
                    Date & Time
                  </h4>
                  <div className="space-y-4">
                    {post.details.date && (
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Date</p>
                          <p className="text-gray-600">
                            {new Date(post.details.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {post.details.time && (
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Time</p>
                          <p className="text-gray-600">{post.details.time}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-4 text-lg">
                    Location & Organizer
                  </h4>
                  <div className="space-y-4">
                    {post.details.venue && (
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Venue</p>
                          <p className="text-gray-600">{post.details.venue}</p>
                        </div>
                      </div>
                    )}
                    
                    {post.details.organized_by && (
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Organized By</p>
                          <p className="text-gray-600">{post.details.organized_by}</p>
                        </div>
                      </div>
                    )}
                    
                    {post.details.organizer_contact && (
                      <div className="flex items-start">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Contact</p>
                          <p className="text-gray-600">{post.details.organizer_contact}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {post.details.registration_link && (
                <div className="mt-6 flex justify-center">
                  <a
                    href={post.details.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Register Now
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Project specific details */}
          {post.category === 'project' && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Project Details
              </h2>
              <div className="space-y-4">
                {post.tech_stack && (
                  <div>
                    <p className="font-medium text-gray-900">Tech Stack</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {post.github_link && (
                  <div>
                    <p className="font-medium text-gray-900">GitHub Repository</p>
                    <a
                      href={post.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View on GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievement specific details */}
          {post.category === 'achievement' && post.achievement_type && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Achievement Details
              </h2>
              <div>
                <p className="font-medium text-gray-900">Type</p>
                <p className="text-gray-600">{post.achievement_type}</p>
              </div>
            </div>
          )}
          
          {/* Alumni Referral specific details */}
          {post.category === 'alumni_referral' && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Referral Details
              </h2>
              
              {post.details ? (
                <>
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                      post.details.referral_type === 'direct_referral' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : post.details.referral_type === 'job_opening'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      <span className="mr-2">{
                        post.details.referral_type === 'direct_referral' ? '🤝' : 
                        post.details.referral_type === 'job_opening' ? '💼' : '🚀'
                      }</span>
                      {post.details.referral_type === 'direct_referral' 
                        ? 'Direct Referral' 
                        : post.details.referral_type === 'job_opening' 
                        ? 'Job Opening' 
                        : 'Startup Hiring'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {post.details.position && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Position</h3>
                        <p className="text-gray-700 text-lg font-medium">{post.details.position}</p>
                      </div>
                    )}
                    
                    {post.details.company_name && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Company</h3>
                        <p className="text-gray-700">{post.details.company_name}</p>
                      </div>
                    )}
                    
                    {post.details.job_type && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Job Type</h3>
                        <p className="text-gray-700">{post.details.job_type.replace('_', ' ')}</p>
                      </div>
                    )}
                    
                    {post.details.is_remote && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Remote Work</h3>
                        <p className="text-gray-700">Yes, remote position available</p>
                      </div>
                    )}
                    
                    {post.details.experience_required && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Experience Required</h3>
                        <p className="text-gray-700">{post.details.experience_required}</p>
                      </div>
                    )}
                    
                    {post.details.salary_range && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Salary Range</h3>
                        <p className="text-gray-700">{post.details.salary_range}</p>
                      </div>
                    )}
                    
                    {post.details.application_deadline && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Application Deadline</h3>
                        <p className="text-gray-700">{new Date(post.details.application_deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {post.details.skills_required && typeof post.details.skills_required === 'string' && (
                      <div className="col-span-2">
                        <h3 className="font-medium text-gray-900 mb-1">Skills Required</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(post.details.skills_required as string).split(',').map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {post.details.application_link && (
                      <div className="col-span-2 mt-2">
                        <h3 className="font-medium text-gray-900 mb-1">Application Link</h3>
                        <a
                          href={post.details.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {post.details.application_link}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {post.details.referral_type === 'direct_referral' && (
                    <div className="mt-6">
                      <Link
                        href={`/dashboard/alumni/${post._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <span className="mr-2">🙋</span> View & Request Referral
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600 mb-4">Detailed information for this referral post is not available or is still being loaded.</p>
                  <Link
                    href="/dashboard/alumni"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-2">🔍</span> View All Referrals
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 