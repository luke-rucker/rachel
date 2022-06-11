import * as cheerio from 'cheerio'
import * as fs from 'fs'
import puppeteer from 'puppeteer'

type Product = {
  name: string
  url: string
  image: string
  price: number
}

async function scrape(registryUrl: string) {
  const html = await getRegistryHtml(registryUrl)
  const $ = cheerio.load(html)

  const scrapedProducts: Array<Partial<Product>> = []

  $('.gr-card.gr-guest-card.registry-asin-card').each(function () {
    const product = $(this)

    const price = product.find('.wedding__text--price')
    const link = product.find('a')
    const image = product.find('img')

    scrapedProducts.push({
      name: link.attr('aria-label'),
      url: link.attr('href'),
      image: image.attr('src'),
      price: parsePrice(price),
    })
  })

  scrapedProducts.forEach(product => console.log(product))
}

function parsePrice(priceContainer: cheerio.Cheerio<cheerio.Element>) {
  const dollars = priceContainer.find('span').text()
  const cents = priceContainer.find('sup').eq(1).text()

  return parseFloat(`${dollars}.${cents}`)
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
