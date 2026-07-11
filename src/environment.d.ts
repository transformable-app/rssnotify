declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      CRON_SECRET?: string
      PAYLOAD_JOBS_BUILD_ID?: string
      PAYLOAD_JOBS_AUTORUN?: 'true' | 'false'
      PAYLOAD_JOBS_AUTORUN_CRON?: string
      PROCESS_FEEDS_CRON?: string
      DELIVER_NOTIFICATIONS_CRON?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
