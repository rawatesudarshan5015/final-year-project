'use client';
import { useEffect, useState } from 'react';
import { MessagePanel } from '@/components/MessagePanel';

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  ern_number: string;
  branch: string;
  batch_year: number;
  section: string;
  interests?: {
    sports?: string[];
    hobbies?: string[];
    domain?: string[];
  };
}

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/students/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to load profile');
        console.error('Error:', error);
      }
    };

    fetchProfile();
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500">{profile.email}</p>
              <p className="text-gray-500">ERN: {profile.ern_number}</p>
              <p className="text-gray-500">
                {profile.branch} - {profile.section} ({profile.batch_year})
              </p>
            </div>
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showMessages ? 'Hide Messages' : 'Message'}
            </button>
          </div>

          {profile.interests && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Interests</h2>
              {Object.entries(profile.interests).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
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
          )}
        </div>

        {showMessages && (
          <MessagePanel recipientId={profile.id} recipientName={profile.name} />
        )}
      </div>
    </div>
  );
} 