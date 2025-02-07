'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const studentSchema = z.object({
  ern_number: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  branch: z.string().min(1),
  batch_year: z.coerce.number().int().min(2000),
  section: z.string().min(1),
  mobile_number: z.string().optional(),
});

type StudentData = z.infer<typeof studentSchema>;

export function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const results = await new Promise<StudentData[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const parsedData = results.data.map(row => studentSchema.parse(row));
              resolve(parsedData);
            } catch (e) {
              reject(e);
            }
          },
          error: (error) => reject(error),
        });
      });

      const studentsWithPasswords = await Promise.all(
        results.map(async (student) => {
          const tempPassword = generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          // TODO: Send email with credentials
          console.log(`Would send email to ${student.email} with password: ${tempPassword}`);
          
          return {
            ...student,
            password: hashedPassword,
          };
        })
      );

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentsWithPasswords),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload students');
      }

      setSuccess(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred while processing the file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <div className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Upload Student Data (CSV)</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </label>

        {isUploading && (
          <div className="text-blue-600">
            Processing file...
          </div>
        )}

        {error && (
          <div className="text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

function generateTempPassword(): string {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}