'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type PostCategory = 'achievement' | 'announcement' | 'event' | 'contest' | 'alumni_referral';

interface PostForm {
  category: PostCategory;
  description: string;
  media_file?: File;
  details: {
    event_name?: string;
    organized_by?: string;
    venue?: string;
    date?: string;
    time?: string;
    dress_code?: string;
    contest_name?: string;
    registration_link?: string;
    organizer_contact?: string;
  };
}

export default function CreatePost() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState<PostForm>({
    category: 'announcement',
    description: '',
    details: {}
  });

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, media_file: file }));
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrl = '';
      if (form.media_file) {
        // Upload media file first
        const formData = new FormData();
        formData.append('file', form.media_file);
        formData.append('type', 'post');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media');
        }
        
        const { url } = await uploadResponse.json();
        mediaUrl = url;
      }

      // Create post
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: form.category,
          media_type: form.media_file ? (form.media_file.type.startsWith('image/') ? 'photo' : 'video') : 'text',
          media_url: mediaUrl,
          description: form.description,
          details: form.details,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to create post');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          Post created successfully! Redirecting...
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
              {form.media_file?.type.startsWith('image/') ? (
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
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
} 