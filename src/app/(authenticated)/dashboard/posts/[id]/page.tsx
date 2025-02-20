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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Event Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                {post.details.date && (
                  <div>
                    <p className="font-medium text-gray-900">Date</p>
                    <p>📅 {post.details.date}</p>
                  </div>
                )}
                {post.details.time && (
                  <div>
                    <p className="font-medium text-gray-900">Time</p>
                    <p>⏰ {post.details.time}</p>
                  </div>
                )}
                {post.details.venue && (
                  <div>
                    <p className="font-medium text-gray-900">Venue</p>
                    <p>📍 {post.details.venue}</p>
                  </div>
                )}
                {post.details.organized_by && (
                  <div>
                    <p className="font-medium text-gray-900">Organized By</p>
                    <p>👥 {post.details.organized_by}</p>
                  </div>
                )}
                {post.details.organizer_contact && (
                  <div>
                    <p className="font-medium text-gray-900">Contact</p>
                    <p>📞 {post.details.organizer_contact}</p>
                  </div>
                )}
              </div>
              {post.details.registration_link && (
                <div className="mt-6">
                  <a
                    href={post.details.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
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
        </div>
      </div>
    </div>
  );
} 