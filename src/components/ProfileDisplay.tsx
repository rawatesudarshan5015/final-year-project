'use client';

import { ProfileAvatar } from './ProfileAvatar';
import { getDisplayRoleName, StudentRole } from '@/lib/utils';
import { format } from 'date-fns';
import { CompanyExperience } from '@/lib/db/types';
import { 
  CalendarIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon 
} from '@heroicons/react/24/outline';

interface ProfileDisplayProps {
  profile: {
    id: number;
    name: string;
    email?: string;
    ern_number?: string;
    branch?: string;
    batch_year?: number;
    section?: string;
    mobile_number?: string;
    profile_pic_url?: string;
    role?: StudentRole;
    interests?: {
      [key: string]: string[];
    };
    current_internship?: {
      company_name: string;
      position: string;
      start_date: string;
      description?: string;
    } | null;
    work_history?: CompanyExperience[];
  };
  variant?: 'full' | 'compact' | 'card';
  showEmail?: boolean;
  showInterests?: boolean;
  showCompanyInfo?: boolean;
  className?: string;
}

export function ProfileDisplay({
  profile,
  variant = 'full',
  showEmail = true,
  showInterests = true,
  showCompanyInfo = true,
  className = ''
}: ProfileDisplayProps) {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';
  
  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Determine if we should show company information based on role
  const canShowCompanyInfo = showCompanyInfo && profile.role && 
    (profile.role === 'TE' || profile.role === 'BE' || profile.role === 'Alumni') &&
    (profile.current_internship || (profile.work_history && Array.isArray(profile.work_history) && profile.work_history.length > 0));

  return (
    <div className={`${className} ${isCard ? 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-5' : ''}`}>
      {/* Profile Header */}
      <div className={`flex ${isCompact ? 'items-center' : 'flex-col items-center sm:flex-row sm:items-start'} gap-3`}>
        <ProfileAvatar
          imageUrl={profile.profile_pic_url}
          name={profile.name}
          size={isCompact ? 'md' : 'lg'}
          className={`border-2 ${isCard ? 'border-blue-100 ring-2 ring-blue-50' : 'border-gray-200'} transition-all duration-300 hover:scale-105`}
        />
        
        <div className={`${isCompact ? '' : 'flex-1'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`${isCompact ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
              {profile.name}
            </h2>
            
            {profile.role && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 transition-colors hover:bg-blue-200">
                {getDisplayRoleName(profile.role)}
              </span>
            )}
          </div>
          
          {showEmail && profile.email && (
            <div className="flex items-center mt-1 text-gray-500">
              <EnvelopeIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <p className="break-all">{profile.email}</p>
            </div>
          )}
          
          {!isCompact && profile.branch && profile.batch_year && (
            <div className="mt-1 text-gray-600 flex items-center">
              <AcademicCapIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <p>
                {profile.branch}{profile.section ? ` - ${profile.section}` : ''} ({profile.batch_year})
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Only show detailed info for full variant */}
      {!isCompact && (
        <div className="mt-8 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.ern_number && (
              <div className="flex items-start">
                <IdentificationIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ERN Number</h3>
                  <p className="mt-1 text-base text-gray-900">{profile.ern_number}</p>
                </div>
              </div>
            )}
            
            {profile.mobile_number && (
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                  <p className="mt-1 text-base text-gray-900">{profile.mobile_number}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Company Information */}
          {canShowCompanyInfo && (
            <div className="mt-4">
              {/* Current Internship for TE/BE Students */}
              {(profile.role === 'TE' || profile.role === 'BE') && profile.current_internship && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Current Internship
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{profile.current_internship.position}</p>
                        <p className="text-gray-700 flex items-center mt-1">
                          <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          {profile.current_internship.company_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatDate(profile.current_internship.start_date)} - Present
                      </p>
                    </div>
                    {profile.current_internship.description && (
                      <p className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">{profile.current_internship.description}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Work History for Alumni */}
              {profile.role === 'Alumni' && profile.work_history && Array.isArray(profile.work_history) && profile.work_history.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Work Experience
                  </h3>
                  <div className="space-y-3">
                    {profile.work_history.map((experience, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{experience.position}</p>
                            <p className="text-gray-700 flex items-center mt-1">
                              <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {experience.company_name}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            {formatDate(experience.start_date)} - {experience.is_current ? 'Present' : formatDate(experience.end_date || '')}
                          </p>
                        </div>
                        {experience.description && (
                          <p className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">{experience.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Interests */}
          {showInterests && profile.interests && Object.keys(profile.interests).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Interests</h3>
              <div className="space-y-3">
                {Object.entries(profile.interests).map(([category, items]) => (
                  <div key={category} className="pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                    <h4 className="text-sm font-medium text-gray-700 capitalize mb-1.5">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors cursor-default"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 