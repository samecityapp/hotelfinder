import { chromium, Browser, BrowserContext, Page } from 'playwright';

class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    async init() {
        if (this.browser) return;

        this.browser = await chromium.launch({
            headless: true, // Use false for debugging if needed
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-blink-features=AutomationControlled' // Helps avoid detection
            ],
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
    }

    async newPage(): Promise<Page> {
        if (!this.context) {
            await this.init();
        }
        return this.context!.newPage();
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
        }
    }
}

export const browserManager = new BrowserManager();
