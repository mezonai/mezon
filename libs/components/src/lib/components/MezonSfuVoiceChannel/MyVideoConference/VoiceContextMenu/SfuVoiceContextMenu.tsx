import { useAuth, useDirect, useOnClickOutside, usePermissionChecker, useSendInviteMessage } from '@mezon/core';
import {
	giveCoffeeActions,
	selectMemberClanByUserId,
	selectVoiceContextMenu,
	selectWalletDetail,
	toastActions,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { EPermission, TypeMessage, compareBigInt, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, type ApiTokenSentEvent } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ButtonCopy from '../../../ButtonSwitchCustom/CopyButtonComponent';
import { useSendReaction } from '../Reaction';
import { SfuVoiceInteractiveLayer } from './SfuVoiceInteractiveLayer';

interface SfuVoiceContextMenuProps {
	channelId: string;
	onParticipantAction: (action: 'mute' | 'kick', participantId: string) => Promise<void>;
}

const TOKEN_SEND_FLOWER = 50000;
const FLOWER_COOLDOWN_MS = 5000;

export const SfuVoiceContextMenu = ({ channelId, onParticipantAction }: SfuVoiceContextMenuProps) => {
	const { t } = useTranslation(['contextMenu', 'token']);
	const dispatch = useAppDispatch();
	const contextMenu = useAppSelector(selectVoiceContextMenu);
	const { sendInviteMessage } = useSendInviteMessage();
	const { createDirectMessageWithUser } = useDirect();
	const myProfile = useAuth();
	const { mmnRef } = useMezon();
	const userWallet = useSelector(selectWalletDetail);
	const [canManageVoice] = usePermissionChecker([EPermission.manageChannel]);

	const menuRef = useRef<HTMLDivElement>(null);
	const isMutingRef = useRef(false);
	const isKickingRef = useRef(false);
	const flowerCooldownUntilRef = useRef(0);
	const [isMuting, setIsMuting] = useState(false);
	const [isKicking, setIsKicking] = useState(false);
	const { sendFlower } = useSendReaction();

	const participantId = contextMenu?.openedParticipantId;
	const member = useAppSelector((state) => (participantId ? selectMemberClanByUserId(state, participantId) : undefined));

	useOnClickOutside(menuRef, () => {
		if (contextMenu) dispatch(voiceActions.closeVoiceContextMenu());
	});

	const handleMute = useCallback(async () => {
		if (!participantId || isMutingRef.current) return;
		isMutingRef.current = true;
		setIsMuting(true);
		dispatch(voiceActions.closeVoiceContextMenu());
		try {
			await onParticipantAction('mute', member?.user?.id || participantId);
		} catch (error) {
			console.error('Failed to mute SFU member:', error);
			dispatch(
				toastActions.addToast({
					message: error instanceof Error ? error.message : 'Failed to mute participant',
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			isMutingRef.current = false;
			setIsMuting(false);
		}
	}, [dispatch, member?.user?.id, onParticipantAction, participantId]);

	const handleKick = useCallback(async () => {
		if (!participantId || isKickingRef.current) return;
		isKickingRef.current = true;
		setIsKicking(true);
		dispatch(voiceActions.closeVoiceContextMenu());
		try {
			await onParticipantAction('kick', member?.user?.id || participantId);
		} catch (error) {
			console.error('Failed to kick SFU member:', error);
			dispatch(
				toastActions.addToast({
					message: error instanceof Error ? error.message : 'Failed to kick participant',
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			isKickingRef.current = false;
			setIsKicking(false);
		}
	}, [dispatch, member?.user?.id, onParticipantAction, participantId]);

	const handleGiveFlowers = useCallback(async () => {
		if (Date.now() < flowerCooldownUntilRef.current) {
			return;
		}

		dispatch(voiceActions.closeVoiceContextMenu());

		try {
			const mmnClient = mmnRef.current;

			if (!mmnClient) {
				return;
			}

			if (compareBigInt(userWallet?.balance || '', mmnClient.scaleAmountToDecimals(TOKEN_SEND_FLOWER)) < 0) {
				dispatch(
					toastActions.addToast({
						message: t('token:toast.error.exceedWallet'),
						type: 'error'
					})
				);
				return;
			}

			const receiverId = member?.user?.id || participantId;
			if (!receiverId) {
				return;
			}

			flowerCooldownUntilRef.current = Date.now() + FLOWER_COOLDOWN_MS;

			const tokenEvent: ApiTokenSentEvent = {
				sender_id: myProfile.userId as string,
				sender_name: myProfile?.userProfile?.user?.username as string,
				receiver_id: receiverId,
				amount: TOKEN_SEND_FLOWER,
				note: t('giveFlowers')
			};

			await dispatch(
				giveCoffeeActions.sendToken({
					tokenEvent: {
						...tokenEvent,
						receiver_name: member?.user?.username || ''
					}
				})
			);
			await dispatch(voiceActions.giveFlowers({ receiver_id: receiverId })).unwrap();
			sendFlower(receiverId);

			const response = await createDirectMessageWithUser(
				receiverId,
				member?.user?.display_name || '',
				member?.user?.username || '',
				member?.user?.avatar_url
			);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Funds Transferred: ${TOKEN_SEND_FLOWER}₫ | ${tokenEvent.note}`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		} catch (error) {
			console.error('Failed to send flower:', error);
		}
	}, [
		createDirectMessageWithUser,
		dispatch,
		member?.user?.avatar_url,
		member?.user?.display_name,
		member?.user?.id,
		member?.user?.username,
		mmnRef,
		myProfile.userId,
		myProfile?.userProfile?.user?.username,
		participantId,
		sendFlower,
		sendInviteMessage,
		t,
		userWallet?.balance
	]);

	if (!contextMenu || !participantId) return <SfuVoiceInteractiveLayer channelId={channelId} />;

	return (
		<>
			<SfuVoiceInteractiveLayer channelId={channelId} />
			<div
				ref={menuRef}
				className="contexify fixed z-30 flex w-52 flex-col rounded-md border border-border bg-theme-setting-nav p-2 text-sm font-medium text-theme-primary !bg-theme-contexify !opacity-100"
				style={{ top: contextMenu.position.y, left: contextMenu.position.x }}
			>
				<button
					className="flex w-full cursor-pointer items-center justify-between rounded p-2 hover:bg-[#f67e882a]"
					onClick={handleGiveFlowers}
					data-e2e={generateE2eId('clan_page.screen.voice_room.button.send_flower')}
				>
					<span>{t('giveFlowers')}</span>
				</button>
				{canManageVoice && (
					<button
						disabled={isMuting}
						className="flex w-full cursor-pointer items-center justify-between rounded p-2 hover:bg-item-hover disabled:cursor-not-allowed disabled:opacity-50"
						onClick={() => void handleMute()}
						data-e2e={generateE2eId('clan_page.screen.voice_room.button.mute_mic')}
					>
						<span>{t('muteMic')}</span>
						{isMuting ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							<Icons.VoiceMicDisabledIcon className="h-4 w-4" />
						)}
					</button>
				)}
				{canManageVoice && (
					<button
						disabled={isKicking}
						className="flex w-full cursor-pointer items-center justify-between rounded p-2 text-[#E13542] hover:bg-[#f67e882a] disabled:cursor-not-allowed disabled:opacity-50"
						onClick={() => void handleKick()}
						data-e2e={generateE2eId('clan_page.screen.voice_room.button.kick')}
					>
						<span>{t('member.kick')}</span>
						{isKicking ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E13542] border-t-transparent" />
						) : (
							<Icons.CloseIcon className="h-4 w-4" />
						)}
					</button>
				)}
				<div className="contexify_separator" />
				<ButtonCopy className="flex flex-row-reverse justify-between p-2" title={t('copyUserId')} copyText={member?.id || participantId} />
			</div>
		</>
	);
};
