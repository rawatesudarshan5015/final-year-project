"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { uploadFile } from "@/lib/github/upload";
import { 
  Pattern, 
  Year, 
  Branch, 
  Semester, 
  ExamType, 
  ResourceType, 
  ResourceMetadata,
  SubjectDefinition 
} from "@/lib/github/types";
import { File, UploadCloud, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSubjects } from "@/lib/github/subjects";
import { getMaxFileSize, formatFileSize } from '@/lib/github/config';

interface UploadResourceDialogProps {
  onUploadComplete: () => Promise<void>;
}

export function UploadResourceDialog({ onUploadComplete }: UploadResourceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pattern, setPattern] = useState<Pattern>("2019");
  const [year, setYear] = useState<Year>("BE");
  const [branch, setBranch] = useState<Branch>("IT");
  const [semester, setSemester] = useState<Semester>("1");
  const [examType, setExamType] = useState<ExamType>("Insem");
  const [resourceType, setResourceType] = useState<ResourceType>("Notes");
  const [subject, setSubject] = useState("");
  const [fileError, setFileError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDefinition[]>([]);

  const { toast } = useToast();

  // Load subjects when pattern, year, branch, or semester changes
  useEffect(() => {
    const subjects = getSubjects(pattern, year, branch, semester);
    setAvailableSubjects(subjects);
    // Reset subject selection when criteria change
    setSubject("");
  }, [pattern, year, branch, semester]);
  
  // Re-validate file size when resource type changes
  useEffect(() => {
    if (file) {
      const maxSize = getMaxFileSize(resourceType);
      if (file.size > maxSize) {
        setFileError(`File is too large. Maximum size for ${resourceType} is ${formatFileSize(maxSize)}.`);
      } else {
        setFileError('');
      }
    }
  }, [resourceType, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Get maximum file size based on selected resource type
      const maxSize = getMaxFileSize(resourceType);
      
      // Check if file is too large
      if (selectedFile.size > maxSize) {
        setFileError(`File is too large. Maximum size for ${resourceType} is ${formatFileSize(maxSize)}.`);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setFileError('');
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const getFileSize = (size: number): string => {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!file) {
      setFileError('Please select a file to upload');
      return;
    }
    
    if (!subject) {
      setSubjectError('Please select a subject');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const metadata: ResourceMetadata = {
        pattern,
        year,
        branch,
        semester,
        examType,
        resourceType,
        subject
      };
      
      const result = await uploadFile(file, metadata);
      
      if (result.success) {
        // Close the dialog first
        setIsOpen(false);
        
        // Reset the form
        setFile(null);
        
        // Show a success notification that stays longer
        toast({
          title: "Upload Successful! ✅",
          description: (
            <div className="space-y-2">
              <p>
                <span className="font-medium">{file.name}</span> has been uploaded successfully.
              </p>
              <p className="text-sm text-gray-600">
                Path: {branch} → {year} → Sem{semester} → {subject} → {resourceType}
              </p>
            </div>
          ),
          variant: "default",
          duration: 6000, // Show for 6 seconds
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Notify parent component that upload is complete
        await onUploadComplete();
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "An error occurred during upload.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="transition-all shadow-md hover:shadow-lg"
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[525px] bg-white border border-gray-200 shadow-lg max-h-[90vh] p-0"
      >
        <ScrollArea className="max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Upload Academic Resource</DialogTitle>
              <DialogDescription className="text-gray-500">
                Share study materials with your peers
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-medium">
                  Resource File
                </Label>
                
                {!file ? (
                  <div 
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      fileError ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Click to select or drag and drop file
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC, DOCX, PPT, PPTX, ZIP etc. (Max 10MB)
                    </p>
                    
                    {fileError && (
                      <p className="text-sm text-red-500 mt-2">{fileError}</p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white rounded-md border">
                        <UploadCloud className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{getFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Resource Metadata */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Resource Metadata</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pattern" className="text-xs">
                      Pattern
                    </Label>
                    <Select defaultValue={pattern} onValueChange={(value: Pattern) => setPattern(value)}>
                      <SelectTrigger id="pattern" className="h-9">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2019">2019 Pattern</SelectItem>
                        <SelectItem value="2015">2015 Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-xs">
                      Year
                    </Label>
                    <Select defaultValue={year} onValueChange={(value: Year) => setYear(value)}>
                      <SelectTrigger id="year" className="h-9">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-xs">
                      Branch
                    </Label>
                    <Select defaultValue={branch} onValueChange={(value: Branch) => setBranch(value)}>
                      <SelectTrigger id="branch" className="h-9">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">Information Technology</SelectItem>
                        <SelectItem value="CE">Computer Engineering</SelectItem>
                        <SelectItem value="ENTC">Electronics & Telecom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-xs">
                      Semester
                    </Label>
                    <Select defaultValue={semester} onValueChange={(value: Semester) => setSemester(value)}>
                      <SelectTrigger id="semester" className="h-9">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examType" className="text-xs">
                      Exam Type
                    </Label>
                    <Select defaultValue={examType} onValueChange={(value: ExamType) => setExamType(value)}>
                      <SelectTrigger id="examType" className="h-9">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="resourceType" className="text-xs">
                      Resource Type
                    </Label>
                    <Select defaultValue={resourceType} onValueChange={(value: ResourceType) => setResourceType(value)}>
                      <SelectTrigger id="resourceType" className="h-9">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tech Knowledge">Tech Knowledge</SelectItem>
                        <SelectItem value="Decode">Decode</SelectItem>
                        <SelectItem value="Notes">Notes</SelectItem>
                        <SelectItem value="PPTs">PPTs</SelectItem>
                        <SelectItem value="Question Papers">Question Papers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="subject" className="text-xs">
                      Subject Name
                    </Label>
                    <Select 
                      value={subject} 
                      onValueChange={(value) => setSubject(value)}
                    >
                      <SelectTrigger 
                        id="subject" 
                        className={`h-9 ${subjectError ? "border-red-300" : ""}`}
                      >
                        <SelectValue placeholder="Select a subject" />
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
                    {subjectError && (
                      <p className="text-xs text-red-500">{subjectError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="min-w-[100px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 