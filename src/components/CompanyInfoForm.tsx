'use client';

import { useState } from 'react';
import { StudentRole } from '@/lib/utils';
import { CompanyExperience } from '@/lib/db/types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CompanyInfoFormProps {
  role?: StudentRole;
  currentInternship?: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  } | null;
  workHistory?: CompanyExperience[];
  onInternshipChange: (internship: {
    company_name: string;
    position: string;
    start_date: string;
    description?: string;
  } | null) => void;
  onWorkHistoryChange: (history: CompanyExperience[]) => void;
}

export function CompanyInfoForm({
  role,
  currentInternship,
  workHistory = [],
  onInternshipChange,
  onWorkHistoryChange
}: CompanyInfoFormProps) {
  const [showInternshipForm, setShowInternshipForm] = useState(!!currentInternship);
  
  // Ensure workHistory is an array
  const safeWorkHistory = Array.isArray(workHistory) ? workHistory : [];
  
  // Only TE, BE, and Alumni can add company information
  const canAddCompanyInfo = role === 'TE' || role === 'BE' || role === 'Alumni';
  
  if (!canAddCompanyInfo) {
    return null;
  }
  
  const handleAddWorkExperience = () => {
    const newExperience: CompanyExperience = {
      company_name: '',
      position: '',
      start_date: new Date().toISOString().split('T')[0],
      is_current: false
    };
    onWorkHistoryChange([...safeWorkHistory, newExperience]);
  };
  
  const handleRemoveWorkExperience = (index: number) => {
    const updatedHistory = [...safeWorkHistory];
    updatedHistory.splice(index, 1);
    onWorkHistoryChange(updatedHistory);
  };
  
  const handleWorkExperienceChange = (index: number, field: keyof CompanyExperience, value: string | boolean) => {
    const updatedHistory = [...safeWorkHistory];
    updatedHistory[index] = {
      ...updatedHistory[index],
      [field]: value
    };
    
    // If setting as current, clear end date
    if (field === 'is_current' && value === true) {
      updatedHistory[index].end_date = undefined;
    }
    
    onWorkHistoryChange(updatedHistory);
  };
  
  return (
    <div className="space-y-8">
      {/* Internship Section for TE and BE students */}
      {(role === 'TE' || role === 'BE') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Current Internship</h3>
            {!showInternshipForm && (
              <button
                type="button"
                onClick={() => {
                  setShowInternshipForm(true);
                  onInternshipChange({
                    company_name: '',
                    position: '',
                    start_date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Internship
              </button>
            )}
          </div>
          
          {showInternshipForm && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    value={currentInternship?.company_name || ''}
                    onChange={(e) => onInternshipChange({
                      ...currentInternship!,
                      company_name: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    value={currentInternship?.position || ''}
                    onChange={(e) => onInternshipChange({
                      ...currentInternship!,
                      position: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    value={currentInternship?.start_date?.split('T')[0] || ''}
                    onChange={(e) => onInternshipChange({
                      ...currentInternship!,
                      start_date: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={currentInternship?.description || ''}
                  onChange={(e) => onInternshipChange({
                    ...currentInternship!,
                    description: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowInternshipForm(false);
                    onInternshipChange(null);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1 text-red-500" />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Work History Section for Alumni */}
      {role === 'Alumni' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
            <button
              type="button"
              onClick={handleAddWorkExperience}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Experience
            </button>
          </div>
          
          <div className="space-y-4">
            {safeWorkHistory.map((experience, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`company_name_${index}`} className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id={`company_name_${index}`}
                      value={experience.company_name}
                      onChange={(e) => handleWorkExperienceChange(index, 'company_name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`position_${index}`} className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      id={`position_${index}`}
                      value={experience.position}
                      onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`start_date_${index}`} className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id={`start_date_${index}`}
                      value={experience.start_date.split('T')[0]}
                      onChange={(e) => handleWorkExperienceChange(index, 'start_date', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label htmlFor={`end_date_${index}`} className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        id={`end_date_${index}`}
                        value={experience.end_date?.split('T')[0] || ''}
                        onChange={(e) => handleWorkExperienceChange(index, 'end_date', e.target.value)}
                        disabled={experience.is_current}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          experience.is_current ? 'bg-gray-100 text-gray-500' : ''
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center mt-6">
                      <input
                        id={`is_current_${index}`}
                        type="checkbox"
                        checked={experience.is_current}
                        onChange={(e) => handleWorkExperienceChange(index, 'is_current', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`is_current_${index}`} className="ml-2 block text-sm text-gray-700">
                        Current Job
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor={`description_${index}`} className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id={`description_${index}`}
                    rows={3}
                    value={experience.description || ''}
                    onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveWorkExperience(index)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1 text-red-500" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {safeWorkHistory.length === 0 && (
              <p className="text-gray-500 text-sm italic">No work experience added yet. Click "Add Experience" to get started.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 