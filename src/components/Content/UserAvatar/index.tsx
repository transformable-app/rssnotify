import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/utilities/ui'

export type UserAvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  fallback,
  className,
  size = 'md',
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const displayFallback = fallback || getInitials(alt)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={alt || ''} />}
      <AvatarFallback>{displayFallback}</AvatarFallback>
    </Avatar>
  )
}

