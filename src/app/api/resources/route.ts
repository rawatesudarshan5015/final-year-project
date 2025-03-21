import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { fetchResources, generateDirectoryZipUrl } from '@/lib/github/fetch';
import { getRepositoryForBranch } from '@/lib/github/upload';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    verifyToken(token);
    
    const { filters } = await request.json();
    
    // Validate filters
    if (!filters || !filters.branch) {
      return NextResponse.json(
        { success: false, error: 'Branch is required to fetch resources' },
        { status: 400 }
      );
    }
    
    // Get repository based on branch
    const repo = getRepositoryForBranch(filters.branch);
    
    const result = await fetchResources(filters);
    
    // Generate ZIP download URL (as a fallback option)
    const zipDownloadUrl = generateDirectoryZipUrl(filters);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        resources: result.resources,
        zipDownloadUrl, // Keep this as a fallback option
        filters: filters
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to fetch resources',
          filters: filters
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Resources fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching resources' },
      { status: 500 }
    );
  }
} 