'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile as BaseProfile, Interest } from '@/types/db';
import { ProfileDisplay } from './ProfileDisplay';
import { StudentRole } from '@/lib/utils';
import { CompanyExperience } from '@/lib/db/types';

// Extend the Profile type to include the role property and company information
interface Profile extends BaseProfile {
  role?: StudentRole;
  current_internship?: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  } | null;
  work_history?: CompanyExperience[];
}

export function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [profileRes, interestsRes] = await Promise.all([
          fetch('/api/user/profile', { headers }),
          fetch('/api/interests', { headers })
        ]);

        const profileData = await profileRes.json();
        const interestsData = await interestsRes.json();

        if (profileData.success) {
          // Ensure the profile data has the expected structure
          const profile = {
            ...profileData.profile,
            interests: profileData.profile.interests || {},
            current_internship: profileData.profile.current_internship || null,
            work_history: Array.isArray(profileData.profile.work_history) ? profileData.profile.work_history : []
          };
          setProfile(profile);
        }

        if (interestsData.success) {
          setInterests(interestsData.interests);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <button
          onClick={() => router.push('/profile/edit')}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {profile && (
        <ProfileDisplay profile={profile} variant="full" showEmail={true} showInterests={true} showCompanyInfo={true} />
      )}
    </div>
  );
} 