import { channelsActions, getStore, inviteActions, selectAppChannelById, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EBacktickType, getYouTubeEmbedSize, getYouTubeEmbedUrl, isYouTubeLink } from '@mezon/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
	isSearchMessage
}) => {
	const appearanceTheme = useSelector(selectTheme);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const origin = process.env.NX_CHAT_APP_REDIRECT_URI + '/invite/';
	const originClan = process.env.NX_CHAT_APP_REDIRECT_URI + '/chat/clans/';
	const originDirect = process.env.NX_CHAT_APP_REDIRECT_URI + '/chat/direct/message/';

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
		<div className={` inline${!isLink ? ' bg-item-theme rounded-lg' : ''} ${isJumMessageEnabled ? 'whitespace-nowrap' : ''}`}>
			{isLink && content && isGoogleMapsLink(content) ? (
				<a
					onClick={() => onClickLink(content)}
					rel="noopener noreferrer"
					className="text-blue-500 cursor-pointer break-words underline tagLink"
					target="_blank"
				>
					<span>A location was shared with you. Tap to open the map</span>
				</a>
			) : (
				isLink && (
					<a
						onClick={() => onClickLink(content ?? '')}
						rel="noopener noreferrer"
						className="text-blue-500 cursor-pointer break-words underline tagLink"
						target="_blank"
					>
						{content}
					</a>
				)
			)}
			{!isReply && isLink && content && isYouTubeLink(content) && <YouTubeEmbed url={content} isSearchMessage={isSearchMessage} isInPinMsg={isInPinMsg} />}
			{!isLink && isBacktick && (typeOfBacktick === EBacktickType.SINGLE || typeOfBacktick === EBacktickType.CODE) ? (
				<SingleBacktick contentBacktick={content} isInPinMsg={isInPinMsg} isLightMode={isLightMode} posInNotification={posInNotification} />
			) : isBacktick && (typeOfBacktick === EBacktickType.TRIPLE || typeOfBacktick === EBacktickType.PRE) && !isLink ? (
				!posInReply ? (
					<TripleBackticks contentBacktick={content} isLightMode={isLightMode} isInPinMsg={isInPinMsg} />
				) : (
					<div className={`py-[4px] relative bg-item-theme `}>
						<pre
							className={`w-full pre ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}
							style={{ padding: 0, fontFamily: 'sans-serif' }}
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

const SingleBacktick: React.FC<BacktickOpt> = ({ contentBacktick, isLightMode, isInPinMsg, posInNotification }) => {
	const posInPinOrNotification = isInPinMsg || posInNotification;
	return (
		<span
			className={!posInPinOrNotification ? 'text-theme-primary-active rounded-md  p-2' : 'w-full'}
			style={{ display: posInPinOrNotification ? '' : 'inline', padding: 2, margin: 0 }}
		>
			<code
				className={`w-full text-sm font-sans px-2 ${
					posInPinOrNotification ? 'whitespace-pre-wrap break-words' : ''
					} ${posInPinOrNotification && ' text-theme-primary rounded-lg'}`}
				style={{
					fontFamily: 'sans-serif',
					wordWrap: 'break-word',
					overflowWrap: 'break-word',
					whiteSpace: posInPinOrNotification ? 'normal' : 'break-spaces'
				}}
			>
				{contentBacktick.trim() === '' ? contentBacktick : contentBacktick.trim()}
			</code>
		</span>
	);
};

const TripleBackticks: React.FC<BacktickOpt> = ({ contentBacktick, isLightMode, isInPinMsg }) => {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setCopied(false);
		}, 5000);

		return () => clearTimeout(timer);
	}, [copied]);

	// TODO: continue test
	const handleCopyClick = () => {
		navigator.clipboard
			.writeText(contentBacktick)
			.then(() => setCopied(true))
			.catch((err) => console.error('Failed to copy text: ', err));
	};

	return (
		<div className={`py-[4px] relative`}>
			<pre
				className={`pre whitespace-pre-wrap break-words break-all w-full p-3 bg-markdown-code border-theme-primary rounded-lg ${isInPinMsg ? `flex items-start` : ''}`}
				style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
			>
				<button className={`absolute right-2 top-3`} onClick={handleCopyClick}>
					{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
				</button>
				<code
					style={{ fontFamily: 'sans-serif', wordBreak: 'break-all', overflowWrap: 'break-word' }}
					className={`text-sm w-full whitespace-pre-wrap break-words break-all text-theme-message ${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}
				>
					{contentBacktick}
				</code>
			</pre>
		</div>
	);
};

const YouTubeEmbed: React.FC<{ url: string; isSearchMessage?: boolean; isInPinMsg?: boolean }> = ({ url, isSearchMessage, isInPinMsg }) => {
	const embedUrl = getYouTubeEmbedUrl(url);
	const { width, height } = getYouTubeEmbedSize(url, isSearchMessage);

	return (
		<div className={`flex ${isInPinMsg ? 'w-full' : ''}`}>
			<div className="border-l-4 rounded-l border-[#ff001f]"></div>
			<div className={`p-4 bg-[#2b2d31] rounded ${isInPinMsg ? 'flex-1 min-w-0' : ''}`}>
				<iframe
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					title={url}
					src={embedUrl}
					style={{ width, height, border: 'none', maxWidth: '100%' }}
					allowFullScreen
				></iframe>
			</div>
		</div>
	);
};
