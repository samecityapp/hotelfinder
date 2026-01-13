import { browserManager } from './browser';

const OTA_DOMAINS = [
    'booking.com', 'hotels.com', 'tripadvisor', 'expedia', 'trivago', 'agoda',
    'kayak', 'skyscanner', 'etstur', 'jollytur', 'tatilbudur', 'odamax', 'otelz'
];

export async function findOfficialWebsite(hotelName: string, location: string): Promise<string | null> {
    const page = await browserManager.newPage();
    const query = `${hotelName} ${location} official website`;

    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        await page.waitForSelector('#search');

        const links = await page.evaluate((otaDomains) => {
            const results: string[] = [];
            const anchors = document.querySelectorAll('#search a');

            for (const a of anchors) {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('/search')) continue;

                try {
                    const url = new URL(href);
                    const domain = url.hostname.toLowerCase();

                    if (!otaDomains.some(ota => domain.includes(ota))) {
                        results.push(href);
                    }
                } catch (e) { continue; }
            }
            return results;
        }, OTA_DOMAINS);

        return links.length > 0 ? links[0] : null;
    } catch (err) {
        console.error(`[Google] Error finding website for ${hotelName}:`, err);
        return null;
    } finally {
        await page.close();
    }
}

export async function findInstagramFromGoogle(hotelName: string): Promise<string | null> {
    const page = await browserManager.newPage();
    const query = `${hotelName} site:instagram.com`;

    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        await page.waitForSelector('#search');

        // Get first result that is actually an instagram profile (not a hashtag or location)
        const link = await page.evaluate(() => {
            const anchors = document.querySelectorAll('#search a');
            for (const a of anchors) {
                const href = a.getAttribute('href');
                if (href && href.includes('instagram.com/')) {
                    return href;
                }
            }
            return null;
        });

        return link;
    } catch (err) {
        console.error(`[Google] Error finding Instagram for ${hotelName}:`, err);
        return null;
    } finally {
        await page.close();
    }
}
