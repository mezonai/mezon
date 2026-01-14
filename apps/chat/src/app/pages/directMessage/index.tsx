import { ClanHeader, DirectMessageContextMenuProvider, DirectMessageList } from '@mezon/components';
import { clansActions, selectCloseMenu, selectStatusMenu } from '@mezon/store';
import { isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Setting from '../setting';
import { MainContentDirect } from './MainContentDirect';

const Direct = () => {
	const dispatch = useDispatch();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);

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
				className={`flex-col flex w-[272px]  bg-theme-direct-message  relative min-w-widthMenuMobile ${isWindowsDesktop || isLinuxDesktop ? 'max-h-heightTitleBar h-heightTitleBar' : ''} sbm:min-w-[272px] ${closeMenu ? (statusMenu ? 'flex' : 'max-sm:hidden') : ''}`}
			>
				<DirectMessageContextMenuProvider contextMenuId="dm-list-context">
					<div className="contain-content ">
						<ClanHeader type={'direct'} />
						<DirectMessageList />
					</div>
				</DirectMessageContextMenuProvider>
			</div>
			<MainContentDirect />
			<Setting isDM={true} />
		</>
	);
};

export default memo(Direct);
