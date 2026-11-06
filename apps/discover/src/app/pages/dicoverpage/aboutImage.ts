const PUBLIC_IMAGE_ORIGIN = 'https://profile.mezon.ai';

export function getPublicAboutImageSrc(src: string): string | null {
	try {
		const url = new URL(src);
		if (url.protocol !== 'https:' || url.origin !== PUBLIC_IMAGE_ORIGIN || url.username || url.password) return null;
		return url.href;
	} catch {
		return null;
	}
}
