'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { getDisplayRoleName, getStudentRole } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  InboxIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowLeftIcon
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
  
  // For received requests
  student_name?: string;
  student_profile_pic?: string;
  student_batch_year?: number;
  student_branch?: string;
  student_section?: string;
  
  // Post details
  post_title?: string;
  post_company?: string;
}

export default function ReferralDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent');
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    declined: 0,
    total: 0
  });

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (type: 'received' | 'sent') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/referrals/request?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
        
        // Calculate stats
        const pending = data.requests.filter((req: ReferralRequest) => req.status === 'pending').length;
        const accepted = data.requests.filter((req: ReferralRequest) => req.status === 'accepted').length;
        const declined = data.requests.filter((req: ReferralRequest) => req.status === 'declined').length;
        
        setStats({
          pending,
          accepted,
          declined,
          total: data.requests.length
        });
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

  const handleUpdateStatus = async (requestId: number, status: 'accepted' | 'declined') => {
    setActionInProgress(requestId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/referrals/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update the local state
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status } : req
          )
        );
        
        // Update stats
        setStats(prev => {
          const updatedStats = { ...prev };
          updatedStats.pending--;
          if (status === 'accepted') updatedStats.accepted++;
          else updatedStats.declined++;
          return updatedStats;
        });
      } else {
        throw new Error(data.error || 'Failed to update referral request');
      }
    } catch (error) {
      console.error('Error updating referral request:', error);
      setError('Failed to update the request. Please try again later.');
    } finally {
      setActionInProgress(null);
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
        // Find the request to determine its status
        const requestToDelete = requests.find(req => req.id === requestId);
        
        // Remove from local state
        setRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Update stats
        if (requestToDelete) {
          setStats(prev => {
            const updatedStats = { ...prev };
            updatedStats.total--;
            if (requestToDelete.status === 'pending') updatedStats.pending--;
            else if (requestToDelete.status === 'accepted') updatedStats.accepted--;
            else if (requestToDelete.status === 'declined') updatedStats.declined--;
            return updatedStats;
          });
        }
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

  const renderStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    } else if (status === 'accepted') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Accepted
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Declined
        </span>
      );
    }
  };

  const renderReceivedRequests = () => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <InboxIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No referral requests</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            You haven't received any referral requests yet. When students request referrals from you, they'll appear here.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/alumni"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <BriefcaseIcon className="h-5 w-5 mr-1" />
              Browse Referrals
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {requests.map(request => {
          const studentRole = getStudentRole(request.student_batch_year || 0);
          
          return (
            <div key={request.id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900 truncate">
                      {request.post_title || 'Referral Request'} {request.post_company && `at ${request.post_company}`}
                    </span>
                  </div>
                  {renderStatusBadge(request.status)}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start">
                  {/* Student info */}
                  <div className="flex-shrink-0">
                    <UserAvatar
                      imageUrl={request.student_profile_pic}
                      name={request.student_name || 'Unknown'}
                      size="md"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{request.student_name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mr-2">
                            {getDisplayRoleName(studentRole)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {request.student_branch} {request.student_section}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {/* Request message */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{request.message}</p>
                    </div>
                    
                    {/* Resume link */}
                    {request.resume_url && (
                      <div className="mt-3">
                        <a
                          href={request.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          View Resume
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}
                    
                    {/* Status and actions */}
                    <div className="mt-4 flex items-center justify-between">
                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'accepted')}
                            disabled={actionInProgress === request.id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'declined')}
                            disabled={actionInProgress === request.id}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {request.status === 'accepted' && (
                        <div className="flex space-x-3">
                          <a
                            href={`mailto:${request.student_name}?subject=Referral for Position&body=Hi ${request.student_name},%0D%0A%0D%0AI've accepted your referral request. Let's connect to discuss next steps.%0D%0A%0D%0ABest regards,%0D%0A`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            Contact Student
                          </a>
                        </div>
                      )}
                      
                      {request.status === 'declined' && (
                        <div>
                          <p className="text-sm text-gray-500 italic">You declined this request</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSentRequests = () => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <PaperAirplaneIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No sent requests</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            You haven't sent any referral requests yet. Browse alumni referrals to find opportunities.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/alumni"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <BriefcaseIcon className="h-5 w-5 mr-1" />
              Browse Referrals
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {requests.map(request => (
          <div key={request.id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">
                    Request to {request.alumni_name}
                  </span>
                </div>
                {renderStatusBadge(request.status)}
              </div>
            </div>
            
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
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.post_title || 'Referral Request'} {request.post_company && `at ${request.post_company}`}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {/* Request message */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{request.message}</p>
                  </div>
                  
                  {/* Resume link */}
                  {request.resume_url && (
                    <div className="mt-3">
                      <a
                        href={request.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        View Resume
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                  
                  {/* Status and actions */}
                  <div className="mt-4 flex items-center justify-between">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={actionInProgress === request.id}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Cancel Request
                      </button>
                    )}
                    
                    {request.status === 'accepted' && (
                      <a
                        href={`mailto:${request.alumni_name}?subject=Following up on Referral&body=Hi ${request.alumni_name},%0D%0A%0D%0AThank you for accepting my referral request. I'd like to follow up on next steps.%0D%0A%0D%0ABest regards,`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        Contact Alumni
                      </a>
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Referral Dashboard</h1>
            <p className="mt-1 text-blue-100">Manage your referral requests</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/alumni"
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md shadow-sm text-white bg-transparent hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Referrals
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
              <InboxIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 truncate">Total</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-shrink-0 bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-3">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 truncate">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-shrink-0 bg-green-100 text-green-600 p-2 rounded-lg mr-3">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 truncate">Accepted</p>
              <p className="text-lg font-semibold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-shrink-0 bg-red-100 text-red-600 p-2 rounded-lg mr-3">
              <XCircleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 truncate">Declined</p>
              <p className="text-lg font-semibold text-gray-900">{stats.declined}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('received')}
              className={`${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm sm:text-base`}
            >
              <InboxIcon className="h-5 w-5 inline mr-2 -mt-0.5" />
              Received Requests
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm sm:text-base`}
            >
              <PaperAirplaneIcon className="h-5 w-5 inline mr-2 -mt-0.5" />
              Sent Requests
            </button>
          </nav>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="p-4">
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
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
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow-sm rounded-lg p-6 animate-pulse border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
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
            activeTab === 'received' ? renderReceivedRequests() : renderSentRequests()
          )}
        </div>
      </div>
    </div>
  );
} 