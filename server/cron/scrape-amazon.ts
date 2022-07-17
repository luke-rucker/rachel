import config from 'config'
import { logger } from '../logger'
import { AmazonScraper } from '../scapers'

const jobLogger = logger.child({ module: 'scrape-amazon' })

export async function scrapeAmazon() {
  jobLogger.info('start')

  const amazon = new AmazonScraper({
    registryUrl: config.get('cron.scrapers.amazon.url'),
  })
  const products = await amazon.scrapeProducts()

  jobLogger.info({ msg: 'scraped products', products })

  jobLogger.info('finished')
}
