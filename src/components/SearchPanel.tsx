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
    <div className="bg-white p-4">
      <h2 className="font-bold text-lg mt-2">Search Students</h2>
      <div className="mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name..."
          className="w-full px-2 py-1 border border-gray-300"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full mt-2 px-4 py-1 bg-blue-600 text-white text-sm border border-blue-600"
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Results</p>
          {results.map((student) => (
            <div
              key={student.id}
              onClick={() => router.push(`/student/${student.id}`)}
              className="py-2 border-b cursor-pointer hover:bg-gray-50"
            >
              <p className="text-sm">{student.name}</p>
              <p className="text-xs text-gray-600">
                {student.branch} - {student.section}
              </p>
              <p className="text-xs text-gray-500">ERN: {student.ern_number}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 