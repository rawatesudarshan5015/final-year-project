'use client';

import { UserAvatar } from './UserAvatar';
import { Post as BasePost } from '@/lib/db/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { getDisplayRoleName, StudentRole } from '@/lib/utils';
import { CompanyExperience } from '@/lib/db/types';

// Extend the Post type to include company information in the author field
interface Post extends BasePost {
  author?: {
    id: number;
    name: string;
    profile_pic_url?: string;
    role?: StudentRole;
    current_internship?: {
      company_name: string;
      position: string;
      start_date: string;
      description?: string;
    } | null;
    work_history?: CompanyExperience[];
  };
}

export function PostCard({ post }: { post: Post }) {
  console.log('[PostCard] Rendering post:', {
    post_id: post._id,
    author_id: post.author_id,
    author: {
      exists: !!post.author,
      name: post.author?.name,
      has_profile_pic: !!post.author?.profile_pic_url,
      role: post.author?.role
    }
  });

  // Get current company or internship info if available
  const companyInfo = post.author?.current_internship 
    ? `${post.author.current_internship.position} at ${post.author.current_internship.company_name}`
    : post.author?.work_history && Array.isArray(post.author.work_history) && post.author.work_history.length > 0
      ? (() => {
          const currentJob = post.author.work_history.find((job: CompanyExperience) => job.is_current);
          return currentJob 
            ? `${currentJob.position} at ${currentJob.company_name}`
            : null;
        })()
      : null;

  return (
    <Link 
      href={`/dashboard/posts/${post._id}`}
      className="block"
    >
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* Author Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div onClick={(e) => e.stopPropagation()}>
              <Link href={`/student/${post.author_id}`}>
                <UserAvatar
                  imageUrl={post.author?.profile_pic_url}
                  name={post.author?.name || 'Unknown'}
                  size="sm"
                />
              </Link>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <Link 
                    href={`/student/${post.author_id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {post.author?.name}
                  </Link>
                </div>
                {post.author?.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getDisplayRoleName(post.author.role)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
              {companyInfo && (
                <p className="text-xs text-gray-600 mt-1">
                  {companyInfo}
                </p>
              )}
            </div>
          </div>

          {/* Post Content */}
          
          {/* Category Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              post.category === 'event' 
                ? 'bg-green-100 text-green-800'
                : post.category === 'contest'
                ? 'bg-purple-100 text-purple-800'
                : post.category === 'alumni_referral'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {post.category.charAt(0).toUpperCase() + post.category.slice(1).replace('_', ' ')}
            </span>
          </div>

          {/* Post Description */}
          <p className="text-gray-700 mb-4">{post.description}</p>

          {/* Media Content */}
          {post.media_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              {post.media_type === 'photo' ? (
                <img 
                  src={post.media_url} 
                  alt="Post attachment" 
                  className="w-full h-auto max-h-96 object-cover"
                />
              ) : (
                <video 
                  src={post.media_url} 
                  controls 
                  className="w-full h-auto max-h-96"
                />
              )}
            </div>
          )}

          {/* Alumni Referral Details */}
          {post.category === 'alumni_referral' && (
            post.details ? (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    post.details.referral_type === 'direct_referral' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : post.details.referral_type === 'job_opening'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <span className="mr-1">{
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
                
                <h3 className="font-medium text-gray-900 text-lg mb-2">{post.details.position}</h3>
                <div className="flex items-center text-gray-700 mb-3">
                  <svg className="h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1a1 1 0 110 2h-1a1 1 0 01-1-1v-3a1 1 0 011-1h2a1 1 0 110 2h-2zm-6-1a1 1 0 100 2h2a1 1 0 100-2H9zm-3-3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{post.details.company_name}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.details.job_type && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {post.details.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {post.details.is_remote && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <span className="mr-1">🌐</span> Remote
                    </span>
                  )}
                  {post.details.experience_required && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      <span className="mr-1">⏱️</span> {post.details.experience_required}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                  {post.details.salary_range && (
                    <div className="flex items-center text-gray-700">
                      <svg className="h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span>{post.details.salary_range}</span>
                    </div>
                  )}
                  {post.details.application_deadline && (
                    <div className="flex items-center text-gray-700">
                      <svg className="h-4 w-4 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>Apply by: {new Date(post.details.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {post.details.referral_type === 'direct_referral' && (
                  <div className="mt-3 flex items-center">
                    <Link
                      href={`/dashboard/alumni/${post._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <span className="mr-1.5">🙋</span> View & Request Referral
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <span className="mr-1">💼</span> Job Referral
                  </span>
                </div>
                <p className="text-gray-600">This is an alumni referral post. View details to learn more about the opportunity.</p>
                <div className="mt-3">
                  <Link
                    href={`/dashboard/alumni/${post._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-1.5">👁️</span> View Details
                  </Link>
                </div>
              </div>
            )
          )}

          {/* Event Details */}
          {post.category === 'event' && post.details && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{post.details.event_name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span> {post.details.date}
                </div>
                <div>
                  <span className="text-gray-500">Time:</span> {post.details.time}
                </div>
                <div>
                  <span className="text-gray-500">Venue:</span> {post.details.venue}
                </div>
                <div>
                  <span className="text-gray-500">Organized by:</span> {post.details.organized_by}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 