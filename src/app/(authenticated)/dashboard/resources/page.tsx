"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { UploadResourceDialog } from "@/components/resources/UploadResourceDialog";
import { ResourceList } from "@/components/resources/ResourceList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Book } from "lucide-react";
import {
  Pattern,
  Year,
  Branch,
  Semester,
  ExamType,
  ResourceType,
  ResourceMetadata,
  Resource,
  SubjectDefinition
} from "@/lib/github/types";
import { fetchResources } from "@/lib/github/fetch";
import { getSubjects } from "@/lib/github/subjects";

export default function ResourcesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMatchingResources, setNoMatchingResources] = useState<boolean>(false);
  const [searched, setSearched] = useState(false);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  
  // Filter states
  const [pattern, setPattern] = useState<Pattern>("2019");
  const [year, setYear] = useState<Year>("BE");
  const [branch, setBranch] = useState<Branch>("IT");
  const [semester, setSemester] = useState<Semester>("1");
  const [examType, setExamType] = useState<ExamType>("Insem");
  const [resourceType, setResourceType] = useState<ResourceType>("Notes");
  const [subject, setSubject] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDefinition[]>([]);

  const validateFilters = (): boolean => {
    if (!pattern || !year || !branch || !semester || !examType || !resourceType || !subject.trim()) {
      setError("Please select all filter options before searching");
      return false;
    }
    setError(null);
    return true;
  };

  async function loadResources() {
    setIsLoading(true);
    setError(null);
    setNoMatchingResources(false);
    setSearched(true);
    setZipDownloadUrl(null);
    
    try {
      // Only include selected filters
      const appliedFilters: Partial<ResourceMetadata> = {};
      if (pattern) appliedFilters.pattern = pattern as Pattern;
      if (year) appliedFilters.year = year as Year;
      if (branch) appliedFilters.branch = branch as Branch;
      if (semester) appliedFilters.semester = semester as Semester;
      if (examType) appliedFilters.examType = examType as ExamType;
      if (resourceType) appliedFilters.resourceType = resourceType as ResourceType;
      if (subject) appliedFilters.subject = subject;
      
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ filters: appliedFilters })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResources(data.resources);
        setZipDownloadUrl(data.zipDownloadUrl);
        setNoMatchingResources(data.resources.length === 0);
      } else {
        setError(data.error || 'Failed to load resources');
      }
    } catch (err) {
      setError('An error occurred while loading resources');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Load subjects when pattern, year, branch, or semester changes
  useEffect(() => {
    const subjects = getSubjects(pattern, year, branch, semester);
    setAvailableSubjects(subjects);
    // Reset subject selection when criteria change
    setSubject("");
  }, [pattern, year, branch, semester]);

  return (
    <div className="py-6 px-4 sm:px-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Academic Resources</h1>
            <p className="text-gray-600 mt-1">
              Access and download study materials, question papers, and more
            </p>
          </div>
          <UploadResourceDialog onUploadComplete={loadResources} />
        </div>

        <Card className="shadow-sm border-gray-200 mb-6">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Resource Filters</CardTitle>
            <CardDescription>
              Select all filters to find resources
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pattern" className="text-sm font-medium">Pattern</Label>
                <Select 
                  value={pattern} 
                  onValueChange={(value: string) => setPattern(value as Pattern)}
                >
                  <SelectTrigger id="pattern" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024 Pattern</SelectItem>
                    <SelectItem value="2019">2019 Pattern</SelectItem>
                    <SelectItem value="2015">2015 Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-sm font-medium">Year</Label>
                <Select 
                  value={year} 
                  onValueChange={(value: string) => setYear(value as Year)}
                >
                  <SelectTrigger id="year" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FE">First Year</SelectItem>
                    <SelectItem value="SE">Second Year</SelectItem>
                    <SelectItem value="TE">Third Year</SelectItem>
                    <SelectItem value="BE">Final Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
                <Select 
                  value={branch} 
                  onValueChange={(value: string) => setBranch(value as Branch)}
                >
                  <SelectTrigger id="branch" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">Information Technology</SelectItem>
                    <SelectItem value="CE">Computer Engineering</SelectItem>
                    <SelectItem value="ENTC">Electronics & Telecom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester" className="text-sm font-medium">Semester</Label>
                <Select 
                  value={semester} 
                  onValueChange={(value: string) => setSemester(value as Semester)}
                >
                  <SelectTrigger id="semester" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="examType" className="text-sm font-medium">Exam Type</Label>
                <Select 
                  value={examType} 
                  onValueChange={(value: string) => setExamType(value as ExamType)}
                >
                  <SelectTrigger id="examType" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Insem">Insem</SelectItem>
                    <SelectItem value="Endsem">Endsem</SelectItem>
                    <SelectItem value="Class Test 1">Class Test 1</SelectItem>
                    <SelectItem value="Class Test 2">Class Test 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resourceType" className="text-sm font-medium">Resource Type</Label>
                <Select 
                  value={resourceType} 
                  onValueChange={(value: string) => setResourceType(value as ResourceType)}
                >
                  <SelectTrigger id="resourceType" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notes">Notes</SelectItem>
                    <SelectItem value="Tech Knowledge">Tech Knowledge</SelectItem>
                    <SelectItem value="Decode">Decode</SelectItem>
                    <SelectItem value="PPTs">PPTs</SelectItem>
                    <SelectItem value="Question Papers">Question Papers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Select 
                  value={subject} 
                  onValueChange={(value) => setSubject(value)}
                >
                  <SelectTrigger id="subject" className="border-gray-300 bg-white h-9">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map((subj) => (
                        <SelectItem key={subj.code} value={subj.name}>
                          {subj.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No subjects found for selected criteria
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 flex justify-center">
              <Button 
                className="px-8 bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={loadResources}
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search Resources"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && (
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-semibold text-gray-800">Available Resources</CardTitle>
              <CardDescription>
                {resources.length} resources found
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center my-8">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : noMatchingResources ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md">
                  No resources found for the selected filters. Try changing your filter criteria or upload new resources.
                </div>
              ) : (
                <ResourceList 
                  resources={resources} 
                  zipDownloadUrl={zipDownloadUrl}
                  currentFilters={{
                    pattern,
                    year,
                    branch,
                    semester,
                    examType,
                    resourceType,
                    subject
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 