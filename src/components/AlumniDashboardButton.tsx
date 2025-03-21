'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InboxIcon } from '@heroicons/react/24/outline';
import { getStudentRole } from '@/lib/utils';

export function AlumniDashboardButton() {
  const [isAlumni, setIsAlumni] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check if user is alumni
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getStudentRole(parsedInfo.batch_year);
        const isUserAlumni = role === 'Alumni';
        setIsAlumni(isUserAlumni);
        setIsVisible(true);
        
        // If alumni, check for pending requests
        if (isUserAlumni) {
          checkPendingRequests();
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);
  
  const checkPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/referrals/request?type=received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        const pendingRequests = data.requests.filter((req: any) => req.status === 'pending');
        setPendingCount(pendingRequests.length);
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  if (!isVisible || !isAlumni) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/dashboard/alumni/dashboard"
        className="flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Manage Referral Requests"
      >
        <InboxIcon className="h-5 w-5 mr-2" />
        <span className="font-medium">Manage Requests</span>
        {pendingCount > 0 && (
          <span className="ml-2 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {pendingCount}
          </span>
        )}
      </Link>
    </div>
  );
} 