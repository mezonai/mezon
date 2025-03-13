// eslint-disable-next-line @nx/enforce-module-boundaries
import { selectAllChannels, useAppSelector } from '@mezon/store';
import { ChannelMembersEntity, EBacktickType, ETokenMessage, IExtendedMessage, TypeMessage, convertMarkdown } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useRef } from 'react';
import { ChannelHashtag, EmojiMarkup, MarkdownContent, MentionUser, PlainText, useMessageContextMenu } from '../../components';

interface RenderContentProps {
	content: IExtendedMessage;
	mode?: number;
	isOnlyContainEmoji?: boolean;
	isSearchMessage?: boolean;
	isHideLinkOneImage?: boolean;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	parentWidth?: number;
	isEditted: boolean;
	isInPinMsg?: boolean;
	code?: number;
	onCopy?: (event: React.ClipboardEvent<HTMLDivElement>, startIndex: number, endIndex: number) => void;
	messageId?: string;
	isReply?: boolean;
	onClickToMessage?: (event: React.MouseEvent<HTMLDivElement | HTMLSpanElement>) => void;
	className?: string;
}

export interface ElementToken {
	s?: number;
	e?: number;
	kindOf: ETokenMessage;
	user_id?: string;
	role_id?: string;
	channelid?: string;
	emojiid?: string;
	type?: EBacktickType;
	username?: string;
}

// Utility functions for text selection
const getSelectionIndex = (node: Node, offset: number, containerRef: HTMLDivElement | null) => {
	let currentNode = node;
	let totalOffset = offset;

	// Traverse up the DOM tree to calculate the index
	while (currentNode && currentNode !== containerRef) {
		// Traverse previous siblings to account for their text content
		while (currentNode.previousSibling) {
			currentNode = currentNode.previousSibling;
			totalOffset += currentNode.textContent?.length ?? 0;
		}
		currentNode = currentNode.parentNode as Node;
	}
	return totalOffset;
};

const getSelectionRange = (containerRef: HTMLDivElement | null) => {
	const selection = window.getSelection();

	// Ensure selection exists and is within the div
	if (selection && selection.rangeCount > 0 && containerRef) {
		const range = selection?.getRangeAt(0);
		const { startContainer, endContainer, startOffset, endOffset } = range;

		// Check if selection is within the target div
		if (containerRef.contains(startContainer) && containerRef.contains(endContainer)) {
			const startIndex = getSelectionIndex(startContainer, startOffset, containerRef);
			const endIndex = getSelectionIndex(endContainer, endOffset, containerRef);
			return { startIndex, endIndex };
		}
	}

	return { startIndex: 0, endIndex: 0 };
};

const RenderContent = ({
	content,
	mode,
	isSearchMessage,
	isJumMessageEnabled,
	parentWidth,
	isOnlyContainEmoji,
	isTokenClickAble,
	isHideLinkOneImage,
	isEditted,
	isInPinMsg,
	code,
	onCopy,
	messageId,
	isReply,
	onClickToMessage
}: RenderContentProps) => {
	mode = mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL;
	const { t, mentions = [], hg = [], ej = [], mk = [], lk = [], vk = [], lky = [] } = content;
	const hgm = Array.isArray(hg) ? hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })) : [];
	const ejm = Array.isArray(ej) ? ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })) : [];
	const mkm = Array.isArray(mk) ? mk.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) : [];
	const lkm = Array.isArray(lk) ? lk.map((item) => ({ ...item, kindOf: ETokenMessage.LINKS })) : [];
	const lkym = Array.isArray(lky) ? lky.map((item) => ({ ...item, kindOf: ETokenMessage.LINKYOUTUBE })) : [];
	const vkm = Array.isArray(vk) ? vk.map((item) => ({ ...item, kindOf: ETokenMessage.VOICE_LINKS })) : [];
	const elements: ElementToken[] = [
		...mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })),
		...hgm,
		...ejm,
		...mkm,
		...lkm,
		...lkym,
		...vkm
	].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	let lastindex = 0;
	const content2 = (() => {
		const formattedContent: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = t?.substring(s, e);

			if (lastindex < s) {
				formattedContent.push(
					<PlainText isSearchMessage={isSearchMessage} key={`plain-${lastindex}-${messageId}`} text={t?.slice(lastindex, s) ?? ''} />
				);
			}

			if (element.kindOf === ETokenMessage.HASHTAGS) {
				formattedContent.push(
					<ChannelHashtag
						key={`hashtag-${s}-${messageId}`}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						channelHastagId={`<#${element.channelid}>`}
					/>
				);
			} else if (
				(element.kindOf === ETokenMessage.MENTIONS && element.user_id) ||
				(element.kindOf === ETokenMessage.MENTIONS && element.username)
			) {
				formattedContent.push(
					<MentionContent
						key={`mentionUser-${s}-${messageId}`}
						element={element}
						contentInElement={contentInElement}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						mode={mode}
						index={index}
						s={s}
						mention={element.username}
					/>
				);
			} else if (element.kindOf === ETokenMessage.MENTIONS && element.role_id) {
				formattedContent.push(
					<RoleMentionContent
						key={`mentionRole-${s}-${messageId}`}
						element={element}
						contentInElement={contentInElement}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						mode={mode}
						index={index}
						s={s}
					/>
				);
			} else if (element.kindOf === ETokenMessage.EMOJIS) {
				formattedContent.push(
					<EmojiMarkup
						key={`emoji-${s}-${messageId}`}
						isOne={Number(t?.length) - 1 === Number(element?.e) - Number(element.s)}
						emojiSyntax={contentInElement ?? ''}
						onlyEmoji={isOnlyContainEmoji ?? false}
						emojiId={element.emojiid ?? ''}
					/>
				);
			} else if ((element.kindOf === ETokenMessage.LINKS || element.kindOf === ETokenMessage.LINKYOUTUBE) && !isHideLinkOneImage) {
				formattedContent.push(
					<MarkdownContent
						key={`link${s}-${messageId}`}
						isLink={true}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						content={contentInElement}
						isReply={isReply}
						isSearchMessage={isSearchMessage}
					/>
				);
			} else if (element.kindOf === ETokenMessage.VOICE_LINKS) {
				const meetingCode = contentInElement?.split('/').pop();
				formattedContent.push(
					<VoiceLinkContent
						key={`voiceLink-${s}-${messageId}`}
						meetingCode={meetingCode}
						isTokenClickAble={isTokenClickAble}
						isJumMessageEnabled={isJumMessageEnabled}
						index={index}
						s={s}
						contentInElement={contentInElement}
					/>
				);
			} else if (element.kindOf === ETokenMessage.MARKDOWNS) {
				if (element.type === EBacktickType.LINK || element.type === EBacktickType.LINKYOUTUBE) {
					formattedContent.push(
						<MarkdownContent
							key={`link${s}-${messageId}`}
							isLink={true}
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							content={contentInElement}
							isReply={isReply}
							isSearchMessage={isSearchMessage}
						/>
					);
				} else if (element.type === EBacktickType.BOLD) {
					formattedContent.push(<b key={`markdown-${s}-${messageId}`}> {contentInElement} </b>);
				} else if (element.type === EBacktickType.VOICE_LINK) {
					const meetingCode = contentInElement?.split('/').pop();
					formattedContent.push(
						<VoiceLinkContent
							key={`voiceLink-${s}-${messageId}`}
							meetingCode={meetingCode}
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							index={index}
							s={s}
							contentInElement={contentInElement}
						/>
					);
				} else {
					let content = contentInElement ?? '';

					if (isJumMessageEnabled) {
						content = content.replace(/\n/g, '');

						if (element.type === EBacktickType.TRIPLE) {
							content = content.replace(/```/g, '`');
						}
					} else {
						if (element.type !== EBacktickType.CODE && element.type !== EBacktickType.PRE) {
							content = convertMarkdown(content, element.type as EBacktickType);
						}
					}
					formattedContent.push(
						<MarkdownContent
							key={`markdown-${s}-${messageId}`}
							isBacktick={true}
							isTokenClickAble={isTokenClickAble}
							isJumMessageEnabled={isJumMessageEnabled}
							content={content}
							isInPinMsg={isInPinMsg}
							typeOfBacktick={element.type}
						/>
					);
				}
			}

			lastindex = e;
		});

		if (t && lastindex < t?.length) {
			formattedContent.push(
				<PlainText isSearchMessage={isSearchMessage} key={`plain-${lastindex}-end-${messageId}`} text={t.slice(lastindex)} />
			);
		}

		if (isEditted) {
			formattedContent.push(
				<p
					key={`edited-status-${lastindex}-end`}
					className="ml-[5px] inline opacity-50 text-[9px] self-center font-semibold dark:text-textDarkTheme text-textLightTheme w-[50px]"
				>
					(edited)
				</p>
			);
		}

		return formattedContent;
	})();

	const divRef = useRef<HTMLDivElement>(null);

	const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const { startIndex, endIndex } = getSelectionRange(divRef.current);

		const isSelectionHasMention = mentions.find((mention) => {
			return (mention.s || 0) >= startIndex && (mention.e as number) <= endIndex;
		});

		if (isSelectionHasMention) {
			if (onCopy) {
				onCopy(event, startIndex, endIndex);
			}
			return;
		}
	};

	return (
		<div
			ref={divRef}
			onClick={onClickToMessage}
			onCopy={handleCopy}
			style={
				isJumMessageEnabled
					? {
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis'
						}
					: {
							whiteSpace: 'break-spaces',
							overflowWrap: 'break-word'
						}
			}
			className={`w-full ${isJumMessageEnabled ? 'whitespace-pre-line gap-1 hover:text-[#060607] hover:dark:text-[#E6F3F5] text-[#4E5057] dark:text-[#B4BAC0] flex items-center  cursor-pointer' : 'text-[#4E5057] dark:text-[#E6E6E6]'}`}
		>
			{code === TypeMessage.MessageBuzz ? <span className="text-red-500">{content2}</span> : content2}
		</div>
	);
};
interface VoiceLinkContentProps {
	meetingCode: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	index: number;
	s: number;
	contentInElement: string | undefined;
}

export const VoiceLinkContent = ({ meetingCode, isTokenClickAble, isJumMessageEnabled, index, s, contentInElement }: VoiceLinkContentProps) => {
	const allChannelVoice = useAppSelector(selectAllChannels);
	const voiceChannelFound = allChannelVoice?.find((channel) => channel.meeting_code === meetingCode) || null;

	if (voiceChannelFound) {
		return (
			<ChannelHashtag
				isTokenClickAble={isTokenClickAble}
				isJumMessageEnabled={isJumMessageEnabled}
				channelHastagId={`<#${voiceChannelFound?.channel_id}>`}
			/>
		);
	}

	return <MarkdownContent isLink={true} isTokenClickAble={isTokenClickAble} isJumMessageEnabled={isJumMessageEnabled} content={contentInElement} />;
};

interface MentionContentProps {
	element: ElementToken;
	contentInElement: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	mode: number;
	index: number;
	s: number;
	mention?: string;
}

export const MentionContent = ({
	mention,
	element,
	contentInElement,
	isTokenClickAble,
	isJumMessageEnabled,
	mode,
	index,
	s
}: MentionContentProps) => {
	const { allUserIdsInChannel } = useMessageContextMenu();
	let isValidMention = false;

	if (allUserIdsInChannel && allUserIdsInChannel?.length > 0) {
		if (typeof allUserIdsInChannel?.[0] === 'string') {
			isValidMention = (allUserIdsInChannel as string[])?.includes(element.user_id ?? '') || contentInElement === '@here';
		} else {
			isValidMention =
				(allUserIdsInChannel as ChannelMembersEntity[])?.some((member) => member.id === element.user_id) || contentInElement === '@here';
		}
	}

	if (isValidMention || mention) {
		return (
			<MentionUser
				isTokenClickAble={isTokenClickAble}
				isJumMessageEnabled={isJumMessageEnabled}
				tagUserName={contentInElement ?? ''}
				tagUserId={element.user_id}
				mode={mode}
				mention={mention}
			/>
		);
	}

	return <PlainText isSearchMessage={false} text={contentInElement ?? ''} />;
};

interface RoleMentionContentProps {
	element: ElementToken;
	contentInElement: string | undefined;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
	mode: number;
	index: number;
	s: number;
}

export const RoleMentionContent = ({ element, contentInElement, isTokenClickAble, isJumMessageEnabled, mode, index, s }: RoleMentionContentProps) => {
	const { allRolesInClan } = useMessageContextMenu();

	const isValidRole = allRolesInClan.indexOf(element.role_id ?? '') !== -1;

	if (isValidRole) {
		return (
			<MentionUser
				isTokenClickAble={isTokenClickAble}
				isJumMessageEnabled={isJumMessageEnabled}
				tagRoleName={contentInElement ?? ''}
				tagRoleId={element.role_id}
				mode={mode}
			/>
		);
	}

	return <PlainText isSearchMessage={false} text={contentInElement ?? ''} />;
};

export const MessageLine = RenderContent;
