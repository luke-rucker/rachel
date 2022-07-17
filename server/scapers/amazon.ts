import type { Product } from '@prisma/client'
import * as cheerio from 'cheerio'
import fs from 'fs'
import { getBrowser } from './browser'
import { Scraper } from './scraper'

export class AmazonScraper extends Scraper {
  async scrapeProducts() {
    const html = await this.getRegistryHtml()
    const $ = cheerio.load(html)

    const productElements = $('.gr-card.gr-guest-card.registry-asin-card')

    const scrapedProducts: Array<Partial<Product>> = []

    const scraper = this
    productElements.each(function () {
      const product = $(this)

      const price = product.find('.wedding__text--price')
      const link = product.find('a')
      const image = product.find('img')
      const stillNeeded = product.find(
        '.wedding__text.wedding__text--sm.wedding__text--light.registry-asin-card__bottom-left-text'
      )
      const label = product.find('.registry-asin-card__label')

      scrapedProducts.push({
        name: link.attr('aria-label'),
        url: scraper.parseProductUrl(link),
        image: image.attr('src'),
        priceInCents: scraper.parsePrice(price),
        stillNeeded: scraper.parseStillNeeded(stillNeeded),
        isMostWanted: scraper.isMostWanted(product),
        isOutOfStock: scraper.isOutOfStock(label),
        isPurchased: scraper.isPurchased(label),
      })
    })

    // TODO: validate shape of products
    return scrapedProducts as Array<Product>
  }

  private parseProductUrl(link: cheerio.Cheerio<cheerio.Element>) {
    const hrefWithQuery = link.attr('href')
    const hrefWithoutQuery = hrefWithQuery?.slice(
      0,
      hrefWithQuery?.indexOf('?')
    )

    if (hrefWithoutQuery?.includes('javascript:')) return hrefWithQuery
    else return `https://amazon.com${hrefWithoutQuery}`
  }

  private parsePrice(priceContainer: cheerio.Cheerio<cheerio.Element>) {
    const dollars = parseInt(priceContainer.find('span').text())
    const cents = parseInt(priceContainer.find('sup').eq(1).text())

    return dollars * 100 + cents
  }

  private parseStillNeeded(stillNeededEl: cheerio.Cheerio<cheerio.Element>) {
    const parts = stillNeededEl.text().trim().split(' ')
    return parseInt(parts[0])
  }

  private isMostWanted(productEl: cheerio.Cheerio<cheerio.Element>) {
    const flag = productEl.find('.registry-asin-card__flag')
    const flagIsShowing = !flag.hasClass('aok-hidden')
    const mostWantedTextExists = flag.has(":contains('Most Wanted')").length > 0

    return flagIsShowing && mostWantedTextExists
  }

  private isOutOfStock(labelEl: cheerio.Cheerio<cheerio.Element>) {
    return labelEl.text().toLowerCase().includes('out of stock')
  }

  private isPurchased(labelEl: cheerio.Cheerio<cheerio.Element>) {
    return labelEl.text().toLowerCase().includes('purchased')
  }

  async getRegistryHtml() {
    if (fs.existsSync('samples/amazon.html')) {
      return fs.readFileSync('samples/amazon.html', { encoding: 'utf-8' })
    }

    const browser = await getBrowser()
    this.page = await browser.newPage()

    await this.page.goto(this.registryUrl)
    await this.loadAllProducts()
    const html = await this.page.evaluate(() => document.body.innerHTML)
    await this.page.close()

    fs.writeFileSync('samples/amazon.html', html)

    return html
  }

  async loadAllProducts() {
    let hasMoreItems = await this.page.evaluate(() =>
      Boolean(document.querySelector('.wedding__pagination > a'))
    )

    while (hasMoreItems) {
      await this.page.evaluate(() =>
        document
          .querySelector('.wedding__pagination > a')
          ?.scrollIntoView(false)
      )
      await this.page.click('.wedding__pagination > a')
      await this.page.waitForNetworkIdle()

      hasMoreItems = await this.page.evaluate(
        () =>
          document
            .querySelector('.wedding__pagination > a')
            ?.getAttribute('style')
            ?.includes('display: inline-block;') || false
      )
    }
  }
}
