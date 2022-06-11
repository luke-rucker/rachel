import * as cheerio from 'cheerio'
import * as fs from 'fs'
import puppeteer from 'puppeteer'

async function scrape(registryUrl: string) {
  const html = await getRegistryHtml(registryUrl)
  const $ = cheerio.load(html)

  $('.gr-card.gr-guest-card.registry-asin-card').each(function () {
    const product = $(this)

    const image = product.find('img')
    const link = product.find('a')

    console.log('title:', link.attr('aria-label'))
    console.log('href:', link.attr('href'))
    console.log('image', image.attr('src'), '\n')
  })
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
