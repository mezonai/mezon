import { useInvite } from '@mezon/core';
import { useNavigate, useParams } from 'react-router-dom';

import { channelsActions, clansActions, inviteActions, selectInviteById, useAppDispatch } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function InvitePage() {
	const { t } = useTranslation('common');
	const { inviteId: inviteIdParam } = useParams();
	const selectInvite = useSelector(selectInviteById(inviteIdParam || ''));
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clanId = useMemo(() => {
		return selectInvite?.clanId || '';
	}, [selectInvite]);
	const channeId = useMemo(() => {
		return selectInvite?.channelId || '';
	}, [selectInvite]);
	const userJoined = useMemo(() => {
		return selectInvite?.userJoined;
	}, [selectInvite]);

	const joinChannel = async () => {
		if (inviteIdParam) {
			setLoading(true);
			setError(null);
			try {
				await inviteUser(inviteIdParam).then((res) => {
					if (res?.channelId && res?.clanId) {
						navigate(`/chat/clans/${res.clanId}/channels/${res.channelId}`);
					}
				});
				dispatch(clansActions.fetchClans({ noCache: true }));
				if (selectInvite.channel_desc) {
					const channel = { ...selectInvite, id: selectInvite.channelId as string };
					dispatch(channelsActions.add({ clanId: selectInvite.channel_desc?.clanId as string, channel: { ...channel, active: 1 } }));
				}
			} catch (err) {
				setError(t('invite.failedToJoin'));
			} finally {
				setLoading(false);
			}
		}
	};

	const handleJoinChannel = () => {
		joinChannel();
		handleBackNavigate();
		navigate(`/mezon`);
		try {
			window.location.href = `mezon.ai://invite/${inviteIdParam}`;
			setLoading(false);
		} catch (e) {
			console.error('log  => handleJoinChannel error', e);
		}
	};

	const appDispatch = useAppDispatch();
	const handleBackNavigate = () => {
		appDispatch(inviteActions.setIsClickInvite(false));
	};

	useEffect(() => {
		if (userJoined) {
			navigate(`/chat/clans/${clanId}/channels/${channeId}`);
			toast.info(t('invite.alreadyMember'));
		} else {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					navigate(`/chat/direct/friends`);
				}
			};

			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [userJoined, navigate, clanId, channeId]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-theme-primary">
			<div className="bg-theme-setting-primary border-theme-primary text-theme-primary rounded-md p-6 w-full max-w-[440px] flex flex-col items-center shadow-xl">
				<div className="flex items-center justify-center mb-3">
					<div className="relative w-12 h-12 flex items-center justify-center">
						{selectInvite?.clanLogo ? (
							<img className="w-full h-full rounded-md object-cover" src={selectInvite.clanLogo} alt="" />
						) : (
							<div className="w-full h-full rounded-md bg-gray-700 flex items-center justify-center text-white text-3xl font-medium select-none">
								{(selectInvite?.clan_name || 'M').charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				</div>

				<div className="text-center mb-4 w-full">
					<p className="text-sm mb-1">{t('invite.invitedToJoin')}</p>
					<h1
						className="truncate text-theme-primary-active text-3xl font-medium mb-3 max-w-full"
						title={selectInvite?.clan_name || t('invite.defaultClanName')}
					>
						{selectInvite?.clan_name || t('invite.defaultClanName')}
					</h1>

					<div className="flex justify-center gap-5 text-sm">
						<div className="flex items-center justify-around w-fit gap-2 p-2 ">
							<div className="flex items-center">
								<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
								<span className="">
									{Number(selectInvite?.member_count || 1).toLocaleString()}{' '}
									{t('invite.member', { count: selectInvite?.member_count || 1 })}
								</span>
							</div>
						</div>
					</div>
				</div>

				{error && <div className="w-full text-center text-red-400 text-sm mb-2">{error}</div>}
				<button
					onClick={handleJoinChannel}
					disabled={loading}
					className={`text-white w-full py-[10px] text-base font-medium rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'btn-primary btn-primary-hover '}`}
					data-e2e={generateE2eId('acceptModal.button.acceptInvite')}
				>
					{loading ? t('invite.joining') : t('invite.acceptInvite')}
				</button>
			</div>
		</div>
	);
}
