import { useUserByUserId } from '@mezon/core';
import { audioCallActions, DMCallActions, selectIsInCall, selectJoinedCall, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, decompress } from '@mezon/utils';
import { safeJSONParse, WebrtcSignalingFwd } from 'mezon-js';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';

interface ModalCallProps {
	dataCall: WebrtcSignalingFwd;
	userId: string;
	triggerCall: () => void;
	clearCallState?: () => void;
}
type ICallerInfo = {
	avatar: string;
	name: string;
};

const ModalCall = ({ dataCall, userId, triggerCall, clearCallState }: ModalCallProps) => {
	const user = useUserByUserId(dataCall?.caller_id);
	const [callerInfo, setCallerInfo] = useState<ICallerInfo>({ name: '', avatar: '' });
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const isJoinedCall = useSelector(selectJoinedCall);
	const isInCall = useSelector(selectIsInCall);

	useEffect(() => {
		const getCallerInfo = async () => {
			try {
				const dataCalDecompress = await decompress(dataCall?.json_data);
				const dataCallObj = safeJSONParse(dataCalDecompress) as { callerName: string; callerAvatar: string };
				setCallerInfo({
					name: (dataCallObj?.callerName as string) || '',
					avatar: dataCallObj?.callerAvatar || ''
				});
			} catch (error) {
				return;
			}
		};
		!!dataCall?.json_data && getCallerInfo();
	}, [dataCall]);

	useEffect(() => {
		if (isJoinedCall && !isInCall) {
			dispatch(DMCallActions.setIsInCall(false));
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(DMCallActions.removeAll());
		}
	}, [dispatch, isInCall, isJoinedCall]);

	const handleJoinCall = async () => {
		triggerCall();
	};

	const handleCloseCall = async () => {
		await mezon.socketRef.current?.forwardWebrtcSignaling(dataCall?.caller_id, 4, '', dataCall.channel_id ?? '', userId ?? '');

		if (clearCallState) {
			clearCallState();
		} else {
			dispatch(DMCallActions.setIsInCall(false));
			dispatch(audioCallActions.setIsEndTone(true));
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(DMCallActions.removeAll());
		}
	};

	return (
		<div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'>
			<div className='bg-black p-6 rounded-lg shadow-xl flex flex-col gap-6 items-center justify-center w-[232px]'>
				<div className='w-16 h-16'>
					<AvatarImage
						className='w-16 h-16'
						alt='user avatar'
						username={user?.clan_nick || user?.user?.display_name || user?.user?.username}
						srcImgProxy={createImgproxyUrl((callerInfo?.avatar || user?.clan_avatar || user?.user?.avatar_url) ?? '', {
							width: 300,
							height: 300,
							resizeType: 'fit'
						})}
						src={callerInfo?.avatar || user?.clan_avatar || user?.user?.avatar_url}
					/>
				</div>

				<div className='text-center'>
					<p className='font-semibold text-xl'>{callerInfo?.name || user?.user?.username}</p>
					<p className='text-gray-600'>Incoming Call...</p>
				</div>

				<div className='flex gap-4 items-center'>
					<div
						onClick={handleCloseCall}
						className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
					>
						<Icons.CloseButton className={`w-[20px]`} />
					</div>
					<div
						className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
						onClick={handleJoinCall}
					>
						<Icons.IconPhoneDM />
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModalCall;
