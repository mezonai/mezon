import { useAppNavigation, useDirect, useMemberStatus } from '@mezon/core';
import {
	EStateFriend,
	audioCallActions,
	messagesActions,
	selectAllAccount,
	selectCurrentChannelId,
	selectFriendById,
	selectIsInCall,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IEmbedProps } from '@mezon/utils';
import { IMessageTypeCallLog, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import { UserStatusIconClan } from '../MemberProfile';

interface ShareContactCardProps {
	embed: IEmbedProps;
}

const ShareContactCard = ({ embed }: ShareContactCardProps) => {
	const { t } = useTranslation('shareContact');
	const { t: tChannelTopbar } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const { createDirectMessageWithUser } = useDirect();
	const isInCall = useSelector(selectIsInCall);
	const currentChannelId = useAppSelector(selectCurrentChannelId);

	const fields = embed.fields || [];
	const getFieldValue = (name: string) => fields.find((f) => f.name === name)?.value || '';

	const userId = getFieldValue('user_id');
	const username = getFieldValue('username');
	const displayName = getFieldValue('display_name');
	const avatar = getFieldValue('avatar');

	const userMeta = useMemberStatus(userId);
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();

	const friendStatus = useAppSelector((state) => selectFriendById(state, userId));
	const currentUser = useAppSelector(selectAllAccount);
	const currentUserId = currentUser?.user?.id;

	const isSelf = useMemo(() => {
		return userId === currentUserId;
	}, [userId, currentUserId]);

	const isBlocked = useMemo(() => {
		return friendStatus?.state === EStateFriend.BLOCK;
	}, [friendStatus]);

	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		abortControllerRef.current = new AbortController();

		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	const handleMessage = useCallback(async () => {
		if (!userId || abortControllerRef.current?.signal.aborted) return;

		try {
			const response = await createDirectMessageWithUser(userId, displayName || username, username, avatar);

			if (abortControllerRef.current?.signal.aborted) return;

			if (response?.channel_id) {
				const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directChat);
			}
		} catch (error) {
			if (abortControllerRef.current?.signal.aborted) return;
			dispatch(
				toastActions.addToast({
					message: t('card.messageError'),
					type: 'error'
				})
			);
		}
	}, [userId, displayName, username, avatar, createDirectMessageWithUser, toDmGroupPageFromMainApp, navigate, dispatch, t]);

	const handleCall = useCallback(async () => {
		if (!userId || isInCall || abortControllerRef.current?.signal.aborted) return;

		if (isSelf) {
			dispatch(
				toastActions.addToast({
					message: t('card.cannotCallSelf'),
					type: 'error'
				})
			);
			return;
		}

		if (isBlocked) {
			dispatch(
				toastActions.addToast({
					message: t('card.blockedAction'),
					type: 'error'
				})
			);
			return;
		}

		try {
			const response = await createDirectMessageWithUser(userId, displayName || username, username, avatar);

			if (abortControllerRef.current?.signal.aborted) return;

			if (response?.channel_id) {
				dispatch(
					messagesActions.sendMessage({
						clanId: '0',
						channelId: response.channel_id,
						content: {
							t: tChannelTopbar('callMessages.startedVoiceCall'),
							callLog: {
								isVideo: false,
								callLogType: IMessageTypeCallLog.STARTCALL,
								showCallBack: false
							}
						},
						mentions: [],
						attachments: [],
						references: [],
						anonymous: false,
						mentionEveryone: false,
						mode: response.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP,
						isPublic: false,
						senderId: userId,
						username,
						avatar
					})
				);

				if (abortControllerRef.current?.signal.aborted) return;

				dispatch(audioCallActions.startDmCall({ groupId: response.channel_id, isVideo: false }));
				dispatch(audioCallActions.setGroupCallId(response.channel_id));
				dispatch(audioCallActions.setUserCallId(String(userId)));
				dispatch(audioCallActions.setIsBusyTone(false));
				const directChat = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directChat);
			}
		} catch (error) {
			if (abortControllerRef.current?.signal.aborted) return;
			dispatch(
				toastActions.addToast({
					message: t('card.callError'),
					type: 'error'
				})
			);
		}
	}, [
		userId,
		displayName,
		username,
		avatar,
		createDirectMessageWithUser,
		dispatch,
		isInCall,
		isBlocked,
		isSelf,
		toDmGroupPageFromMainApp,
		navigate,
		t,
		tChannelTopbar
	]);

	if (!userId || !username) {
		return null;
	}

	return (
		<div className="w-[280px] rounded-xl overflow-hidden shadow-lg mt-2 border-color-primary border">
			<div className=" bg-theme-primary p-4">
				<div className="flex items-center gap-3">
					<div className="relative">
						<AvatarImage
							alt={displayName || username}
							username={username}
							className="w-12 h-12 rounded-full border-2 border-white/30"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
						<div className="rounded-full right-[-4px] absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm ">
							<UserStatusIconClan channelId={currentChannelId || ''} userId={userId || ''} status={userMeta?.status} isShareContact />
						</div>
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-theme-primary-active font-semibold text-base truncate">{displayName || username}</p>
						<p className="text-theme-primary text-sm truncate">@{username}</p>
					</div>
				</div>
			</div>

			<div className="bg-button-secondary flex divide-x divide-color-primary ">
				<button
					onClick={handleCall}
					disabled={isInCall}
					className={`flex-1 py-3 flex text-theme-primary-hover items-center bg-secondary-button-hover justify-center gap-2 text-theme-primary text-sm font-medium  transition-colors ${isInCall ? 'opacity-50 cursor-not-allowed' : ''}`}
				>
					<Icons.IconPhoneDM defaultSize="size-4" />
					<span>{t('card.call')}</span>
				</button>
				<button
					onClick={handleMessage}
					className="flex-1 py-3 text-theme-primary-hover flex items-center bg-secondary-button-hover justify-center gap-2 text-theme-primary text-sm font-medium transition-colors"
				>
					<Icons.Chat defaultSize="size-4" />
					<span>{t('card.message')}</span>
				</button>
			</div>
		</div>
	);
};

export default ShareContactCard;
