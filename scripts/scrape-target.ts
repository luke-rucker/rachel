import * as cheerio from 'cheerio'
import * as fs from 'fs'
import puppeteer from 'puppeteer'
import type { ScrapedProduct } from '../types'

async function scrape(registryUrl: string) {
  const html = await getRegistryHtml(registryUrl)
  const $ = cheerio.load(html)
  const productElements = $('.styles__Card-sc-uu5e5x-0')

  const scrapedProducts: Array<Partial<ScrapedProduct>> = []

  productElements.each(function () {
    const product = $(this)

    console.log(product)
  })
}

async function getRegistryHtml(registryUrl: string) {
  if (fs.existsSync('samples/target.html')) {
    return fs.readFileSync('samples/target.html')
  }

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(registryUrl)

  const html = await page.evaluate(() => document.body.innerHTML)

  browser
    .close()
    .catch(error => console.log('could not shutdown browser:', error))

  fs.writeFileSync('samples/target.html', html)

  return html
}

scrape(
  'https://www.target.com/gift-registry/gift-giver?registryId=312edfa0-d59d-11ec-a524-f3a36ca284f0&type=WEDDING'
)
