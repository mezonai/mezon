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
const QR_SIZE = 175;
const LOGO_SIZE = 36;

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
	const initials = (username || displayName || 'U').charAt(0).toUpperCase();

	return (
		<div className="bg-[#0a0a0f] h-screen w-screen overflow-hidden flex items-center justify-center relative select-none">
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none" />
			<div
				className="absolute inset-0 opacity-[0.03] pointer-events-none"
				style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
			/>

			<div className="relative z-10 w-full max-w-[380px] mx-4 flex flex-col items-center">
				<div className="w-full bg-[#181920] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col items-center">
					{username && (
						<>
							{/* Personal Information Header */}
							<div className="w-full flex flex-col items-center px-6 pt-6 pb-3 text-center">
								<div className="flex items-center gap-2.5">
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
									<div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
										<span className="text-indigo-400 text-xs font-semibold">@{username}</span>
									</div>
								)}
							</div>

							<div className="px-6 w-full flex flex-col items-center">
								<div
									className="relative rounded-2xl bg-white px-[30px] py-2 flex flex-col items-center shadow-2xl"
									style={{
										boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 25px rgba(99,102,241,0.2)'
									}}
								>
									<div className="flex items-center justify-between w-full pb-2 border-b border-slate-100 mb-2 px-0.5">
										<div className="flex items-center gap-1.5">
											<img src={DEFAULT_LOGO} className="w-4 h-4 object-contain rounded-md" alt="Mezon Logo" />
											<span className="font-extrabold text-xs tracking-wider text-slate-800">MEZON</span>
										</div>
										<span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
											Profile QR
										</span>
									</div>

									<div className="relative flex items-center justify-center bg-white" style={{ width: QR_SIZE, height: QR_SIZE }}>
										<QRCode
											level="L"
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
												padding: 2,
												border: '2px solid #ffffff',
												boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
											}}
										>
											{avatarUrl ? (
												<img
													src={avatarUrl}
													className="w-full h-full object-cover rounded-lg pointer-events-none"
													alt="Center Logo"
												/>
											) : (
												<div className="w-full h-full rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs select-none">
													{initials}
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center justify-center w-full pt-1.5 mt-2 border-t border-slate-100 px-0.5">
										<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100">
											<svg className="w-3.5 h-3.5 text-[#2563eb] shrink-0" viewBox="0 0 24 24" fill="currentColor">
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027ZM16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"
												/>
											</svg>
											<span className="text-[9px] font-bold tracking-wider text-indigo-600 uppercase">VERIFIED BY MEZON</span>
										</div>
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
