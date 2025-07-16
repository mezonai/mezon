import { load, remove, save } from '@mezon/mobile-components';

const CACHE_KEY = 'processed_notifications';
const CACHE_EXPIRY_HOURS = 24; // Clear cache older than 24 hours
const MAX_CACHE_SIZE = 100; // Maximum number of cached notifications

interface CachedNotification {
	key: string; // title + body combination
	timestamp: number;
}

// Create unique key from title and body
const createCacheKey = (title: string, body: string): string => {
	return `${title.trim()}_${body.trim()}`.toLowerCase();
};

const loadCache = async (): Promise<CachedNotification[]> => {
	try {
		const cacheData = await load(CACHE_KEY);
		return cacheData ? JSON.parse(cacheData) : [];
	} catch (error) {
		console.error('Error loading notification cache:', error);
		return [];
	}
};

const saveCache = async (cache: CachedNotification[]): Promise<void> => {
	try {
		save(CACHE_KEY, JSON.stringify(cache));
	} catch (error) {
		console.error('Error saving notification cache:', error);
	}
};

// Clean expired entries and limit cache size
const cleanCache = (cache: CachedNotification[]): CachedNotification[] => {
	const now = Date.now();
	const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

	// Remove expired entries
	let cleanedCache = cache.filter((item) => now - item.timestamp < expiryTime);

	// Limit cache size (keep most recent)
	if (cleanedCache.length > MAX_CACHE_SIZE) {
		cleanedCache = cleanedCache
			.sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
			.slice(0, MAX_CACHE_SIZE); // Keep only MAX_CACHE_SIZE most recent
	}

	return cleanedCache;
};

// Check if notification is duplicate
export const isNotificationProcessed = async (title: string, body: string): Promise<boolean> => {
	try {
		const cacheKey = createCacheKey(title, body);
		const cache = await loadCache();

		// Check if this notification was already processed
		const isDuplicate = cache.some((item) => item.key === cacheKey);

		if (!isDuplicate) {
			// Add to cache if not duplicate
			const updatedCache = [...cache, { key: cacheKey, timestamp: Date.now() }];
			const cleanedCache = cleanCache(updatedCache);
			await saveCache(cleanedCache);
		}

		return isDuplicate;
	} catch (error) {
		console.error('Error checking notification cache:', error);
		return false; // If error, allow notification to proceed
	}
};

// Manual cache cleanup (can be called periodically)
export const cleanupNotificationCache = async (): Promise<void> => {
	try {
		const cache = await loadCache();
		const cleanedCache = cleanCache(cache);
		await saveCache(cleanedCache);
	} catch (error) {
		console.error('Error cleaning notification cache:', error);
	}
};

// Clear all cached notifications
export const clearNotificationCache = async (): Promise<void> => {
	try {
		await remove(CACHE_KEY);
	} catch (error) {
		console.error('Error clearing notification cache:', error);
	}
};

// Get cache statistics (for debugging)
export const getCacheStats = async (): Promise<{ total: number; oldest: Date | null; newest: Date | null }> => {
	try {
		const cache = await loadCache();
		if (cache.length === 0) {
			return { total: 0, oldest: null, newest: null };
		}

		const timestamps = cache.map((item) => item.timestamp);
		const oldest = new Date(Math.min(...timestamps));
		const newest = new Date(Math.max(...timestamps));

		return { total: cache.length, oldest, newest };
	} catch (error) {
		console.error('Error getting cache stats:', error);
		return { total: 0, oldest: null, newest: null };
	}
};
