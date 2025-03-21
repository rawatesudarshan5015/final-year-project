export function generateTempPassword(): string {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export type StudentRole = 'FE' | 'SE' | 'TE' | 'BE' | 'Alumni';

/**
 * Determines a student's role based on their batch year
 * FE: First Year
 * SE: Second Year
 * TE: Third Year
 * BE: Final Year
 * Alumni: Graduated
 */
export function getStudentRole(batchYear: number): StudentRole {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Engineering is typically a 4-year program
  // Graduation typically happens in June (month 6)
  // For 2024:
  // - 2024 batch: First year (FE)
  // - 2023 batch: Second year (SE)
  // - 2022 batch: Third year (TE)
  // - 2021 batch: Final year (BE) until June 2025, then Alumni
  // - 2020 and earlier: Alumni
  
  // Calculate graduation year (batch year + 4)
  const graduationYear = batchYear + 4;
  
  // If current date is after June of graduation year, student is Alumni
  if (currentYear > graduationYear || (currentYear === graduationYear && currentMonth > 6)) {
    return 'Alumni';
  }
  
  // Otherwise, determine year based on batch
  if (batchYear === currentYear) return 'FE'; // First year
  if (batchYear === currentYear - 1) return 'SE'; // Second year
  if (batchYear === currentYear - 2) return 'TE'; // Third year
  return 'BE'; // Final year
}

/**
 * Returns the full role name based on the role code
 */
export function getFullRoleName(role: StudentRole): string {
  switch (role) {
    case 'FE': return 'First Year';
    case 'SE': return 'Second Year';
    case 'TE': return 'Third Year';
    case 'BE': return 'Final Year';
    case 'Alumni': return 'Alumni';
  }
}

/**
 * Returns a more descriptive role name for display purposes
 */
export function getDisplayRoleName(role: StudentRole): string {
  switch (role) {
    case 'FE': return 'First Year Student';
    case 'SE': return 'Second Year Student';
    case 'TE': return 'Third Year Student';
    case 'BE': return 'Final Year Student';
    case 'Alumni': return 'Alumni';
  }
}

/**
 * Utility function to merge class names
 * Used with Tailwind CSS and conditional classes
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 