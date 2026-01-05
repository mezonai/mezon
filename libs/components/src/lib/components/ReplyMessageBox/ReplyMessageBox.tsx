import { getShowName } from '@mezon/core';
import { referencesActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { blankReferenceObj } from '@mezon/utils';
import classNames from 'classnames';
import type { ApiMessageRef } from 'mezon-js/types';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

type MessageReplyProps = {
	channelId: string;
	dataReferences: ApiMessageRef;
	className?: string;
};

export function ReplyMessageBox({ channelId, dataReferences, className }: MessageReplyProps) {
	const { t } = useTranslation('common');
	const dispatch = useDispatch();
	const nameShowed = getShowName(
		dataReferences.messageSenderClanNick ?? '',
		dataReferences.messageSenderDisplayName ?? '',
		dataReferences.messageSenderUsername ?? '',
		dataReferences.messageSenderId ?? ''
	);

	const handleRemoveReply = () => {
		dispatch(
			referencesActions.setDataReferences({
				channelId,
				dataReferences: blankReferenceObj
			})
		);
	};

	return (
		<div
			className={classNames(
				'flex flex-row items-center justify-between w-full   border-theme-primary bg-theme-setting-nav p-2 rounded-t-lg text-[14px]',
				className
			)}
		>
			<div className="text-theme-primary">
				{t('replyingTo')} <span className=" text-theme-primary-active font-semibold">{nameShowed}</span>
			</div>
			<button className="relative text-theme-primary-active" onClick={handleRemoveReply}>
				<Icons.Close />
			</button>
		</div>
	);
}
