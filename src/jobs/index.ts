import type { TaskConfig } from 'payload'

import { deliverNotificationsTask } from './deliverNotifications'
import { processFeedsTask } from './processFeeds'
import { sendDigestsTask } from './sendDigests'
import { recoverStuckJobs } from './recoverStuckJobs'

type JobSchedule = NonNullable<TaskConfig['schedule']>[number]

export const tasks: TaskConfig[] = [processFeedsTask, deliverNotificationsTask, sendDigestsTask].map(
  (task) => ({
    ...task,
    schedule: task.schedule?.map((schedule): JobSchedule => ({
      ...schedule,
      hooks: {
        ...schedule.hooks,
        beforeSchedule: async (args) => {
          await recoverStuckJobs(args.req.payload, args.req)
          return (schedule.hooks?.beforeSchedule ?? args.defaultBeforeSchedule)(args)
        },
      },
    })),
  }),
)
