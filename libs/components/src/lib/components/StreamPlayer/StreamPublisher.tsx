import { selectMemberClanByUserId, selectStreamMembersByChannelId, selectStreamViewerCount, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { VoiceChannelUsers } from '../MezonSfuVoiceChannel/PreJoinVoiceChannel/VoiceChannelUsers/VoiceChannelUsers';

export type StreamPublisherInfo = { userId: string; name: string; avatar: string };

export function useStreamPublisher(channelId: string): StreamPublisherInfo | null {
	const publisher = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId)[0]);
	const member = useAppSelector((state) => selectMemberClanByUserId(state, publisher?.user_id ?? ''));
	if (!publisher) return null;
	return {
		userId: publisher.user_id,
		name: getNameForPrioritize(member?.clan_nick, member?.user?.display_name, member?.user?.username) || publisher.user_name || '',
		avatar: getAvatarForPrioritize(member?.clan_avatar, member?.user?.avatar_url) || publisher.user_avatar || ''
	};
}

export function StreamPublisherAvatar({
	publisher,
	className,
	classNameText
}: {
	publisher: StreamPublisherInfo;
	className: string;
	classNameText: string;
}) {
	return (
		<AvatarImage
			alt={publisher.name}
			username={publisher.name}
			className={className}
			classNameText={classNameText}
			srcImgProxy={publisher.avatar ? createImgproxyUrl(publisher.avatar, { width: 300, height: 300, resizeType: 'fit' }) : undefined}
			src={publisher.avatar}
		/>
	);
}

export function StreamLiveBadge() {
	const { t } = useTranslation('channelStream');
	return <span className="shrink-0 rounded bg-[#da373c] px-1.5 py-1 text-[11px] font-bold uppercase leading-none text-white">{t('live')}</span>;
}

export function StreamViewers({ channelId }: { channelId: string }) {
	const members = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));
	const viewers = useMemo(() => members.slice(1), [members]);
	if (!viewers.length) return null;
	return <VoiceChannelUsers voiceChannelMembers={viewers} total={viewers.length} />;
}

export function StreamViewerCount({ channelId, className = '' }: { channelId: string; className?: string }) {
	const { t } = useTranslation('channelStream');
	const count = useAppSelector((state) => selectStreamViewerCount(state, channelId));
	if (count <= 0) return null;
	return (
		<span className={`flex shrink-0 items-center gap-1 text-sm ${className}`} title={t('viewerCount', { count })}>
			<Icons.EyeOpen className="h-4 w-4" />
			{count}
		</span>
	);
}
