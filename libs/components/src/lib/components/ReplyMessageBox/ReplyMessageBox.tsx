import { getShowName } from '@mezon/core';
import { referencesActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { blankReferenceObj } from '@mezon/utils';
import classNames from 'classnames';
import { ApiMessageRef } from 'mezon-js/api.gen';
import { useDispatch } from 'react-redux';

type MessageReplyProps = {
	channelId: string;
	dataReferences: ApiMessageRef;
	className?: string;
};

export function ReplyMessageBox({ channelId, dataReferences, className }: MessageReplyProps) {
	const dispatch = useDispatch();
	const nameShowed = getShowName(
		dataReferences.message_sender_clan_nick ?? '',
		dataReferences.message_sender_display_name ?? '',
		dataReferences.message_sender_username ?? '',
		dataReferences.message_sender_id ?? ''
	);

	const handleRemoveReply = () => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: channelId,
				dataReferences: blankReferenceObj
			})
		);
	};

	return (
		<div className={classNames('flex flex-row items-center justify-between w-full  border-theme-primary bg-theme-setting-nav p-2 rounded-lg text-[14px]', className)}>
			<div className="text-theme-primary">
				Replying to <span className=" text-theme-primary-active font-semibold">{nameShowed}</span>
			</div>
			<button className="relative" onClick={handleRemoveReply}>
				<Icons.Close />
			</button>
		</div>
	);
}
