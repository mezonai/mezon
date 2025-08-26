import { useInvite } from '@mezon/core';
import { useNavigate, useParams } from 'react-router-dom';

import { channelsActions, clansActions, inviteActions, selectInviteById, useAppDispatch } from '@mezon/store';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function InvitePage() {
	const { inviteId: inviteIdParam } = useParams();
	const selectInvite = useSelector(selectInviteById(inviteIdParam || ''));
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clanId = useMemo(() => {
		return selectInvite?.clan_id || '';
	}, [selectInvite]);
	const channeId = useMemo(() => {
		return selectInvite?.channel_id || '';
	}, [selectInvite]);
	const userJoined = useMemo(() => {
		return selectInvite?.user_joined;
	}, [selectInvite]);

	const joinChannel = async () => {
		if (inviteIdParam) {
			setLoading(true);
			setError(null);
			try {
				await inviteUser(inviteIdParam).then((res) => {
					if (res?.channel_id && res?.clan_id) {
						navigate(`/chat/clans/${res.clan_id}/channels/${res.channel_id}`);
					}
				});
				dispatch(clansActions.fetchClans({ noCache: true }));
				if (selectInvite.channel_desc) {
					const channel = { ...selectInvite, id: selectInvite.channel_id as string };
					dispatch(channelsActions.add({ clanId: selectInvite.channel_desc?.clan_id as string, channel: { ...channel, active: 1 } }));
				}
			} catch (err) {
				setError('Failed to join the channel. Please try again.');
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
			toast.info('You are already a member!');
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
						{selectInvite?.clan_logo ? (
							<img className="w-full h-full rounded-md object-cover" src={selectInvite.clan_logo} alt="" />
						) : (
							<div className="w-full h-full rounded-md bg-gray-700 flex items-center justify-center text-white text-3xl font-medium select-none">
								{(selectInvite?.clan_name || 'M').charAt(0).toUpperCase()}
							</div>
						)}
					</div>
				</div>

				<div className="text-center mb-4 w-full">
					<p className="text-sm mb-1">You've been invited to join</p>
					<h1
						className="text-theme-primary-active text-3xl font-medium mb-3 truncate max-w-full"
						style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
						title={selectInvite?.clan_name || 'Mezon Clan'}
					>
						{selectInvite?.clan_name || 'Mezon Clan'}
					</h1>

					<div className="flex justify-center gap-5 text-sm">
						<div className="flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
							<span className="">
								{Number(selectInvite?.member_count || 1).toLocaleString()} Member{selectInvite?.member_count > 1 ? 's' : ''}
							</span>
						</div>
						{/* <div className="flex items-center">
							<div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
							<span className="text-gray-300">965,376 Members</span>
						</div> */}
					</div>
				</div>

				<div className="w-full bg-input-secondary rounded-md p-3 mb-5 flex items-center">
					<div>
						<div className=" text-xs font-medium uppercase tracking-wide">Clan Settings</div>
						<div className="text-xs">You can customize these at any time</div>
					</div>
				</div>

				{error && <div className="w-full text-center text-red-400 text-sm mb-2">{error}</div>}
				<button
					onClick={handleJoinChannel}
					disabled={loading}
					className={`text-white w-full py-[10px] text-base font-medium rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'btn-primary btn-primary-hover '}`}
				>
					{loading ? 'Joining...' : 'Accept Invite'}
				</button>
			</div>
		</div>
	);
}
