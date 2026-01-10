import { useInvite } from '@mezon/core';
import { channelsActions, clansActions, getStore, inviteActions, selectAllClans, selectInviteById, useAppDispatch } from '@mezon/store';
import { Modal } from '@mezon/ui';
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

	const clanId = selectInvite?.clanId || '';
	const channelId = selectInvite?.channelId || '';

	const userJoined = selectInvite?.userJoined;

	const joinChannel = async () => {
		if (inviteId) {
			setLoading(true);
			setError(null);
			try {
				await inviteUser(inviteId).then((res) => {
					if (res?.channelId && res?.clanId) {
						navigate(`/chat/clans/${res.clanId}/channels/${res.channelId}`);
						onClose();
					}
				});
				dispatch(clansActions.fetchClans({ noCache: true }));
				if (selectInvite.channelDesc) {
					const channel = { ...selectInvite, id: selectInvite.channelId as string };
					dispatch(channelsActions.add({ clanId: selectInvite.channelDesc?.clanId as string, channel: { ...channel, active: 1 } }));
				}
			} finally {
				setLoading(false);
				onClose();
			}
		}
	};

	const handleJoinChannel = () => {
		joinChannel();
		dispatch(inviteActions.setIsClickInvite(false));
	};

	const handleClose = () => {
		dispatch(inviteActions.setIsClickInvite(false));
		onClose();
	};

	useEffect(() => {
		const store = getStore();
		const clans = selectAllClans(store.getState());
		const isClanMember = clans.some((item) => item.id === clanId);
		if (userJoined || isClanMember) {
			toast.info(t('acceptModal.toast.alreadyMember'));
			navigate(`/chat/clans/${clanId}/channels/${channelId}`);
			onClose();
		}
	}, [userJoined, navigate, clanId, channelId, onClose, t]);

	return (
		<Modal showModal={showModal} onClose={handleClose} isInviteModal={true} title={t('acceptModal.title')}>
			<div className="bg-theme-setting-primary text-theme-primary rounded-md p-6 w-full max-w-[440px] flex flex-col items-center">
				<div className="flex items-center justify-center mb-3">
					<div className="relative w-12 h-12 flex items-center justify-center">
						{selectInvite?.clanLogo ? (
							<img className="w-full h-full rounded-md object-cover" src={selectInvite.clanLogo} alt="" />
						) : (
							<div className="w-full h-full rounded-md bg-gray-700 flex items-center justify-center text-white text-3xl font-medium select-none">
								{(selectInvite?.clanName || 'M').charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				</div>

				<div className="text-center mb-4 w-full">
					<p className="text-sm mb-1">{t('acceptModal.invitedToJoin')}</p>
					<h1
						className="text-theme-primary-active text-3xl font-medium mb-3 truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
						title={selectInvite?.clanName || 'XCLAN'}
					>
						{selectInvite?.clanName || 'XCLAN'}
					</h1>

					<div className="flex justify-center gap-5 text-sm">
						<div className="flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
							<span>{t('acceptModal.memberCount', { count: Number(selectInvite?.memberCount || 1) })}</span>
						</div>
					</div>
				</div>

				{error && <div className="w-full text-center text-red-400 text-sm mb-2">{error}</div>}

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
			</div>
		</Modal>
	);
}
