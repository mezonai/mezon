import { useAuth } from '@mezon/core';
import { checkMutableRelationship, selectAddFriendRequestLoading, sendRequestAddFriend, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20, SpinningIcon } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import type { ApiIsFollowerResponse } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isMobileBrowser, openAppDeeplink } from '../../utils/deeplink';

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
		if (isMobileBrowser()) {
			openAppDeeplink(`invite/chat/${username}?data=${data}`);
		}
	};

	useEffect(() => {
		navigateDeeplinkMobile();
	}, []);

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
											src={createImgproxyUrl(avatarUrl, { width: 100, height: 100, resizeType: 'fill-down' })}
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
													src={createImgproxyUrl(avatarUrl, { width: 100, height: 100, resizeType: 'fill-down' })}
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
											<MezonIcon icon={MzIcons16.mzVerified} className="text-[#2563eb] shrink-0" />
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
								<SpinningIcon icon={MzIcons20.mzSpinner} />
								<p className="text-xs text-white/50">{t('invite.verifyWait')}</p>
							</div>
						) : (
							!!userProfile && (
								<div className="flex flex-col gap-3 w-full">
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
