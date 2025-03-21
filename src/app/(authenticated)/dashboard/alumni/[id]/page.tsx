'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Post } from '@/lib/db/types';
import { UserAvatar } from '@/components/UserAvatar';
import { getDisplayRoleName, getStudentRole } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  LinkIcon,
  ExclamationCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

export default function AlumniReferralDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlumni, setIsAlumni] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is alumni
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        const role = getStudentRole(parsedInfo.batch_year);
        setUserRole(role);
        setIsAlumni(role === 'Alumni');
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setPost(data.post);
        } else {
          throw new Error(data.error || 'Failed to fetch post');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load the referral post. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center text-red-500 mb-4">
            <ExclamationCircleIcon className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-medium">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">
            {error || 'The referral post could not be found. It may have been removed.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/alumni')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Alumni Referrals
          </button>
        </div>
      </div>
    );
  }

  // Check if this is an alumni referral post
  if (post.category !== 'alumni_referral') {
    router.push('/dashboard/alumni');
    return null;
  }

  const referralType = post.details?.referral_type || 'job_opening';
  const companyName = post.details?.company_name || '';
  const position = post.details?.position || '';
  const jobType = post.details?.job_type || '';
  const isRemote = post.details?.is_remote || false;
  const deadline = post.details?.application_deadline;
  const experienceRequired = post.details?.experience_required || '';
  const skillsRequired = post.details?.skills_required || [];
  const applicationLink = post.details?.application_link || '';
  const salaryRange = post.details?.salary_range || '';
  
  // Format referral type for display
  const referralTypeDisplay = {
    direct_referral: 'Direct Referral',
    job_opening: 'Job Opening',
    startup_hiring: 'Startup Hiring'
  };

  // Determine badge color based on referral type
  const badgeColors = {
    direct_referral: 'bg-purple-100 text-purple-800',
    job_opening: 'bg-blue-100 text-blue-800',
    startup_hiring: 'bg-green-100 text-green-800'
  };
  
  const badgeColor = badgeColors[referralType as keyof typeof badgeColors] || badgeColors.job_opening;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Referrals
        </button>
        
        {isAlumni && (
          <Link
            href="/dashboard/alumni/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <InboxIcon className="h-4 w-4 mr-1" />
            Manage Referral Requests
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Author info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Link href={`/student/${post.author_id}`}>
              <UserAvatar
                imageUrl={post.author?.profile_pic_url}
                name={post.author?.name || 'Unknown'}
                size="md"
              />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/student/${post.author_id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {post.author?.name}
                </Link>
                {post.author?.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getDisplayRoleName(post.author.role)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
              {post.author?.current_internship && (
                <p className="text-xs text-gray-600 mt-1">
                  {post.author.current_internship.position} at {post.author.current_internship.company_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="p-6">
          {/* Referral type badge */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
              {referralTypeDisplay[referralType as keyof typeof referralTypeDisplay]}
            </span>
            {jobType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {jobType.replace('_', ' ')}
              </span>
            )}
            {isRemote && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                Remote
              </span>
            )}
          </div>
          
          {/* Position and company */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{position}</h1>
            <div className="flex items-center text-gray-700">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              <span className="text-lg">{companyName}</span>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-line">{post.description}</p>
            </div>
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {experienceRequired && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Experience Required</h3>
                <p className="text-gray-900">{experienceRequired}</p>
              </div>
            )}
            
            {skillsRequired && skillsRequired.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Skills Required</h3>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(skillsRequired) ? (
                    skillsRequired.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-900">{skillsRequired}</p>
                  )}
                </div>
              </div>
            )}
            
            {salaryRange && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Salary Range</h3>
                <p className="text-gray-900">{salaryRange}</p>
              </div>
            )}
            
            {deadline && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Application Deadline</h3>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <p className="text-gray-900">{new Date(deadline).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Application link */}
          {applicationLink && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Application Link</h3>
              <a 
                href={applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                {applicationLink}
              </a>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {referralType === 'direct_referral' && !isAlumni && (
              <Link
                href={`/dashboard/alumni/request/${post._id}`}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Request Referral
              </Link>
            )}
            
            {isAlumni && (
              <Link
                href="/dashboard/alumni/dashboard"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <InboxIcon className="h-4 w-4 mr-1" />
                Manage Requests
              </Link>
            )}
            
            {applicationLink && (
              <a
                href={applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Now
              </a>
            )}
            
            <button
              onClick={() => router.push('/dashboard/alumni')}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Referrals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 