'use client';

interface UserAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ imageUrl, name, size = 'md', className = '' }: UserAvatarProps) {
  console.log('[UserAvatar] Rendering avatar:', {
    name,
    size,
    has_image: !!imageUrl,
    image_url: imageUrl
  });

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gray-200 ${sizeClasses[size]} ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('[UserAvatar] Error loading image:', {
              image_url: imageUrl,
              error: e
            });
            // Remove the src to show initials instead
            (e.target as HTMLImageElement).src = '';
          }}
        />
      ) : (
        <span className="font-medium text-gray-600">{initials}</span>
      )}
    </div>
  );
} 