import { useChatTypings } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { useMemo } from 'react';

type ChannelTypingProps = {
	channelId: string;
	mode: number;
	isPublic: boolean;
	isDM?: boolean;
};

export function ChannelTyping({ channelId, mode, isPublic, isDM }: ChannelTypingProps) {
	const { typingUsers } = useChatTypings({ channelId, mode, isPublic, isDM });
	const typingLabel = useMemo(() => {
		if (typingUsers.length === 1) {
			return (
				<>
					<span className="absolute bottom-1 -left-1">
						<Icons.IconLoadingTyping />
					</span>
					<span className="dark:text-textDarkTheme text-textPrimaryLight text-xs font-semibold mr-[2px] ">
						{`${typingUsers[0].typingName}`}
					</span>
					is typing...
				</>
			);
		}
		if (typingUsers.length > 1) {
			return 'Several people are typing...';
		}
		return '';
	}, [typingUsers]);

	return (
		<div className="text-xs dark:text-bgIconDark text-textPrimaryLight relative left-4 pl-4 w-widthMessageViewChat" style={{ height: 16 }}>
			{typingLabel}
		</div>
	);
}
