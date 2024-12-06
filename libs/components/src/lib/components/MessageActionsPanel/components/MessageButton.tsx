import {
	messagesActions,
	selectCurrentChannelId,
	selectCurrentUserId,
	selectDataFormEmbedByMessageId,
	selectDmGroupCurrentId,
	selectModeResponsive,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EButtonMessageStyle, EIconEmbedButtonMessage, IButtonMessage, ModeResponsive } from '@mezon/utils';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

type MessageButtonProps = {
	messageId: string;
	button: IButtonMessage;
	senderId: string;
	buttonId: string;
	inside?: boolean;
};

export const MessageButton: React.FC<MessageButtonProps> = ({ messageId, button, senderId, buttonId, inside }) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const modeResponsive = useSelector(selectModeResponsive);
	const currentUserId = useSelector(selectCurrentUserId);
	const embedData = useSelector((state) => selectDataFormEmbedByMessageId(state, messageId));
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

	const handleClickButton = useCallback(() => {
		if (!button.url) {
			const data = JSON.stringify(embedData);

			dispatch(
				messagesActions.clickButtonMessage({
					message_id: messageId,
					channel_id: (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmId) as string,
					button_id: buttonId,
					sender_id: senderId,
					user_id: currentUserId,
					extra_data: data
				})
			);
		}
	}, [embedData]);

	const commonClass = inside ? `rounded p-2` : `px-5 py-1 rounded ${buttonColor} text-white font-medium hover:bg-opacity-70 active:bg-opacity-80`;

	return (
		<button className={commonClass} onClick={handleClickButton}>
			{button.url ? (
				<a href={button.url} target="_blank" rel="noopener noreferrer" className={commonClass + ' flex items-center hover:underline'}>
					{button.label}
					<Icons.ForwardRightClick defaultSize="w-4 h-4 ml-2" defaultFill={'#ffffff'} />
				</a>
			) : (
				<>
					{button.icon && IconEmbedMessage[button.icon]}
					{button.label && button.label}
				</>
			)}
		</button>
	);
};

const IconEmbedMessage: { [key: string]: JSX.Element } = {
	[EIconEmbedButtonMessage.PLAY]: <Icons.RightFilledTriangle className="w-4 h-4" />,
	[EIconEmbedButtonMessage.PAUSE]: <Icons.PauseIcon className="w-4 h-4 text-white" />
};
