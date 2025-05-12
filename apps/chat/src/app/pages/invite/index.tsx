import { useInvite } from '@mezon/core';
import { useNavigate, useParams } from 'react-router-dom';

import { channelsActions, inviteActions, selectInviteById, useAppDispatch } from '@mezon/store';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function InvitePage() {
	const { inviteId: inviteIdParam } = useParams();
	const selectInvite = useSelector(selectInviteById(inviteIdParam || ''));
	const navigate = useNavigate();
	const { inviteUser } = useInvite();
	const dispatch = useDispatch();
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
				if (selectInvite.channel_desc) {
					const channel = { ...selectInvite.channel_desc, id: selectInvite.channel_desc.channel_id as string };
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
	};

	const appDispatch = useAppDispatch();
	const handleBackNavigate = () => {
		appDispatch(inviteActions.setIsClickInvite(false));
	};

	useEffect(() => {
		if (userJoined) {
			navigate(`/chat/clans/${clanId}/channels/${channeId}`);
			toast.info('You are already a member!');
		}
	}, [userJoined, navigate, clanId, channeId]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-cover bg-center">
			<div className="bg-[#2F3136] rounded-md p-6 w-full max-w-[440px] flex flex-col items-center shadow-xl">
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
					<p className="text-gray-300 text-sm mb-1">You've been invited to join</p>
					<h1
						className="text-white text-3xl font-medium mb-3 truncate max-w-full"
						style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
						title={selectInvite?.clan_name || 'Mezon Clan'}
					>
						{selectInvite?.clan_name || 'Mezon Clan'}
					</h1>

					<div className="flex justify-center gap-5 text-sm">
						<div className="flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
							<span className="text-gray-300">{Number(selectInvite?.member_count || 1).toLocaleString()} Members</span>
						</div>
						{/* <div className="flex items-center">
							<div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
							<span className="text-gray-300">965,376 Members</span>
						</div> */}
					</div>
				</div>

				<div className="w-full bg-[#202225] rounded-md p-3 mb-5 flex items-center">
					<div>
						<div className="text-gray-200 text-xs font-medium uppercase tracking-wide">Server Settings</div>
						<div className="text-gray-400 text-xs">You can customize these at any time</div>
					</div>
				</div>

				{error && <div className="w-full text-center text-red-400 text-sm mb-2">{error}</div>}
				<button
					onClick={handleJoinChannel}
					disabled={loading}
					className={`text-white w-full py-[10px] text-base font-medium rounded-md ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#5865F2] hover:bg-[#4752C4]'}`}
				>
					{loading ? 'Joining...' : 'Accept Invite'}
				</button>
			</div>
		</div>
	);
}
