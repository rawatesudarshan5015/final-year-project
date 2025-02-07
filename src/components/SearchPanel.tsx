'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: number;
  name: string;
  ern_number: string;
  branch: string;
  section: string;
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search Students
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter name..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Results</h3>
          <div className="space-y-2">
            {results.map((student) => (
              <div
                key={student.id}
                onClick={() => router.push(`/student/${student.id}`)}
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                <p className="text-xs text-gray-500">
                  {student.branch} - {student.section}
                </p>
                <p className="text-xs text-gray-500">ERN: {student.ern_number}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 