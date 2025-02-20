'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PostCategory } from '@/lib/db/types';

interface CreatePostFormProps {
  initialData?: any;
  isEditing?: boolean;
  postId?: string;
}

export function CreatePostForm({ initialData, isEditing, postId }: CreatePostFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    category: initialData?.category || 'announcement',
    description: initialData?.description || '',
    media_file: null as File | null,
    details: initialData?.details || {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialData?.media_url || null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialData?.media_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, media_file: file }));
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError('');
      
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }
      
      console.log('Starting upload process for file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Create FormData and append fields
      const formData = new FormData();
      
      // Append file with specific name
      formData.append('file', file, file.name);
      
      // Explicitly append type as string
      formData.append('type', 'post');

      // Debug: Log FormData contents before sending
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', {
          key,
          value: value instanceof File ? `File: ${value.name}` : value,
          type: value instanceof File ? value.type : typeof value
        });
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create headers without Content-Type
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);

      console.log('Sending upload request with FormData keys:', Array.from(formData.keys()));

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (!data.success || !data.url) {
        throw new Error('Invalid upload response');
      }

      setMediaUrl(data.url);
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(`Failed to upload media: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrl = initialData?.media_url || '';
      let mediaType = initialData?.media_type || 'text';

      if (form.media_file) {
        mediaUrl = await handleUpload(form.media_file);
        mediaType = form.media_file.type.startsWith('image/') ? 'photo' : 'video';
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/posts/${postId}` : '/api/posts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: form.category,
          media_type: mediaType,
          media_url: mediaUrl,
          description: form.description,
          details: form.details,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/posts');
        }, 1500);
      } else {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} post`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          Post {isEditing ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm(prev => ({ 
              ...prev, 
              category: e.target.value as PostCategory,
              details: {} // Reset details when category changes
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isSubmitting}
          >
            <option value="announcement">Announcement</option>
            <option value="achievement">Achievement</option>
            <option value="event">Event</option>
            <option value="contest">Contest</option>
            <option value="alumni_referral">Alumni Referral</option>
          </select>
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Choose File
          </button>
          {mediaPreview && (
            <div className="mt-2">
              {form.media_file?.type.startsWith('image/') || initialData?.media_type === 'photo' ? (
                <img src={mediaPreview} alt="Preview" className="max-h-48 rounded-md" />
              ) : (
                <video src={mediaPreview} className="max-h-48 rounded-md" controls />
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Dynamic Fields based on Category */}
        {form.category === 'event' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={form.details.event_name || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, event_name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organized By *
              </label>
              <input
                type="text"
                value={form.details.organized_by || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, organized_by: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={form.details.date || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    details: { ...prev.details, date: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={form.details.time || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    details: { ...prev.details, time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                type="text"
                value={form.details.venue || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, venue: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dress Code
              </label>
              <input
                type="text"
                value={form.details.dress_code || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, dress_code: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {form.category === 'contest' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contest Name *
              </label>
              <input
                type="text"
                value={form.details.contest_name || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, contest_name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Link *
              </label>
              <input
                type="url"
                value={form.details.registration_link || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, registration_link: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizer Contact *
              </label>
              <input
                type="text"
                value={form.details.organizer_contact || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, organizer_contact: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={form.details.date || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    details: { ...prev.details, date: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={form.details.time || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    details: { ...prev.details, time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                type="text"
                value={form.details.venue || ''}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  details: { ...prev.details, venue: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Post' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
} 