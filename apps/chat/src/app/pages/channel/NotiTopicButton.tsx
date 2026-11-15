import { EventName, badgeService, topicsActions, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const NotiTopicButton = memo(({ channelId }: { channelId: string }) => {
	const { t } = useTranslation('common');
	const [badge, setBadge] = useState(() => badgeService.getTopicInChannel(channelId));
	const dispatch = useAppDispatch();

	useEffect(() => {
		const onChange = (data: { channelId: string }) => {
			if (data.channelId === channelId) {
				setBadge(badgeService.getTopicInChannel(channelId));
			}
		};

		badgeService.on(EventName.INCREASE_BADGE_TOPIC, onChange);
		setBadge(badgeService.getTopicInChannel(channelId));
		return () => {
			badgeService.off(EventName.INCREASE_BADGE_TOPIC, onChange);
		};
	}, [channelId]);

	const handleOpenTopic = () => {
		if (badge?.topicId) {
			dispatch(topicsActions.setIsShowCreateTopic(true));
			dispatch(topicsActions.setCurrentTopicId(badge.topicId));
		}
	};

	if (!badge || badge.totalCount <= 0) return null;
	return (
		<div
			className="mz-hover cursor-pointer absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 py-2 px-4 rounded-full bg-theme-contexify bottom-3"
			onClick={handleOpenTopic}
		>
			<div>
				<MezonIcon icon={MzIcons20.mzTopic} className="text-[var(--mz-icon)]" />
			</div>
			<div className="text-theme-primary">{t('newMentionsInTopic')}</div>
			<div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-xs -top-1 -right-1 text-white">
				{badge.totalCount > 9 ? '9+' : badge.totalCount}
			</div>
		</div>
	);
});
