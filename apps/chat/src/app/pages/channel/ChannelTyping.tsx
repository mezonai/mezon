import { useChatTypings } from '@mezon/core';
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
	const { typingUsers } = useChatTypings({ channelId, mode, isPublic, isDM });
	const typingLabel = useMemo(() => {
		if (typingUsers.length === 1) {
			return (
				<>
					<span className="absolute bottom-1 -left-1">
						<Icons.IconLoadingTyping />
					</span>
					<span className="text-theme-primary-active text-xs font-semibold mr-[2px] ">{`${typingUsers[0].typingName}`}</span>
					{t('isTyping')}
				</>
			);
		}
		if (typingUsers.length > 1) {
			return t('severalPeopleTyping');
		}
		return '';
	}, [typingUsers, t]);

	return <div className="text-xs dark:text-bgIconDark text-textPrimaryLight relative left-4 pl-4 w-widthMessageViewChat h-4">{typingLabel}</div>;
}
