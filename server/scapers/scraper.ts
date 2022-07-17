import type { Product } from '@prisma/client'
import type { Page } from 'puppeteer'

export abstract class Scraper {
  protected readonly registryUrl: string

  private _page?: Page

  constructor({ registryUrl }: { registryUrl: string }) {
    this.registryUrl = registryUrl
  }

  protected set page(page: Page) {
    this._page = page
  }

  protected get page() {
    if (!this._page) {
      throw new Error('_page not instaniated yet')
    }
    return this._page as Page
  }

  abstract scrapeProducts(): Promise<Array<Omit<Product, 'id'>>>

  abstract getRegistryHtml(): Promise<string>
}
