import { GitHubConfig, ResourceMetadata, UploadResponse } from './types';
import { getGitHubConfig, validateGitHubConfig, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './config';

const fetchGitHubAPI = async (
  url: string,
  method: string,
  body: any = null,
  token: string
): Promise<any> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} - ${data.message || 'Unknown error'}`
      );
    }

    return data;
  } catch (error) {
    console.error('GitHub API request failed:', error);
    throw error;
  }
};

// Check if a file exists in GitHub repository
const checkFileExists = async (
  config: GitHubConfig,
  repo: string,
  path: string
): Promise<{exists: boolean, sha?: string}> => {
  try {
    const url = `https://api.github.com/repos/${config.username}/${repo}/contents/${path}`;
    const data = await fetchGitHubAPI(url, 'GET', null, config.token);
    return { exists: true, sha: data.sha };
  } catch (error) {
    // If response is 404, file doesn't exist - this is normal
    if (error instanceof Error && error.message.includes('404')) {
      return { exists: false };
    }
    // Rethrow any other errors
    throw error;
  }
};

// Generate a unique file name if a file with the same name already exists
const generateUniqueFilename = (originalName: string, existingNames: string[]): string => {
  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  const nameParts = originalName.split('.');
  const extension = nameParts.pop() || '';
  const baseName = nameParts.join('.');
  
  let counter = 1;
  let newName = `${baseName}(${counter}).${extension}`;
  
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName}(${counter}).${extension}`;
  }
  
  return newName;
};

// Get all files in a directory
const getDirectoryContents = async (
  config: GitHubConfig,
  repo: string,
  path: string
): Promise<string[]> => {
  try {
    const url = `https://api.github.com/repos/${config.username}/${repo}/contents/${path}`;
    const data = await fetchGitHubAPI(url, 'GET', null, config.token);
    
    // If data is an array, it's a directory
    if (Array.isArray(data)) {
      return data.map(item => item.name);
    }
    
    // If we get here, it's a file not a directory
    return [];
  } catch (error) {
    // If 404, directory doesn't exist yet, which is fine
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    throw error;
  }
};

// Validate file before upload
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
    return {
      valid: false,
      error: `File type ${file.type || 'unknown'} is not allowed`,
    };
  }

  return { valid: true };
};

// Create path from resource metadata
export const createPathFromMetadata = (metadata: ResourceMetadata, filename: string): string => {
  return [
    metadata.pattern,
    metadata.year,
    metadata.semester,
    metadata.subject,
    metadata.examType,
    metadata.resourceType,
    filename,
  ].join('/');
};

// Get repository name for a branch
export const getRepositoryForBranch = (branch: string): string => {
  switch (branch) {
    case 'IT':
      return process.env.NEXT_PUBLIC_GITHUB_REPO_IT || 'it-resources';
    case 'CE':
      return process.env.NEXT_PUBLIC_GITHUB_REPO_CE || 'ce-resources';
    case 'ENTC':
      return process.env.NEXT_PUBLIC_GITHUB_REPO_ENTC || 'entc-resources';
    default:
      throw new Error(`Invalid branch: ${branch}`);
  }
};

interface UploadResult {
  success: boolean;
  error?: string;
}

export async function uploadFile(
  file: File,
  metadata: ResourceMetadata
): Promise<UploadResult> {
  try {
    // Get the access token from environment variables
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token not found");
    }

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    if (!owner) {
      throw new Error("GitHub owner not found");
    }

    // Get repository based on branch
    const repo = getRepositoryForBranch(metadata.branch);

    // Create the file path based on metadata
    const filePath = createFilePath(file.name, metadata);

    // Convert file to base64
    const base64Content = await fileToBase64(file);

    // Create or update the file in the repository
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64Content,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload file");
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

function createFilePath(fileName: string, metadata: ResourceMetadata): string {
  const { pattern, year, semester, examType, resourceType, subject } = metadata;
  return `${pattern}/${year}/Sem${semester}/${examType}/${resourceType}/${subject}/${fileName}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Content = base64String.split(",")[1];
      resolve(base64Content);
    };
    reader.onerror = (error) => reject(error);
  });
} 