import { useGifsStickersEmoji, useIdleRender } from '@mezon/core';
import {
	selectClickedOnThreadBoxStatus,
	selectClickedOnTopicStatus,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectIsShowCreateTopic,
	threadsActions,
	topicsActions
} from '@mezon/store';
import { SubPanelName, isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import ReactionEmojiPanel from './ReactionEmojiPanel';

const ChannelLayout = () => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isChannelStream = currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING;
	const closeMenu = useSelector(selectCloseMenu);

	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const isFocusThreadBox = useSelector(selectClickedOnThreadBoxStatus);

	const { subPanelActive, setSubPanelActive } = useGifsStickersEmoji();
	const openEmojiRightPanel = subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT;
	const openEmojiBottomPanel = subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM;
	const openEmojiPanelOnTopic = (openEmojiRightPanel || openEmojiBottomPanel) && isFocusTopicBox;
	const openEmojiPanelOnThreadBox = (openEmojiRightPanel || openEmojiBottomPanel) && isFocusThreadBox;

	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);

	const dispatch = useDispatch();

	const onMouseDown = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(false));
		dispatch(threadsActions.setFocusThreadBox(false));
	};
	const shouldRender = useIdleRender();

	return (
		<div
			onMouseDown={onMouseDown}
			className={`flex flex-col ${openEmojiPanelOnTopic || subPanelActive !== SubPanelName.NONE || isFocusThreadBox ? 'z-20 relative' : 'z-0'} flex-1 shrink min-w-0 bg-transparent h-[100%] overflow-visible justify-end relative`}
		>
			<div
				className={`flex flex-row ${closeMenu ? `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBarMobile' : 'h-heightWithoutTopBarMobile'}` : `${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'}`} ${isChannelStream ? 'justify-center items-center mx-4' : ''}`}
			>
				<Outlet />
			</div>
			{shouldRender && (
				<ReactionEmojiPanel
					isFocusTopicOrThreadBox={isFocusTopicBox || isFocusThreadBox}
					openEmojiRightPanel={openEmojiRightPanel}
					openEmojiBottomPanel={openEmojiBottomPanel}
					openEmojiPanelOnTopicOrThreadBox={openEmojiPanelOnTopic || openEmojiPanelOnThreadBox}
					closeMenu={closeMenu}
					currentChannelId={currentChannelId ?? ''}
					isShowCreateTopic={isShowCreateTopic}
				/>
			)}
		</div>
	);
};

export default ChannelLayout;
