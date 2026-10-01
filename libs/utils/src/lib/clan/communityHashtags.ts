export interface HashtagItem {
	id: string;
	translationKey: string;
	fallbackLabel: string;
}

export const MIN_COMMUNITY_HASHTAGS = 1;
export const MAX_COMMUNITY_HASHTAGS = 6;
export const DEFAULT_COMMUNITY_HASHTAG = 'Community';

export const COMMUNITY_HASHTAGS = [
	{ id: 'Gaming', translationKey: 'communitySettings.hashtags.items.Gaming', fallbackLabel: 'Gaming' },
	{ id: 'Technology', translationKey: 'communitySettings.hashtags.items.Technology', fallbackLabel: 'Technology' },
	{ id: 'Education', translationKey: 'communitySettings.hashtags.items.Education', fallbackLabel: 'Education' },
	{ id: 'Entertainment', translationKey: 'communitySettings.hashtags.items.Entertainment', fallbackLabel: 'Entertainment' },
	{ id: 'Music', translationKey: 'communitySettings.hashtags.items.Music', fallbackLabel: 'Music' },
	{ id: 'Art', translationKey: 'communitySettings.hashtags.items.Art', fallbackLabel: 'Art' },
	{ id: 'Crypto', translationKey: 'communitySettings.hashtags.items.Crypto', fallbackLabel: 'Crypto' },
	{ id: 'Anime', translationKey: 'communitySettings.hashtags.items.Anime', fallbackLabel: 'Anime & Manga' },
	{ id: 'Sports', translationKey: 'communitySettings.hashtags.items.Sports', fallbackLabel: 'Sports' },
	{ id: 'Community', translationKey: 'communitySettings.hashtags.items.Community', fallbackLabel: 'Community' }
] as const;

export type DiscoverHashtag = (typeof COMMUNITY_HASHTAGS)[number]['id'];

export const DISCOVER_HASHTAGS: readonly DiscoverHashtag[] = COMMUNITY_HASHTAGS.map((tag) => tag.id);
