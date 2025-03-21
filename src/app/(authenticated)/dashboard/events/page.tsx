'use client';
import { useEffect, useState } from 'react';
import { Post } from '@/lib/db/types';
import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

export default function EventsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
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
          // Log author information to help debugging
          if (data.events && data.events.length > 0) {
            console.log('Events page received data:', {
              total_events: data.events.length,
              events_with_author: data.events.filter((event: Post) => !!event.author).length,
              first_event: data.events[0] ? {
                id: data.events[0]._id,
                author_id: data.events[0].author_id,
                has_author: !!data.events[0].author,
                author_name: data.events[0].author?.name || 'Missing'
              } : 'No events'
            });
          }
          setAllPosts(data.events);
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

  // Filter events and contests
  const events = allPosts.filter(post => post.category === 'event');
  const contests = allPosts.filter(post => post.category === 'contest');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <p className="mt-2 text-gray-500">Loading events and contests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events & Contests</h1>
            <p className="text-gray-600 mt-1">Discover upcoming events and contests</p>
          </div>
          <Link
            href="/dashboard/posts/create"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </Link>
        </div>
      </div>

      {/* Events and Contests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events Column */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event._id?.toString()} post={event} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-gray-600 mb-2 font-medium">No upcoming events</h3>
              <p className="text-gray-500 text-sm mb-4">There are no events scheduled at the moment.</p>
              <Link
                href="/dashboard/posts/create"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                Create an Event
              </Link>
            </div>
          )}
        </div>

        {/* Contests Column */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ongoing Contests</h2>
          </div>
          
          {contests.length > 0 ? (
            <div className="space-y-4">
              {contests.map((contest) => (
                <EventCard key={contest._id?.toString()} post={contest} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h3 className="text-gray-600 mb-2 font-medium">No active contests</h3>
              <p className="text-gray-500 text-sm mb-4">There are no contests available at the moment.</p>
              <Link
                href="/dashboard/posts/create"
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
              >
                Create a Contest
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Format date function
function formatEventDate(dateString: string): string {
  if (!dateString) return 'TBA';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
}

// Event/Contest Card Component
function EventCard({ post }: { post: Post }) {
  // Add debugging for author data
  console.log('EventCard author data:', {
    post_id: post._id,
    author_id: post.author_id,
    author: post.author,
    has_author: !!post.author,
    author_name: post.author?.name || 'No name',
    profile_pic: post.author?.profile_pic_url || 'No pic'
  });

  // Get post date
  const eventDate = post.details?.date 
    ? new Date(post.details.date) 
    : new Date();
  
  // Format date for display
  const dateDisplay = formatEventDate(post.details?.date || '');
  
  // Get company info if available
  const companyInfo = post.author?.current_internship 
    ? `${post.author.current_internship.position} at ${post.author.current_internship.company_name}`
    : post.author?.work_history && Array.isArray(post.author.work_history) && post.author.work_history.length > 0
      ? (() => {
          const currentJob = post.author.work_history.find(job => job.is_current);
          return currentJob 
            ? `${currentJob.position} at ${currentJob.company_name}`
            : null;
        })()
      : null;

  // Format time for display
  const timeDisplay = post.details?.time 
    ? post.details.time.replace(/:/g, '\u2236') // Replace : with ∶ for better visual
    : 'TBA';

  // Days until the event
  const daysUntil = post.details?.date 
    ? Math.ceil((new Date(post.details.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link
      href={`/dashboard/posts/${post._id}`}
      className="block group"
    >
      <div className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border ${
        post.category === 'event' ? 'border-green-100' : 'border-purple-100'
      } relative`}>
        <div className={`h-2 ${
          post.category === 'event' ? 'bg-green-500' : 'bg-purple-500'
        }`}></div>

        {/* Upcoming badge */}
        {daysUntil !== null && daysUntil <= 3 && daysUntil >= 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              {daysUntil === 0 ? 'Today!' : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
            </span>
          </div>
        )}
        
        <div className="p-5">
          {/* Date and Category */}
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <div className={`min-w-[3.5rem] h-14 rounded-lg ${
                post.category === 'event' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
              } flex items-center justify-center font-medium text-xs`}>
                <div className="flex flex-col items-center">
                  <span className="uppercase text-xs">{dateDisplay.split(' ')[0]}</span>
                  <span className="uppercase text-xs">{dateDisplay.split(' ')[1]}</span>
                  <span className="text-lg font-bold">{dateDisplay.split(' ')[2]}</span>
                </div>
              </div>
              <span className={`ml-3 px-2.5 py-1 text-xs font-medium rounded-full ${
                post.category === 'event' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {post.category === 'event' ? 'Event' : 'Contest'}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeDisplay}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.details?.event_name || post.details?.contest_name || 'Untitled'}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.description}
          </p>

          {/* Event Details */}
          <div className="flex flex-col space-y-1 text-sm text-gray-600 mb-4">
            {post.details?.venue && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{post.details.venue}</span>
              </div>
            )}
            {post.details?.organized_by && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="truncate">{post.details.organized_by}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
            {/* Author Info */}
            <div className="border-t pt-3 mt-auto flex-grow">
              <div className="flex items-center space-x-3">
                {post.author ? (
                  <UserAvatar
                    imageUrl={post.author.profile_pic_url}
                    name={post.author.name}
                    size="sm"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    {post.details?.organized_by ? post.details.organized_by.charAt(0).toUpperCase() : "O"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.author?.name || (post.details?.organized_by ? post.details.organized_by : 'Event Organizer')}
                  </p>
                  {companyInfo ? (
                    <p className="text-xs text-gray-500 truncate">{companyInfo}</p>
                  ) : post.author ? (
                    <p className="text-xs text-gray-500 truncate">Posted by student</p>
                  ) : post.details?.organized_by ? (
                    <p className="text-xs text-gray-500 truncate">Event organizer</p>
                  ) : post.category === 'contest' ? (
                    <p className="text-xs text-gray-500 truncate">Contest host</p>
                  ) : (
                    <p className="text-xs text-gray-500 truncate">Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  )}
                </div>
              </div>
            </div>

            {/* View details button */}
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                post.category === 'event' 
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              } inline-flex items-center`}>
                <span className="mr-1">→</span> View Details
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 