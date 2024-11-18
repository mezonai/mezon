import { EMessageComponentType, IMessageActionRow } from '@mezon/utils';
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
