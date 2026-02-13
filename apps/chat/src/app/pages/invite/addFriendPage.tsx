import { useAuth } from '@mezon/core';
import { checkMutableRelationship, directActions, sendRequestAddFriend, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelType, safeJSONParse } from 'mezon-js';
import type { ApiChannelDescription, ApiCreateChannelDescRequest, ApiIsFollowerResponse } from 'mezon-js/api.gen';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

enum ErrorTypeMutable {
	NOT_MUTABLE = 'not_mutable',
	MUTABLE = 'mutable'
}

export default function AddFriendPage() {
	const { t } = useTranslation('common');
	const [searchParams] = useSearchParams();
	const { username } = useParams();
	const data = searchParams.get('data');
	const { userProfile } = useAuth();
	const [error, setError] = useState<ErrorTypeMutable | null>(null);
	const [loading, setLoading] = useState(true);
	const dataEncode: { id: string; name: string; avatar: string } | null | undefined = useMemo(() => {
		if (data) {
			try {
				const jsonStr = atob(data);
				const parsed = safeJSONParse(decodeURIComponent(jsonStr));
				return parsed as { id: string; name: string; avatar: string };
			} catch (err) {
				console.error('Decode data error:', err);
				return null;
			}
		}
	}, [data]);

	const qrValue = useMemo(() => {
		const origin = process.env.NX_CHAT_APP_REDIRECT_URI || window.location.origin;
		if (data) {
			return `${origin}/chat/${username}?data=${data}`;
		}
		return `${origin}/chat/${username}`;
	}, [username, data]);

	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			if (!username || !userProfile?.user?.id) return;
			try {
				const result: ApiIsFollowerResponse = await dispatch(checkMutableRelationship({ userId: dataEncode?.id || username || '' })).unwrap();

				if (result.is_follower) {
					toast.success(t('invite.canChatNow'));
					setError(ErrorTypeMutable.MUTABLE);
				} else if (dataEncode?.id) {
					setError(ErrorTypeMutable.NOT_MUTABLE);
				}
				setLoading(false);
			} catch (error) {
				setLoading(false);
				console.error('Error:', error);
			}
		};
		if (dataEncode?.id || username) {
			fetchData();
		} else {
			setLoading(false);
		}
	}, [dispatch, dataEncode?.id, userProfile]);

	const navigateDeeplinkMobile = () => {
		try {
			const strData = `${username}?data=${data}`;
			window.location.href = `mezon.ai://invite/chat/${strData}`;
		} catch (e) {
			console.error('log  => navigateDeeplinkMobile error', e);
		}
	};

	useEffect(() => {
		navigateDeeplinkMobile();
	}, []);

	const handleGotoDm = async () => {
		const targetUserId = dataEncode?.id;

		if (!userProfile?.user?.id || !targetUserId) return;
		const bodyCreateDm: ApiCreateChannelDescRequest = {
			type: ChannelType.CHANNEL_TYPE_DM,
			channel_private: 1,
			user_ids: [targetUserId],
			clan_id: '0'
		};
		const result = await dispatch(
			directActions.createNewDirectMessage({
				body: bodyCreateDm,
				username: [userProfile?.user?.display_name || userProfile?.user?.username || '', dataEncode?.name || username || ''],
				avatar: [userProfile?.user?.avatar_url || '', dataEncode?.avatar || '']
			})
		);
		if ((result.payload as ApiChannelDescription).channel_id) {
			navigate(`/chat/direct/message/${(result.payload as ApiChannelDescription).channel_id}/3`);
		} else {
			navigate('/chat/direct/friends');
		}
	};

	const handleAddFriend = () => {
		if (!userProfile?.user?.id || !username) return;

		dispatch(
			sendRequestAddFriend({
				usernames: username
			})
		);
		navigate('/chat/direct/friends');
	};

	const displayName = dataEncode?.name || username || '';
	const avatarUrl = dataEncode?.avatar || '';
	const initials = displayName.charAt(0).toUpperCase();

	return (
		<div className="bg-[#0a0a0f] h-screen w-screen overflow-hidden flex items-center justify-center relative">
			<div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />
			<div
				className="absolute inset-0 opacity-[0.03] pointer-events-none"
				style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
			/>

			<div className="relative z-10 w-full max-w-[420px] mx-4">
				<div className="bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
					{username && (
						<div className="flex flex-col items-center pt-10 pb-6 px-8">
							<div className="relative mb-5">
								{avatarUrl ? (
									<div className="w-20 h-20 rounded-full ring-4 ring-blue-500/30 ring-offset-2 ring-offset-[#1a1a2e] overflow-hidden">
										<img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
									</div>
								) : (
									<div className="w-20 h-20 rounded-full ring-4 ring-blue-500/30 ring-offset-2 ring-offset-[#1a1a2e] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
										<span className="text-2xl font-bold text-white">{initials}</span>
									</div>
								)}
								<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-[3px] border-[#1a1a2e]" />
							</div>

							<h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
							{dataEncode?.name && username && <p className="text-sm text-white/40">@{username}</p>}

							<div className="mt-6 bg-white rounded-xl p-4 shadow-lg relative group">
								<QRCode size={200} value={qrValue} level="L" />
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
										<img src="/assets/images/mezon-logo-white.svg" alt="Mezon" className="w-6 h-6" />
									</div>
								</div>
							</div>

							<p className="mt-4 text-xs text-white/30 text-center">{t('invite.scanToConnect') || 'Scan QR code to connect'}</p>
						</div>
					)}

					<div className="px-8 pb-8">
						{loading ? (
							<div className="flex flex-col items-center gap-3 py-4">
								<Icons.LoadingSpinner className="!w-10 !h-10 text-blue-400" />
								<p className="text-sm text-white/50">{t('invite.verifyWait')}</p>
							</div>
						) : (
							!!userProfile && (
								<div className="flex flex-col gap-3">
									{error === ErrorTypeMutable.MUTABLE && (
										<button
											onClick={handleGotoDm}
											className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
										>
											{t('invite.chatNow')}
										</button>
									)}
									{error === ErrorTypeMutable.NOT_MUTABLE && (
										<button
											onClick={handleAddFriend}
											className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
										>
											{t('invite.addFriend')}
										</button>
									)}
								</div>
							)
						)}
					</div>
				</div>

				<div className="flex items-center justify-center gap-2 mt-6 opacity-40">
					<img src="/assets/images/mezon-logo-white.svg" alt="Mezon" className="w-4 h-4" />
					<span className="text-xs text-white font-medium tracking-wider uppercase">Mezon</span>
				</div>
			</div>
		</div>
	);
}
