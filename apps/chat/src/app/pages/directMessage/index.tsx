import { ClanHeader, DirectMessageList, StreamInfo, UpdateButton, VoiceInfo } from '@mezon/components';
import {
	clansActions,
	selectCloseMenu,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectIsJoin,
	selectStatusMenu,
	selectVoiceJoined
} from '@mezon/store';
import { ESummaryInfo, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Setting from '../setting';
import { MainContentDirect } from './MainContentDirect';

const Direct = () => {
	const dispatch = useDispatch();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const isInCall = useSelector(selectIsInCall);
	const isJoin = useSelector(selectIsJoin);
	const isVoiceJoined = useSelector(selectVoiceJoined);

	useEffect(() => {
		dispatch(clansActions.setCurrentClanId('0'));
		const recentEmojis = localStorage.getItem('recentEmojis');
		if (!recentEmojis) {
			localStorage.setItem('recentEmojis', JSON.stringify([]));
		}
	}, []);

	return (
		<>
			<div
				className={`flex-col flex w-[272px] dark:bg-bgSecondary bg-bgLightMode relative min-w-widthMenuMobile ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} sbm:min-w-[272px] ${closeMenu ? (statusMenu ? 'flex' : 'max-sm:hidden') : ''}`}
			>
				<div className="contain-content">
					<ClanHeader type={'direct'} />
					<DirectMessageList />
					{isInCall && <StreamInfo type={ESummaryInfo.CALL} />}
					{isJoin && <StreamInfo type={ESummaryInfo.STREAM} />}
					{isVoiceJoined && <VoiceInfo />}
				</div>
				{(isElectronUpdateAvailable || IsElectronDownloading) && <UpdateButton isDownloading={!isElectronUpdateAvailable} />}
			</div>
			<MainContentDirect />
			<Setting isDM={true} />
		</>
	);
};

export default memo(Direct);
