import { orchestrateSearch } from '../lib/scraper/orchestrator';
import prisma from '../lib/prisma';

async function main() {
    console.log('--- STARTING TEST ---');

    // Use a small location to be quick
    const location = 'Olympos, Turkey';

    await orchestrateSearch(location);

    const results = await prisma.hotel.findMany({
        where: { locationQuery: location }
    });

    console.log('--- RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
    console.log('--- DONE ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
