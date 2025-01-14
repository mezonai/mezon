import { useAppNavigation } from '@mezon/core';
import { inviteActions, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EBacktickType } from '@mezon/utils';
import { memo, useCallback, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';

type MarkdownContentOpt = {
	content?: string;
	isJumMessageEnabled: boolean;
	isTokenClickAble: boolean;
	isInPinMsg?: boolean;
	isLink?: boolean;
	isBacktick?: boolean;
	typeOfBacktick?: EBacktickType;
};

export const MarkdownContent: React.FC<MarkdownContentOpt> = ({
	content,
	isJumMessageEnabled,
	isTokenClickAble,
	isInPinMsg,
	isLink,
	isBacktick,
	typeOfBacktick
}) => {
	const appearanceTheme = useSelector(selectTheme);
	const { navigate } = useAppNavigation();
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
			{!isLink && isBacktick && typeOfBacktick === EBacktickType.SINGLE ? (
				<SingleBacktick contentBacktick={content} isInPinMsg={isInPinMsg} isLightMode={isLightMode} posInNotification={posInNotification} />
			) : isBacktick && typeOfBacktick === EBacktickType.TRIPLE && !posInReply && !isLink ? (
				<TripleBackticks contentBacktick={content} isLightMode={isLightMode} isInPinMsg={isInPinMsg} />
			) : typeOfBacktick === EBacktickType.TRIPLE && posInReply && !isLink ? (
				<SingleBacktick contentBacktick={content} isLightMode={isLightMode} />
			) : null}
		</div>
	);
};
export default memo(MarkdownContent);

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
				{contentBacktick?.trim()}
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
				<CopyToClipboard text={`${contentBacktick?.trim()}`} onCopy={() => setCopied(true)}>
					<button className={`absolute right-1 top-1 ${isLightMode ? 'text-[#535353]' : 'text-[#E5E7EB]'} `}>
						{copied ? <Icons.PasteIcon /> : <Icons.CopyIcon />}
					</button>
				</CopyToClipboard>
				<code className={`${isInPinMsg ? 'whitespace-pre-wrap block break-words w-full' : ''}`}>{contentBacktick?.trim()}</code>
			</pre>
		</div>
	);
};
