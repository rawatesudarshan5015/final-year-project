'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePanel } from '@/components/ProfilePanel';
import { SearchPanel } from '@/components/SearchPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6 py-8">
          {/* Left Panel - Profile */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow">
              <ProfilePanel />
            </div>
          </div>

          {/* Center Panel - Feed */}
          <div className="col-span-6 space-y-6">
            {children}
          </div>

          {/* Right Panel - Search */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow">
              <SearchPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 