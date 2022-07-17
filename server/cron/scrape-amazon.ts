import { logger } from '../logger'
import { AmazonScraper } from '../scapers'

const jobLogger = logger.child({ module: 'scrape-amazon' })

export async function scrapeAmazon() {
  jobLogger.info('start')

  const amazon = new AmazonScraper({
    registryUrl: 'https://www.amazon.com/wedding/a/registry/29WZCNDL16O7W',
  })
  const products = await amazon.scrapeProducts()

  jobLogger.info({ msg: 'scraped products', products })

  jobLogger.info('finished')
}
