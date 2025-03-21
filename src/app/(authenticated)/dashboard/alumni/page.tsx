'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/db/types';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { getDisplayRoleName } from '@/lib/utils';
import { 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

export default function AlumniReferralPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlumni, setIsAlumni] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Define common constants at component level
  // Determine badge color based on referral type
  const badgeColors = {
    direct_referral: 'bg-purple-100 text-purple-800 border-purple-200',
    job_opening: 'bg-blue-100 text-blue-800 border-blue-200',
    startup_hiring: 'bg-green-100 text-green-800 border-green-200'
  };
  
  // Format referral type for display
  const referralTypeDisplay = {
    direct_referral: 'Direct Referral',
    job_opening: 'Job Opening',
    startup_hiring: 'Startup Hiring'
  };
  
  // Icon mapping for referral types
  const referralTypeIcons = {
    direct_referral: '🤝',
    job_opening: '💼',
    startup_hiring: '🚀'
  };

  useEffect(() => {
    // Get user info from localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getDisplayRoleName(parsedInfo.batch_year);
        setUserRole(role);
        setIsAlumni(role === 'Alumni');
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchReferralPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/posts?category=alumni_referral', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Error fetching referral posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    // Apply category filter
    if (filter && post.details?.referral_type !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.description.toLowerCase().includes(query) ||
        post.details?.company_name?.toLowerCase().includes(query) ||
        post.details?.position?.toLowerCase().includes(query) ||
        post.author?.name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Prominent banner for alumni to access their dashboard */}
      {isAlumni && (
        <div className="bg-indigo-600 text-white rounded-lg p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-full mr-3">
              <InboxIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white text-lg">Manage Your Referral Requests</h3>
              <p className="text-indigo-100">View and respond to student referral requests in your dashboard</p>
            </div>
          </div>
          <Link
            href="/dashboard/alumni/dashboard"
            className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Alumni Referrals</h1>
            <p className="mt-1 text-blue-100">Connect with alumni for job referrals and opportunities</p>
          </div>
          <div className="flex space-x-3">
              <Link
                href="/dashboard/alumni/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <InboxIcon className="h-5 w-5 mr-2" />
              Manage Referral Requests
              </Link>
          </div>
        </div>
      </div>
      
      {/* Alumni Dashboard Banner - Only visible to alumni */}
      {isAlumni && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-full mr-3">
              <InboxIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-900">Manage Your Referral Requests</h3>
              <p className="text-sm text-indigo-700">View, accept, or decline student referral requests in your dashboard</p>
            </div>
          </div>
          <Link
            href="/dashboard/alumni/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, position, or description..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 hidden md:inline">
              <FunnelIcon className="h-5 w-5 inline mr-1" />
              Filter:
            </span>
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilter(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  filter === null
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('direct_referral')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  filter === 'direct_referral'
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Direct Referrals
              </button>
              <button
                onClick={() => setFilter('job_opening')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  filter === 'job_opening'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Job Openings
              </button>
              <button
                onClick={() => setFilter('startup_hiring')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  filter === 'startup_hiring'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Startups
              </button>
            </div>
            
            {isAlumni && (
              <Link
                href="/dashboard/alumni/dashboard"
                className="ml-auto inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <InboxIcon className="h-4 w-4 mr-1" />
                View Requests
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Results count */}
      {!isLoading && (
        <div className="text-sm text-gray-600">
          Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'result' : 'results'}
          {filter && ` for ${filter.replace('_', ' ')}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
      
      {/* Posts grid */}
      {isLoading ? (
        <div className="flex flex-col gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md animate-pulse border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-64 p-4 sm:border-r border-gray-100">
                  <div className="h-6 bg-blue-100 rounded-full w-32 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded flex items-center mb-3">
                    <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
                  <div className="flex items-center pt-3 border-t border-gray-100 mt-auto">
                <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="ml-3 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-2 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded flex items-center">
                        <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded flex items-center">
                        <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <div className="h-10 bg-blue-200 rounded flex-1"></div>
                    <div className="h-10 bg-purple-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filteredPosts.map((post, index) => (
            <div key={post._id?.toString()} className={`rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:translate-y-[-2px] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex flex-col sm:flex-row">
                {/* Left column - Badge and company info */}
                <div className="sm:w-64 p-4 sm:border-r border-gray-100 flex flex-col justify-between">
                  {/* Referral type badge */}
                  <div>
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${
                      badgeColors[post.details?.referral_type as keyof typeof badgeColors] || badgeColors.job_opening
                    } mb-3`}>
                      <span className="mr-1.5">
                        {referralTypeIcons[post.details?.referral_type as keyof typeof referralTypeIcons] || referralTypeIcons.job_opening}
                      </span>
                      <span className="font-medium text-sm">
                        {referralTypeDisplay[post.details?.referral_type as keyof typeof referralTypeDisplay] || 'Job Opening'}
                      </span>
                    </div>
                    
                    {/* Company name */}
                    <div className="flex items-center mb-1.5">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                      <span className="text-gray-700 font-medium truncate">{post.details?.company_name || ''}</span>
                    </div>
                  </div>
                  
                  {/* Author info */}
                  <div className="flex items-center pt-3 border-t border-gray-100 mt-auto">
                    <Link href={`/student/${post.author_id}`} className="flex-shrink-0">
                      <UserAvatar
                        imageUrl={post.author?.profile_pic_url}
                        name={post.author?.name || 'Unknown'}
                        size="sm"
                      />
                    </Link>
                    <div className="ml-3 min-w-0">
                      <Link 
                        href={`/student/${post.author_id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block text-sm"
                      >
                        {post.author?.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right column - Position and details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  {/* Position and tags */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link href={`/dashboard/alumni/${post._id}`} className="hover:text-blue-600 transition-colors hover:underline">
                        {post.details?.position || ''}
                      </Link>
                    </h3>
                    
                    {/* Tags row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.details?.job_type && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {post.details.job_type.replace('_', ' ')}
                        </span>
                      )}
                      {post.details?.is_remote && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <span className="mr-1">🌐</span> Remote
                        </span>
                      )}
                      {post.details?.experience_required && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <span className="mr-1">⏱️</span> {post.details.experience_required}
                        </span>
                      )}
                    </div>
                    
                    {/* Key details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                      {post.details?.salary_range && (
                        <div className="flex items-center text-gray-700">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                          <span>{post.details.salary_range}</span>
                        </div>
                      )}
                      {post.details?.application_deadline && (
                        <div className="flex items-center text-gray-700">
                          <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                          <span>Apply by: {new Date(post.details.application_deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-3 mt-auto">
                    <Link
                      href={`/dashboard/alumni/${post._id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center"
                    >
                      <span className="mr-1.5">👁️</span> View Details
                    </Link>
                    
                    {post.details?.referral_type === 'direct_referral' && !isAlumni && (
                      <Link
                        href={`/dashboard/alumni/request/${post._id}`}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center"
                      >
                        <span className="mr-1.5">🙋</span> Request Referral
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-10 text-center border border-gray-200">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
            <BriefcaseIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No referrals found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery || filter
              ? "No posts match your current filters. Try adjusting your search criteria."
              : "There are no alumni referral posts yet. Be the first to create one!"}
          </p>
          <div className="mt-8">
            {isAlumni && (
              <Link
                href="/dashboard/alumni/create"
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New Referral Post
              </Link>
            )}
            {!isAlumni && (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 