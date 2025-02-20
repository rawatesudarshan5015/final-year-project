'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePostForm } from '@/components/CreatePostForm';

export default function EditPost({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setInitialData(data.post);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Post</h1>
      <CreatePostForm 
        initialData={initialData} 
        isEditing={true} 
        postId={params.id} 
      />
    </div>
  );
} 