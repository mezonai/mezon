import { useAuth } from '@mezon/core';
import { checkMutableRelationship, directActions, sendRequestAddFriend, useAppDispatch } from '@mezon/store';
import { Button, Icons } from '@mezon/ui';
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
		if (!userProfile?.user?.id || !username) return;
		const bodyCreateDm: ApiCreateChannelDescRequest = {
			type: ChannelType.CHANNEL_TYPE_DM,
			channel_private: 1,
			user_ids: [username],
			clan_id: '0'
		};
		const result = await dispatch(
			directActions.createNewDirectMessage({
				body: bodyCreateDm,
				username: [userProfile?.user?.display_name || userProfile?.user?.username || '', dataEncode?.name || username],
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
				usernames: [username]
			})
		);
		navigate('/chat/direct/friends');
	};

	return (
		<div className="bg-theme-primary h-screen w-screen overflow-hidden flex items-center justify-center">
			<div className="bg-input-secondary min-w-[480px] w-2/5 h-4/5 h-fit rounded-lg flex flex-col gap-5 justify-center items-center p-8 text-white">
				{username && (
					<div
						className={`relative bg-white p-6 ${dataEncode?.avatar ? 'pt-10' : ''} rounded-md flex items-center justify-center gap-3 flex-col`}
					>
						{dataEncode?.avatar && (
							<div className="absolute bg-white -top-8 rounded-full">
								<img src={dataEncode?.avatar} className="w-14 h-14 rounded-full shadow-sm shadow-black" />
							</div>
						)}
						<QRCode size={220} value={username} />
						{dataEncode?.name && <p className="text-2xl font-bold text-black">{dataEncode?.name}</p>}
					</div>
				)}
				{loading ? (
					<>
						<Icons.LoadingSpinner className="!w-20 !h-20" />
						<p className="italic text-sm ">({t('invite.verifyWait')})</p>
					</>
				) : (
					!!userProfile && (
						<div className="flex gap-3 items-center">
							{error === ErrorTypeMutable.MUTABLE && (
								<Button className="px-4 py-3 rounded-md btn-primary btn-primary-hover" onClick={handleGotoDm}>
									{t('invite.chatNow')}
								</Button>
							)}
							{error === ErrorTypeMutable.NOT_MUTABLE && (
								<Button className="px-4 py-3 rounded-md btn-primary btn-primary-hover" onClick={handleAddFriend}>
									{t('invite.addFriend')}
								</Button>
							)}
						</div>
					)
				)}
			</div>
		</div>
	);
}
