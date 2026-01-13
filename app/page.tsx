'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { startSearch, getHotels } from './actions';

// Define types locally for now or import from prisma client types
interface Hotel {
  id: string;
  name: string;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  website: string | null;
  instagram: string | null;
  status: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Hotel[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(async () => {
        const data = await getHotels(query);
        setResults(data as Hotel[]);
        // We could stop polling if we detect "done" state, but scraping is async infinite loosely.
        // For now, poll for 1 minute or let user stop?
        // Let's just poll.
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);
    setIsPolling(true);

    try {
      await startSearch(query);
      // Immediate fetch
      const initial = await getHotels(query);
      setResults(initial as Hotel[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-20 px-4 sm:px-8">
      {/* Header / Hero */}
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-center mb-6">
        Private <span className="text-gold-gradient">Hotel Discovery</span>
      </h1>
      <p className="text-slate-400 max-w-lg text-center mb-12 text-lg">
        Autonomous agent-verified hotel search. Accurate Instagram & Website links.
      </p>

      {/* Search Input */}
      <div className="w-full max-w-xl relative group z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 to-slate-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <form onSubmit={handleSearch} className="relative flex items-center bg-slate-900 rounded-2xl border border-slate-700 p-2 shadow-2xl">
          <MapPin className="text-slate-400 ml-4 w-6 h-6" />
          <input
            type="text"
            placeholder="Enter location (e.g., Kaş, Bodrum)"
            className="w-full bg-transparent p-4 text-white placeholder-slate-500 focus:outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-slate-50 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-white hover:scale-105 transition-all flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
            <span>Find</span>
          </button>
        </form>
      </div>

      {/* Status */}
      {isPolling && (
        <div className="mt-8 flex items-center gap-2 text-gold-500 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium tracking-wide">AGENT SEARCHING & VERIFYING...</span>
        </div>
      )}

      {/* Results Grid */}
      <div className="w-full max-w-6xl mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((hotel, idx) => (
          <div
            key={hotel.id}
            className="glass-panel p-6 rounded-2xl hover:border-gold-500/50 transition-colors group flex flex-col animate-slide-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white leading-tight">{hotel.name}</h3>
              {hotel.status === 'VERIFIED' && (
                <div className="text-emerald-400 bg-emerald-400/10 p-1.5 rounded-full" title="Verified">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-6 flex-grow">{hotel.address || 'Address not found'}</p>

            {hotel.rating && (
              <div className="mb-4 flex items-center gap-2 text-sm text-yellow-500 font-bold">
                <span>★ {hotel.rating}</span>
                <span className="text-slate-500 font-normal">({hotel.reviews || 0} reviews)</span>
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              {hotel.website ? (
                <a
                  href={hotel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm text-slate-300 font-medium transition-colors border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" /> Website
                </a>
              ) : (
                <div className="flex-1 py-2 text-center text-slate-600 text-sm italic">No Website</div>
              )}

              {hotel.instagram ? (
                <a
                  href={hotel.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-900 to-pink-900 hover:from-purple-800 hover:to-pink-800 py-2 rounded-lg text-sm text-white font-medium transition-colors border border-white/10"
                >
                  <span>Instagram</span>
                </a>
              ) : (
                <div className="flex-1 py-2 text-center text-slate-600 text-sm italic">No Insta</div>
              )}
            </div>

            {hotel.status === 'UNCERTAIN' && (
              <div className="mt-2 text-xs text-amber-500/80 text-center"> verification in progress </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isSearching && !isPolling && (
        <div className="mt-20 text-slate-600">Enter a location to discover hotels.</div>
      )}
    </main>
  );
}
