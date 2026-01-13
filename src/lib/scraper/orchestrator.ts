import { scrapeGoogleMaps } from './maps';
import { findOfficialWebsite, findInstagramFromGoogle } from './google';
import { scrapeInstagramProfile } from './instagram';
import prisma from '../prisma';

export async function orchestrateSearch(location: string) {
    console.log(`[Orchestrator] Starting search for: ${location}`);

    // 1. Discover via Maps
    const mapsResults = await scrapeGoogleMaps(location);
    console.log(`[Orchestrator] Found ${mapsResults.length} candidates from Maps`);

    for (const item of mapsResults) {
        // Check if already exists to save time
        const existing = await prisma.hotel.findFirst({
            where: { name: item.name, locationQuery: location }
        });

        if (existing && existing.status === 'VERIFIED') {
            console.log(`[Orchestrator] Skipping ${item.name} (Already Verified)`);
            continue;
        }

        let website = item.website;
        let instagram = '';
        const verificationLog: string[] = [`Maps found: ${item.name}`];

        // 2. Find Official Website if missing
        if (!website) {
            const foundSite = await findOfficialWebsite(item.name, location);
            if (foundSite) {
                website = foundSite;
                verificationLog.push(`Found website via Google: ${website}`);
            }
        } else {
            verificationLog.push(`Maps provided website: ${website}`);
        }

        // 3. Find Instagram
        // Strategy: Search Google for "Hotel Name Instagram"
        const instaLink = await findInstagramFromGoogle(item.name);
        if (instaLink) {
            instagram = instaLink;
            verificationLog.push(`Found Instagram via Google: ${instagram}`);

            // 4. Verify Instagram (Light check)
            const profile = await scrapeInstagramProfile(instagram);
            if (profile) {
                verificationLog.push(`Instagram Profile Validated: ${profile.bio.substring(0, 50)}...`);
            } else {
                verificationLog.push(`Instagram Profile Access Failed or Invalid`);
            }
        }

        // 5. Save to DB
        // Determine status
        let status = 'UNCERTAIN';
        if (instagram && (website || item.rating)) {
            status = 'VERIFIED'; // Loose verification for now
        }

        const data = {
            name: item.name,
            locationQuery: location,
            address: item.address,
            rating: item.rating,
            reviews: item.reviews,
            website,
            instagram,
            status,
            verificationLog: JSON.stringify(verificationLog)
        };

        if (existing) {
            await prisma.hotel.update({
                where: { id: existing.id },
                data
            });
        } else {
            await prisma.hotel.create({ data });
        }
    }

    console.log(`[Orchestrator] Search for ${location} complete.`);
}
