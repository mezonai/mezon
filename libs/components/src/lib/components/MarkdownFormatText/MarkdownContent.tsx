import { channelsActions, getStore, inviteActions, selectAppChannelById, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	EBacktickType,
	getFacebookEmbedSize,
	getFacebookEmbedUrl,
	getTikTokEmbedSize,
	getTikTokEmbedUrl,
	getYouTubeEmbedSize,
	getYouTubeEmbedUrl
} from '@mezon/utils';
import type { Element, Root } from 'hast';
import { common, createLowlight } from 'lowlight';
import { ChannelStreamMode } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMessageContextMenu } from '../ContextMenu';
import InviteAcceptModal from '../InviteAcceptModal';
import './highlight-github-dark.scss';

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

const extractLanguageFromCodeBlock = (content: string): { language: string | null; code: string } => {
	if (!content) return { language: null, code: content };

	const lines = content.split('\n');
	const firstLine = lines[0]?.trim();
	const languagePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

	if (firstLine && languagePattern.test(firstLine) && lines.length > 1) {
		return {
			language: firstLine.toLowerCase(),
			code: lines.slice(1).join('\n')
		};
	}

	return { language: null, code: content };
};

const lowlight = createLowlight(common);

function isLanguageRegistered(language: string): boolean {
	const lowLang = language.toLowerCase();
	return lowlight.registered(lowLang);
}

function highlightCode(text: string, language: string | null): Root | null {
	if (!text) {
		return null;
	}

	if (!language) {
		try {
			return lowlight.highlightAuto(text);
		} catch {
			return null;
		}
	}

	const lowLang = language.toLowerCase();

	if (isLanguageRegistered(lowLang)) {
		try {
			return lowlight.highlight(lowLang, text);
		} catch (error) {
			try {
				return lowlight.highlightAuto(text);
			} catch {
				return null;
			}
		}
	}

	try {
		return lowlight.highlightAuto(text);
	} catch {
		return null;
	}
}

type LinkContentProps = {
	content: string;
	messageId?: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
	onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
};

const LinkContent = memo<LinkContentProps>(({ content, messageId, isJumMessageEnabled, isTokenClickAble, onContextMenu }) => {
	const { t } = useTranslation('common');
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { showMessageContextMenu } = useMessageContextMenu();
	const origin = `${process.env.NX_CHAT_APP_REDIRECT_URI}/invite/`;
	const originClan = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/`;
	const originDirect = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/direct/message/`;

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
		const inviteId = extractInviteId(content);
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
	}, [content, extractInviteId]);

	const [openLoadingModal, closeLoadingModal] = useModal(() => {
		if (!isLoadingInvite && !inviteError) return null;

		return (
			<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
				<div className="bg-theme-setting-primary text-theme-primary rounded-md p-6 w-full max-w-[400px] flex flex-col items-center">
					{isLoadingInvite && (
						<>
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
							<p>{t('loadingInvite')}</p>
						</>
					)}
					{inviteError && (
						<>
							<div className="text-red-500 text-center mb-4">
								<p className="font-semibold mb-2">{t('canvas.error')}</p>
								<p className="text-sm">{inviteError}</p>
							</div>
							<button
								onClick={() => {
									setInviteError(null);
									closeLoadingModal();
								}}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								{t('close')}
							</button>
						</>
					)}
				</div>
			</div>
		);
	}, [isLoadingInvite, inviteError, t]);

	const handleClickLink = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			if (!isJumMessageEnabled || isTokenClickAble) {
				if (content.startsWith(origin)) {
					const inviteId = content.replace(origin, '');
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
								setInviteError(t('inviteLoadFailed'));
							}
						} catch {
							setIsLoadingInvite(false);
							setInviteError(t('inviteLoadFailed'));
						}
					}
					return;
				}

				if (content.startsWith(originClan) || content.startsWith(originDirect)) {
					const urlInvite = new URL(content);
					dispatch(inviteActions.setIsClickInvite(true));

					navigate(urlInvite.pathname);

					const params = extractChannelParams(content);

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
					window.open(content, '_blank');
				}
			}
		},
		[
			isJumMessageEnabled,
			isTokenClickAble,
			content,
			origin,
			originClan,
			originDirect,
			dispatch,
			navigate,
			openInviteModal,
			openLoadingModal,
			closeLoadingModal,
			t
		]
	);

	const handleContextMenu = useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();

			if (messageId) {
				showMessageContextMenu(event, messageId, ChannelStreamMode.STREAM_MODE_CHANNEL, false, {
					linkContent: content,
					isLinkContent: true
				});
			} else if (onContextMenu) {
				onContextMenu(event);
			}
		},
		[content, messageId, showMessageContextMenu, onContextMenu]
	);

	const isGoogleMaps = isGoogleMapsLink(content);

	return (
		<a
			href={content}
			onClick={handleClickLink}
			onContextMenu={handleContextMenu}
			rel="noopener noreferrer"
			className="text-blue-500 cursor-pointer break-words underline tagLink"
			target="_blank"
		>
			{isGoogleMaps ? <span>{t('locationSharedMessage')}</span> : content}
		</a>
	);
});

LinkContent.displayName = 'LinkContent';

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

	const isLightMode = appearanceTheme === 'light';
	const posInNotification = !isJumMessageEnabled && !isTokenClickAble;
	const posInReply = isJumMessageEnabled && !isTokenClickAble;
	const isSocialLink =
		!isReply &&
		isLink &&
		content &&
		(typeOfBacktick === EBacktickType.LINKTIKTOK ||
			typeOfBacktick === EBacktickType.LINKYOUTUBE ||
			typeOfBacktick === EBacktickType.LINKFACEBOOK);

	return (
		<div className={` inline${!isLink ? ' bg-item-theme rounded-lg' : ''} ${isJumMessageEnabled ? 'whitespace-nowrap' : ''}`}>
			{isLink && content && (
				<LinkContent
					content={content}
					messageId={messageId}
					isJumMessageEnabled={isJumMessageEnabled}
					isTokenClickAble={isTokenClickAble}
					onContextMenu={onContextMenu}
				/>
			)}

			{isSocialLink && <SocialEmbed url={content} platform={typeOfBacktick} isSearchMessage={isSearchMessage} isInPinMsg={isInPinMsg} />}
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

const treeToElements = (tree: Element | Root): React.ReactNode => {
	const children = tree.children
		.map((child) => {
			if (child.type === 'text') {
				return child.value;
			}
			if (child.type === 'element') {
				return treeToElements(child);
			}
			return null;
		})
		.filter((child) => child !== null);

	if (tree.type === 'root') {
		return children;
	}

	const name = tree.tagName;
	const classNameArray = tree.properties?.className as string[] | undefined;
	const className = classNameArray?.join(' ');

	return React.createElement(name, { className }, ...children);
};

const CodeHighlighter: React.FC<{ code: string; language: string | null; isInPinMsg?: boolean }> = ({ code, language, isInPinMsg }) => {
	const [highlightedElements, setHighlightedElements] = useState<React.ReactNode | null>(null);

	useEffect(() => {
		if (!code || !language) {
			setHighlightedElements(null);
			return;
		}

		try {
			const result = highlightCode(code, language);
			if (result) {
				const elements = treeToElements(result);
				setHighlightedElements(elements);
			} else {
				setHighlightedElements(null);
			}
		} catch (error) {
			console.warn('Failed to highlight code:', error);
			setHighlightedElements(null);
		}
	}, [code, language]);

	const codeClassName = `text-sm w-full whitespace-pre-wrap break-words break-all text-theme-message ${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`;

	if (highlightedElements && Array.isArray(highlightedElements) && highlightedElements.length > 0) {
		return (
			<code style={{ fontFamily: 'sans-serif', wordBreak: 'break-word', overflowWrap: 'break-word' }} className={codeClassName}>
				{highlightedElements}
			</code>
		);
	}

	return (
		<code style={{ fontFamily: 'sans-serif', wordBreak: 'break-word', overflowWrap: 'break-word' }} className={codeClassName}>
			{code}
		</code>
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

	const { language, code } = useMemo(() => extractLanguageFromCodeBlock(contentBacktick || ''), [contentBacktick]);

	return (
		<div className="py-1 relative">
			<pre
				className={`pre whitespace-pre-wrap break-words break-all w-full p-3 bg-markdown-code border-theme-primary rounded-lg ${isInPinMsg ? `flex items-start` : ''}`}
				style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
			>
				<button className="absolute right-2 top-3" onClick={handleCopyClick}>
					{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
				</button>
				<CodeHighlighter code={code} language={language} isInPinMsg={isInPinMsg} />
			</pre>
		</div>
	);
};

type SocialPlatform = EBacktickType.LINKYOUTUBE | EBacktickType.LINKTIKTOK | EBacktickType.LINKFACEBOOK;

const SocialEmbed: React.FC<{ url: string; platform: SocialPlatform; isSearchMessage?: boolean; isInPinMsg?: boolean }> = ({
	url,
	platform,
	isSearchMessage,
	isInPinMsg
}) => {
	const getEmbedData = () => {
		switch (platform) {
			case EBacktickType.LINKYOUTUBE:
				return {
					embedUrl: getYouTubeEmbedUrl(url),
					size: getYouTubeEmbedSize(url, isSearchMessage),
					borderColor: '#ff001f',
					allowAttributes: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
				};
			case EBacktickType.LINKTIKTOK:
				return {
					embedUrl: getTikTokEmbedUrl(url),
					size: getTikTokEmbedSize(),
					borderColor: '#ff0050',
					allowAttributes: 'fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture'
				};
			case EBacktickType.LINKFACEBOOK:
				return {
					embedUrl: getFacebookEmbedUrl(url),
					size: getFacebookEmbedSize(),
					borderColor: '#1877f2',
					allowAttributes: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
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
