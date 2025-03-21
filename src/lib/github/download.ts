import { DownloadResponse, GitHubConfig, GitHubDirectory, GitHubFile, ResourceMetadata } from './types';
import { getGitHubConfig, validateGitHubConfig } from './config';
import { getRepositoryForBranch } from './upload';

// Fetch the GitHub API
const fetchGitHubAPI = async (
  url: string,
  method: string = 'GET',
  token: string
): Promise<any> => {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${token}`,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API error: ${response.status} - ${errorText || 'Unknown error'}`
      );
    }

    // If response is a file download and not JSON
    if (response.headers.get('content-type')?.includes('application/octet-stream')) {
      return response.blob();
    }

    // Otherwise, parse as JSON
    return response.json();
  } catch (error) {
    console.error('GitHub API request failed:', error);
    throw error;
  }
};

// Get directory contents from GitHub
export const getDirectoryContents = async (
  pathParts: string[],
  branch: string
): Promise<GitHubDirectory> => {
  try {
    const config = getGitHubConfig();
    
    if (!validateGitHubConfig(config)) {
      throw new Error('GitHub configuration is missing or invalid');
    }
    
    const repo = getRepositoryForBranch(config, branch);
    const path = pathParts.join('/');
    
    const url = `https://api.github.com/repos/${config.username}/${repo}/contents/${path}`;
    const data = await fetchGitHubAPI(url, 'GET', config.token);
    
    // Handle case where data is a single file, not a directory
    if (!Array.isArray(data)) {
      return {
        files: [data],
        path,
      };
    }
    
    return {
      files: data,
      path,
    };
  } catch (error) {
    console.error('Error fetching directory contents:', error);
    
    // If 404, directory doesn't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      return {
        files: [],
        path: pathParts.join('/'),
      };
    }
    
    throw error;
  }
};

// Download a single file from GitHub
export const downloadFile = async (
  file: GitHubFile
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const config = getGitHubConfig();
    
    if (!validateGitHubConfig(config)) {
      throw new Error('GitHub configuration is missing or invalid');
    }
    
    // If download_url is provided, use it directly
    if (file.download_url) {
      const blob = await fetchGitHubAPI(file.download_url, 'GET', config.token);
      return { blob, filename: file.name };
    }
    
    throw new Error('Download URL not available for this file');
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Download multiple files as a zip archive
export const downloadMultipleFiles = async (
  files: GitHubFile[]
): Promise<DownloadResponse> => {
  try {
    const downloadPromises = files.map(file => downloadFile(file));
    const downloadedFiles = await Promise.all(downloadPromises);
    
    // Here we would typically use JSZip to create a zip file
    // but for now, let's just return success with the file names
    return {
      success: true,
      message: `Successfully prepared ${downloadedFiles.length} files for download`,
      files: downloadedFiles.map(df => df.filename),
    };
  } catch (error) {
    console.error('Error downloading multiple files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to download files',
    };
  }
};

// Generate download link for a single file
export const generateDownloadUrl = (file: GitHubFile): string => {
  if (file.download_url) {
    return file.download_url;
  }
  
  const config = getGitHubConfig();
  if (validateGitHubConfig(config)) {
    return `https://raw.githubusercontent.com/${config.username}/${file.path.split('/')[0]}/main/${file.path}`;
  }
  
  throw new Error('Unable to generate download URL');
};

// Create path from resource metadata
export const createPathFromMetadata = (metadata: ResourceMetadata): string[] => {
  return [
    metadata.pattern,
    metadata.year,
    metadata.semester,
    metadata.subject,
    metadata.examType,
    metadata.resourceType,
  ];
};

// Helper to get all possible paths for browsing
export const getParentPaths = (path: string): { label: string; path: string }[] => {
  const parts = path.split('/').filter(Boolean);
  const result: { label: string; path: string }[] = [{ label: 'Home', path: '' }];
  
  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += (currentPath ? '/' : '') + part;
    
    // Generate a more human-readable label
    let label = part;
    if (index === 0) label = `Pattern: ${part}`;
    if (index === 1) label = `Year: ${part}`;
    if (index === 2) label = `Semester: ${part}`;
    if (index === 3) label = `Subject: ${part}`;
    if (index === 4) label = `Exam: ${part}`;
    if (index === 5) label = `Type: ${part}`;
    
    result.push({ label, path: currentPath });
  });
  
  return result;
}; 