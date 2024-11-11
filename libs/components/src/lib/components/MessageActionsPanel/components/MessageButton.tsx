import {EButtonMessageStyle, IButtonMessage} from "@mezon/utils";
import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import {
	clickButtonMessage,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId, selectCurrentUserId,
	useAppDispatch
} from "@mezon/store";

type MessageButtonProps = {
	messageId: string;
	button: IButtonMessage,
	senderId: string
}

export const MessageButton: React.FC<MessageButtonProps> = ({messageId, button, senderId}) => {
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentUserId = useSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();
	
	const buttonColor = useMemo(() => {
		switch (button.style) {
			case EButtonMessageStyle.PRIMARY:
				return 'bg-buttonPrimary'
			case EButtonMessageStyle.SECONDARY:
				return 'bg-buttonSecondary'
			case EButtonMessageStyle.SUCCESS:
				return 'bg-colorSuccess'
			case EButtonMessageStyle.DANGER:
				return 'bg-colorDanger'
			case EButtonMessageStyle.LINK:
				return 'bg-buttonSecondary'
		}
		return 'bg-buttonPrimary'
	}, [])
	
	const handleClickButton = () => {
		dispatch(messagesActions.clickButtonMessage({
			message_id: messageId,
			channel_id: currentChannelId as string,
			button_id : button.id,
			sender_id : senderId,
			user_id : currentUserId
		}))
	}
	
	return (
		<>
			<button className={`px-5 py-1 rounded ${buttonColor} text-white font-medium`} onClick={handleClickButton}>
				{button.label}
			</button>
		</>
	)
}

