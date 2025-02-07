'use client';
import { useEffect, useState } from 'react';
import { Post } from '@/lib/db/types';

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post._id} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {post.author_id}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-gray-800">{post.content}</p>
        </div>
      ))}
    </div>
  );
} 