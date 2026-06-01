import type { TaskConfig } from 'payload'

import { deliverNotificationsTask } from './deliverNotifications'
import { processFeedsTask } from './processFeeds'
import { sendDigestsTask } from './sendDigests'

export const tasks: TaskConfig[] = [processFeedsTask, deliverNotificationsTask, sendDigestsTask]
