import * as cheerio from 'cheerio'
import * as fs from 'fs'
import puppeteer from 'puppeteer'

type Product = {
  name: string
  url: string
  image: string
  priceInCents: number
  stillNeeded: number
  isMostWanted: boolean
  isOutOfStock: boolean
  isPurchased: boolean
}

async function scrape(registryUrl: string) {
  const html = await getRegistryHtml(registryUrl)
  const $ = cheerio.load(html)
  const productElements = $('.gr-card.gr-guest-card.registry-asin-card')

  const scrapedProducts: Array<Partial<Product>> = []

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
      url: parseProductUrl(link),
      image: image.attr('src'),
      priceInCents: parsePrice(price),
      stillNeeded: parseStillNeeded(stillNeeded),
      isMostWanted: isMostWanted(product),
      isOutOfStock: isOutOfStock(label),
      isPurchased: isPurchased(label),
    })
  })

  scrapedProducts.forEach(product => console.log(product))
}

function parseProductUrl(link: cheerio.Cheerio<cheerio.Element>) {
  const hrefWithQuery = link.attr('href')
  const hrefWithoutQuery = hrefWithQuery?.slice(0, hrefWithQuery?.indexOf('?'))

  if (hrefWithoutQuery?.includes('javascript:')) return hrefWithQuery
  else return `https://amazon.com${hrefWithoutQuery}`
}

function parsePrice(priceContainer: cheerio.Cheerio<cheerio.Element>) {
  const dollars = parseInt(priceContainer.find('span').text())
  const cents = parseInt(priceContainer.find('sup').eq(1).text())

  return dollars * 100 + cents
}

function parseStillNeeded(stillNeededEl: cheerio.Cheerio<cheerio.Element>) {
  const parts = stillNeededEl.text().trim().split(' ')
  return parseInt(parts[0])
}

function isMostWanted(productEl: cheerio.Cheerio<cheerio.Element>) {
  const flag = productEl.find('.registry-asin-card__flag')
  const flagIsShowing = !flag.hasClass('aok-hidden')
  const mostWantedTextExists = flag.has(":contains('Most Wanted')").length > 0

  return flagIsShowing && mostWantedTextExists
}

function isOutOfStock(labelEl: cheerio.Cheerio<cheerio.Element>) {
  return labelEl.text().toLowerCase().includes('out of stock')
}

function isPurchased(labelEl: cheerio.Cheerio<cheerio.Element>) {
  return labelEl.text().toLowerCase().includes('purchased')
}

let page: puppeteer.Page

async function getRegistryHtml(registryUrl: string) {
  if (fs.existsSync('amazon.html')) {
    return fs.readFileSync('amazon.html')
  }

  const browser = await puppeteer.launch()
  page = await browser.newPage()
  await page.goto(registryUrl)

  await loadAllRegistryItems()

  const html = await page.evaluate(() => document.body.innerHTML)

  browser
    .close()
    .catch(error => console.log('could not shutdown browser:', error))

  fs.writeFileSync('amazon.html', html)

  return html
}

async function loadAllRegistryItems() {
  let hasMoreItems = await page.evaluate(() =>
    Boolean(document.querySelector('.wedding__pagination > a'))
  )

  while (hasMoreItems) {
    await page.evaluate(() =>
      document.querySelector('.wedding__pagination > a')?.scrollIntoView(false)
    )
    await page.click('.wedding__pagination > a')
    await page.waitForNetworkIdle()

    hasMoreItems = await page.evaluate(
      () =>
        document
          .querySelector('.wedding__pagination > a')
          ?.getAttribute('style')
          ?.includes('display: inline-block;') || false
    )
  }
}

scrape('https://www.amazon.com/wedding/a/registry/29WZCNDL16O7W')
