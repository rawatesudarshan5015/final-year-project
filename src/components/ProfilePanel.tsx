'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Profile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  mobile_number?: string;
  interests?: {
    [key: string]: string[];
    sports: string[];
    hobbies: string[];
    domain: string[];
  };
}

interface Interest {
  category: string;
  options: string[];
}

export function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setEditedProfile(data.profile);
        } else {
          console.error('Failed to fetch profile:', data.error);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchInterests = async () => {
      try {
        const response = await fetch('/api/interests');
        const data = await response.json();
        if (data.success) {
          setInterests(data.interests);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      }
    };

    fetchProfile();
    fetchInterests();
  }, [router]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedProfile)
      });

      const data = await response.json();
      if (data.success) {
        setProfile(editedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Profile editing form */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              type="text"
              value={editedProfile?.mobile_number || ''}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev!,
                mobile_number: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Interests section */}
          {interests.map((category) => (
            <div key={category.category}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
              </label>
              <div className="space-y-2">
                {category.options.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedProfile?.interests?.[category.category]?.includes(option) || false}
                      onChange={(e) => {
                        const currentInterests: { [key: string]: string[] } = editedProfile?.interests || {};
                        const categoryInterests = currentInterests[category.category] || [];
                        
                        setEditedProfile(prev => ({
                          ...prev!,
                          interests: {
                            sports: [],
                            hobbies: [],
                            domain: [],
                            ...currentInterests,
                            [category.category]: e.target.checked
                              ? [...categoryInterests, option]
                              : categoryInterests.filter(i => i !== option)
                          }
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Profile display */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-sm text-gray-500">ERN: {profile.ern_number}</p>
            <p className="text-sm text-gray-500">
              {profile.branch} - {profile.section} ({profile.batch_year})
            </p>
            {profile.mobile_number && (
              <p className="text-sm text-gray-500">
                Mobile: {profile.mobile_number}
              </p>
            )}
          </div>

          {/* Interests display */}
          {profile.interests && Object.entries(profile.interests).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
              <div className="mt-1 flex flex-wrap gap-2">
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
      )}
    </div>
  );
} 