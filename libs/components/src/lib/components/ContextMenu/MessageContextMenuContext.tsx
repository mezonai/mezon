import { useIdleRender } from '@mezon/core';
import { SHOW_POSITION } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ShowContextMenuParams, useContextMenu } from 'react-contexify';
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
	allUserIdsInChannel: string[];
	allRolesInClan: string[];
	posShortProfile: posShortProfileOpt;
	setPosShortProfile: (pos: posShortProfileOpt) => void;
	onVisibilityChange: (status: boolean) => void;
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
	allUserIdsInChannel: [],
	allRolesInClan: [],
	posShortProfile: {},
	setPosShortProfile: () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
	}
});

export const MessageContextMenuProvider = ({
	children,
	allUserIdsInChannel,
	allRolesInClan,
	channelId
}: {
	children: React.ReactNode;
	allUserIdsInChannel: string[];
	allRolesInClan: string[];
	channelId?: string;
}) => {
	const messageIdRef = useRef<string>('');
	const [elementTarget, setElementTarget] = useState<HTMLElement | null>(null);
	const [activeMode, setActiveMode] = useState<ChannelStreamMode>(ChannelStreamMode.STREAM_MODE_CHANNEL);
	const [posShowMenu, setPosShowMenu] = useState<string>(SHOW_POSITION.NONE);
	const [imageSrc, setImageSrc] = useState<string>(SHOW_POSITION.NONE);
	const [posShortProfile, setPosShortProfile] = useState<posShortProfileOpt>({});
	const [isTopic, setIsTopic] = useState<boolean>(false);

	const { show } = useContextMenu({
		id: MESSAGE_CONTEXT_MENU_ID
	});

	const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);

	const menu = useMemo(() => {
		if (!isMenuVisible) return null;
		return (
			<MessageContextMenu
				id={MESSAGE_CONTEXT_MENU_ID}
				messageId={messageIdRef.current}
				elementTarget={elementTarget}
				activeMode={activeMode}
				isTopic={isTopic}
			/>
		);
	}, [elementTarget, activeMode, isMenuVisible, isTopic]);

	const setPositionShow = useCallback((pos: string) => {
		setPosShowMenu(pos);
	}, []);

	useEffect(() => {
		// change channel hide menu keep not mount
		channelId && setIsMenuVisible(false);
	}, [channelId]);

	const resetMenuState = useCallback(() => {
		setIsMenuVisible(false);
		setElementTarget(null);
		setActiveMode(ChannelStreamMode.STREAM_MODE_CHANNEL);
		setIsTopic(false);
		messageIdRef.current = '';
	}, []);

	const onVisibilityChange = useCallback((status: boolean) => {}, [resetMenuState]);
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
			setActiveMode(mode);
			setIsTopic(isTopic);

			const niceProps = {
				messageId,
				...props
			};
			showContextMenu(event, niceProps);
		},
		[setElementTarget, setActiveMode, setIsTopic]
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
			onVisibilityChange
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
			onVisibilityChange
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
