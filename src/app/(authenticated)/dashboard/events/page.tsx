'use client';
import { useEffect, useState } from 'react';
import { Post } from '@/lib/db/types';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';

export default function EventsPage() {
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Events & Contests</h1>
        <Link
          href="/dashboard/posts/create"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          event._id ? (
            <Link
              key={event._id.toString()}
              href={`/dashboard/posts/${event._id}`}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                {/* Author info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Link href={`/student/${event.author_id}`}>
                      <UserAvatar
                        imageUrl={event.author?.profile_pic_url}
                        name={event.author?.name || 'Unknown'}
                        size="sm"
                      />
                    </Link>
                  </div>
                  <div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Link 
                        href={`/student/${event.author_id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {event.author?.name}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.category === 'event' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.category === 'event' ? 'Event' : 'Contest'}
                  </span>
                  <time className="text-sm text-gray-500">
                    {new Date(event.details?.date || '').toLocaleDateString()}
                  </time>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {event.details?.event_name || event.details?.contest_name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>📍 {event.details?.venue}</p>
                  <p>⏰ {event.details?.time}</p>
                  {event.category === 'event' && (
                    <p>👥 {event.details?.organized_by}</p>
                  )}
                </div>

                <p className="mt-4 text-sm text-gray-500 line-clamp-2">
                  {event.description}
                </p>
              </div>
            </Link>
          ) : null
        ))}

        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No events or contests found
          </div>
        )}
      </div>
    </div>
  );
} 