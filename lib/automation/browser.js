/**
 * ClawBee Browser Automation
 * Web browsing and automation capabilities using Puppeteer
 */

const puppeteer = require('puppeteer');

class BrowserAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch(options = {}) {
    this.browser = await puppeteer.launch({
      headless: options.headless !== false ? 'new' : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return this;
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    return this.page.url();
  }

  async screenshot(path) {
    return this.page.screenshot({ path, fullPage: true });
  }

  async getContent() {
    return this.page.content();
  }

  async getText() {
    return this.page.evaluate(() => document.body.innerText);
  }

  async click(selector) {
    await this.page.click(selector);
  }

  async type(selector, text) {
    await this.page.type(selector, text);
  }

  async select(selector, value) {
    await this.page.select(selector, value);
  }

  async waitForSelector(selector, timeout = 30000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async evaluate(fn, ...args) {
    return this.page.evaluate(fn, ...args);
  }

  async extractData(selector) {
    return this.page.$$eval(selector, elements => 
      elements.map(el => ({
        text: el.innerText,
        href: el.href,
        src: el.src,
        html: el.innerHTML
      }))
    );
  }

  async fillForm(formData) {
    for (const [selector, value] of Object.entries(formData)) {
      const element = await this.page.$(selector);
      if (element) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await this.page.select(selector, value);
        } else if (tagName === 'input') {
          const type = await element.evaluate(el => el.type);
          if (type === 'checkbox' || type === 'radio') {
            if (value) await this.page.click(selector);
          } else {
            await this.page.click(selector, { clickCount: 3 });
            await this.page.type(selector, value);
          }
        } else {
          await this.page.click(selector, { clickCount: 3 });
          await this.page.type(selector, value);
        }
      }
    }
  }

  async scrapeTable(selector) {
    return this.page.$$eval(`${selector} tr`, rows => 
      rows.map(row => {
        const cells = row.querySelectorAll('td, th');
        return Array.from(cells).map(cell => cell.innerText.trim());
      })
    );
  }

  async waitForNavigation() {
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Web scraping helper
async function scrapeUrl(url, options = {}) {
  const browser = new BrowserAutomation();
  await browser.launch({ headless: true });
  
  try {
    await browser.goto(url);
    
    const result = {
      url: url,
      title: await browser.evaluate(() => document.title),
      text: options.text !== false ? await browser.getText() : null,
      html: options.html ? await browser.getContent() : null,
      links: options.links ? await browser.extractData('a') : null,
      images: options.images ? await browser.extractData('img') : null
    };

    if (options.screenshot) {
      await browser.screenshot(options.screenshot);
      result.screenshot = options.screenshot;
    }

    if (options.selector) {
      result.selected = await browser.extractData(options.selector);
    }

    return result;
  } finally {
    await browser.close();
  }
}

module.exports = { BrowserAutomation, scrapeUrl };
