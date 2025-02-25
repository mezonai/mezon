import { codeBlockRegex, codeBlockRegexGlobal, markdownDefaultUrlRegex, splitBlockCodeRegex, urlRegex } from '@mezon/mobile-components';
import { Attributes, Colors, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	RootState,
	selectAllChannelMembers,
	selectAllUserClans,
	selectChannelsEntities,
	selectHashtagDmEntities
} from '@mezon/store-mobile';
import { EBacktickType, ETokenMessage, IExtendedMessage, getSrcEmoji, getYouTubeEmbedUrl, isYouTubeLink } from '@mezon/utils';
import { TFunction } from 'i18next';
import React from 'react';
import { Dimensions, Linking, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import WebView from 'react-native-webview';
import { useStore } from 'react-redux';
import CustomIcon from '../../../../../../assets/CustomIcon';
import { ChannelHashtag } from '../MarkdownFormatText/ChannelHashtag';
import { EmojiMarkup } from '../MarkdownFormatText/EmojiMarkup';
import { MentionUser } from '../MarkdownFormatText/MentionUser';
import RenderCanvasItem from '../RenderCanvasItem';
interface ElementToken {
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

export default function openUrl(url, customCallback) {
	if (customCallback) {
		const result = customCallback(url);
		if (url && result && typeof result === 'boolean') {
			Linking.openURL(url);
		}
	} else if (url) {
		Linking.openURL(url);
	}
}

/**
 * Todo: move to helper
 */
export const EDITED_FLAG = 'edited-flag';
export const TYPE_MENTION = {
	userMention: '@',
	hashtag: '#',
	voiceChannel: '##voice',
	userRoleMention: '@role',
	thread: '#thread',
	stream: '#stream'
};
/**
 * custom style for markdown
 * react-native-markdown-display/src/lib/styles.js to see more
 */
export const markdownStyles = (colors: Attributes, isUnReadChannel?: boolean, isLastMessage?: boolean, isBuzzMessage?: boolean) => {
	const commonHeadingStyle = {
		color: isUnReadChannel ? colors.white : isBuzzMessage ? baseColor.buzzRed : colors.text,
		fontSize: isLastMessage ? size.small : size.medium
	};
	return StyleSheet.create({
		heading1: commonHeadingStyle,
		heading2: commonHeadingStyle,
		heading3: commonHeadingStyle,
		heading4: commonHeadingStyle,
		heading5: commonHeadingStyle,
		heading6: commonHeadingStyle,
		body: commonHeadingStyle,
		em: commonHeadingStyle,
		s: commonHeadingStyle,
		paragraph: {
			marginTop: 0,
			marginBottom: 0,
			paddingTop: 0,
			paddingBottom: 0
		},
		code_block: {
			color: colors.text,
			backgroundColor: colors.secondaryLight,
			paddingVertical: 1,
			borderColor: colors.secondary,
			borderRadius: 5,
			lineHeight: size.s_20
		},
		code_inline: {
			color: colors.text,
			backgroundColor: colors.secondaryLight,
			fontSize: size.small,
			lineHeight: size.s_20
		},
		fence: {
			color: colors.text,
			backgroundColor: colors.secondaryLight,
			paddingVertical: 5,
			borderColor: colors.borderHighlight,
			borderRadius: 5,
			fontSize: size.small,
			lineHeight: size.s_20
		},
		link: {
			color: colors.textLink,
			textDecorationLine: 'none',
			lineHeight: size.s_20
		},
		iconEmojiInMessage: {
			width: size.s_20,
			height: size.s_20
		},
		onlyIconEmojiInMessage: {
			width: size.s_40,
			height: size.s_40
		},
		emojiInMessageContain: {
			height: size.s_16,
			width: size.s_20
		},
		editedText: {
			fontSize: size.small,
			color: colors.textDisabled
		},
		mention: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.textLink,
			backgroundColor: colors.midnightBlue,
			lineHeight: size.s_20
		},
		blockquote: {
			backgroundColor: Colors.tertiaryWeight,
			borderColor: Colors.textGray
		},
		tr: {
			borderColor: colors.border
		},
		hr: {
			backgroundColor: colors.borderRadio,
			height: 2
		},
		voiceChannel: {
			backgroundColor: colors.midnightBlue,
			flexDirection: 'row',
			gap: size.s_2,
			alignItems: 'center',
			justifyContent: 'center'
		},
		textVoiceChannel: {
			fontSize: size.medium,
			color: colors.textLink,
			lineHeight: size.s_20
		},
		unknownChannel: { fontStyle: 'italic' },
		roleMention: {
			color: colors.textRoleLink,
			backgroundColor: colors.darkMossGreen
		},
		threadIcon: { marginBottom: size.s_2 },
		privateChannel: {
			color: colors.text,
			backgroundColor: colors.secondaryLight
		},
		viewYoutube: {
			flex: 1,
			padding: size.s_10,
			backgroundColor: colors.border,
			width: '90%',
			maxWidth: size.s_400,
			borderRadius: size.s_4,
			height: size.s_220
		},
		borderLeftView: {
			borderLeftWidth: size.s_4,
			borderLeftColor: 'red',
			borderRadius: size.s_4,
			height: size.s_220
		}
	});
};

const styleMessageReply = (colors: Attributes) =>
	StyleSheet.create({
		body: {
			color: colors.text,
			fontSize: size.small
		},
		textVoiceChannel: {
			fontSize: size.small,
			color: colors.textDisabled,
			lineHeight: size.s_20
		},
		mention: {
			fontSize: size.small,
			color: colors.textLink,
			backgroundColor: colors.midnightBlue,
			lineHeight: size.s_20
		}
	});

export type IMarkdownProps = {
	content: IExtendedMessage;
	isEdited?: boolean;
	translate?: TFunction;
	onMention?: (url: string) => void;
	onChannelMention?: (channel: ChannelsEntity) => void;
	isNumberOfLine?: boolean;
	isMessageReply?: boolean;
	mode?: number;
	isHiddenHashtag?: boolean;
	currentChannelId?: string;
	isOpenLink?: boolean;
	isOnlyContainEmoji?: boolean;
	isUnReadChannel?: boolean;
	isLastMessage?: boolean;
	isBuzzMessage?: boolean;
	onLongPress?: () => void;
};

function parseMarkdownLink(text: string) {
	const bracketMatch = text.match(/\[(.*?)\]/);
	const parenthesesMatch = text.match(/\((.*?)\)/);

	return {
		text: bracketMatch?.[1] || '',
		link: parenthesesMatch?.[1] || ''
	};
}

export function extractIds(url: string): { clanId: string | null; channelId: string | null; canvasId: string | null } {
	const clanIdMatch = url.match(/\/clans\/(\d+)\//);
	const channelIdMatch = url.match(/\/channels\/(\d+)\//);
	const canvasIdMatch = url.match(/\/canvas\/(\d+)/);

	return {
		clanId: clanIdMatch ? clanIdMatch[1] : null,
		channelId: channelIdMatch ? channelIdMatch[1] : null,
		canvasId: canvasIdMatch ? canvasIdMatch[1] : null
	};
}

/**
 * custom render if you need
 * react-native-markdown-display/src/lib/renderRules.js to see more
 */
export const renderRulesCustom = (isOnlyContainEmoji, onLongPress) => ({
	heading1: (node, children, parent, styles) => {
		return (
			<View key={node.key} style={styles._VIEW_SAFE_heading1}>
				{children}
			</View>
		);
	},
	code_inline: (node, children, parent, styles, inheritedStyles = {}) => (
		<Text key={node.key} style={[inheritedStyles, styles.code_inline, { bottom: -5 }]}>
			{node.content}
		</Text>
	),
	link: (node, children, parent, styles, onLinkPress) => {
		const payload = node?.attributes?.href;
		const content = node?.children[0]?.content;
		const widthScreen = Dimensions.get('screen').width;

		if (payload === EDITED_FLAG) {
			return (
				<Text key={node.key} style={[styles.editedText]}>
					{content}
				</Text>
			);
		}

		if (isYouTubeLink(payload)) {
			const videoUrl = getYouTubeEmbedUrl(payload);
			return (
				<View style={{ width: widthScreen - size.s_70, display: 'flex', gap: size.s_4 }}>
					<Text
						key={node.key}
						style={[styles.link]}
						onPress={() => openUrl(node.attributes.href, onLinkPress)}
						onLongPress={onLongPress && onLongPress}
					>
						{children}
					</Text>
					<View style={{ display: 'flex', flexDirection: 'row' }}>
						<View style={styles.borderLeftView} />
						<View style={styles.viewYoutube}>
							<WebView source={{ uri: videoUrl }} allowsFullscreenVideo={true} javaScriptEnabled={true} domStorageEnabled={true} />
						</View>
					</View>
				</View>
			);
		}

		if (payload.includes('canvas')) {
			const { clanId, channelId, canvasId } = extractIds(payload);
			if (!canvasId || !clanId || !channelId) return;
			return <RenderCanvasItem clanId={clanId} channelId={channelId} canvasId={canvasId} />;
		}

		if (content?.includes?.('unknown')) {
			return (
				<Text
					key={node.key}
					onPress={() => {
						Toast.show({
							type: 'error',
							text1: 'You don`t have access to this link.',
							text2: 'This link is to a clan or channel you don`t have access to.'
						});
						return;
					}}
				>
					<Text style={styles.privateChannel}>
						<Feather name="lock" size={15} /> private-channel
					</Text>
				</Text>
			);
		}

		if (content?.startsWith(':')) {
			return (
				<View key={`${content}`} style={!isOnlyContainEmoji && styles.emojiInMessageContain}>
					<FastImage
						source={{ uri: payload }}
						style={isOnlyContainEmoji ? styles.onlyIconEmojiInMessage : [styles.iconEmojiInMessage]}
						resizeMode={'contain'}
					/>
				</View>
			);
		}
		if (payload.startsWith(TYPE_MENTION.userMention) || payload.startsWith(TYPE_MENTION.hashtag)) {
			if (payload.includes(TYPE_MENTION.voiceChannel)) {
				return (
					<Text key={node.key} style={styles.voiceChannel} onPress={() => openUrl(node.attributes.href, onLinkPress)}>
						<Text>
							<CustomIcon name="volume-up" size={size.s_14} color={Colors.textLink} style={{ marginTop: 10 }} />{' '}
						</Text>
						<Text style={styles.textVoiceChannel}>{`${content}`}</Text>
					</Text>
				);
			}
			if (payload.includes(TYPE_MENTION.stream)) {
				return (
					<Text key={node.key} style={styles.voiceChannel} onPress={() => openUrl(`#${payload?.slice?.(7)}`, onLinkPress)}>
						<Text>
							<CustomIcon name="stream" size={size.s_14} color={Colors.textLink} />{' '}
						</Text>
						<Text style={styles.textVoiceChannel}>{`${content}`}</Text>
					</Text>
				);
			}
			if (payload.includes(TYPE_MENTION.thread)) {
				return (
					<Text key={node.key} style={styles.voiceChannel} onPress={() => openUrl(`#${payload?.slice?.(7)}`, onLinkPress)}>
						<Text>
							<CustomIcon name="thread-icon" size={size.s_16} color={Colors.textLink} />{' '}
						</Text>
						<Text style={styles.textVoiceChannel}>{`${content}`}</Text>
					</Text>
				);
			}
			return (
				<Text
					key={node.key}
					style={[styles.mention, payload?.startsWith(TYPE_MENTION.userRoleMention) && styles.roleMention]}
					onPress={() => openUrl(node.attributes.href, onLinkPress)}
				>
					{content}
				</Text>
			);
		}
		return (
			<Text
				key={node.key}
				style={[styles.link]}
				onPress={() => openUrl(node.attributes.href, onLinkPress)}
				onLongPress={onLongPress && onLongPress}
			>
				{children}
			</Text>
		);
	},
	image: (node, children, parent, styles, allowedImageHandlers, defaultImageHandler) => {
		const { src } = node.attributes;
		return (
			<View key={node.key} style={{ padding: 1 }}>
				<FastImage source={{ uri: src }} style={styles.iconEmojiInMessage} resizeMode={'contain'} />
			</View>
		);
	},
	fence: (node, children, parent, styles, inheritedStyles = {}) => {
		// we trim new lines off the end of code blocks because the parser sends an extra one.
		let { content } = node;
		if (typeof content === 'string' && content.endsWith('\n')) {
			content = content.slice(0, -1);
		}
		const sourceInfo = node?.sourceInfo;
		let displayContent = content;

		if (sourceInfo) {
			const textContent = sourceInfo.split?.(' ');
			if (textContent[textContent.length - 1].includes(EDITED_FLAG)) {
				textContent.pop();
			}
			displayContent = '```' + textContent.join(' ') + '\n' + content;
		}

		return (
			<Text key={node.key} style={[inheritedStyles, styles.fence]}>
				{displayContent}
			</Text>
		);
	}
});

/**
 * helper for markdown
 */
export const formatUrls = (text: string) => {
	const modifiedString = text.replace(splitBlockCodeRegex, (match) => `\0${match}\0`);
	const parts = modifiedString?.split?.('\0')?.filter?.(Boolean);

	return parts
		?.map((part) => {
			if (codeBlockRegex.test(part)) {
				return part;
			} else {
				if (urlRegex.test(part)) {
					if (markdownDefaultUrlRegex.test(part)) {
						return part;
					} else {
						return `[${part}](${part})`;
					}
				}
				return part;
			}
		})
		.join('');
};

export const formatBlockCode = (text: string, isMessageReply: boolean) => {
	const matchesUrls = text?.match?.(urlRegex);

	if (matchesUrls) {
		return formatUrls(text);
	}

	const addNewlinesToCodeBlock = (block) => {
		if (isMessageReply) {
			block = block.replace(/```|\n/g, '').trim();
			block = '`' + block + '`';
		} else {
			if (!block.startsWith('```\n')) {
				block = block.replace(/^```/, '```\n');
			}
			if (!block.endsWith('\n```')) {
				block = block.replace(/```$/, '\n```');
			}
		}
		return '\n' + block + '\n';
	};
	return text?.replace?.(codeBlockRegexGlobal, addNewlinesToCodeBlock);
};

export const RenderTextMarkdownContent = ({
	content,
	isEdited,
	translate,
	onMention,
	onChannelMention,
	isNumberOfLine,
	isMessageReply,
	mode,
	isHiddenHashtag,
	currentChannelId,
	isOpenLink = true,
	isOnlyContainEmoji,
	isUnReadChannel = false,
	isLastMessage = false,
	isBuzzMessage = false,
	onLongPress
}: IMarkdownProps) => {
	let customStyle = {};
	const { themeValue } = useTheme();
	const store = useStore();

	if (isMessageReply) {
		customStyle = { ...styleMessageReply(themeValue) };
	}
	const { t, mentions = [], hg = [], ej = [], mk = [], lk = [], vk = [] } = content || {};

	const hasMarkdown = mk.length > 0 || isEdited;
	if (!hasMarkdown) {
		const elements = [
			...hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })),
			...mentions.map((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })),
			...ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS }))
		].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

		let lastIndex = 0;
		const textParts: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			if (lastIndex < s) {
				textParts.push(
					<Text
						key={`text-${index}`}
						style={themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).body : {}}
					>
						{t?.slice(lastIndex, s)}
					</Text>
				);
			}

			switch (element?.kindOf) {
				case ETokenMessage.EMOJIS: {
					const srcEmoji = getSrcEmoji(element.emojiid);
					textParts.push(
						<FastImage
							key={`emoji-${index}`}
							source={{ uri: srcEmoji }}
							style={
								isOnlyContainEmoji ? markdownStyles(themeValue).onlyIconEmojiInMessage : markdownStyles(themeValue).iconEmojiInMessage
							}
							resizeMode={'contain'}
						/>
					);
					break;
				}
				case ETokenMessage.MENTIONS: {
					const usersClan = selectAllUserClans(store.getState() as RootState);
					const usersInChannel = selectAllChannelMembers(store.getState() as RootState, currentChannelId as string);
					const contentInElement = t?.substring(s, e);

					const mention = MentionUser({
						tagName: contentInElement,
						roleId: element.role_id || '',
						tagUserId: element.user_id,
						mode,
						usersClan,
						usersInChannel
					});

					const { text, link } = parseMarkdownLink(mention);

					if (link.startsWith(TYPE_MENTION.userRoleMention)) {
						textParts.push(
							<Text
								key={`mention-${index}`}
								style={[
									themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).mention : {},
									{
										color: themeValue.textRoleLink,
										backgroundColor: themeValue.darkMossGreen
									}
								]}
								onPress={() => onMention?.(link.replace('@role', '@'))}
							>
								{text}
							</Text>
						);
					} else {
						textParts.push(
							<Text
								key={`mention-${index}`}
								style={[themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).mention : {}]}
								onPress={() => onMention?.(link)}
							>
								{text}
							</Text>
						);
					}
					break;
				}
				case ETokenMessage.HASHTAGS: {
					const contentInElement = t?.substring(s, e);
					if (!isHiddenHashtag) {
						const channelsEntities = selectChannelsEntities(store.getState() as any);
						const hashtagDmEntities = selectHashtagDmEntities(store.getState() as any);

						const mention = ChannelHashtag({
							channelHashtagId: element.channelid,
							mode,
							currentChannelId,
							channelsEntities,
							hashtagDmEntities
						});

						const { text, link } = parseMarkdownLink(mention);

						textParts.push(
							<Text
								key={`hashtag-${index}`}
								style={[themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).link : {}]}
								onPress={() => {
									const urlFormat = link.replace(/##voice%22|#%22|%22|"|#/g, '');
									const dataChannel = urlFormat.split('_');
									const payloadChannel = {
										type: Number(dataChannel?.[0] || 1),
										id: dataChannel?.[1],
										channel_id: dataChannel?.[1],
										clan_id: dataChannel?.[2],
										status: Number(dataChannel?.[3] || 1),
										meeting_code: dataChannel?.[4] || '',
										category_id: dataChannel?.[5]
									};
									onChannelMention?.(payloadChannel);
								}}
							>
								{text}
							</Text>
						);
					} else {
						textParts.push(<Text key={`hashtag-${index}`}>{contentInElement}</Text>);
					}
					break;
				}
			}

			lastIndex = e;
		});

		if (lastIndex < (t?.length ?? 0)) {
			textParts.push(
				<Text key="text-end" style={[themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).body : {}]}>
					{t?.slice(lastIndex)}
				</Text>
			);
		}

		return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>{textParts}</View>;
	}

	const hgm = Array.isArray(hg) ? hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })) : [];
	const ejm = Array.isArray(ej) ? ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })) : [];
	const mkm = Array.isArray(mk) ? mk.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) : [];
	const lkm = Array.isArray(lk) ? lk.map((item) => ({ ...item, kindOf: ETokenMessage.LINKS })) : [];
	const vkm = Array.isArray(vk) ? vk.map((item) => ({ ...item, kindOf: ETokenMessage.VOICE_LINKS })) : [];
	const elements: ElementToken[] = [
		...(mentions?.map?.((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })) || []),
		...hgm,
		...ejm,
		...mkm,
		...lkm,
		...vkm
	].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	let lastIndex = 0;

	const contentRender = (() => {
		let formattedContent = '';

		elements.forEach((element) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = t?.substring?.(s, e);

			if (lastIndex < s) {
				formattedContent += t?.slice?.(lastIndex, s)?.toString() ?? '';
			}
			if (element.kindOf === ETokenMessage.HASHTAGS) {
				if (isHiddenHashtag) {
					formattedContent = contentInElement;
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					const channelsEntities = selectChannelsEntities(store.getState() as RootState);
					const hashtagDmEntities = selectHashtagDmEntities(store.getState() as RootState);
					formattedContent += ChannelHashtag({
						channelHashtagId: element.channelid,
						mode,
						currentChannelId,
						channelsEntities,
						hashtagDmEntities
					});
				}
			}
			if (element.kindOf === ETokenMessage.MENTIONS) {
				const usersClan = selectAllUserClans(store.getState() as RootState);
				const usersInChannel = selectAllChannelMembers(store.getState() as RootState, currentChannelId as string);
				formattedContent += MentionUser({
					tagName: contentInElement,
					roleId: element.role_id || '',
					tagUserId: element.user_id,
					mode,
					usersClan,
					usersInChannel
				});
			}
			if (element.kindOf === ETokenMessage.EMOJIS) {
				formattedContent += EmojiMarkup({ shortname: contentInElement, emojiid: element.emojiid, isMessageReply: isMessageReply });
			}

			if (element.kindOf === ETokenMessage.MARKDOWNS) {
				if (element.type === EBacktickType.LINK || element.type === EBacktickType.LINKYOUTUBE) {
					formattedContent += formatUrls(contentInElement);
				} else if (element.type === EBacktickType.BOLD) {
					formattedContent += `**${contentInElement}**` ?? '';
				} else if (element.type === EBacktickType.VOICE_LINK) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					const channelsEntities = selectChannelsEntities(store.getState() as RootState);
					const meetingCode = contentInElement?.split('/').pop();
					const allChannelVoice = Object.values(channelsEntities).flat();
					const voiceChannelFound = allChannelVoice?.find((channel) => channel.meeting_code === meetingCode) || null;
					if (!voiceChannelFound) {
						formattedContent += formatUrls(contentInElement);
					} else {
						formattedContent += ChannelHashtag({
							channelHashtagId: voiceChannelFound?.channel_id,
							channelsEntities
						});
					}
				} else {
					let content = contentInElement ?? '';
					if (element.type === EBacktickType.PRE) {
						content = '```' + content + '```';
					}
					if (element.type === EBacktickType.CODE) {
						content = '`' + content + '`';
					}
					formattedContent += formatBlockCode(content, isMessageReply);
				}
			}

			if (element.kindOf === ETokenMessage.VOICE_LINKS) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				const channelsEntities = selectChannelsEntities(store.getState() as RootState);
				const hashtagDmEntities = selectHashtagDmEntities(store.getState() as RootState);
				const meetingCode = contentInElement?.split('/').pop();
				const allChannelVoice = Object.values(channelsEntities).flat();
				const voiceChannelFound = allChannelVoice?.find((channel) => channel.meeting_code === meetingCode) || null;

				if (!voiceChannelFound) {
					formattedContent += formatUrls(contentInElement);
				} else {
					formattedContent += ChannelHashtag({ channelHashtagId: voiceChannelFound?.channel_id, channelsEntities, hashtagDmEntities });
				}
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
			lastIndex = e;
		});

		if (lastIndex < t?.length) {
			formattedContent += t?.slice?.(lastIndex)?.toString();
		}

		if (isEdited) {
			formattedContent += ` [${translate('edited')}](${EDITED_FLAG})`;
		}
		return formattedContent;
	})();

	const escapeDashes = (text: string): string => {
		return text.replace(/-{1,10}/g, (match) => `\\${match}`);
	};

	const renderMarkdown = () => (
		<Markdown
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			style={{
				...(themeValue ? (markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage) as StyleSheet.NamedStyles<any>) : {}),
				...customStyle
			}}
			rules={renderRulesCustom(isOnlyContainEmoji, onLongPress)}
			onLinkPress={(url) => {
				if (isOpenLink) {
					if (url.startsWith(TYPE_MENTION.userRoleMention)) {
						onMention && onMention(url.replace('@role', '@'));
						return false;
					}
					if (url.startsWith(TYPE_MENTION.userMention)) {
						onMention && onMention(url);
						return false;
					}
					if (url.startsWith(TYPE_MENTION.hashtag)) {
						const urlFormat = url.replace(/##voice%22|#%22|%22/g, '');
						const dataChannel = urlFormat.split('_');
						const payloadChannel = {
							type: Number(dataChannel?.[0] || 1),
							id: dataChannel?.[1],
							channel_id: dataChannel?.[1],
							clan_id: dataChannel?.[2],
							status: Number(dataChannel?.[3] || 1),
							meeting_code: dataChannel?.[4] || '',
							category_id: dataChannel?.[5]
						};
						onChannelMention && onChannelMention(payloadChannel);
						return false;
					}
					// Note: return false to prevent default
					return true;
				}
			}}
		>
			{escapeDashes(formatBlockCode(contentRender?.trim(), isMessageReply))}
		</Markdown>
	);

	return isNumberOfLine ? (
		<View
			style={{
				flex: 1,
				maxHeight: isMessageReply ? size.s_17 : size.s_20 * 10 - size.s_10,
				overflow: 'hidden'
			}}
		>
			{isMessageReply && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 1
					}}
				/>
			)}
			{renderMarkdown()}
		</View>
	) : (
		renderMarkdown()
	);
};
