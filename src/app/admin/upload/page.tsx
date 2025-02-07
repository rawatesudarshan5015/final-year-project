import React from 'react';
import { UploadForm } from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Student Data</h1>
        <UploadForm />
      </div>
    </main>
  );
}