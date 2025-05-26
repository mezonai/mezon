export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
	let timeout: NodeJS.Timeout;

	return ((...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T;
};

export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): T => {
	let inThrottle: boolean;

	return ((...args: any[]) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	}) as T;
};

/**
 * Generate unique ID for call sessions
 */
export const generateCallId = (): string => {
	return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Safe JSON stringify with error handling
 */
export const safeStringify = (obj: any): string => {
	try {
		return JSON.stringify(obj);
	} catch {
		return '{}';
	}
};

/**
 * Create delay promise
 */
export const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
	let lastError: Error;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (i < maxRetries - 1) {
				const delayTime = baseDelay * Math.pow(2, i);
				await delay(delayTime);
			}
		}
	}

	throw lastError!;
};
