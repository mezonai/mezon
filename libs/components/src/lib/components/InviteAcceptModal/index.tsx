import { useInvite } from '@mezon/core';
import { clansActions, inviteActions, selectClanById, selectInviteById, useAppDispatch } from '@mezon/store';
import { Modal } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export interface InviteAcceptModalProps {
	inviteId: string;
	onClose: () => void;
	showModal: boolean;
}

export default function InviteAcceptModal({ inviteId, onClose, showModal }: InviteAcceptModalProps) {
	const { t } = useTranslation('invitation');
	const selectInvite = useSelector(selectInviteById(inviteId || ''));
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [joinPending, setJoinPending] = useState(Boolean(selectInvite?.join_pending));

	useEffect(() => {
		setJoinPending(Boolean(selectInvite?.join_pending));
	}, [inviteId, selectInvite?.join_pending, showModal]);

	const clanId = selectInvite?.clan_id || '0';

	const clan = useSelector(selectClanById(clanId));
	const userJoined = selectInvite?.user_joined;

	const joinChannel = async () => {
		if (inviteId) {
			setLoading(true);
			setError(null);
			let isPending = false;
			try {
				const res = await inviteUser(inviteId);
				if (res?.join_pending) {
					isPending = true;
					setJoinPending(true);
					return;
				}
				if (res?.channel_id && res?.clan_id) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					navigate(`/chat/clans/${res?.clan_id}/member-safety`);
					dispatch(clansActions.fetchClans({ noCache: true }));
					onClose();
				}
			} finally {
				setLoading(false);
				if (!isPending) {
					onClose();
				}
			}
		}
	};

	const handleJoinChannel = () => {
		dispatch(inviteActions.setIsClickInvite(false));
		if (userJoined || !!clan) {
			toast.info(t('acceptModal.toast.alreadyMember'));
			navigate(`/chat/clans/${clanId}/member-safety`);
			onClose();
			return;
		}
		joinChannel();
	};

	const handleClose = () => {
		dispatch(inviteActions.setIsClickInvite(false));
		onClose();
	};

	return (
		<Modal showModal={showModal} onClose={handleClose} isInviteModal={true} title={t('acceptModal.title')}>
			<div className="bg-theme-setting-primary text-theme-primary rounded-md p-6 w-full max-w-[440px] flex flex-col items-center">
				<div className="flex items-center justify-center mb-3">
					<div className="relative w-12 h-12 flex items-center justify-center">
						{selectInvite?.clan_logo ? (
							<img
								className="w-full h-full rounded-md object-cover"
								src={createImgproxyUrl(selectInvite.clan_logo, { width: 100, height: 100, resizeType: 'fill-down' })}
								alt=""
							/>
						) : (
							<div className="w-full h-full rounded-md bg-item-theme hover:[background:var(--bg-item-hover)] flex items-center justify-center text-theme-primary text-3xl font-medium select-none">
								{(selectInvite?.clan_name || 'M').charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				</div>

				<div className="text-center mb-4 w-full">
					<p className="text-sm mb-1">{t('acceptModal.invitedToJoin')}</p>
					<h1
						className="text-theme-primary-active text-3xl font-medium mb-3 truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
						title={selectInvite?.clan_name || 'XCLAN'}
					>
						{selectInvite?.clan_name || 'XCLAN'}
					</h1>

					<div className="flex justify-center gap-5 text-sm">
						<div className="flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
							<span>{t('acceptModal.memberCount', { count: Number(selectInvite?.member_count || 1) })}</span>
						</div>
					</div>
				</div>

				{error && <div className="w-full text-center text-red-400 text-sm mb-2">{error}</div>}

				{joinPending ? (
					<div className="w-full flex flex-col items-center gap-3">
						<div className="w-full rounded-md border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-center">
							<p className="text-sm font-semibold text-theme-primary-active">{t('acceptModal.requestSentTitle')}</p>
							<p className="text-xs text-theme-primary mt-1">{t('acceptModal.requestSentDesc')}</p>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="text-theme-primary w-full py-[10px] text-base font-medium rounded-md border border-theme-primary hover:bg-theme-input-hover"
						>
							{t('acceptModal.close')}
						</button>
					</div>
				) : (
					<div className="flex w-full gap-3">
						<button
							onClick={handleClose}
							className="text-theme-primary w-full py-[10px] text-base font-medium rounded-md border border-theme-primary hover:bg-theme-input-hover"
						>
							{t('acceptModal.noThanks')}
						</button>
						<button
							onClick={handleJoinChannel}
							disabled={loading}
							className={`text-white w-full py-[10px] text-base font-medium rounded-md ${
								loading ? 'bg-gray-500 cursor-not-allowed' : 'btn-primary btn-primary-hover'
							}`}
						>
							{loading ? t('acceptModal.joining') : t('acceptModal.acceptInvite')}
						</button>
					</div>
				)}
			</div>
		</Modal>
	);
}
