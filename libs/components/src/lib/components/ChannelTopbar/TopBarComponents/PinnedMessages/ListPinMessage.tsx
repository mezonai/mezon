import { useAppParams } from '@mezon/core';
import type { PinMessageEntity } from '@mezon/store';
import { selectClanView, selectCurrentChannelId, selectPinMessageByChannelId, useAppSelector } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useSelector } from 'react-redux';
import type { UnpinMessageObject } from '.';
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
	const isClanView = useSelector(selectClanView);
	const dmChannelId = useAppSelector((state) => selectPinMessageByChannelId(state, directId as string));
	const clanChannelId = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId as string));

	let listPinMessages: PinMessageEntity[] = [];

	if (!isClanView) {
		listPinMessages = dmChannelId;
	} else {
		listPinMessages = clanChannelId;
	}

	return (
		<div className="min-h-36">
			{!listPinMessages?.length ? (
				<EmptyPinMess />
			) : (
				<div className="flex flex-col items-center justify-center space-y-2 py-2">
					{listPinMessages?.map((pinMessage) => {
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
