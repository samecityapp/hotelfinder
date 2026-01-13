'use server';

import { orchestrateSearch } from '@/src/lib/scraper/orchestrator';
import prisma from '@/src/lib/prisma';

export async function startSearch(location: string) {
    // Check if we have recent results (e.g. last 24h)
    // For now, we always trigger to ensure freshness as requested, 
    // but we run it without blocking the return if it takes too long? 
    // No, the user wants "Repeatable". 

    // We'll return immediately and let the client poll for updates.
    // Fire and forget the scraper?
    // Next.js actions might kill the process if response returns.
    // In local 'npm run dev', it usually stays alive.

    // To be safe, we await it? The user said "Retry automatically until certainty is achieved".
    // The process might be long (minutes).

    // We will kick off the process and rely on the Node.js event loop to keep it running
    // or use a structured way.

    // For this V1, let's wrap it in a promise that doesn't await IF we want non-blocking.
    // But for simple "stability", blocking might be safer to ensure it finishes?
    // Let's try non-blocking for better UX.

    (async () => {
        try {
            await orchestrateSearch(location);
        } catch (e) {
            console.error('Background scraping failed:', e);
        }
    })();

    return { success: true, message: 'Scraping started' };
}

export async function getHotels(location: string) {
    const hotels = await prisma.hotel.findMany({
        where: { locationQuery: location },
        orderBy: { rating: 'desc' } // Sort by rating
    });

    // specific sort: VERIFIED first, then existing reviews/rating
    return hotels.sort((a, b) => {
        if (a.status === 'VERIFIED' && b.status !== 'VERIFIED') return -1;
        if (a.status !== 'VERIFIED' && b.status === 'VERIFIED') return 1;
        return (b.rating || 0) - (a.rating || 0);
    });
}
