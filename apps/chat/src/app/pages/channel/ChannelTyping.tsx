import { selectCloseMenu, selectStatusMenu, useAppSelector, useTypingUsersByChannel } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type ChannelTypingProps = {
	channelId: string;
	mode: number;
	isPublic: boolean;
	isDM?: boolean;
};

export function ChannelTyping({ channelId, mode, isPublic, isDM }: ChannelTypingProps) {
	const { t } = useTranslation('common');
	const typingUsers = useTypingUsersByChannel(channelId);
	const boxWidthClass = 'w-full max-w-wrappBoxChatView';

	const typingLabel = useMemo(() => {
		if (typingUsers.length === 1) {
			return (
				<>
					<Icons.IconLoadingTyping className="shrink-0" width={20} height={10} aria-hidden />
					<span className="min-w-0 text-theme-primary-active font-semibold mr-[2px] truncate">
						{typingUsers[0].typingName}
					</span>
					<span className="shrink-0 text-theme-primary">{t('isTyping')}</span>
				</>
			);
		}
		if (typingUsers.length > 1) {
			return t('severalPeopleTyping');
		}
		return '';
	}, [typingUsers, t]);

	return (
		<div
			className={`mx-3 box-border flex h-4 max-h-4 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap pr-1 text-xs leading-4 text-theme-primary ${boxWidthClass}`}
		>
			{typingLabel}
		</div>
	);
}
