import JSZip from 'jszip';
import { getRepositoryForBranch } from './upload';
import { ResourceMetadata } from './types';
import { constructPath } from './helpers';

// GitHub API URL
const GITHUB_API_URL = "https://api.github.com";

/**
 * Creates a ZIP file from GitHub files matching the metadata filters
 * This function fetches files from GitHub API and creates a ZIP file client-side
 */
export async function createZipFromGitHub(
  metadata: Partial<ResourceMetadata>,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; filename: string }> {
  try {
    if (!metadata.branch) {
      throw new Error("Branch is required to fetch resources");
    }

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    if (!owner) {
      throw new Error("GitHub owner not found");
    }

    const repo = getRepositoryForBranch(metadata.branch);
    if (!repo) {
      throw new Error("Invalid branch");
    }

    // Construct the path based on provided metadata
    const path = constructPath(metadata);
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    if (!token) {
      throw new Error("GitHub token not found");
    }

    // Fetch the directory contents first
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch resources");
    }

    const contents = await response.json();
    const files = Array.isArray(contents) ? contents : [contents];
    
    // Filter to keep only files (not directories)
    const fileItems = files.filter(item => item.type === 'file');
    
    // Create a new ZIP file
    const zip = new JSZip();
    const totalFiles = fileItems.length;
    let processedFiles = 0;

    // Process each file
    await Promise.all(
      fileItems.map(async (file) => {
        const fileResponse = await fetch(file.download_url);
        
        if (!fileResponse.ok) {
          console.error(`Failed to fetch file: ${file.name}`);
          processedFiles++;
          if (onProgress) onProgress((processedFiles / totalFiles) * 100);
          return;
        }
        
        const fileBlob = await fileResponse.blob();
        
        // Add file to the ZIP
        zip.file(file.name, fileBlob);
        
        // Update progress
        processedFiles++;
        if (onProgress) onProgress((processedFiles / totalFiles) * 100);
      })
    );

    // Get all parts of the path to create a meaningful filename
    const pathParts = path.split('/');
    const zipFileName = `${pathParts[pathParts.length - 1] || 'resources'}.zip`;

    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    return {
      blob,
      filename: zipFileName
    };
  } catch (error) {
    console.error("Error creating ZIP file:", error);
    throw error;
  }
}

/**
 * Initiates a download of a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click it to start the download, then remove it
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
} 