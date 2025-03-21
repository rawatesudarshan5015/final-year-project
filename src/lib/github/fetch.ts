import { Resource, ResourceMetadata } from "./types";
import { getRepositoryForBranch } from "./upload";
import { constructPath } from "./helpers";

const GITHUB_API_URL = "https://api.github.com";

interface FetchResult {
  success: boolean;
  resources?: Resource[];
  error?: string;
}

export async function fetchResources(
  metadata: Partial<ResourceMetadata>
): Promise<FetchResult> {
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

    if (!metadata.branch) {
      throw new Error("Branch is required to fetch resources");
    }

    // Get repository based on branch
    const repo = getRepositoryForBranch(metadata.branch);

    // Construct the path based on provided metadata
    const path = constructPath(metadata);

    // Fetch contents from the repository
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

    const data = await response.json();
    const resources = Array.isArray(data) ? data : [data];

    // Branch is already validated above, so it can't be undefined here
    const branch = metadata.branch;

    // Filter and transform the resources
    const filteredResources = resources
      .filter((item) => item.type === "file")
      .map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        download_url: item.download_url,
        metadata: extractMetadata(item.path, branch),
      }));

    return { success: true, resources: filteredResources };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch resources",
    };
  }
}

function extractMetadata(path: string, branch: ResourceMetadata["branch"]): ResourceMetadata {
  const parts = path.split("/");
  return {
    pattern: parts[0] as ResourceMetadata["pattern"],
    year: parts[1] as ResourceMetadata["year"],
    branch,
    semester: parts[2].replace("Sem", "") as ResourceMetadata["semester"],
    examType: parts[3] as ResourceMetadata["examType"],
    resourceType: parts[4] as ResourceMetadata["resourceType"],
    subject: parts[5],
  };
}

/**
 * Generate a GitHub ZIP download URL for a directory based on metadata filters
 * This URL will download only the specific directory contents as a ZIP file using DownGit
 */
export function generateDirectoryZipUrl(metadata: Partial<ResourceMetadata>): string | null {
  try {
    if (!metadata.branch) {
      return null; // Branch is required
    }

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = getRepositoryForBranch(metadata.branch);
    
    if (!owner || !repo) {
      return null;
    }

    // Construct the path based on provided metadata
    const path = constructPath(metadata);
    
    // Create the GitHub URL for the specific directory
    const githubUrl = `https://github.com/${owner}/${repo}/tree/main/${path}`;
    const encodedGithubUrl = encodeURIComponent(githubUrl);
    
    // Primary service: Using minhaskamal's DownGit service
    // This creates a direct download link for just the specified directory
    return `https://minhaskamal.github.io/DownGit/#/home?url=${encodedGithubUrl}`;
    
    // Alternative services (if primary is down):
    // 1. https://download-directory.github.io/?url=${githubUrl}
    // 2. https://downgit.github.io/#/home?url=${encodedGithubUrl}
  } catch (error) {
    console.error("Error generating ZIP URL:", error);
    return null;
  }
} 