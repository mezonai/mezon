import { messagesActions, selectCurrentChannelId, selectCurrentUserId, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EButtonMessageStyle, IButtonMessage } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

type MessageButtonProps = {
	messageId: string;
	button: IButtonMessage;
	senderId: string;
	buttonId: string;
};

export const MessageButton: React.FC<MessageButtonProps> = ({ messageId, button, senderId, buttonId }) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentUserId = useSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();

	const buttonColor = useMemo(() => {
		switch (button.style) {
			case EButtonMessageStyle.PRIMARY:
				return 'bg-buttonPrimary';
			case EButtonMessageStyle.SECONDARY:
				return 'bg-buttonSecondary';
			case EButtonMessageStyle.SUCCESS:
				return 'bg-colorSuccess';
			case EButtonMessageStyle.DANGER:
				return 'bg-colorDanger';
			case EButtonMessageStyle.LINK:
				return 'bg-buttonSecondary';
			default:
				return 'bg-buttonPrimary';
		}
	}, [button.style]);

	const handleClickButton = () => {
		if (!button.url) {
			dispatch(
				messagesActions.clickButtonMessage({
					message_id: messageId,
					channel_id: currentChannelId as string,
					button_id: buttonId,
					sender_id: senderId,
					user_id: currentUserId
				})
			);
		}
	};

	const commonClass = `px-5 py-1 rounded ${buttonColor} text-white font-medium hover:bg-opacity-70 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`;

	return (
		<button className={commonClass} onClick={handleClickButton} disabled={button?.disable}>
			{button.url ? (
				<a href={button.url} target="_blank" rel="noopener noreferrer" className={'flex items-center hover:underline'}>
					{button.label}
					<Icons.ForwardRightClick defaultSize="w-4 h-4 ml-2" defaultFill={'#ffffff'} />
				</a>
			) : (
				button.label
			)}
		</button>
	);
};
