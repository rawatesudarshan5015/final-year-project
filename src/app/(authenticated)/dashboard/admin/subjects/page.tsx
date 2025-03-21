"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Pattern, 
  Year, 
  Branch, 
  Semester,
  SubjectDefinition 
} from "@/lib/github/types";
import { getSubjects } from "@/lib/github/subjects";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function SubjectsAdminPage() {
  const [pattern, setPattern] = useState<Pattern>("2019");
  const [year, setYear] = useState<Year>("BE");
  const [branch, setBranch] = useState<Branch>("IT");
  const [semester, setSemester] = useState<Semester>("1");
  
  const [subjects, setSubjects] = useState<SubjectDefinition[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<SubjectDefinition | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  
  const { toast } = useToast();
  
  // Load subjects when criteria change
  useEffect(() => {
    const loadedSubjects = getSubjects(pattern, year, branch, semester);
    setSubjects(loadedSubjects);
  }, [pattern, year, branch, semester]);
  
  const handleAddSubject = () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      toast({
        title: "Error",
        description: "Subject name and code are required",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would make an API call to update the database
    // For now, we're just updating the local state
    const newSubject = { name: newSubjectName, code: newSubjectCode };
    setSubjects([...subjects, newSubject]);
    
    // Reset form
    setNewSubjectName("");
    setNewSubjectCode("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Subject added successfully",
    });
  };
  
  const handleEditSubject = () => {
    if (!currentSubject || !newSubjectName.trim() || !newSubjectCode.trim()) {
      toast({
        title: "Error",
        description: "Subject name and code are required",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would make an API call to update the database
    // For now, we're just updating the local state
    const updatedSubjects = subjects.map(s => 
      s.code === currentSubject.code 
        ? { name: newSubjectName, code: newSubjectCode }
        : s
    );
    
    setSubjects(updatedSubjects);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Subject updated successfully",
    });
  };
  
  const handleDeleteSubject = (code: string) => {
    // In a real application, this would make an API call to update the database
    // For now, we're just updating the local state
    const updatedSubjects = subjects.filter(s => s.code !== code);
    setSubjects(updatedSubjects);
    
    toast({
      title: "Success",
      description: "Subject deleted successfully",
    });
  };
  
  const openEditDialog = (subject: SubjectDefinition) => {
    setCurrentSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectCode(subject.code);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Subject Management</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subject Criteria</CardTitle>
          <CardDescription>
            Select the pattern, year, branch, and semester to view and manage subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Select value={pattern} onValueChange={(value: Pattern) => setPattern(value)}>
                <SelectTrigger id="pattern">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2019">2019 Pattern</SelectItem>
                  <SelectItem value="2015">2015 Pattern</SelectItem>
                  <SelectItem value="2024">2024 Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={(value: Year) => setYear(value)}>
                <SelectTrigger id="year">
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
              <Label htmlFor="branch">Branch</Label>
              <Select value={branch} onValueChange={(value: Branch) => setBranch(value)}>
                <SelectTrigger id="branch">
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
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={(value: Semester) => setSemester(value)}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>
              Manage subjects for {pattern} pattern, {year}, {branch}, Semester {semester}
            </CardDescription>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                  Enter the details for the new subject
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName">Subject Name</Label>
                  <Input 
                    id="subjectName" 
                    value={newSubjectName} 
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Machine Learning"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subjectCode">Subject Code</Label>
                  <Input 
                    id="subjectCode" 
                    value={newSubjectCode} 
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="e.g. ITC701"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSubject}>
                  Add Subject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {subjects.length > 0 ? (
            <Table>
              <TableCaption>
                List of subjects for the selected criteria
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.code}>
                    <TableCell className="font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteSubject(subject.code)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-gray-500">
              No subjects found for the selected criteria
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the details for this subject
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSubjectName">Subject Name</Label>
              <Input 
                id="editSubjectName" 
                value={newSubjectName} 
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editSubjectCode">Subject Code</Label>
              <Input 
                id="editSubjectCode" 
                value={newSubjectCode} 
                onChange={(e) => setNewSubjectCode(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 