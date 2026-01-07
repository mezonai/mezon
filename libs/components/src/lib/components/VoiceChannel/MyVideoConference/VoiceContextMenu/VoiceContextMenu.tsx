import { useOnClickOutside } from '@mezon/core';
import { selectMemberClanByUserId, selectVoiceContextMenu, useAppDispatch, useAppSelector, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { UsersClanEntity } from '@mezon/utils';
import type { Room } from 'livekit-client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonCopy from '../../../ButtonSwitchCustom/CopyButtonComponent';

interface VoiceContextMenuProps {
	roomName?: string;
	room?: Room;
	groupMembers?: UsersClanEntity[];
}

export const VoiceContextMenu: React.FC<VoiceContextMenuProps> = ({ roomName, room, groupMembers }) => {
	const { t } = useTranslation('contextMenu');
	const dispatch = useAppDispatch();
	const contextMenu = useAppSelector(selectVoiceContextMenu);
	const focusRef = useRef<HTMLDivElement>(null);

	const [isMuting, setIsMuting] = useState(false);
	const [isKicking, setIsKicking] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);

	const isMutingRef = useRef(false);
	const isKickingRef = useRef(false);

	const participantId = contextMenu?.openedParticipantId;

	const clanMember = useAppSelector((state) => (participantId ? selectMemberClanByUserId(state, participantId) : undefined));

	const member = useMemo(() => {
		if (!participantId) return undefined;
		if (groupMembers) {
			return groupMembers.find((m) => m.user?.id === participantId || m.id === participantId);
		}
		return clanMember;
	}, [groupMembers, clanMember, participantId]);

	useEffect(() => {
		if (!participantId || !room || !contextMenu) {
			setIsMicOn(false);
			return;
		}

		const participant = room.remoteParticipants.get(participantId);
		if (!participant) {
			setIsMicOn(false);
			dispatch(voiceActions.closeVoiceContextMenu());
			return;
		}

		const updateMicStatus = () => {
			for (const publication of participant.audioTrackPublications.values()) {
				if (publication.kind === 'audio' && publication.track && publication.isSubscribed) {
					const isMuted = publication.track.isMuted || publication.isMuted;
					setIsMicOn(!isMuted);
					return;
				}
			}
			setIsMicOn(false);
		};

		updateMicStatus();
		const events = ['trackMuted', 'trackUnmuted', 'trackPublished', 'trackUnpublished', 'trackSubscribed', 'trackUnsubscribed'] as const;
		events.forEach((event) => participant.on(event, updateMicStatus));

		return () => {
			events.forEach((event) => participant.off(event, updateMicStatus));
		};
	}, [participantId, room, contextMenu, dispatch]);

	const handleRemoveMember = useCallback(async () => {
		if (isKickingRef.current) return;

		isKickingRef.current = true;
		setIsKicking(true);
		dispatch(voiceActions.closeVoiceContextMenu());

		if (!roomName) {
			isKickingRef.current = false;
			setIsKicking(false);
			return;
		}

		try {
			await dispatch(
				voiceActions.kickVoiceMember({
					roomName: roomName,
					username: member?.user?.id
				})
			).unwrap();
		} catch (error) {
			console.error('Failed to kick member:', error);
		} finally {
			isKickingRef.current = false;
			setIsKicking(false);
		}
	}, [roomName, dispatch, member?.user?.id]);

	const handleMuteMember = useCallback(async () => {
		if (isMutingRef.current) return;

		isMutingRef.current = true;
		setIsMuting(true);
		dispatch(voiceActions.closeVoiceContextMenu());

		if (!roomName) {
			isMutingRef.current = false;
			setIsMuting(false);
			return;
		}

		try {
			await dispatch(
				voiceActions.muteVoiceMember({
					roomName: roomName,
					username: member?.user?.id
				})
			).unwrap();
		} catch (error) {
			console.error('Failed to mute member:', error);
		} finally {
			isMutingRef.current = false;
			setIsMuting(false);
		}
	}, [roomName, dispatch, member?.user?.id]);

	useOnClickOutside(focusRef, () => {
		if (contextMenu) {
			dispatch(voiceActions.closeVoiceContextMenu());
		}
	});

	if (!contextMenu) {
		return null;
	}

	return (
		<div
			className="contexify !bg-theme-contexify font-medium text-sm !opacity-100 flex flex-col w-52 rounded-md bg-theme-setting-nav text-theme-primary fixed z-30 p-2"
			style={
				{
					top: contextMenu.position.y,
					left: contextMenu.position.x,
					'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
					'--contexify-activeItem-color': 'var(--text-secondary)',
					'--contexify-rightSlot-color': 'var(--text-secondary)',
					'--contexify-activeRightSlot-color': 'var(--text-secondary)',
					'--contexify-arrow-color': 'var(--text-theme-primary)',
					'--contexify-activeArrow-color': 'var(--text-secondary)',
					'--contexify-separator-color': 'var(--text-separator-theme-primary)',
					'--contexify-menu-radius': '8px',
					'--contexify-item-color': 'var(--text-theme-primary)',
					border: '1px solid var(--border-primary)'
				} as React.CSSProperties
			}
			ref={focusRef}
		>
			{isMicOn && (
				<div
					className={`text-[#E13542] p-2 w-full justify-between bg-item-hover items-center flex hover:bg-[#f67e882a] ${
						isMuting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					}`}
					onClick={handleMuteMember}
				>
					{t('muteMic')}
					{isMuting ? (
						<div className="w-4 h-4 border-2 border-[#E13542] border-t-transparent rounded-full animate-spin" />
					) : (
						<Icons.VoiceMicDisabledIcon className="w-4 h-4" />
					)}
				</div>
			)}

			<div
				className={`text-[#E13542] p-2 w-full justify-between bg-item-hover items-center flex hover:bg-[#f67e882a] ${
					isKicking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
				}`}
				onClick={handleRemoveMember}
			>
				{t('member.kick')}
				{isKicking ? (
					<div className="w-4 h-4 border-2 border-[#E13542] border-t-transparent rounded-full animate-spin" />
				) : (
					<Icons.CloseIcon className="w-4 h-4" />
				)}
			</div>
			<div className="contexify_separator"></div>

			<ButtonCopy className="flex flex-row-reverse justify-between p-2" title={t('copyUserId')} copyText={member?.id} />
		</div>
	);
};
