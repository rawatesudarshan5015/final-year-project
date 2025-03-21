'use client';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Post } from '@/lib/db/types';
import { PostCard } from './PostCard';

interface FeedProps {
  initialPosts?: Post[];
}

export type FeedRef = {
  refresh: () => Promise<void>;
};

export const Feed = forwardRef<FeedRef, FeedProps>(({ initialPosts }, ref) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [isLoading, setIsLoading] = useState(!initialPosts);

  const fetchPosts = async () => {
    setIsLoading(true);
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

  useImperativeHandle(ref, () => ({
    refresh: fetchPosts
  }));

  useEffect(() => {
    if (!initialPosts) {
      fetchPosts();
    }
  }, [initialPosts]);

  if (isLoading) {
    return (
      <div className="py-3 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="py-3 text-center text-gray-500">
        No posts yet. Be the first to post!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post._id?.toString()} post={post} />
      ))}
    </div>
  );
});

Feed.displayName = 'Feed'; 