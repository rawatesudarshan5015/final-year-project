'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from './UserAvatar';
import { getDisplayRoleName, StudentRole } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  id: number;
  name: string;
  branch: string;
  section: string;
  batch_year: number;
  role: StudentRole;
  company_info?: {
    company_name: string;
    position: string;
  } | null;
}

interface Conversation {
  _id: string;
  id: string;
  updated_at: string;
  participant_names: string;
  participant_ids: string;
  last_message?: {
    content: string;
    sender_id: number;
    created_at: string;
  };
  unread_count?: number;
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const router = useRouter();

  // Fetch recent conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchConversations();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.students);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Format the date for recent chats
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const clearResults = () => {
    setResults([]);
    setQuery('');
  };

  return (
    <div className="bg-white p-4">
      <h2 className="font-bold text-lg mt-2">Search Students</h2>
      <div className="mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-600">Results</p>
            <button 
              onClick={clearResults}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Clear search results"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            {results.slice(0, 4).map((student) => (
              <div
                key={student.id}
                onClick={() => router.push(`/student/${student.id}`)}
                className="py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    name={student.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {getDisplayRoleName(student.role)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {student.branch} {student.section}
                      </span>
                    </div>
                    {student.company_info && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {student.company_info.position} at {student.company_info.company_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Chats */}
      <div className={`${results.length > 0 ? 'mt-6' : 'mt-4'}`}>
        <h3 className="font-medium text-gray-700 mb-2">Recent Chats</h3>
        {isLoadingChats ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 py-3 border-b">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No recent conversations</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => router.push(`/student/${conversation.participant_ids.split(',')[0]}`)}
                className="flex items-center justify-between py-3 px-2 border-b cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <UserAvatar
                    name={conversation.participant_names}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.participant_names}
                    </p>
                    {conversation.last_message && (
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {conversation.updated_at && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(conversation.updated_at)}
                    </span>
                  )}
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <span className="mt-1 inline-flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 