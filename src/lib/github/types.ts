export interface GitHubConfig {
  token: string;
  username: string;
  repositories: {
    IT: string;
    CE: string;
    ENTC: string;
  };
}

export type Pattern = "2024" | "2019" | "2015";
export type Year = "FE" | "SE" | "TE" | "BE";
export type Branch = "IT" | "CE" | "ENTC";
export type Semester = "1" | "2";
export type ExamType = "Insem" | "Endsem" | "Class Test 1" | "Class Test 2";
export type ResourceType = "Tech Knowledge" | "Decode" | "Notes" | "PPTs" | "Question Papers";

export interface ResourceMetadata {
  pattern: Pattern;
  year: Year;
  branch: Branch;
  semester: Semester;
  examType: ExamType;
  resourceType: ResourceType;
  subject: string;
}

export interface Resource {
  name: string;
  path: string;
  type: string;
  download_url: string;
  metadata: ResourceMetadata;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  path?: string;
  error?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubDirectory {
  files: GitHubFile[];
  path: string;
}

export interface DownloadResponse {
  success: boolean;
  message: string;
  files?: string[];
  error?: string;
}

export interface SubjectDefinition {
  name: string;
  code: string;
}

export interface SubjectMap {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        [key: string]: SubjectDefinition[];
      };
    };
  };
} 