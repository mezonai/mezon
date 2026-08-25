import { useAuth } from '@mezon/core';
import { checkMutableRelationship, directActions, selectAddFriendRequestLoading, sendRequestAddFriend, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ApiChannelDescription, ApiCreateChannelDescRequest, ApiIsFollowerResponse } from 'mezon-js';
import { ChannelType, safeJSONParse } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const DEFAULT_LOGO = 'https://cdn.komu.vn/images/mezon_logo.png';
const QR_SIZE = 260;
const LOGO_SIZE = 50;

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
	const isAddingFriend = useSelector(selectAddFriendRequestLoading);

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

	const handleAddFriend = async () => {
		if (!userProfile?.user?.id || !username || isAddingFriend) return;

		await dispatch(
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
		<div className="bg-[#0a0a0f] h-screen w-screen overflow-hidden flex items-center justify-center relative select-none">
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none" />
			<div
				className="absolute inset-0 opacity-[0.03] pointer-events-none"
				style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
			/>

			<div className="relative z-10 w-full max-w-[380px] mx-4 flex flex-col items-center">
				<div className="w-full bg-[#181920] border border-white/10 rounded-[32px] shadow-2xl shadow-black/50 overflow-hidden flex flex-col items-center">
					{username && (
						<>
							<div className="w-full flex items-center justify-center pt-5 pb-2">
								<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
									<div className="w-2 h-2 rounded-full bg-emerald-400" />
									<span className="text-[11px] font-semibold tracking-wider text-white uppercase">Mezon QR</span>
								</div>
							</div>

							<div className="w-full flex flex-col items-center px-6 pt-2 pb-3 text-center">
								<p className="text-slate-400 text-xs font-normal tracking-wide">{t('invite.scanToConnect')}</p>

								<div className="flex items-center gap-2.5 mt-1.5">
									{avatarUrl ? (
										<img
											src={avatarUrl}
											alt={displayName}
											className="w-8 h-8 rounded-full border-2 border-indigo-500/40 object-cover"
										/>
									) : (
										<div className="w-8 h-8 rounded-full border-2 border-indigo-500/40 bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
											{initials}
										</div>
									)}
									<h2 className="text-lg font-bold text-white tracking-tight uppercase line-clamp-1">{displayName}</h2>
								</div>

								{dataEncode?.name && username && (
									<div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
										<span className="text-indigo-400 text-xs font-semibold">@{username}</span>
									</div>
								)}
							</div>

							<div className="px-6 w-full flex flex-col items-center">
								<div
									className="relative w-full rounded-[24px] bg-white p-3.5 flex flex-col items-center shadow-2xl"
									style={{
										boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 25px rgba(99,102,241,0.2)'
									}}
								>
									<div className="flex items-center justify-between w-full pb-3 border-b border-slate-100 mb-3 px-1">
										<div className="flex items-center gap-1.5">
											<img src={DEFAULT_LOGO} className="w-5 h-5 object-contain rounded-md" alt="Mezon Logo" />
											<span className="font-extrabold text-sm tracking-wider text-slate-800">MEZON</span>
										</div>
										<span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
											Profile QR
										</span>
									</div>

									<div className="relative flex items-center justify-center bg-white" style={{ width: QR_SIZE, height: QR_SIZE }}>
										<QRCode
											level="H"
											value={qrValue}
											size={QR_SIZE}
											style={{ width: '100%', height: '100%' }}
											bgColor="#ffffff"
											fgColor="#0f172a"
										/>

										<div
											className="absolute rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-md"
											style={{
												width: LOGO_SIZE,
												height: LOGO_SIZE,
												top: '50%',
												left: '50%',
												transform: 'translate(-50%, -50%)',
												padding: 3,
												border: '2px solid #ffffff',
												boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
											}}
										>
											<img
												src={avatarUrl || DEFAULT_LOGO}
												className="w-full h-full object-contain rounded-lg pointer-events-none"
												alt="Center Logo"
											/>
										</div>
									</div>

									<div className="flex items-center justify-center w-full pt-3 mt-3 border-t border-slate-100 px-1 text-slate-400">
										<span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">SCAN • CONNECT</span>
									</div>
								</div>
							</div>
						</>
					)}

					<div className="w-full px-6 pt-5 pb-6">
						{loading ? (
							<div className="flex flex-col items-center gap-2.5 py-2">
								<Icons.LoadingSpinner className="!w-8 !h-8 text-indigo-400 animate-spin" />
								<p className="text-xs text-white/50">{t('invite.verifyWait')}</p>
							</div>
						) : (
							!!userProfile && (
								<div className="flex flex-col gap-3 w-full">
									{error === ErrorTypeMutable.MUTABLE && (
										<button
											onClick={handleGotoDm}
											className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer text-sm"
										>
											{t('invite.chatNow')}
										</button>
									)}
									{error === ErrorTypeMutable.NOT_MUTABLE && (
										<button
											onClick={handleAddFriend}
											disabled={isAddingFriend}
											className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
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
					<img src={DEFAULT_LOGO} alt="Mezon" className="w-4 h-4 object-contain rounded" />
					<span className="text-xs text-white font-medium tracking-wider uppercase">mezon.ai</span>
				</div>
			</div>
		</div>
	);
}
