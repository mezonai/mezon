export interface ApiDimensions {
	width: number;
	height: number;
}

export interface ApiPhotoSize extends ApiDimensions {
	type: 's' | 'm' | 'x' | 'y' | 'w';
}

export interface ApiVideoSize extends ApiDimensions {
	type: 'u' | 'v';
	videoStartTs?: number;
	size: number;
}

export interface ApiThumbnail extends ApiDimensions {
	dataUri: string;
}

export interface ApiPhoto {
	mediaType: 'photo';
	id: string;
	date: number;
	thumbnail?: ApiThumbnail;
	isVideo?: boolean;
	sizes: ApiPhotoSize[];
	videoSizes?: ApiVideoSize[];
	blobUrl?: string;
	isSpoiler?: boolean;
	url?: string;
	width?: number;
	height?: number;
}

export interface ApiSticker {
	mediaType: 'sticker';
	id: string;
	stickerSetInfo: ApiStickerSetInfo;
	emoji?: string;
	isCustomEmoji?: boolean;
	isLottie: boolean;
	isVideo: boolean;
	width?: number;
	height?: number;
	thumbnail?: ApiThumbnail;
	previewPhotoSizes?: ApiPhotoSize[];
	isPreloadedGlobally?: boolean;
	hasEffect?: boolean;
	isFree?: boolean;
	shouldUseTextColor?: boolean;
}

export interface ApiStickerSet {
	isArchived?: true;
	isEmoji?: true;
	installedDate?: number;
	id: string;
	accessHash: string;
	title: string;
	hasThumbnail?: boolean;
	hasStaticThumb?: boolean;
	hasAnimatedThumb?: boolean;
	hasVideoThumb?: boolean;
	thumbCustomEmojiId?: string;
	count: number;
	stickers?: ApiSticker[];
	packs?: Record<string, ApiSticker[]>;
	covers?: ApiSticker[];
	shortName: string;
}

type ApiStickerSetInfoShortName = {
	shortName: string;
};

type ApiStickerSetInfoId = {
	id: string;
	accessHash: string;
};

type ApiStickerSetInfoMissing = {
	isMissing: true;
};

export type ApiStickerSetInfo = ApiStickerSetInfoShortName | ApiStickerSetInfoId | ApiStickerSetInfoMissing;

export interface ApiVideo {
	mediaType: 'video';
	id: string;
	mimeType: string;
	duration: number;
	fileName: string;
	width?: number;
	height?: number;
	supportsStreaming?: boolean;
	isRound?: boolean;
	isGif?: boolean;
	hasVideoPreview?: boolean;
	isSpoiler?: boolean;
	thumbnail?: ApiThumbnail;
	previewPhotoSizes?: ApiPhotoSize[];
	blobUrl?: string;
	previewBlobUrl?: string;
	size: number;
	noSound?: boolean;
	waveform?: number[];
}

export interface ApiAudio {
	mediaType: 'audio';
	id: string;
	size: number;
	mimeType: string;
	fileName: string;
	duration: number;
	performer?: string;
	title?: string;
	thumbnailSizes?: ApiPhotoSize[];
}

export interface ApiVoice {
	mediaType: 'voice';
	id: string;
	duration: number;
	waveform?: number[];
	size: number;
}

export interface ApiDocument {
	mediaType: 'document';
	id?: string;
	fileName: string;
	size: number;
	timestamp?: number;
	mimeType: string;
	thumbnail?: ApiThumbnail;
	previewPhotoSizes?: ApiPhotoSize[];
	previewBlobUrl?: string;
	innerMediaType?: 'photo' | 'video';
	mediaSize?: ApiDimensions;
}

export interface ApiMediaExtendedPreview {
	mediaType: 'extendedMediaPreview';
	width?: number;
	height?: number;
	thumbnail?: ApiThumbnail;
	duration?: number;
	url?: string;
}

export type ApiGame = {
	mediaType: 'game';
	title: string;
	description: string;
	photo?: ApiPhoto;
	shortName: string;
	id: string;
	accessHash: string;
	document?: ApiDocument;
};

export interface ApiGeoPoint {
	long: number;
	lat: number;
	accessHash: string;
	accuracyRadius?: number;
}

interface ApiGeo {
	mediaType: 'geo';
	geo: ApiGeoPoint;
}

interface ApiVenue {
	mediaType: 'venue';
	geo: ApiGeoPoint;
	title: string;
	address: string;
	provider: string;
	venueId: string;
	venueType: string;
}

interface ApiGeoLive {
	mediaType: 'geoLive';
	geo: ApiGeoPoint;
	heading?: number;
	period: number;
}

export type ApiLocation = ApiGeo | ApiVenue | ApiGeoLive;

export type ApiMessageSearchType = 'text' | 'media' | 'documents' | 'links' | 'audio' | 'voice' | 'profilePhoto';

export type MediaContent = {
	photo?: ApiPhoto;
	video?: ApiVideo;
	altVideos?: ApiVideo[];
	document?: ApiDocument;
	sticker?: ApiSticker;
	pollId?: string;
	audio?: ApiAudio;
	voice?: ApiVoice;
	location?: ApiLocation;
	game?: ApiGame;
	isExpiredVoice?: boolean;
	isExpiredRoundVideo?: boolean;
	ttlSeconds?: number;
};
export type MediaContainer = {
	content: MediaContent;
};
