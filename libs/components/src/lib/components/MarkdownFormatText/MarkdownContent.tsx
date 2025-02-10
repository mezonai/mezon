import { inviteActions, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EBacktickType, getYouTubeEmbedSize, getYouTubeEmbedUrl, isYouTubeLink } from '@mezon/utils';
import { useCallback, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
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
			{isLink && (
				// eslint-disable-next-line jsx-a11y/anchor-is-valid
				<a
					onClick={() => onClickLink(content ?? '')}
					rel="noopener noreferrer"
					style={{
						color: 'rgb(59,130,246)',
						cursor: 'pointer',
						wordBreak: 'break-word',
						textDecoration: 'underline'
					}}
					className="tagLink"
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
					<div className={`relative prose-backtick ${isLightMode ? 'triple-markdown-lightMode' : 'triple-markdown'} `}>
						<pre
							className={`pre ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}
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
				className={`${
					posInPinOrNotification ? 'whitespace-pre-wrap break-words' : ''
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

	return (
		<div className={`relative prose-backtick ${isLightMode ? 'triple-markdown-lightMode' : 'triple-markdown'} `}>
			<pre className={`pre p-2  ${isInPinMsg ? `flex items-start  ${isLightMode ? 'pin-msg-modeLight' : 'pin-msg'}` : ''}`}>
				<CopyToClipboard text={`${contentBacktick}`} onCopy={() => setCopied(true)}>
					<button className={`absolute right-1 top-1 ${isLightMode ? 'text-[#535353]' : 'text-[#E5E7EB]'} `}>
						{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
					</button>
				</CopyToClipboard>
				<code className={`${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}>
					{contentBacktick.trim() === '' ? contentBacktick : contentBacktick.trim()}
				</code>
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
