import { channelsActions, getStore, inviteActions, selectAppChannelById, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EBacktickType, getYouTubeEmbedSize, getYouTubeEmbedUrl, isYouTubeLink } from '@mezon/utils';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

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
	return url?.startsWith('https://www.google.com/maps?') || url?.startsWith('https://maps.google.com/maps?') || url?.startsWith('https://www.google.com/maps?q=');
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
	const onClickLink = useCallback(
		(url: string) => {
			if (!isJumMessageEnabled || isTokenClickAble) {
				if (url.startsWith(origin) || url.startsWith(originClan) || url.startsWith(originDirect)) {
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
		[isJumMessageEnabled, isTokenClickAble]
	);

	const isLightMode = appearanceTheme === 'light';
	const posInNotification = !isJumMessageEnabled && !isTokenClickAble;
	const posInReply = isJumMessageEnabled && !isTokenClickAble;

	return (
		<div className={`inline dark:text-white text-colorTextLightMode ${isJumMessageEnabled ? 'whitespace-nowrap' : ''}`}>
			{isLink && content && isGoogleMapsLink(content) ? (
				<a
					onClick={() => onClickLink(content)}
					rel="noopener noreferrer"
					className="text-blue-500 cursor-pointer break-words underline tagLink"
					target="_blank"
				>
					<span>A location was shared with you. Tap to open the map</span>
				</a>
			) : isLink && (
				<a
					onClick={() => onClickLink(content ?? '')}
					rel="noopener noreferrer"
					className="text-blue-500 cursor-pointer break-words underline tagLink"
					target="_blank"
				>
					{content}
				</a>
			)}
			{!isReply && isLink && content && isYouTubeLink(content) && <YouTubeEmbed url={content} isSearchMessage={isSearchMessage} />}
			{!isLink && isBacktick && (typeOfBacktick === EBacktickType.SINGLE || typeOfBacktick === EBacktickType.CODE) ? (
				<SingleBacktick contentBacktick={content} isInPinMsg={isInPinMsg} isLightMode={isLightMode} posInNotification={posInNotification} />
			) : isBacktick && (typeOfBacktick === EBacktickType.TRIPLE || typeOfBacktick === EBacktickType.PRE) && !isLink ? (
				!posInReply ? (
					<TripleBackticks contentBacktick={content} isLightMode={isLightMode} isInPinMsg={isInPinMsg} />
				) : (
					<div className={`py-[4px] relative prose-backtick ${isLightMode ? 'triple-markdown-lightMode' : 'triple-markdown'} `}>
						<pre
							className={`w-full pre font-sans ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}
							style={{ padding: 0 }}
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
			className={
				!posInPinOrNotification
					? `${isLightMode ? 'prose-backtick single-markdown-light-mode ' : 'prose-backtick single-markdown'}`
					: 'w-full'
			}
			style={{ display: posInPinOrNotification ? '' : 'inline', padding: 2, margin: 0 }}
		>
			<code
				className={`w-full font-sans ${posInPinOrNotification ? 'whitespace-pre-wrap break-words' : ''
					} ${posInPinOrNotification && isLightMode ? 'pin-msg-modeLight' : posInPinOrNotification && !isLightMode ? 'pin-msg' : null}`}
				style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: posInPinOrNotification ? 'normal' : 'break-spaces' }}
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

	const formatContent = () => {
		if (!contentBacktick) return '';

		const content = contentBacktick.trim();
		const lines = content.split('\n');

		const formattedLines = lines.map((line: string) => {
			if (line.match(/^#{1,6}\s+.+$/)) {
				const headingLevel = line.indexOf(' ');
				const headingText = line.substring(headingLevel).trim();
				const fontSize = 24 - (headingLevel - 1) * 2;
				return `<div style="font-size: ${fontSize}px; font-weight: bold; margin: 8px 0; line-height: 1">${headingText}</div>`;
			}
			return line;
		});

		return formattedLines.join('\n');
	};

	const formattedContent = formatContent();

	const displayContent = formattedContent.includes('<div') ? (
		<div dangerouslySetInnerHTML={{ __html: formattedContent }} />
	) : contentBacktick.trim() === '' ? (
		contentBacktick
	) : (
		contentBacktick.trim()
	);

	return (
		<div className={`py-[4px] relative prose-backtick ${isLightMode ? 'triple-markdown-lightMode' : 'triple-markdown'} `}>
			<pre className={`pre p-2  ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}>
				<button className={`absolute right-1 top-1 ${isLightMode ? 'text-[#535353]' : 'text-[#E5E7EB]'} `} onClick={handleCopyClick}>
					{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
				</button>
				<code className={`w-full font-sans ${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}>{displayContent}</code>
			</pre>
		</div>
	);
};

const YouTubeEmbed: React.FC<{ url: string; isSearchMessage?: boolean }> = ({ url, isSearchMessage }) => {
	const embedUrl = getYouTubeEmbedUrl(url);
	const { width, height } = getYouTubeEmbedSize(url, isSearchMessage);

	return (
		<div className="flex">
			<div className="border-l-4 rounded-l border-[#ff001f]"></div>
			<div className="p-4 bg-[#2b2d31] rounded">
				<iframe
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					title={url}
					src={embedUrl}
					style={{ width, height, border: 'none' }}
					allowFullScreen
				></iframe>
			</div>
		</div>
	);
};
