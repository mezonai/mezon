import { embedActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageDatePicker } from '@mezon/utils';
import React from 'react';

type MessageDatePcikerProps = {
	datepicker: IMessageDatePicker;
	messageId: string;
	senderId: string;
	buttonId: string;
	inside?: boolean;
};

export const MessageDatePicker: React.FC<MessageDatePcikerProps> = ({ datepicker, messageId, senderId, buttonId, inside }) => {
	const dispatch = useAppDispatch();
	const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(
			embedActions.addEmbedValue({
				messageId: messageId,
				data: {
					id: buttonId,
					value: e.target.value
				}
			})
		);
	};

	return (
		<div className="flex relative items-center justify-center">
			<input
				type="date"
				onChange={handleChangeDate}
				className="outline-none p-4 py-2 bg-bgTertiary text-channelTextLabel rounded custom-datepicker flex-1"
			/>
			<div className="absolute flex items-center justify-center right-3 pointer-events-none">
				<Icons.CalendarIcon className="w-5 h-5 text-channelTextLabel " />
			</div>
		</div>
	);
};
