import { EButtonMessageStyle, EMessageComponentType, IMessageActionRow } from '@mezon/utils';
import React from 'react';
import { MessageButton } from './components/MessageButton';

type MessageActionsPanelProps = {
	actionRow: IMessageActionRow;
	messageId: string;
	senderId: string;
};

export const MessageActionsPanel: React.FC<MessageActionsPanelProps> = ({ actionRow, messageId, senderId }) => {
	return (
		<div className={'flex flex-row gap-2 py-2'}>
			{actionRow.components?.map((component) => (
				<>
					{component.type === EMessageComponentType.BUTTON && (
						<MessageButton
							button={component.component}
							messageId={messageId}
							key={component.id}
							senderId={senderId}
							buttonId={component.id}
						/>
					)}
				</>
			))}
		</div>
	);
};

export const actionRows: IMessageActionRow[] = [
	{
		components: [
			{
				type: EMessageComponentType.BUTTON,
				id: 'button1',
				component: {
					label: 'Primary Button',
					style: EButtonMessageStyle.PRIMARY
				}
			},
			{
				type: EMessageComponentType.BUTTON,
				id: 'button2',
				component: {
					label: 'Secondary Button',
					style: EButtonMessageStyle.SECONDARY
				}
			}
		]
	},
	{
		components: [
			{
				type: EMessageComponentType.BUTTON,
				id: 'button3',
				component: {
					label: 'Success Button',
					style: EButtonMessageStyle.SUCCESS
				}
			},
			{
				type: EMessageComponentType.BUTTON,
				id: 'button4',
				component: {
					label: 'Danger Button',
					style: EButtonMessageStyle.DANGER
				}
			}
		]
	},
	{
		components: [
			{
				type: EMessageComponentType.BUTTON,
				id: 'button5',
				component: {
					label: 'Link Button',
					style: EButtonMessageStyle.LINK,
					url: 'https://example.com'
				}
			}
		]
	}
];
