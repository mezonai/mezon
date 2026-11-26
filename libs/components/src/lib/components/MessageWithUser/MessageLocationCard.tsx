import type { IMessageWithUser } from '@mezon/utils';
import { buildLocationMapPreview, createImgproxyUrl, parseLocationFromMessage } from '@mezon/utils';
import type { MouseEvent, ReactNode } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../AvatarImage/AvatarImage';

const MAP_CREDIT_URL = 'https://www.openstreetmap.org/copyright';

export type MessageLocationCardProps = {
	message: IMessageWithUser;
	isMe: boolean;
	onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
	quickReaction?: ReactNode;
};

const MessageLocationCard = ({ message, isMe, onContextMenu, quickReaction }: MessageLocationCardProps) => {
	const { t } = useTranslation('message');
	const location = useMemo(() => parseLocationFromMessage(message.code, message.content?.t), [message.code, message.content?.t]);
	const preview = useMemo(() => (location ? buildLocationMapPreview(location.latitude, location.longitude) : null), [location]);
	const avatarSrc = message.clan_avatar || message.avatar || '';
	const avatarProxySrc = useMemo(() => createImgproxyUrl(avatarSrc, { width: 100, height: 100, resizeType: 'fill-down' }), [avatarSrc]);
	const senderName = message.clan_nick || message.display_name || message.username || '';
	const title = useMemo(() => (isMe ? t('mapView.yourLocation') : t('mapView.locationOf', { name: senderName })), [isMe, senderName, t]);
	const mapGridStyle = useMemo(
		() => (preview ? { left: `calc(50% - ${preview.offsetX}px)`, top: `calc(50% - ${preview.offsetY}px)` } : undefined),
		[preview]
	);

	const handleCardClick = useCallback(() => {
		if (!location) return;
		window.open(location.mapsUrl, '_blank', 'noopener,noreferrer');
	}, [location]);

	const handleCreditClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
		event.stopPropagation();
	}, []);

	if (!location || !preview) {
		return null;
	}

	return (
		<div className="w-full min-w-0 mt-1">
			<div className="relative w-full max-w-[520px]">
				<div
					onClick={handleCardClick}
					onContextMenu={onContextMenu}
					className="w-full rounded-[10px] overflow-hidden border-theme-primary bg-theme-setting-primary cursor-pointer"
				>
					<div className="relative w-full h-[150px] overflow-hidden bg-[var(--border-primary)]">
						<div className="absolute w-[768px] h-[768px] pointer-events-none select-none" style={mapGridStyle}>
							{preview.tiles.map((tile) => (
								<img
									key={tile.url}
									src={tile.url}
									alt=""
									loading="lazy"
									draggable={false}
									className="absolute w-[256px] h-[256px] max-w-none pointer-events-none select-none"
									style={{ left: tile.left, top: tile.top }}
								/>
							))}
						</div>
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="size-[34px] rounded-full bg-item-theme flex items-center justify-center">
								<AvatarImage
									alt={senderName}
									username={message.username}
									src={avatarSrc}
									srcImgProxy={avatarProxySrc}
									useUserPlaceholder
									draggable={false}
									className="!size-[30px] border border-white"
								/>
							</div>
						</div>
						<a
							href={MAP_CREDIT_URL}
							target="_blank"
							rel="noopener noreferrer"
							onClick={handleCreditClick}
							className="absolute bottom-[4px] left-[6px] px-[4px] py-[1px] rounded-[3px] bg-black/60 text-[10px] leading-tight text-white/90 hover:underline"
						>
							{t('mapView.mapCredit')}
						</a>
					</div>
					<div className="w-full h-[40px] px-[10px] flex items-center bg-theme-setting-primary">
						<span className="truncate text-[14px] font-bold text-theme-primary-active">{title}</span>
					</div>
				</div>
				{quickReaction}
			</div>
		</div>
	);
};

export default memo(MessageLocationCard);
