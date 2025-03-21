'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStudentRole } from '@/lib/utils';
import { InboxIcon } from '@heroicons/react/24/outline';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAlumni, setIsAlumni] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getStudentRole(parsedInfo.batch_year);
        setUserRole(role);
        setIsAlumni(role === 'Alumni');
        
        // For testing purposes, we'll consider any user as admin
        // In production, you would check for the actual admin role
        setIsAdmin(true); // Temporary: making all users admins for testing
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Check for pending referral requests for alumni
    if (isAlumni) {
      const checkPendingRequests = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/referrals/request?type=received', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
            const pendingRequests = data.requests.filter((req: any) => req.status === 'pending');
            setHasUnreadRequests(pendingRequests.length > 0);
          }
        } catch (error) {
          console.error('Error checking pending requests:', error);
        }
      };
      
      checkPendingRequests();
    }
  }, [isAlumni]);

  // Define navigation items based on user role
  const baseNavItems = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Posts', href: '/dashboard/posts' },
    { label: 'Alumni Referral', href: '/dashboard/alumni' }
  ];
  
  // Add role-specific navigation items
  const navItems = [
    ...baseNavItems,
    ...(isAlumni ? [{ label: 'Manage Referrals', href: '/dashboard/alumni/dashboard' }] : []),
    { label: 'Academic Resources', href: '/dashboard/resources' },
    ...(isAdmin ? [{ label: 'Subject Management', href: '/dashboard/admin/subjects' }] : []),
    { label: 'Events', href: '/dashboard/events' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/');
  };

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              CollegeConnect
            </Link>
            <nav className="flex space-x-4 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : item.href === '/dashboard/alumni/dashboard' && isAlumni
                        ? 'bg-indigo-100 text-indigo-700 relative'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.href === '/dashboard/alumni/dashboard' && isAlumni && (
                    <>
                      <InboxIcon className="inline-block h-4 w-4 mr-1" />
                      {item.label}
                      {hasUnreadRequests && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                      )}
                    </>
                  )}
                  {item.href !== '/dashboard/alumni/dashboard' && item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 
