import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const getInitials = (str: string) => {
    if (!str) return 'BC';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover ring-1 ring-[#2D233D] ${className}`}
        onError={(e) => {
          // Fallback to initials if image link breaks
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Consistent gradient based on name hash
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-tr from-[#9B5CFF]/30 to-[#F05AA6]/40 text-[#F8F5FC] border border-[#3D2E55] flex items-center justify-center shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
