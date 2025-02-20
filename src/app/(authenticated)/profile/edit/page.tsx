'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/UserAvatar';

interface Interest {
  _id?: string;
  category: string;
  options: string[];
}

interface Profile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  mobile_number: string | null;
  profile_pic_url?: string;
  interests: {
    [key: string]: string[];
  };
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      setStatus(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      const token = localStorage.getItem('token');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      const updateResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile_pic_url: uploadData.url,
          cloudinary_public_id: uploadData.public_id
        })
      });

      const updateData = await updateResponse.json();
      if (!updateData.success) throw new Error(updateData.error);

      setProfile(prev => prev ? {
        ...prev,
        profile_pic_url: uploadData.url
      } : null);
      setStatus({ type: 'success', message: 'Profile photo updated successfully!' });
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setStatus({ type: 'error', message: 'Failed to update profile photo' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_number: profile?.mobile_number,
          interests: profile?.interests
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Changes saved successfully!' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to save changes' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatus({ type: 'error', message: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Photo Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="flex items-center space-x-4">
                <UserAvatar
                  imageUrl={profile?.profile_pic_url}
                  name={profile?.name || ''}
                  size="lg"
                  className="border-2 border-gray-200"
                />
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Uploading...' : 'Change Photo'}
                  </button>
                  <p className="mt-1 text-sm text-gray-500">
                    Click to upload a new profile photo
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Number Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                value={profile?.mobile_number || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, mobile_number: e.target.value} : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Interests</h3>
              {interests.map((interest) => (
                <div key={interest.category} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-md font-medium text-gray-700 mb-3 capitalize">
                    {interest.category}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {interest.options.map((option) => (
                      <label key={option} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <input
                          type="checkbox"
                          checked={profile?.interests?.[interest.category]?.includes(option) || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setProfile(prev => {
                              if (!prev) return prev;
                              const updatedInterests = { ...prev.interests };
                              if (!updatedInterests[interest.category]) {
                                updatedInterests[interest.category] = [];
                              }
                              if (checked) {
                                updatedInterests[interest.category] = [...updatedInterests[interest.category], option];
                              } else {
                                updatedInterests[interest.category] = updatedInterests[interest.category].filter(i => i !== option);
                              }
                              return { ...prev, interests: updatedInterests };
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {status && (
            <div className={`mt-4 p-3 ${
              status.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {status.message}
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 