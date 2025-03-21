"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  File,
  FileText, 
  FileImage, 
  FileVideo, 
  FileIcon,
  Search,
  Download,
  Clock,
  Calendar,
  BookOpen,
  ExternalLink,
  Library,
  PresentationIcon,
  FileQuestion,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Resource, ResourceMetadata } from "@/lib/github/types";
import { useToast } from "@/components/ui/use-toast";
import { getRepositoryForBranch } from "@/lib/github/upload";
import { createZipFromGitHub, downloadBlob } from '@/lib/github/zipUtils';
import { Progress } from "@/components/ui/progress";

interface ResourceListProps {
  resources: Resource[];
  isLoading?: boolean;
  zipDownloadUrl?: string | null;
  currentFilters?: Partial<ResourceMetadata>;
}

export function ResourceList({ 
  resources, 
  isLoading = false, 
  zipDownloadUrl,
  currentFilters 
}: ResourceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  
  // Handle direct ZIP download with client-side creation
  const handleDirectZipDownload = async () => {
    if (!currentFilters) {
      toast({
        title: "Error",
        description: "No filters selected for download",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingZip(true);
    setZipProgress(0);
    
    try {
      // Show toast for starting the process
      toast({
        title: "Creating ZIP file",
        description: "Preparing files for download...",
        duration: 3000,
      });
      
      // Create the ZIP file from GitHub contents
      const { blob, filename } = await createZipFromGitHub(
        currentFilters,
        (progress) => setZipProgress(progress)
      );
      
      // Trigger the download
      downloadBlob(blob, filename);
      
      // Show success toast
      toast({
        title: "Download Started ✓",
        description: `Your ZIP file "${filename}" is being downloaded.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      
      // Show error toast with fallback options
      toast({
        title: "Download Failed",
        description: (
          <div className="mt-2 space-y-2">
            <p>{error instanceof Error ? error.message : "Failed to create ZIP file"}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (zipDownloadUrl) window.open(zipDownloadUrl, '_blank');
                }}
                className="text-left text-blue-600 hover:underline"
              >
                Try Fallback Method (DownGit)
              </button>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsCreatingZip(false);
    }
  };
  
  // Handle ZIP download with toast notification and fallbacks
  const handleExternalZipDownload = () => {
    if (zipDownloadUrl) {
      try {
        // Open the download URL in a new tab
        window.open(zipDownloadUrl, '_blank');
        
        // Show a toast notification
        toast({
          title: "Download Initiated ✓",
          description: `Preparing ZIP file with ${resources.length} resources. The download will begin shortly.`,
          duration: 5000,
        });
      } catch (error) {
        console.error("Error opening download URL:", error);
        
        // Show fallback options if there's an error
        toast({
          title: "Download Service Issue",
          description: (
            <div className="mt-2 space-y-2">
              <p>The download service may be temporarily unavailable.</p>
              <div className="pt-2 flex flex-col gap-2">
                <a 
                  href="https://download-directory.github.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Try Alternative Download Service
                </a>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getGitHubUrl());
                    toast({
                      title: "GitHub URL Copied!",
                      description: "Paste it in the alternative download service.",
                      duration: 3000,
                    });
                  }}
                  className="text-left text-green-600 hover:underline"
                >
                  Copy GitHub Directory URL
                </button>
              </div>
            </div>
          ),
          duration: 10000,
        });
      }
    }
  };
  
  // Get the GitHub URL for the directory (for fallback options)
  const getGitHubUrl = (): string => {
    if (!currentFilters?.branch) return "";
    
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = getRepositoryForBranch(currentFilters.branch);
    
    if (!owner || !repo) return "";
    
    // Create path components
    const pathParts = [];
    if (currentFilters.pattern) pathParts.push(currentFilters.pattern);
    if (currentFilters.year) pathParts.push(currentFilters.year);
    if (currentFilters.semester) pathParts.push(`Sem${currentFilters.semester}`);
    if (currentFilters.examType) pathParts.push(currentFilters.examType);
    if (currentFilters.resourceType) pathParts.push(currentFilters.resourceType);
    if (currentFilters.subject) pathParts.push(currentFilters.subject);
    
    const path = pathParts.join("/");
    return `https://github.com/${owner}/${repo}/tree/main/${path}`;
  };

  // Get path for filters to display to the user
  const getFilterPath = () => {
    if (!currentFilters) return "";
    
    const parts = [];
    if (currentFilters.pattern) parts.push(currentFilters.pattern);
    if (currentFilters.year) parts.push(currentFilters.year);
    if (currentFilters.semester) parts.push(`Sem${currentFilters.semester}`);
    if (currentFilters.examType) parts.push(currentFilters.examType);
    if (currentFilters.resourceType) parts.push(currentFilters.resourceType);
    if (currentFilters.subject) parts.push(currentFilters.subject);
    
    return parts.join(" → ");
  };

  const filteredResources = useMemo(() => {
    return resources.filter(resource => 
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.metadata.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  function getFileIcon(fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <FileImage className="h-5 w-5 text-green-500" />;
      case "mp4":
      case "avi":
        return <FileVideo className="h-5 w-5 text-purple-500" />;
      case "xls":
      case "xlsx":
        return <FileIcon className="h-5 w-5 text-emerald-500" />;
      case "ppt":
      case "pptx":
        return <FileIcon className="h-5 w-5 text-orange-500" />;
      case "zip":
      case "rar":
        return <FileIcon className="h-5 w-5 text-gray-500" />;
      case "html":
      case "js":
      case "css":
      case "ts":
      case "tsx":
        return <FileText className="h-5 w-5 text-indigo-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  }

  function getResourceTypeIcon(resourceType: string) {
    switch (resourceType) {
      case "Decode":
        return <FileText className="h-4 w-4 mr-1" />;
      case "Notes":
        return <BookOpen className="h-4 w-4 mr-1" />;
      case "Tech Knowledge":
        return <Library className="h-4 w-4 mr-1" />;
      case "PPTs":
        return <PresentationIcon className="h-4 w-4 mr-1" />;
      case "Question Papers":
        return <FileQuestion className="h-4 w-4 mr-1" />;
      default:
        return <File className="h-4 w-4 mr-1" />;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search resources by name or subject..."
            className="pl-9 h-10 bg-white border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {resources.length > 0 && (
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 font-medium"
              onClick={handleDirectZipDownload}
              disabled={isCreatingZip}
            >
              <Archive className="h-4 w-4" />
              {isCreatingZip ? `Creating ZIP (${Math.round(zipProgress)}%)` : `Download All (${resources.length})`}
            </Button>
            
            {isCreatingZip && (
              <div className="absolute -bottom-2 left-0 right-0 h-1">
                <Progress value={zipProgress} className="h-1 bg-blue-100" />
              </div>
            )}
            
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-600 hidden group-hover:block z-10">
              <p>Creates and downloads a ZIP file containing all {resources.length} resources matching your filters.</p>
              {currentFilters && (
                <div className="mt-2 pb-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-700">Filter criteria:</p>
                  <p className="text-xs mt-1 bg-gray-50 p-1.5 rounded border border-gray-200 overflow-x-auto whitespace-nowrap">
                    {getFilterPath()}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-green-600">
                <span className="font-medium">✓ Direct Download:</span> Files are fetched and packaged directly in your browser.
              </p>
              {zipDownloadUrl && (
                <button 
                  onClick={handleExternalZipDownload}
                  className="mt-3 text-xs text-blue-600 hover:underline flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Fallback: Use DownGit service
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-md bg-gray-50">
          <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchQuery.trim() !== '' 
              ? "No resources match your search query. Try a different search term."
              : "No resources available with the current filters."}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md shadow-sm bg-white">
          <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
            {filteredResources.map((resource) => (
              <div 
                key={resource.path} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-blue-50 border-b last:border-b-0 transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0 mb-3 sm:mb-0">
                  <div className="w-12 h-12 flex items-center justify-center rounded-md bg-white border border-gray-200 flex-shrink-0 shadow-sm group-hover:border-blue-200 group-hover:shadow transition-all">
                    {getFileIcon(resource.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {resource.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-medium py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 rounded-full">
                        {resource.metadata.subject}
                      </Badge>
                      <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full py-0.5 px-2">
                        {getResourceTypeIcon(resource.metadata.resourceType)}
                        <span>{resource.metadata.resourceType}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span>{resource.metadata.year}, Semester {resource.metadata.semester}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <span>{resource.metadata.examType}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:ml-4 flex-shrink-0 w-full sm:w-auto group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                  onClick={() => window.open(resource.download_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 