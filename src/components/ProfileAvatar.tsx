'use client';

interface ProfileAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileAvatar({ imageUrl, name, size = 'md', className = '' }: ProfileAvatarProps) {
  console.log('[ProfileAvatar] Rendering avatar:', {
    name,
    size,
    has_image: !!imageUrl,
    image_url: imageUrl
  });

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-lg'
  };

  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Enhanced URL handling for Cloudinary and other sources
  const processImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // If it's already a full URL (http, https, data, blob), return as is
    if (url.match(/^(http|https|data|blob):/i)) {
      return url;
    }
    
    // If it's a Cloudinary URL without protocol, add https
    if (url.startsWith('//res.cloudinary.com/')) {
      return `https:${url}`;
    }
    
    // If it's a Cloudinary public ID, construct the full URL
    if (!url.includes('/') && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${url}`;
    }
    
    // If it's a relative path, add leading slash if needed
    return url.startsWith('/') ? url : `/${url}`;
  };

  const fullImageUrl = processImageUrl(imageUrl);
  
  // Additional debugging for the processed URL
  console.log('[ProfileAvatar] Processed image URL:', {
    original: imageUrl,
    processed: fullImageUrl,
    is_processed_different: imageUrl !== fullImageUrl,
    url_type: fullImageUrl ? {
      is_http: fullImageUrl.startsWith('http'),
      is_https: fullImageUrl.startsWith('https'),
      is_data: fullImageUrl.startsWith('data:'),
      is_blob: fullImageUrl.startsWith('blob:'),
      is_cloudinary: fullImageUrl.includes('cloudinary.com'),
      starts_with_slash: fullImageUrl.startsWith('/')
    } : null
  });

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gray-200 ${sizeClasses[size]} ${className}`}
    >
      {fullImageUrl ? (
        <img
          src={fullImageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('[ProfileAvatar] Error loading image:', {
              image_url: fullImageUrl,
              error: e,
              error_type: e.type,
              target_element: e.target,
              cloudinary_url: fullImageUrl?.includes('cloudinary.com')
            });
            // Remove the src to show initials instead
            (e.target as HTMLImageElement).src = '';
            // Add a class to show the backdrop color
            (e.target as HTMLImageElement).parentElement?.classList.add('bg-blue-100');
          }}
        />
      ) : (
        <span className="font-medium text-gray-600">{initials}</span>
      )}
    </div>
  );
} 