import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { ContentTeam, type ContentTeamMember } from '@/components/Content/ContentTeam'
import RichText from '@/components/RichText'

type TeamBlockProps = {
  id?: string
  members?: Array<{
    id?: string
    name?: string
    role?: string
    bio?: DefaultTypedEditorState
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
  blockType?: 'team'
}

export const TeamBlock: React.FC<TeamBlockProps> = (props) => {
  const { id, members, columns, layout, width = 'content' } = props

  if (!members || members.length === 0) {
    return null
  }

  const teamMembers: ContentTeamMember[] = members
    .filter((member) => member.name && member.role)
    .map((member) => ({
      id: typeof member.id === 'string' ? member.id : undefined,
      name: typeof member.name === 'string' ? member.name : '',
      role: typeof member.role === 'string' ? member.role : '',
      bio: member.bio ? <RichText data={member.bio} enableGutter={false} /> : undefined,
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
    return null
  }

  const columnsNum = typeof columns === 'string' ? parseInt(columns, 10) : columns || 3
  const validColumns = (columnsNum >= 2 && columnsNum <= 4 ? columnsNum : 3) as 2 | 3 | 4

  return (
    <div className={cn('my-16', width === 'content' && 'container')} id={`block-${id}`}>
      <ContentTeam members={teamMembers} columns={validColumns} layout={layout} />
    </div>
  )
}

