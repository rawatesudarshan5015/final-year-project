'use client';
import React, { useEffect, useState } from 'react';
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
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-4 pt-0">
        {/* Left Panel - Profile */}
        <div className="col-start-1 col-span-3">
          <div className="bg-white rounded-lg shadow">
            <ProfilePanel />
          </div>
        </div>

        {/* Center Panel - Feed */}
        <div className="col-span-6 space-y-4">
          {children}
        </div>

        {/* Right Panel - Search */}
        <div className="col-span-3 col-end-13">
          <div className="bg-white rounded-lg shadow">
            <SearchPanel />
          </div>
        </div>
      </div>
    </div>
  );
} 