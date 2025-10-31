import { channelsActions, getStore, inviteActions, selectAppChannelById, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	EBacktickType,
	getTikTokEmbedSize,
	getTikTokEmbedUrl,
	getYouTubeEmbedSize,
	getYouTubeEmbedUrl,
	isTikTokLink,
	isYouTubeLink
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMessageContextMenu } from '../ContextMenu';
import InviteAcceptModal from '../InviteAcceptModal';

type MarkdownContentOpt = {
	content?: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
	isInPinMsg?: boolean;
	isLink?: boolean;
	isBacktick?: boolean;
	typeOfBacktick?: EBacktickType;
	isReply?: boolean;
	isSearchMessage?: boolean;
	messageId?: string;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
};

const extractChannelParams = (url: string) => {
	const pattern = /mezon\.ai\/chat\/clans\/([^/]+)\/channels\/([^/]+)\?([^#]+)/i;
	const match = url.match(pattern);

	if (match) {
		const params = new URLSearchParams(match[3]);
		return {
			channelId: match[2],
			clanId: match[1],
			code: params.get('code'),
			subpath: params.get('subpath')
		};
	}

	return null;
};

const isGoogleMapsLink = (url?: string) => {
	return (
		url?.startsWith('https://www.google.com/maps?') ||
		url?.startsWith('https://maps.google.com/maps?') ||
		url?.startsWith('https://www.google.com/maps?q=')
	);
};

export const MarkdownContent: React.FC<MarkdownContentOpt> = ({
	content,
	isJumMessageEnabled,
	isTokenClickAble,
	isInPinMsg,
	isLink,
	isBacktick,
	typeOfBacktick,
	isReply,
	isSearchMessage,
	messageId,
	onContextMenu
}) => {
	const appearanceTheme = useSelector(selectTheme);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { showMessageContextMenu } = useMessageContextMenu();
	const origin = `${process.env.NX_CHAT_APP_REDIRECT_URI}/invite/`;
	const originClan = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/`;
	const originDirect = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/direct/message/`;

	const handleContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();

			if (isLink && content && messageId) {
				showMessageContextMenu(event, messageId, ChannelStreamMode.STREAM_MODE_CHANNEL, false, {
					linkContent: content,
					isLinkContent: true
				});
			} else if (onContextMenu) {
				onContextMenu(event);
			}
		},
		[isLink, content, messageId, showMessageContextMenu, onContextMenu]
	);

	const [isLoadingInvite, setIsLoadingInvite] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);

	const extractInviteId = useCallback(
		(url: string) => {
			if (url.startsWith(origin)) {
				return url.replace(origin, '');
			}
			return null;
		},
		[origin]
	);

	const [openInviteModal, closeInviteModal] = useModal(() => {
		const inviteId = extractInviteId(content || '');
		if (!inviteId) return null;

		return (
			<InviteAcceptModal
				inviteId={inviteId}
				onClose={() => {
					closeInviteModal();
					setInviteError(null);
					setIsLoadingInvite(false);
				}}
				showModal={true}
			/>
		);
	}, [content]);

	const [openLoadingModal, closeLoadingModal] = useModal(() => {
		if (!isLoadingInvite && !inviteError) return null;

		return (
			<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
				<div className="bg-theme-setting-primary text-theme-primary rounded-md p-6 w-full max-w-[400px] flex flex-col items-center">
					{isLoadingInvite && (
						<>
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
							<p>Loading invite...</p>
						</>
					)}
					{inviteError && (
						<>
							<div className="text-red-500 text-center mb-4">
								<p className="font-semibold mb-2">Error</p>
								<p className="text-sm">{inviteError}</p>
							</div>
							<button
								onClick={() => {
									setInviteError(null);
									closeLoadingModal();
								}}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Close
							</button>
						</>
					)}
				</div>
			</div>
		);
	}, [isLoadingInvite, inviteError]);

	const onClickLink = useCallback(
		async (url: string) => {
			if (!isJumMessageEnabled || isTokenClickAble) {
				if (url.startsWith(origin)) {
					const inviteId = url.replace(origin, '');
					if (inviteId) {
						try {
							setIsLoadingInvite(true);
							setInviteError(null);
							openLoadingModal();

							dispatch(inviteActions.setIsClickInvite(true));
							const result = await dispatch(inviteActions.getLinkInvite({ inviteId })).unwrap();
							if (result) {
								closeLoadingModal();
								setIsLoadingInvite(false);
								openInviteModal();
							} else {
								setIsLoadingInvite(false);
								setInviteError('Failed to load invite. Please check the link and try again.');
							}
						} catch (error) {
							setIsLoadingInvite(false);
							setInviteError('Failed to load invite. Please check the link and try again.');
						}
					}
					return;
				}

				if (url.startsWith(originClan) || url.startsWith(originDirect)) {
					const urlInvite = new URL(url);
					dispatch(inviteActions.setIsClickInvite(true));

					navigate(urlInvite.pathname);

					const params = extractChannelParams(url);

					if (!params?.channelId || !params?.clanId || !params?.code) return;

					const store = getStore();
					const appChannel = selectAppChannelById(store.getState(), params.channelId);

					if (appChannel) {
						dispatch(
							channelsActions.setAppChannelsListShowOnPopUp({
								clanId: params.clanId,
								channelId: params.channelId,
								appChannel: {
									...appChannel,
									code: params.code as string,
									subpath: params.subpath as string
								}
							})
						);
					}
				} else {
					window.open(url, '_blank');
				}
			}
		},
		[
			isJumMessageEnabled,
			isTokenClickAble,
			origin,
			originClan,
			originDirect,
			dispatch,
			navigate,
			openInviteModal,
			openLoadingModal,
			closeLoadingModal
		]
	);

	const isLightMode = appearanceTheme === 'light';
	const posInNotification = !isJumMessageEnabled && !isTokenClickAble;
	const posInReply = isJumMessageEnabled && !isTokenClickAble;

	return (
		<div
			onContextMenu={handleContextMenu}
			className={` inline${!isLink ? ' bg-item-theme rounded-lg' : ''} ${isJumMessageEnabled ? 'whitespace-nowrap' : ''}`}
		>
			{isLink && content && isGoogleMapsLink(content) ? (
				<a
					href={content}
					onClick={(e) => {
						e.preventDefault();
						onClickLink(content);
					}}
					rel="noopener noreferrer"
					className="text-blue-500 cursor-pointer break-words underline tagLink"
					target="_blank"
				>
					<span>A location was shared with you. Tap to open the map</span>
				</a>
			) : (
				isLink && (
					<a
						href={content ?? '#'}
						onClick={(e) => {
							e.preventDefault();
							onClickLink(content ?? '');
						}}
						rel="noopener noreferrer"
						className="text-blue-500 cursor-pointer break-words underline tagLink"
						target="_blank"
					>
						{content}
					</a>
				)
			)}

			{!isReply && isLink && content && isYouTubeLink(content) && (
				<SocialEmbed url={content} platform="youtube" isSearchMessage={isSearchMessage} isInPinMsg={isInPinMsg} />
			)}
			{!isReply && isLink && content && isTikTokLink(content) && <SocialEmbed url={content} platform="tiktok" isInPinMsg={isInPinMsg} />}
			{!isLink && isBacktick && (typeOfBacktick === EBacktickType.SINGLE || typeOfBacktick === EBacktickType.CODE) ? (
				<SingleBacktick contentBacktick={content} isInPinMsg={isInPinMsg} isLightMode={isLightMode} posInNotification={posInNotification} />
			) : isBacktick && (typeOfBacktick === EBacktickType.TRIPLE || typeOfBacktick === EBacktickType.PRE) && !isLink ? (
				!posInReply ? (
					<TripleBackticks contentBacktick={content} isLightMode={isLightMode} isInPinMsg={isInPinMsg} />
				) : (
					<div className={`py-[4px] relative bg-item-theme `}>
						<pre
							className={`w-full pre p-0 font-sans ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}
						>
							<code className={`${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}>{content}</code>
						</pre>
					</div>
				)
			) : typeOfBacktick === EBacktickType.TRIPLE && posInReply && !isLink ? (
				<SingleBacktick contentBacktick={content} isLightMode={isLightMode} />
			) : null}
		</div>
	);
};
export default MarkdownContent;

type BacktickOpt = {
	contentBacktick?: any;
	isLightMode?: boolean;
	isInPinMsg?: boolean;
	isJumMessageEnabled?: boolean;
	posInNotification?: boolean;
};

const SingleBacktick: React.FC<BacktickOpt> = ({ contentBacktick, isLightMode: _isLightMode, isInPinMsg, posInNotification }) => {
	const posInPinOrNotification = isInPinMsg || posInNotification;

	return (
		<span className={`${!posInPinOrNotification ? 'inline text-theme-primary-active rounded-md p-0.5 m-0' : 'w-full'}`}>
			<code
				className={`w-full text-sm font-sans px-2 break-words ${
					posInPinOrNotification ? 'whitespace-normal' : 'whitespace-break-spaces'
				} ${posInPinOrNotification && ' text-theme-primary rounded-lg'}`}
			>
				{contentBacktick.trim() === '' ? contentBacktick : contentBacktick.trim()}
			</code>
		</span>
	);
};

const TripleBackticks: React.FC<BacktickOpt> = ({ contentBacktick, isLightMode: _isLightMode, isInPinMsg }) => {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setCopied(false);
		}, 5000);

		return () => clearTimeout(timer);
	}, [copied]);

	const handleCopyClick = () => {
		navigator.clipboard
			.writeText(contentBacktick)
			.then(() => setCopied(true))
			.catch((err) => console.error('Failed to copy text: ', err));
	};

	return (
		<div className="py-1 relative">
			<pre
				className={`pre whitespace-pre-wrap break-words break-all w-full p-3 bg-markdown-code border-theme-primary rounded-lg ${isInPinMsg ? `flex items-start` : ''}`}
				style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
			>
				<button className="absolute right-2 top-3" onClick={handleCopyClick}>
					{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
				</button>
				<code
					style={{ fontFamily: 'sans-serif', wordBreak: 'break-word', overflowWrap: 'break-word' }}
					className={`text-sm w-full whitespace-pre-wrap break-words break-all text-theme-message ${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}
				>
					{contentBacktick}
				</code>
			</pre>
		</div>
	);
};

type SocialPlatform = 'youtube' | 'tiktok';

const SocialEmbed: React.FC<{ url: string; platform: SocialPlatform; isSearchMessage?: boolean; isInPinMsg?: boolean }> = ({
	url,
	platform,
	isSearchMessage,
	isInPinMsg
}) => {
	const getEmbedData = () => {
		switch (platform) {
			case 'youtube':
				return {
					embedUrl: getYouTubeEmbedUrl(url),
					size: getYouTubeEmbedSize(url, isSearchMessage),
					borderColor: '#ff001f',
					allowAttributes: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
				};
			case 'tiktok':
				return {
					embedUrl: getTikTokEmbedUrl(url),
					size: getTikTokEmbedSize(),
					borderColor: '#ff0050',
					allowAttributes: 'fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture'
				};
			default:
				return null;
		}
	};

	const embedData = getEmbedData();

	if (!embedData || !embedData.embedUrl) return null;

	const { embedUrl, size, borderColor, allowAttributes } = embedData;
	const { width, height } = size;

	return (
		<div className={`flex ${isInPinMsg ? 'w-full' : ''}`}>
			<div className="border-l-4 rounded-l" style={{ borderColor }}></div>
			<div className={`p-4 bg-[#2b2d31] rounded ${isInPinMsg ? 'flex-1 min-w-0' : ''}`}>
				<iframe
					allow={allowAttributes}
					title={url}
					src={embedUrl}
					style={{ width, height, border: 'none', maxWidth: '100%' }}
					allowFullScreen
					referrerPolicy={'strict-origin-when-cross-origin'}
				></iframe>
			</div>
		</div>
	);
};
