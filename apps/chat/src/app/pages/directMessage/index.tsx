import { ClanHeader, DirectMessageList, FooterProfile, StreamInfo } from '@mezon/components';
import { useAuth } from '@mezon/core';
import { clansActions, selectCloseMenu, selectStatusMenu, selectStatusStream } from '@mezon/store';
import { isWindowsDesktop } from '@mezon/utils';
import { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Setting from '../setting';
import { MainContentDirect } from './MainContentDirect';

const Direct = () => {
	const dispatch = useDispatch();
	const { userProfile } = useAuth();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const streamPlay = useSelector(selectStatusStream);

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
				className={`flex-col  flex w-[272px] dark:bg-bgSecondary bg-bgLightMode relative min-w-widthMenuMobile ${isWindowsDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} sbm:min-w-[272px] ${closeMenu ? (statusMenu ? 'flex' : 'hidden') : ''}`}
			>
				<ClanHeader type={'direct'} />
				<DirectMessageList />
				{streamPlay && <StreamInfo />}
				<FooterProfile
					name={userProfile?.user?.display_name || userProfile?.user?.username || ''}
					status={userProfile?.user?.online}
					avatar={userProfile?.user?.avatar_url || ''}
					userId={userProfile?.user?.id}
					isDM={true}
				/>
			</div>
			<MainContentDirect />
			<Setting isDM={true} />
		</>
	);
};

export default memo(Direct);
