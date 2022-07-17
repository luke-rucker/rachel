import puppeteer from 'puppeteer'

let browser: puppeteer.Browser

export async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({ headless: false, slowMo: 250 })
  }
  return browser
}
