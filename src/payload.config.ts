import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'
import path from 'path'
import { en } from 'payload/i18n/en'
import { APIError, buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

import { FeedAutomations } from './collections/FeedAutomations'
import { AutomationHistory } from './collections/NotificationHistory'
import { Notifications } from './collections/Notifications'
import { DigestRuns } from './collections/DigestRuns'
import { Digests } from './collections/Digests'
import { ResultFeeds } from './collections/ResultFeeds'
import { RssFeeds } from './collections/RssFeeds'
import { Users } from './collections/Users'
import { JobsGlobal } from './JobsGlobal/config'
import { Settings } from './Settings/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { tasks } from './jobs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const jobsAutoRunEnabled = process.env.PAYLOAD_JOBS_AUTORUN === 'true'
const jobsAutoRunCron = process.env.PAYLOAD_JOBS_AUTORUN_CRON || '* * * * *'

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: ' - rssnotify',
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '32x32' },
          { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
      },
    },
    components: {
      graphics: {
        Logo: '@/components/Admin/graphics/RssBrand#RssLogo',
        Icon: '@/components/Admin/graphics/RssBrand#RssIcon',
      },
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
      logout: {
        Button: '@/components/Admin/NavLogoutVersion',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM ?? 'noreply@localhost',
    defaultFromName: process.env.SMTP_FROM_NAME ?? 'RSS Notify',
    ...(process.env.SMTP_URL && {
      transport: nodemailer.createTransport(process.env.SMTP_URL),
    }),
  }),
  collections: [RssFeeds, FeedAutomations, Notifications, Digests, DigestRuns, ResultFeeds, AutomationHistory, Users],
  cors: [
    getServerSideURL(),
    'https://payloadcms.3twenty9.com',
  ].filter((url): url is string => Boolean(url) && typeof url === 'string'),
  folders: {
    browseByFolder: false,
  },
  i18n: {
    translations: {
      en: {
        ...en.translations,
        general: {
          ...en.translations.general,
          collections: 'rssnotify',
        },
      },
    },
  },
  globals: [Settings, JobsGlobal],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  endpoints: [
    {
      path: '/jobs/reset',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          throw new APIError('Unauthorized', 401)
        }

        await req.payload.delete({
          collection: 'payload-jobs',
          where: { id: { exists: true } },
          overrideAccess: false,
          req,
        })

        await req.payload.updateGlobal({
          slug: 'payload-jobs-stats',
          data: {
            stats: {},
          },
          overrideAccess: false,
          req,
        })

        return Response.json({ ok: true })
      },
    },
  ],
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    autoRun: jobsAutoRunEnabled
      ? [
          {
            allQueues: true,
            cron: jobsAutoRunCron,
          },
        ]
      : undefined,
    tasks,
  },
})
