'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/db/types';
import { Feed } from '@/components/Feed';
import { getStudentRole } from '@/lib/utils';
import { InboxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAlumni, setIsAlumni] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const feedRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  const fetchPosts = useCallback(async () => {
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
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (feedRef.current) {
      await feedRef.current.refresh();
    } else {
      await fetchPosts();
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    // Check if user is alumni
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getStudentRole(parsedInfo.batch_year);
        const isUserAlumni = role === 'Alumni';
        setIsAlumni(isUserAlumni);
        
        // If alumni, check for pending requests
        if (isUserAlumni) {
          checkPendingRequests();
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
    
    fetchPosts();
  }, [fetchPosts]);
  
  const checkPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/referrals/request?type=received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        const pending = data.requests.filter((req: any) => req.status === 'pending');
        setPendingRequests(pending.length);
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      {isAlumni && pendingRequests > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-full mr-3 relative">
              <InboxIcon className="h-6 w-6 text-indigo-600" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {pendingRequests}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-indigo-900">You have {pendingRequests} pending referral {pendingRequests === 1 ? 'request' : 'requests'}</h3>
              <p className="text-sm text-indigo-700">Review and respond to student referral requests in your dashboard</p>
            </div>
          </div>
          <Link
            href="/dashboard/alumni/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Referral Dashboard
          </Link>
        </div>
      )}
      
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-gray-200">
        <h1 className="text-lg font-medium text-gray-900">Feed</h1>
        <button 
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center"
          disabled={isRefreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <Feed ref={feedRef} />
    </div>
  );
} 