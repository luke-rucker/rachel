import config from 'config'
import cron from 'node-cron'
import { logger } from '../logger'
import { scrapeAmazon } from './scrape-amazon'

const scraperInterval = config.get<string>('cron.scrapers.interval')

export function scheduleCronJobs() {
  cron.schedule(scraperInterval, scrapeAmazon)

  logger.info('cron jobs scheduled!')
}
