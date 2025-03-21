import { GitHubConfig, ResourceType } from './types';

export const getGitHubConfig = (): GitHubConfig => {
  return {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || 'collegeconnecti2it',
    repositories: {
      IT: process.env.GITHUB_REPO_IT || 'it-resources',
      CE: process.env.GITHUB_REPO_CE || 'ce-resources',
      ENTC: process.env.GITHUB_REPO_ENTC || 'entc-resources',
    },
  };
};

export const validateGitHubConfig = (config: GitHubConfig): boolean => {
  const { token, username, repositories } = config;
  return !!(
    token &&
    username &&
    repositories.IT &&
    repositories.CE &&
    repositories.ENTC
  );
};

// Maximum file size in bytes (50MB for Tech Knowledge, 10MB for others)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
export const TECH_KNOWLEDGE_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for Tech Knowledge

// Function to get max file size based on resource type
export const getMaxFileSize = (resourceType: ResourceType): number => {
  return resourceType === "Tech Knowledge" ? TECH_KNOWLEDGE_MAX_FILE_SIZE : MAX_FILE_SIZE;
};

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

// Function to get a human-readable file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 