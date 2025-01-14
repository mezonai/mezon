import { useIdleRender } from '@mezon/core';
import {
	pinMessageActions,
	RootState,
	selectClanView,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDmGroupCurrent,
	selectDmGroupCurrentId,
	selectMessageByMessageId,
	useAppDispatch
} from '@mezon/store';
import { ChannelMembersEntity, SHOW_POSITION } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ShowContextMenuParams, useContextMenu } from 'react-contexify';
import { useModal } from 'react-modal-hook';
import { useStore } from 'react-redux';
import ModalDeleteMess from '../DeleteMessageModal/ModalDeleteMess';
import { ModalAddPinMess } from '../PinMessModal';
import MessageContextMenu from './MessageContextMenu';

const MESSAGE_CONTEXT_MENU_ID = 'message-context-menu';

type posShortProfileOpt = {
	top?: number | string;
	bottom?: number | string;
	left?: number | string;
	right?: number | string;
};

type MessageContextMenuContextValue = {
	showMessageContextMenu: (
		event: React.MouseEvent<HTMLElement>,
		messageId: string,
		mode: ChannelStreamMode,
		isTopic: boolean,
		props?: Partial<MessageContextMenuProps>
	) => void;
	setPositionShow: (showPostion: SHOW_POSITION) => void;
	posShowMenu: string;
	setImageURL: (url: string) => void;
	imageSrc: string;
	allUserIdsInChannel?: string[] | ChannelMembersEntity[];
	allRolesInClan: string[];
	posShortProfile: posShortProfileOpt;
	setPosShortProfile: (pos: posShortProfileOpt) => void;
	onVisibilityChange: (status: boolean) => void;
	openDeleteMessageModal: () => void;
	openPinMessageModal: () => void;
};

export type MessageContextMenuProps = {
	messageId: string;
	position?: ShowContextMenuParams['position'];
};

export const MessageContextMenuContext = createContext<MessageContextMenuContextValue>({
	showMessageContextMenu: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	onVisibilityChange: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},

	setPositionShow: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	posShowMenu: SHOW_POSITION.NONE,
	setImageURL: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	imageSrc: '',
	allRolesInClan: [],
	posShortProfile: {},
	setPosShortProfile: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	openDeleteMessageModal: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	openPinMessageModal: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	}
});

const getCurrentChannelAndDm = (appState: RootState) => {
	const currentChannel = selectCurrentChannel(appState);
	const currentDmId = selectDmGroupCurrentId(appState);
	const currentDm = selectDmGroupCurrent(currentDmId || '')(appState);

	return { currentChannel, currentDm };
};

const getMessage = (appState: RootState, isTopic: boolean, messageId: string) => {
	const isClanView = selectClanView(appState);
	const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);
	const currentTopicId = selectCurrentTopicId(appState);
	const message = selectMessageByMessageId(appState, isTopic ? currentTopicId : isClanView ? currentChannel?.id : currentDm?.id, messageId);

	return message;
};

const getActiveMode = (appState: RootState) => {
	const isClanView = selectClanView(appState);
	const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);

	if (isClanView) {
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT) {
			return ChannelStreamMode.STREAM_MODE_CHANNEL;
		}
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
			return ChannelStreamMode.STREAM_MODE_THREAD;
		}
	}

	if (currentDm?.type === ChannelType.CHANNEL_TYPE_DM) {
		return ChannelStreamMode.STREAM_MODE_DM;
	}

	return ChannelStreamMode.STREAM_MODE_GROUP;
};

export const MessageContextMenuProvider = ({
	children,
	allUserIdsInChannel,
	allRolesInClan,
	channelId
}: {
	children: React.ReactNode;
	allUserIdsInChannel?: string[] | ChannelMembersEntity[];
	allRolesInClan: string[];
	channelId?: string;
}) => {
	const dispatch = useAppDispatch();
	const messageIdRef = useRef<string>('');
	const [elementTarget, setElementTarget] = useState<HTMLElement | null>(null);
	const [posShowMenu, setPosShowMenu] = useState<string>(SHOW_POSITION.NONE);
	const [imageSrc, setImageSrc] = useState<string>(SHOW_POSITION.NONE);
	const [posShortProfile, setPosShortProfile] = useState<posShortProfileOpt>({});
	const [isTopic, setIsTopic] = useState<boolean>(false);

	const appStore = useStore();

	const [openDeleteMessageModal, closeDeleteMessageModal] = useModal(() => {
		const appState = appStore.getState() as RootState;
		const mode = getActiveMode(appState);
		const message = getMessage(appState, isTopic, messageIdRef.current);
		return <ModalDeleteMess mess={message} closeModal={closeDeleteMessageModal} mode={mode} />;
	}, []);

	const [openPinMessageModal, closePinMessageModal] = useModal(() => {
		const appState = appStore.getState() as RootState;
		const message = getMessage(appState, isTopic, messageIdRef.current);
		const mode = getActiveMode(appState);
		const currentChannel = selectCurrentChannel(appState);

		return (
			<ModalAddPinMess
				mess={message}
				closeModal={closePinMessageModal}
				handlePinMessage={handlePinMessage}
				mode={mode || 0}
				channelLabel={currentChannel?.channel_label || ''}
			/>
		);
	}, []);

	const handlePinMessage = useCallback(async () => {
		const appState = appStore.getState() as RootState;
		const currentClanId = selectCurrentClanId(appState);
		const message = getMessage(appState, isTopic, messageIdRef.current);
		const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);
		const mode = getActiveMode(appState);

		dispatch(
			pinMessageActions.setChannelPinMessage({
				clan_id: currentClanId ?? '',
				channel_id: message?.channel_id,
				message_id: message?.id,
				message: message
			})
		);
		dispatch(
			pinMessageActions.joinPinMessage({
				clanId: mode !== ChannelStreamMode.STREAM_MODE_CHANNEL && mode !== ChannelStreamMode.STREAM_MODE_THREAD ? '' : (currentClanId ?? ''),
				channelId:
					mode !== ChannelStreamMode.STREAM_MODE_CHANNEL && mode !== ChannelStreamMode.STREAM_MODE_THREAD
						? currentDm?.id || ''
						: (currentChannel?.channel_id ?? ''),
				messageId: message?.id,
				isPublic:
					mode !== ChannelStreamMode.STREAM_MODE_CHANNEL && mode !== ChannelStreamMode.STREAM_MODE_THREAD
						? false
						: currentChannel
							? !currentChannel.channel_private
							: false,
				mode: mode as number
			})
		);
	}, []);

	const { show } = useContextMenu({
		id: MESSAGE_CONTEXT_MENU_ID
	});

	const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);

	const menu = useMemo(() => {
		if (!isMenuVisible) return null;

		const appState = appStore.getState() as RootState;
		const mode = getActiveMode(appState);
		return (
			<MessageContextMenu
				id={MESSAGE_CONTEXT_MENU_ID}
				messageId={messageIdRef.current}
				elementTarget={elementTarget}
				activeMode={mode}
				isTopic={isTopic}
				openDeleteMessageModal={openDeleteMessageModal}
				openPinMessageModal={openPinMessageModal}
			/>
		);
	}, [elementTarget, isMenuVisible, isTopic]);

	const setPositionShow = useCallback((pos: string) => {
		setPosShowMenu(pos);
	}, []);

	useEffect(() => {
		// change channel hide menu keep not mount
		channelId && setIsMenuVisible(false);
	}, [channelId]);

	const onVisibilityChange = useCallback((status: boolean) => {
		setIsMenuVisible(status);
	}, []);
	const setImageURL = useCallback((src: string) => {
		setImageSrc(src);
	}, []);

	const showContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>, props: MessageContextMenuProps) => {
			const position = props.position || null;
			setIsMenuVisible(true);
			setTimeout(() => {
				show({
					event,
					props,
					position
				});
			}, 100);
		},
		[show]
	);

	const showMessageContextMenu = useCallback(
		(
			event: React.MouseEvent<HTMLElement>,
			messageId: string,
			mode: ChannelStreamMode,
			isTopic: boolean,
			props?: Partial<MessageContextMenuProps>
		) => {
			messageIdRef.current = messageId;
			setElementTarget(event.target as HTMLElement);
			setIsTopic(isTopic);

			const niceProps = {
				messageId,
				...props
			};
			showContextMenu(event, niceProps);
		},
		[]
	);

	const value = useMemo(
		() => ({
			showMessageContextMenu,
			setPositionShow,
			posShowMenu,
			setImageURL,
			imageSrc,
			allUserIdsInChannel,
			allRolesInClan,
			posShortProfile,
			setPosShortProfile,
			onVisibilityChange,
			openDeleteMessageModal,
			openPinMessageModal
		}),
		[
			showMessageContextMenu,
			setPositionShow,
			posShowMenu,
			setImageURL,
			imageSrc,
			allUserIdsInChannel,
			allRolesInClan,
			posShortProfile,
			setPosShortProfile,
			onVisibilityChange,
			openDeleteMessageModal,
			openPinMessageModal
		]
	);

	const shouldRender = useIdleRender();

	if (!shouldRender) return null;

	return (
		<MessageContextMenuContext.Provider value={value}>
			{children}
			{menu}
		</MessageContextMenuContext.Provider>
	);
};

export const useMessageContextMenu = () => useContext(MessageContextMenuContext);
