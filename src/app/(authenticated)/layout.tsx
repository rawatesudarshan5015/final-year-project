'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AlumniDashboardButton } from '@/components/AlumniDashboardButton';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto py-1 px-4 sm:px-6 lg:px-8 pt-20">
        {children}
      </main>
      <AlumniDashboardButton />
    </div>
  );
} 