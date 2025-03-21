'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { getDisplayRoleName, getStudentRole } from '@/lib/utils';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

interface ReferralRequest {
  id: number;
  student_id: number;
  alumni_id: number;
  post_id: string;
  message: string;
  resume_url?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
  
  // For sent requests
  alumni_name?: string;
  alumni_profile_pic?: string;
}

export default function StudentReferralDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [isAlumni, setIsAlumni] = useState(false);

  useEffect(() => {
    // Check if user is alumni
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getStudentRole(parsedInfo.batch_year);
        setIsAlumni(role === 'Alumni');
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
    
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/request?type=sent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        throw new Error(data.error || 'Failed to fetch referral requests');
      }
    } catch (error) {
      console.error('Error fetching referral requests:', error);
      setError('Failed to load referral requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    setActionInProgress(requestId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/referrals/request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        throw new Error(data.error || 'Failed to delete referral request');
      }
    } catch (error) {
      console.error('Error deleting referral request:', error);
      setError('Failed to delete the request. Please try again later.');
    } finally {
      setActionInProgress(null);
    }
  };

  const renderSentRequests = () => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-8">
          <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sent requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't sent any referral requests yet.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard/alumni')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Alumni Referrals
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {requests.map(request => (
          <div key={request.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                {/* Alumni info */}
                <div className="flex-shrink-0">
                  <UserAvatar
                    imageUrl={request.alumni_profile_pic}
                    name={request.alumni_name || 'Unknown'}
                    size="md"
                  />
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Request to {request.alumni_name}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {/* Request message */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{request.message}</p>
                  </div>
                  
                  {/* Resume link */}
                  {request.resume_url && (
                    <div className="mt-3">
                      <a
                        href={request.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        View Resume
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                  
                  {/* Status and actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {request.status === 'pending' ? (
                        <span className="inline-flex items-center text-sm text-yellow-600">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Pending
                        </span>
                      ) : request.status === 'accepted' ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-red-600">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Declined
                        </span>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={actionInProgress === request.id}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Referral Requests</h1>
        <div className="flex space-x-3">
          {isAlumni && (
            <Link
              href="/dashboard/alumni/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <InboxIcon className="h-4 w-4 mr-1" />
              Manage Alumni Requests
            </Link>
          )}
          <button
            onClick={() => router.push('/dashboard/alumni')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Alumni Referrals
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="flex items-start">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="mt-4 h-24 bg-gray-200 rounded"></div>
                  <div className="mt-4 flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        renderSentRequests()
      )}
    </div>
  );
} 