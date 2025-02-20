'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Posts', href: '/dashboard/posts' },
    { label: 'Alumni Referral', href: '/dashboard/alumni' },
    { label: 'Academic Resources', href: '/dashboard/resources' },
    { label: 'Events', href: '/dashboard/events' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">College Social</h1>
            <nav className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
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