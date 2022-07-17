import cron from 'node-cron'
import { logger } from '../logger'
import { scrapeAmazon } from './scrape-amazon'

const everyMin = '*/1 * * * *'

export function scheduleCronJobs() {
  cron.schedule(everyMin, scrapeAmazon)

  logger.info('cron jobs scheduled!')
}
