import { useChatSending } from '@mezon/core';
import type { RootState } from '@mezon/store';
import {
	EStateFriend,
	getStore,
	selectAllAccount,
	selectCurrentDM,
	selectFriendById,
	selectMessageIdsByChannelId,
	selectUserIdCurrentDm
} from '@mezon/store';
import type { IMessageSendPayload } from '@mezon/utils';
import { STICKER_WAVE } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface IWaveButtonDMProps {
	username?: string;
}

const WaveButtonDM = ({ username }: IWaveButtonDMProps) => {
	const { t } = useTranslation('dmMessage');
	const [hasWaved, setHasWaved] = useState(false);
	const currentDm = useSelector(selectCurrentDM);
	const userProfile = useSelector(selectAllAccount);
	const userID = useSelector(selectUserIdCurrentDm);

	const isDM = useMemo(() => {
		return currentDm?.type === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDm?.type]);

	const isBlockedByUser = useMemo(() => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const infoFriend = selectFriendById(appState, userID?.[0] || '');
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.sourceId === userID?.[0] && infoFriend?.user?.id === userProfile?.user?.id;
	}, [userID, userProfile?.user?.id]);

	const isMySelf = useMemo(() => {
		return userID?.[0] === userProfile?.user?.id;
	}, [userID, userProfile?.user?.id]);

	const messageIdsLength = useMemo(() => {
		const store = getStore();
		const appState = store.getState() as RootState;
		return selectMessageIdsByChannelId(appState, currentDm?.channelId || '').length;
	}, [currentDm?.channelId]);

	const mode = useMemo(() => {
		return isDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	}, [isDM]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: currentDm as ApiChannelDescription
	});

	const urlIcon = useMemo(() => {
		if (!currentDm?.createTimeSeconds) {
			return STICKER_WAVE.LIST_STICKER[0];
		}
		return STICKER_WAVE.LIST_STICKER[currentDm.createTimeSeconds % STICKER_WAVE.LIST_STICKER.length];
	}, [currentDm?.createTimeSeconds]);

	const displayName = useMemo(() => {
		return username || currentDm?.channelLabel || '';
	}, [username, currentDm?.channelLabel]);

	const shouldShowWaveButton = useMemo(() => {
		if (hasWaved) return false;
		if (!isDM) return false;
		if (isBlockedByUser) return false;
		if (isMySelf) return false;
		return messageIdsLength <= 1;
	}, [hasWaved, isDM, isBlockedByUser, isMySelf, messageIdsLength]);

	const handleSendWaveSticker = () => {
		try {
			const content: IMessageSendPayload = { t: '' };
			const attachments = [
				{
					url: urlIcon,
					filetype: 'image/gif',
					filename: STICKER_WAVE.NAME,
					size: 374892,
					width: 150,
					height: 150
				}
			];

			sendMessage(content, [], attachments, [], false, false, false);
			setHasWaved(true);
		} catch (error) {
			console.error('Error sending wave sticker:', error);
		}
	};

	if (!shouldShowWaveButton) {
		return null;
	}

	return (
		<div className="flex flex-col  w-[232px] items-center mt-6 gap-6">
			<img src={urlIcon} alt="Wave Sticker" className="object-contain mx-auto" width={160} height={160} />
			<button
				className="btn-primary btn-primary-hover w-full p-3 rounded-lg flex flex-row items-center justify-center gap-1.5 transition-all duration-200 ease-in-out"
				onClick={handleSendWaveSticker}
			>
				<p className="text-white text-xs font-medium truncate max-w-full">{t('waveWelcomeDM', { username: displayName })}</p>
			</button>
		</div>
	);
};

export default memo(WaveButtonDM);
