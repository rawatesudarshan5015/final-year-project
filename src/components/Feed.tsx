'use client';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Post } from '@/lib/db/types';
import Link from 'next/link';
import { PostCard } from './PostCard';

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Create ref for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });
  
  const fetchPosts = async (pageNum: number) => {
    try {
      console.log('[Feed] Fetching posts for page:', pageNum);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('[Feed] Received response:', {
        success: data.success,
        posts_count: data.posts?.length,
        hasMore: data.hasMore
      });
      
      if (data.success) {
        setPosts(prev => pageNum === 1 ? data.posts : [...prev, ...data.posts]);
        setHasMore(data.hasMore);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('[Feed] Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        fetchPosts(nextPage);
        return nextPage;
      });
    }
  }, [inView, loading, hasMore]);

  if (loading && posts.length === 0) {
    return <div className="p-4">Loading posts...</div>;
  }

  if (error && posts.length === 0) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="p-4">No posts found</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id?.toString()} post={post} />
      ))}
      
      {/* Loading indicator */}
      <div ref={ref} className="w-full py-4 text-center">
        {loading && hasMore && (
          <div className="animate-pulse text-gray-500">Loading more posts...</div>
        )}
      </div>
    </div>
  );
} 