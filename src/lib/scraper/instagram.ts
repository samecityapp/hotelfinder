import { browserManager } from './browser';

export interface InstagramProfile {
    username: string;
    bio: string;
    website?: string;
    isVerified: boolean;
    followerCount?: number;
}

export async function scrapeInstagramProfile(url: string): Promise<InstagramProfile | null> {
    const page = await browserManager.newPage();

    try {
        // Navigate to profile
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Check for 404
        if (await page.title().then(t => t.includes('Page Not Found'))) {
            return null;
        }

        // Attempt to read meta tags first (less likely to be blocked by login wall overlay)
        const description = await page.locator('meta[property="og:description"]').getAttribute('content').catch(() => '');

        // Description format roughly: "X Followers, Y Following, Z Posts - See Instagram photos and videos from Name (@username)"
        // Or just Bio if scraping bio is possible.

        // Try to get JSON data from sharedData if available
        // OR standard selector scraping

        // Fallback: use title or og:title
        const title = await page.title(); // "Name (@username) • Instagram photos..."

        const bioMatch = description?.match(/^(.*?) - /);

        // Simplified validation: If we got a title with "Instagram", it's likely a valid page.
        // Deep verification requires login usually. 
        // We will assume valid if we see specific hotel content in title/description.

        const isVerified = false; // Hard to detect without login often

        return {
            username: url.split('/').filter(s => s).pop() || '',
            bio: description || '',
            isVerified,
            followerCount: 0 // Placeholder
        };

    } catch (error) {
        console.error(`[Instagram] Error scraping ${url}:`, error);
        return null;
    } finally {
        await page.close();
    }
}
