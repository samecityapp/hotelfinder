import { browserManager } from './browser';

export interface MapsResult {
    name: string;
    address?: string;
    website?: string;
    rating?: number;
    reviews?: number;
}

export async function scrapeGoogleMaps(location: string): Promise<MapsResult[]> {
    const page = await browserManager.newPage();
    const query = `hotels in ${location}`;
    const results: MapsResult[] = [];

    try {
        console.log(`[Maps] Searching for: ${query}`);
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);

        // Wait for the feed to load
        try {
            await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
        } catch (e) {
            console.log('[Maps] No feed found, maybe valid single result or no results.');
            // Handle single result logic if needed or just return empty
            return [];
        }

        // Scroll loop to load more results
        const feed = page.locator('div[role="feed"]');
        let previousHeight = 0;

        // Limit scrolling to avoid infinite loops (e.g. 5 scrolls or untill end)
        for (let i = 0; i < 5; i++) {
            await feed.evaluate((el) => el.scrollTo(0, el.scrollHeight));
            await page.waitForTimeout(2000); // Wait for lazy load

            // Simple end detection
            const newHeight = await feed.evaluate((el) => el.scrollHeight);
            if (newHeight === previousHeight) break;
            previousHeight = newHeight;
        }

        // Extract items
        // Maps list items usually don't have a semantic role 'article' reliably, 
        // but they are often direct children or wrapped in divs.
        // Class names are obfuscated, so we look for structural patterns.
        // A reliable way is locating elements with "aria-label" that contains the result name, 
        // but we don't know the name yet.
        // We'll select all elements that look like cards.

        // Strategy: valid cards usually have an href to the place detail.
        const success = await page.evaluate(() => {
            const items = [];
            // Select all anchor tags that link to /maps/place/
            const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

            for (const link of links) {
                const parent = link.closest('div[role="article"]') || link.parentElement?.parentElement;
                if (!parent) continue;

                const updateText = parent.innerText;
                if (!updateText) continue;

                // Heuristic extraction
                // The aria-label of the link is often the Place Name
                const name = link.getAttribute('aria-label');
                if (!name) continue;

                // Rating
                const ratingEl = parent.querySelector('span[role="img"]');
                const ratingText = ratingEl ? ratingEl.getAttribute('aria-label') : '';
                const ratingMatch = ratingText?.match(/([0-9.]+) stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

                // Reviews
                const reviewsMatch = ratingText?.match(/([0-9,]+) reviews/);
                const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g, '')) : undefined;

                items.push({
                    name,
                    rating,
                    reviews,
                    // Address is harder to pinpoint without specific classes, 
                    // but usually is in the text content. We'll refine this later if needed.
                });
            }
            return items;
        });

        // Remove duplicates
        const unique = new Map();
        success.forEach(item => unique.set(item.name, item));
        results.push(...Array.from(unique.values()));

    } catch (error) {
        console.error('[Maps] Error:', error);
    } finally {
        await page.close();
    }

    return results;
}
