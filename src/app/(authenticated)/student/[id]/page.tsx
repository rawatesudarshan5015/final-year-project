'use client';

import { useEffect, useState } from 'react';
import { MessagePanel } from '@/components/MessagePanel';
import { StudentRole, getDisplayRoleName } from '@/lib/utils';
import { ProfileDisplay } from '@/components/ProfileDisplay';
import { CompanyExperience } from '@/lib/db/types';
import Link from 'next/link';

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  profile_pic_url?: string;
  role?: StudentRole;
  interests?: {
    sports?: string[];
    hobbies?: string[];
    domain?: string[];
  };
  current_internship?: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  } | null;
  work_history?: CompanyExperience[];
}

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'message' | 'posts' | 'projects'>('message');
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/students/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          // Ensure the profile data has the expected structure
          const profile = {
            ...data.profile,
            interests: data.profile.interests || {},
            current_internship: data.profile.current_internship || null,
            work_history: Array.isArray(data.profile.work_history) ? data.profile.work_history : []
          };
          setProfile(profile);
          
          // Fetch user posts if we're on that tab
          if (activeTab === 'posts') {
            fetchUserPosts(profile.id);
          }
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to load profile');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [params.id, activeTab]);
  
  const fetchUserPosts = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts?author=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-6 w-full max-w-5xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-gray-200 rounded-lg h-64 md:w-1/3"></div>
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1 mt-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-4">
          <div>
            <ProfileDisplay 
              profile={profile} 
              variant="card" 
              showEmail={true} 
              showInterests={true} 
              showCompanyInfo={true}
              className="shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            />
            
            {/* Quick contact actions */}
            <div className="mt-4 bg-white rounded-lg shadow-md p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Options</h3>
              <div className="flex flex-col space-y-2">
                {profile.email && (
                  <a 
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabbed Content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('message')}
                className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
                  activeTab === 'message'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Message
                </div>
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Posts
                </div>
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 py-2 px-4 text-center font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Projects
                </div>
              </button>
            </div>

            {/* Tab content */}
            <div className="h-[560px] overflow-hidden">
              {activeTab === 'message' && (
                <div className="h-full overflow-hidden">
                  <MessagePanel 
                    recipientId={profile.id} 
                    recipientName={profile.name} 
                    recipientImageUrl={profile.profile_pic_url} 
                  />
                </div>
              )}
              
              {activeTab === 'posts' && (
                <div className="p-4 overflow-y-auto h-full">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Posts by {profile.name}</h2>
                  {posts.length > 0 ? (
                    <div className="space-y-4">
                      {/* Post display would go here */}
                      <p className="text-gray-500">Posts by this user will be displayed here.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <h3 className="text-gray-500 font-medium">No posts yet</h3>
                      <p className="text-gray-400 mt-1">This user hasn't made any posts yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'projects' && (
                <div className="p-4 overflow-y-auto h-full">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Projects by {profile.name}</h2>
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h3 className="text-gray-500 font-medium">No projects yet</h3>
                    <p className="text-gray-400 mt-1">This user hasn't shared any projects yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 