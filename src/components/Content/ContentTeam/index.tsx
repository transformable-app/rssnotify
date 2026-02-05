import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/utilities/ui'

export type ContentTeamMember = {
  id?: string
  name: string
  role: string
  bio?: React.ReactNode
  image?: string
  email?: string
  socialLinks?: Array<{
    platform: string
    url: string
  }>
}

export type ContentTeamProps = {
  members: ContentTeamMember[]
  className?: string
  columns?: 2 | 3 | 4
  layout?: 'grid' | 'list'
}

export const ContentTeam: React.FC<ContentTeamProps> = ({
  members,
  className,
  columns = 3,
  layout = 'grid',
}) => {
  if (!members || members.length === 0) {
    return null
  }

  if (layout === 'list') {
    return (
      <div className={cn('w-full', className)}>
        <div className="space-y-6">
          {members.map((member, index) => (
            <Card key={member.id || index}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {member.image ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  ) : (
                    <Avatar className="h-24 w-24 flex-shrink-0">
                      <AvatarFallback className="text-2xl">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-muted-foreground mb-2">{member.role}</p>
                    {member.bio && <div className="text-sm">{member.bio}</div>}
                    {(member.email || member.socialLinks) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {member.email}
                          </a>
                        )}
                        {member.socialLinks?.map((link, linkIndex) => (
                          <a
                            key={linkIndex}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {link.platform}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('grid', gridCols[columns], 'gap-6')}>
        {members.map((member, index) => (
          <Card key={member.id || index} className="text-center">
            <CardHeader>
              {member.image ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              ) : (
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarFallback className="text-3xl">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-muted-foreground">{member.role}</p>
            </CardHeader>
            {member.bio && <CardContent>{member.bio}</CardContent>}
            {(member.email || member.socialLinks) && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap justify-center gap-3">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Email
                    </a>
                  )}
                  {member.socialLinks?.map((link, linkIndex) => (
                    <a
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

