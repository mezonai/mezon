import { useIdleRender } from '@mezon/core';
import type { RootState, UpdatePinMessage } from '@mezon/store';
import {
	getActiveMode,
	getCurrentChannelAndDm,
	getStore,
	pinMessageActions,
	selectClanView,
	selectClickedOnThreadBoxStatus,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectMessageByMessageId,
	selectThreadCurrentChannel,
	useAppDispatch
} from '@mezon/store';
import { isValidUrl } from '@mezon/transport';
import { SHOW_POSITION } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ShowContextMenuParams } from 'react-contexify';
import { useContextMenu } from 'react-contexify';
import { useModal } from 'react-modal-hook';
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
	posShortProfile: posShortProfileOpt;
	setPosShortProfile: (pos: posShortProfileOpt) => void;
	onVisibilityChange: (status: boolean) => void;
	openDeleteMessageModal: () => void;
	openPinMessageModal: () => void;
	selectedMessageId: string | null;
};

export type MessageContextMenuProps = {
	messageId: string;
	position?: ShowContextMenuParams['position'];
	linkContent?: string;
	isLinkContent?: boolean;
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
	posShortProfile: {},
	setPosShortProfile: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	openDeleteMessageModal: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	openPinMessageModal: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	},
	selectedMessageId: null
});

const getMessage = (appState: RootState, isTopic: boolean, messageId: string) => {
	const isClanView = selectClanView(appState);
	const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);
	const isFocusThreadBox = selectClickedOnThreadBoxStatus(appState);
	const currentThread = selectThreadCurrentChannel(appState);

	const channelId = isFocusThreadBox ? currentThread?.channel_id : currentChannel?.id;

	const currentTopicId = selectCurrentTopicId(appState);
	const message = selectMessageByMessageId(
		appState,
		isTopic ? currentTopicId : isFocusThreadBox ? channelId : isClanView ? currentChannel?.id : currentDm?.id,
		messageId
	);

	return message;
};

export const MessageContextMenuProvider = ({ children, channelId }: { children: React.ReactNode; channelId?: string }) => {
	const dispatch = useAppDispatch();
	const messageIdRef = useRef<string>('');
	const [elementTarget, setElementTarget] = useState<HTMLElement | null>(null);
	const [posShowMenu, setPosShowMenu] = useState<string>(SHOW_POSITION.NONE);
	const [imageSrc, setImageSrc] = useState<string>(SHOW_POSITION.NONE);
	const [posShortProfile, setPosShortProfile] = useState<posShortProfileOpt>({});
	const [isTopic, setIsTopic] = useState<boolean>(false);
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [linkContent, setLinkContent] = useState<string | undefined>(undefined);
	const [isLinkContent, setIsLinkContent] = useState<boolean>(false);

	const [openDeleteMessageModal, closeDeleteMessageModal] = useModal(() => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const mode = getActiveMode();
		const message = getMessage(appState, isTopic, messageIdRef.current);
		return <ModalDeleteMess mess={message} closeModal={closeDeleteMessageModal} mode={mode} isTopic={isTopic} />;
	}, [messageIdRef.current]);

	const [openPinMessageModal, closePinMessageModal] = useModal(() => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const message = getMessage(appState, isTopic, messageIdRef.current);
		const mode = getActiveMode();
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
	}, [messageIdRef.current]);

	const handlePinMessage = useCallback(async () => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const currentClanId = selectCurrentClanId(appState);
		const message = getMessage(appState, isTopic, messageIdRef.current);
		const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);
		const mode = getActiveMode();

		dispatch(
			pinMessageActions.setChannelPinMessage({
				clan_id: currentClanId ?? '',
				channel_id: message?.channel_id,
				message_id: message?.id,
				message
			})
		);
		const attachments = message.attachments?.filter((attach) => isValidUrl(attach.url || '')) || [];
		const jsonAttachments = attachments.length > 0 ? JSON.stringify(attachments) : '';
		const createTime = new Date(message.create_time).toISOString();
		const pinBody: UpdatePinMessage = {
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
			mode: mode as number,
			senderId: message.sender_id,
			senderUsername: message.display_name || message.username || message.user?.name || message.user?.name || '',
			attachment: jsonAttachments,
			avatar: message.avatar || message.clan_avatar || '',
			content: JSON.stringify(message.content),
			createdTime: createTime
		};

		dispatch(pinMessageActions.joinPinMessage(pinBody));
	}, []);

	const { show } = useContextMenu({
		id: MESSAGE_CONTEXT_MENU_ID
	});

	const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);

	const menu = useMemo(() => {
		if (!isMenuVisible) return null;
		const mode = getActiveMode();
		return (
			<MessageContextMenu
				id={MESSAGE_CONTEXT_MENU_ID}
				messageId={selectedMessageId || ''}
				elementTarget={elementTarget}
				activeMode={mode}
				isTopic={isTopic}
				openDeleteMessageModal={openDeleteMessageModal}
				openPinMessageModal={openPinMessageModal}
				linkContent={linkContent}
				isLinkContent={isLinkContent}
			/>
		);
	}, [elementTarget, isMenuVisible, isTopic, linkContent, isLinkContent, openDeleteMessageModal, openPinMessageModal, selectedMessageId]);

	const setPositionShow = useCallback((pos: string) => {
		setPosShowMenu(pos);
	}, []);

	useEffect(() => {
		// change channel hide menu keep not mount
		channelId && setIsMenuVisible(false);
	}, [channelId]);

	const onVisibilityChange = useCallback((status: boolean) => {
		setIsMenuVisible(status);
		if (!status) {
			setSelectedMessageId(null);
		}
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
			setSelectedMessageId(messageId);
			setLinkContent(props?.linkContent);
			setIsLinkContent(props?.isLinkContent || false);

			const niceProps = {
				messageId,
				...props
			};
			showContextMenu(event, niceProps);
		},
		[showContextMenu]
	);

	const value = useMemo(
		() => ({
			showMessageContextMenu,
			setPositionShow,
			posShowMenu,
			setImageURL,
			imageSrc,
			posShortProfile,
			setPosShortProfile,
			onVisibilityChange,
			openDeleteMessageModal,
			openPinMessageModal,
			selectedMessageId
		}),
		[
			showMessageContextMenu,
			setPositionShow,
			posShowMenu,
			setImageURL,
			imageSrc,
			posShortProfile,
			setPosShortProfile,
			onVisibilityChange,
			openDeleteMessageModal,
			openPinMessageModal,
			selectedMessageId
		]
	);

	const shouldRender = useIdleRender();

	return (
		<MessageContextMenuContext.Provider value={value}>
			{children}
			{shouldRender && menu}
		</MessageContextMenuContext.Provider>
	);
};

export const useMessageContextMenu = () => useContext(MessageContextMenuContext);
