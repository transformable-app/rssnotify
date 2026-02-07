import type { TaskConfig } from 'payload'

import { processFeedsTask } from './processFeeds'

export const tasks: TaskConfig[] = [processFeedsTask]
