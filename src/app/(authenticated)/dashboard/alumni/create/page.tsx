'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { getStudentRole } from '@/lib/utils';
import { CreatePostForm } from '@/components/CreatePostForm';

export default function CreateReferralPostPage() {
  const router = useRouter();
  const [isAlumni, setIsAlumni] = useState(false);

  useEffect(() => {
    // Check if user is alumni
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        // Use the getStudentRole function to determine if user is alumni
        const role = getStudentRole(parsedInfo.batch_year);
        setIsAlumni(role === 'Alumni');
        
        if (role !== 'Alumni') {
          // Redirect non-alumni users
          router.push('/dashboard/alumni');
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
        router.push('/dashboard/alumni');
      }
    } else {
      // If no user info, redirect to alumni page
      router.push('/dashboard/alumni');
    }
  }, [router]);

  // Define initial data for alumni referral post
  const initialReferralData = {
    category: 'alumni_referral',
    description: '',
    details: {
      referral_type: 'direct_referral',
      company_name: '',
      position: '',
      job_type: 'full_time',
      is_remote: false,
      experience_required: '',
      skills_required: '',
      application_deadline: '',
      application_link: '',
      salary_range: ''
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Alumni Referral Post</h1>
      </div>

      {/* Use the CreatePostForm component with alumni_referral category pre-selected */}
      <CreatePostForm initialData={initialReferralData} />
    </div>
  );
} 