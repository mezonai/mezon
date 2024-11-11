import {EButtonMessageStyle, IButtonMessage} from "@mezon/utils";
import React from "react";
import {MessageButton} from "./components/MessageButton";

type MessageActionsPanelProps = {
	buttons: IButtonMessage[];
	messageId: string;
	senderId: string;
}

export const MessageActionsPanel: React.FC<MessageActionsPanelProps> = ({buttons, messageId, senderId}) => {
	return (
		<div className={'flex flex gap-2 py-3'}>
			{buttons.map(button => (
				<MessageButton button={button} messageId={messageId} key={button.id} senderId={senderId}/>
			))}
		</div>
	)
}

export const mockMessageButtons: IButtonMessage[] = [
	{
		id: 'hello1',
		label: 'Label 1'
	},
	{
		id: 'hello2',
		label: 'Success',
		style: EButtonMessageStyle.SUCCESS
	},
	{
		id: 'hello3',
		label: 'Danger',
		style: EButtonMessageStyle.DANGER
	},
	{
		id: 'hello4',
		label: 'Label 1',
		style: EButtonMessageStyle.LINK
	},
]