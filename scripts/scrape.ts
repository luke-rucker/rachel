import puppeteer from 'puppeteer'

let page: puppeteer.Page

async function scrape(registryUrl: string) {
  const browser = await puppeteer.launch({ headless: false, slowMo: 250 })
  page = await browser.newPage()
  await page.goto(registryUrl)

  await loadAllRegistryItems()
  await scrollToBottom()

  await browser.close()
}

const scrollToBottom = () =>
  page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

async function loadAllRegistryItems() {
  let hasMoreItems = await page.evaluate(() =>
    Boolean(document.querySelector('.wedding__pagination > a'))
  )

  while (hasMoreItems) {
    await page.evaluate(() =>
      document.querySelector('.wedding__pagination > a')?.scrollIntoView()
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
