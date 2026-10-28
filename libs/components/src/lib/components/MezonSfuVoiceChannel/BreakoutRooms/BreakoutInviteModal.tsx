import type { RootState } from '@mezon/store';
import {
	selectBreakoutInvite,
	selectBreakoutPending,
	selectChannelsEntitiesByClanId,
	selectEntitiesChannelsByUser,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export interface BreakoutInviteModalProps {
	clanId: string;
}

export const BreakoutInviteModal: React.FC<BreakoutInviteModalProps> = ({ clanId }) => {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();
	const breakoutInvite = useSelector(selectBreakoutInvite);
	const breakoutPending = useSelector(selectBreakoutPending);
	const clanChannelEntities = useSelector((state: RootState) => selectChannelsEntitiesByClanId(state, clanId));
	const userChannelEntities = useSelector(selectEntitiesChannelsByUser);

	const invite = breakoutInvite?.invite ?? null;

	useEffect(() => {
		if (!invite) {
			return;
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				dispatch(voiceActions.dismissBreakoutInvite());
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dispatch, invite]);

	if (!breakoutInvite || !invite) {
		return null;
	}

	const resolveVoiceChannelName = (roomId: string): string | null => {
		const fromClan = clanChannelEntities?.[roomId]?.channel_label?.trim();
		if (fromClan) {
			return fromClan;
		}
		const fromUser = userChannelEntities?.[roomId]?.channel_label?.trim();
		if (fromUser) {
			return fromUser;
		}
		return null;
	};

	const handleDismiss = () => {
		dispatch(voiceActions.dismissBreakoutInvite());
	};

	const handleAccept = (selectedRoomId?: string) => {
		void dispatch(
			voiceActions.acceptBreakoutInvite({
				selectedRoomId
			})
		);
	};

	const assignedRoomName = invite.kind === 'Assigned' ? resolveVoiceChannelName(invite.roomId) : null;

	return (
		<div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
			<div
				className="flex w-full max-w-[440px] flex-col gap-3 rounded-xl border border-white/10 bg-[#1e1f22] p-6 text-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-2">
					<span className="text-white">
						<Icons.VoiceBreakoutIcon className="h-5 w-5" />
					</span>
					<h3 className="text-xl font-semibold text-white">{t('breakout.title')}</h3>
				</div>

				<p className="text-sm text-[#b5bac1]">
					{invite.kind === 'Assigned'
						? t('breakout.inviteAssigned')
						: invite.kind === 'Choose'
							? t('breakout.inviteChoose')
							: t('breakout.inviteReturn')}
				</p>

				{assignedRoomName && (
					<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#2b2d31] px-3 py-2">
						<span className="text-[#5865f2]">
							<Icons.VoiceBreakoutIcon className="h-[15px] w-[15px]" />
						</span>
						<span className="truncate text-sm font-semibold text-white">{assignedRoomName}</span>
					</div>
				)}

				{invite.kind === 'Choose' && invite.roomIds.length > 0 && (
					<div className="flex max-h-[240px] flex-wrap gap-2 overflow-y-auto">
						{invite.roomIds.map((roomId, idx) => {
							const label = resolveVoiceChannelName(roomId) || t('breakout.room', { number: idx + 1 });
							return (
								<button
									key={roomId}
									type="button"
									disabled={breakoutPending}
									onClick={() => handleAccept(roomId)}
									className="rounded-lg border border-white/15 bg-[#2b2d31] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5865f2] disabled:cursor-not-allowed disabled:opacity-50"
								>
									{label}
								</button>
							);
						})}
					</div>
				)}

				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={handleDismiss}
						className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#dbdee1] transition-colors hover:bg-white/10"
					>
						{t('breakout.later')}
					</button>
					{invite.kind !== 'Choose' && (
						<button
							type="button"
							disabled={breakoutPending}
							onClick={() => handleAccept()}
							className="rounded-lg bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{invite.kind === 'Return' ? t('breakout.returnToMain') : t('breakout.join')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
