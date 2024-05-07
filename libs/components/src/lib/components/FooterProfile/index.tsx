import { useOnClickOutside } from '@mezon/core';
import {
	ChannelsEntity,
	selectShowModalCustomStatus,
	selectShowModalFooterProfile,
	selectStatusCall,
	useAppDispatch,
	userClanProfileActions,
	voiceActions,
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HeadPhoneICon, MicIcon, SettingProfile } from '../Icons';
import MemberProfile from '../MemberProfile';
import ModalCustomStatus from '../ModalUserProfile/StatusProfile/ModalCustomStatus';
import VoiceControlPanel from '../VoiceControlPanel';
import ModalFooterProfile from './ModalFooterProfile';

export type FooterProfileProps = {
	name: string;
	status?: boolean;
	avatar: string;
	userId?: string;
	openSetting: () => void;
	channelCurrent?: ChannelsEntity | null;
};

function FooterProfile({ name, status, avatar, userId, openSetting, channelCurrent }: FooterProfileProps) {
	const dispatch = useAppDispatch();
	const showScreen = useSelector(selectStatusCall);
	const showModalFooterProfile = useSelector(selectShowModalFooterProfile);
	const showModalCustomStatus = useSelector(selectShowModalCustomStatus);

	const profileRef = useRef<HTMLDivElement | null>(null);

	const checkTypeChannel = channelCurrent?.type === ChannelType.CHANNEL_TYPE_VOICE;

	useEffect(() => {
		if (checkTypeChannel) {
			dispatch(voiceActions.setStatusCall(checkTypeChannel));
		}
	}, [channelCurrent?.type]);

	const handleClickFooterProfile = () => {
		dispatch(userClanProfileActions.setShowModalFooterProfile(!showModalFooterProfile));
	};

	const handleCloseModalFooterProfile = () => {
		dispatch(userClanProfileActions.setShowModalFooterProfile(false));
	};

	const handleCloseModalCustomStatus = () => {
		dispatch(userClanProfileActions.setShowModalCustomStatus(false));
	};

	useOnClickOutside(profileRef, handleCloseModalFooterProfile);

	return (
		<>
			{showScreen && <VoiceControlPanel channelCurrent={channelCurrent} />}
			<button
				className="flex items-center justify-between border-t-2
			 border-borderDefault px-4 py-2 font-title text-[15px]
			 font-[500] text-white hover:bg-gray-550/[0.16]
			 shadow-sm transition bg-bgSurface
			 w-full group focus-visible:outline-none"
			>
				<div className="footer-profile" ref={profileRef} onClick={handleClickFooterProfile}>
					<div className="pointer-events-none">
						<MemberProfile
							name={name}
							status={status}
							avatar={avatar}
							isHideStatus={false}
							numberCharacterCollapse={15}
							classParent="memberProfile"
						/>
					</div>
					{showModalFooterProfile && <ModalFooterProfile userId={userId ?? ''} />}
				</div>
				<div className="flex items-center gap-2 iconHover bgHover">
					<MicIcon className="ml-auto w-[18px] h-[18px] opacity-80 iconRed" />
					<HeadPhoneICon className="ml-auto w-[18px] h-[18px] opacity-80" />
					<SettingProfile className="ml-auto w-[18px] h-[18px] opacity-80 text-[#AEAEAE]" onClick={openSetting} />
				</div>
			</button>
			{showModalCustomStatus && <ModalCustomStatus name={name} openModal={showModalCustomStatus} onClose={handleCloseModalCustomStatus} />}
		</>
	);
}

export default FooterProfile;
