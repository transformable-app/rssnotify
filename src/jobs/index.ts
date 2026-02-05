import type { TaskConfig } from 'payload'

import { deliverNotificationsTask } from './deliverNotifications'
import { processFeedsTask } from './processFeeds'

export const tasks: TaskConfig[] = [processFeedsTask, deliverNotificationsTask]
