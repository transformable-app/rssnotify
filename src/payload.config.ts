import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'
import path from 'path'
import { en } from 'payload/i18n/en'
import { APIError, buildConfig, PayloadRequest } from 'payload'
import type { CollectionConfig } from 'payload'
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
import { Settings } from './Settings/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { tasks } from './jobs'
import { getCurrentJobsBuildID, resetAllJobs, resetJobsForNewBuild } from './jobs/resetJobs'

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
  collections: [RssFeeds, FeedAutomations, Notifications, AutomationHistory, Digests, DigestRuns, ResultFeeds, Users],
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
  globals: [Settings],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  onInit: async (payload) => {
    const reset = await resetJobsForNewBuild({ payload })

    if (reset.reason === 'missing-build-id') {
      payload.logger.info('Payload jobs build reset skipped: no build ID configured')
      return
    }

    if (reset.reset) {
      payload.logger.info(`Payload jobs reset for build ${reset.buildID}`)
    }
  },
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

        await resetAllJobs({
          buildID: getCurrentJobsBuildID(),
          payload: req.payload,
          reason: 'manual-reset',
          req,
        })

        return Response.json({ ok: true })
      },
    },
    {
      path: '/jobs/run',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          const authHeader = req.headers.get('authorization')
          if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            throw new APIError('Unauthorized', 401)
          }
        }

        const queue = typeof req.query.queue === 'string' ? req.query.queue : undefined
        const allQueues = queue ? false : req.query.allQueues !== 'false'
        const parsedLimit = Number(req.query.limit)

        const reset = await resetJobsForNewBuild({
          payload: req.payload,
          req,
        })
        const schedule =
          req.query.disableScheduling === 'true'
            ? null
            : await req.payload.jobs.handleSchedules({
                allQueues,
                queue,
                req,
              })
        const run = await req.payload.jobs.run({
          allQueues,
          overrideAccess: true,
          queue,
          req,
          silent: req.query.silent === 'true',
          ...(!Number.isNaN(parsedLimit) ? { limit: parsedLimit } : {}),
        })

        return Response.json({ ok: true, reset, run, schedule })
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
        return Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`)
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
    jobsCollectionOverrides: ({ defaultJobsCollection }): CollectionConfig => ({
      ...defaultJobsCollection,
      admin: {
        ...defaultJobsCollection.admin,
        group: 'System',
        hidden: false,
      },
    }),
    tasks,
  },
})
