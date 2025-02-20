'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, Interest } from '@/types/db';
import { ProfileAvatar } from './ProfileAvatar';

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
          setProfile(profileData.profile);
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
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <ProfileAvatar
              imageUrl={profile.profile_pic_url}
              name={profile.name}
              size="lg"
              className="border-2 border-gray-200"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1 text-base text-gray-900">{profile.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-base text-gray-900 break-all">{profile.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">ERN Number</h3>
              <p className="mt-1 text-base text-gray-900">{profile.ern_number}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
              <p className="mt-1 text-base text-gray-900">{profile.mobile_number || 'Not provided'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Branch</h3>
              <p className="mt-1 text-base text-gray-900">{profile.branch}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Batch Year</h3>
              <p className="mt-1 text-base text-gray-900">{profile.batch_year}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Interests</h3>
              <div className="space-y-3">
                {Object.entries(profile.interests || {}).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 capitalize mb-1">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 