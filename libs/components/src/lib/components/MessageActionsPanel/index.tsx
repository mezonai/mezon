import { EMessageComponentType, IMessageActionRow } from '@mezon/utils';
import React, { Fragment } from 'react';
import { MessageButton } from './components/MessageButton';
import { MessageSelect } from './components/MessageSelect';

type MessageActionsPanelProps = {
	actionRow: IMessageActionRow;
	messageId: string;
	senderId: string;
};

export const MessageActionsPanel: React.FC<MessageActionsPanelProps> = ({ actionRow, messageId, senderId }) => {
	return (
		<div className={'flex flex-row gap-2 py-2'}>
			{actionRow.components.map((component) => (
				<Fragment key={component.id}>
					{component.type === EMessageComponentType.BUTTON && (
						<MessageButton button={component.component} messageId={messageId} senderId={senderId} buttonId={component.id} />
					)}
					{component.type === EMessageComponentType.SELECT && (
						<MessageSelect select={component.component} messageId={messageId} senderId={senderId} buttonId={component.id} />
					)}
				</Fragment>
			))}
		</div>
	);
};
