import { useAppParams } from '@mezon/core';
import { PinMessageEntity, selectCurrentChannelId, selectPinMessageByChannelId } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UnpinMessageObject } from '.';
import EmptyPinMess from './EmptyPinMess';
import ItemPinMessage from './ItemPinMessage';

const ListPinMessage = ({
	onClose = () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	handleUnPinConfirm,
	mode
}: {
	onClose?: () => void;
	handleUnPinConfirm: (unpinValue: UnpinMessageObject) => void;
	mode?: number;
}) => {
	const { directId } = useAppParams();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const dmChannelId = useSelector(selectPinMessageByChannelId(directId));
	const clanChannelId = useSelector(selectPinMessageByChannelId(currentChannelId));
	let listPinMessages: PinMessageEntity[] = [];

	if (dmChannelId) {
		listPinMessages = dmChannelId;
	} else if (clanChannelId) {
		listPinMessages = clanChannelId;
	}

	const checkListPinMessages = useMemo(() => listPinMessages.length <= 0, [listPinMessages.length]);

	return (
		<div className="min-h-36">
			{checkListPinMessages ? (
				<EmptyPinMess />
			) : (
				<div className="flex flex-col items-center justify-center space-y-2 py-2">
					{listPinMessages.map((pinMessage) => {
						// Parse content if it's a JSON string
						let contentString = pinMessage.content;
						if (typeof contentString === 'string') {
							try {
								const contentObject = safeJSONParse(contentString);
								contentString = contentObject?.t;
							} catch (e) {
								console.error('Failed to parse content JSON:', e);
							}
						}

						return (
							<ItemPinMessage
								pinMessage={pinMessage}
								contentString={contentString}
								handleUnPinMessage={handleUnPinConfirm}
								key={pinMessage.id}
								onClose={onClose}
								mode={mode}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default ListPinMessage;
