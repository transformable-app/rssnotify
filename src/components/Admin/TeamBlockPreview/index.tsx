'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ContentTeam, type ContentTeamMember } from '@/components/Content/ContentTeam'

export type TeamBlockPreviewProps = {
  members?: Array<{
    id?: string
    name?: string
    role?: string
    bio?: unknown
    image?: string | { url?: string }
    email?: string
    socialLinks?: Array<{
      platform?: string
      url?: string
    }>
  }>
  columns?: string | number
  layout?: 'grid' | 'list'
  width?: 'content' | 'full'
}

export const TeamBlockPreview: React.FC<TeamBlockPreviewProps> = (props) => {
  const { members = [], columns: columnsProp = '3', layout = 'grid', width = 'content' } = props

  if (!members || members.length === 0) {
    return (
      <Banner type="info">
        <p>No team members configured. Add members to see the preview.</p>
      </Banner>
    )
  }

  const teamMembers: ContentTeamMember[] = members
    .filter((member) => member.name && member.role)
    .map((member) => ({
      id: typeof member.id === 'string' ? member.id : undefined,
      name: typeof member.name === 'string' ? member.name : '',
      role: typeof member.role === 'string' ? member.role : '',
      bio: member.bio ? (
        <div>{typeof member.bio === 'string' ? member.bio : 'Rich text content'}</div>
      ) : undefined,
      image:
        typeof member.image === 'object' && member.image && 'url' in member.image
          ? (member.image.url as string)
          : undefined,
      email: typeof member.email === 'string' ? member.email : undefined,
      socialLinks: Array.isArray(member.socialLinks)
        ? member.socialLinks
            .map((link) => {
              if (typeof link === 'object' && link && 'platform' in link && 'url' in link) {
                return {
                  platform: typeof link.platform === 'string' ? link.platform : '',
                  url: typeof link.url === 'string' ? link.url : '',
                }
              }
              return null
            })
            .filter((link): link is { platform: string; url: string } => link !== null)
        : undefined,
    }))

  if (teamMembers.length === 0) {
    return (
      <Banner type="info">
        <p>No valid team members configured. Please add members with names and roles.</p>
      </Banner>
    )
  }

  const columnsNum = typeof columnsProp === 'string' ? parseInt(columnsProp, 10) : columnsProp || 3
  const columns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className="p-4">
      <Banner type="success" className="mb-4">
        <p>
          Team Preview ({teamMembers.length} members, {layout}, {columns} columns) - Width:{' '}
          {width === 'content' ? 'Content' : 'Full'}
        </p>
      </Banner>
      <div className={width === 'content' ? 'max-w-[1200px] mx-auto' : 'w-full'}>
        <ContentTeam members={teamMembers} columns={columns} layout={layout} />
      </div>
    </div>
  )
}

export default TeamBlockPreview

