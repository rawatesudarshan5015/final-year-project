'use client';

import { UserAvatar } from './UserAvatar';
import { Post } from '@/lib/db/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function PostCard({ post }: { post: Post }) {
  console.log('[PostCard] Rendering post:', {
    post_id: post._id,
    author_id: post.author_id,
    author: {
      exists: !!post.author,
      name: post.author?.name,
      has_profile_pic: !!post.author?.profile_pic_url
    }
  });

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
              <div onClick={(e) => e.stopPropagation()}>
                <Link 
                  href={`/student/${post.author_id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {post.author?.name}
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-4">
            {/* Media */}
            {post.media_url && (
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                {post.media_type === 'photo' ? (
                  <img 
                    src={post.media_url} 
                    alt="Post media" 
                    className="w-full h-auto object-contain max-h-[500px]"
                    loading="lazy"
                  />
                ) : post.media_type === 'video' ? (
                  <video 
                    src={post.media_url} 
                    controls 
                    className="w-full h-auto max-h-[500px]"
                    preload="metadata"
                  />
                ) : null}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-800 whitespace-pre-wrap">{post.description}</p>

            {/* Category-specific fields */}
            {post.category === 'event' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {post.event_date ? new Date(post.event_date).toLocaleDateString() : 'Not specified'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {post.location || 'Not specified'}
                </p>
              </div>
            )}

            {post.category === 'project' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tech Stack:</span> {post.tech_stack?.join(', ')}
                </p>
                {post.github_link && (
                  <p className="text-sm">
                    <a 
                      href={post.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View on GitHub
                    </a>
                  </p>
                )}
              </div>
            )}

            {post.category === 'achievement' && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Achievement Type:</span> {post.achievement_type}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 