'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePostForm } from '@/components/CreatePostForm';

export default function CreatePost() {
  const router = useRouter();
  const [initialData, setInitialData] = useState({
    category: 'announcement',
    description: '',
    details: {}
  });

  // Handle category from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const category = searchParams.get('category');
    
    if (category === 'alumni_referral') {
      setInitialData({
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
      });
    }
  }, []);
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <CreatePostForm initialData={initialData} />
    </div>
  );
} 