'use client';
import { useEffect, useState } from 'react';
import { Post } from '@/lib/db/types';
import Link from 'next/link';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/posts/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Remove the deleted post from state
      setPosts(posts.filter(post => post._id?.toString() !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">My Posts</h1>
        <Link
          href="/dashboard/posts/create"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Post
        </Link>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id?.toString()} className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {post.category}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDelete(post._id!.toString())}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 flex items-center space-x-1"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                  <Link
                    href={`/dashboard/posts/${post._id}/edit`}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </Link>
                </div>
              </div>

              <Link href={`/dashboard/posts/${post._id}`}>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.details?.event_name || post.details?.contest_name || 'Post'}
                </h2>
                <p className="text-gray-600">{post.description}</p>
                
                {post.media_url && (
                  <div className="mt-4 aspect-w-16 aspect-h-9">
                    {post.media_type === 'photo' ? (
                      <img 
                        src={post.media_url}
                        alt="Post media"
                        className="object-cover rounded-lg"
                      />
                    ) : (
                      <video 
                        src={post.media_url}
                        className="w-full rounded-lg"
                      />
                    )}
                  </div>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 