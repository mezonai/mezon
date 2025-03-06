import { Attributes, Colors, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	RootState,
	getStore,
	selectAllChannelMembers,
	selectAllUserClans,
	selectChannelsEntities,
	selectHashtagDmEntities
} from '@mezon/store-mobile';
import { EBacktickType, ETokenMessage, IExtendedMessage, getSrcEmoji, getYouTubeEmbedUrl, isYouTubeLink } from '@mezon/utils';
import { TFunction } from 'i18next';
import { ChannelType } from 'mezon-js';
import React from 'react';
import { Dimensions, Image, Linking, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import WebView from 'react-native-webview';
import CustomIcon from '../../../../../../../src/assets/CustomIcon';
import { ChannelHashtag } from '../MarkdownFormatText/ChannelHashtag';
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
const screenWidth = Dimensions.get('screen').width;
const codeBlockMaxWidth = screenWidth - size.s_70;

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
			paddingVertical: size.s_10,
			borderColor: colors.secondary,
			fontSize: size.medium,
			lineHeight: size.s_22,
			paddingHorizontal: size.s_10
		},
		code_inline: {
			color: colors.text,
			backgroundColor: colors.secondaryLight,
			fontSize: size.medium,
			lineHeight: size.s_20
		},
		fence: {
			color: colors.text,
			width: codeBlockMaxWidth,
			backgroundColor: colors.secondaryLight,
			marginTop: size.s_6,
			borderColor: colors.black,
			borderRadius: size.s_4,
			overflow: 'hidden'
		},
		link: {
			color: colors.textLink,
			textDecorationLine: 'none',
			lineHeight: size.s_20
		},
		hashtag: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.textLink,
			backgroundColor: colors.midnightBlue,
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
		},
		boldText: {
			fontSize: size.medium,
			fontWeight: 'bold',
			lineHeight: size.s_20,
			color: colors.white
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
	const { themeValue } = useTheme();

	const { t, mentions = [], hg = [], ej = [], mk = [] } = content || {};
	let lastIndex = 0;
	const textParts: React.ReactNode[] = [];
	const markdownBlackParts: React.ReactNode[] = [];

	const elements = [
		...hg.map((item) => ({ ...item, kindOf: ETokenMessage.HASHTAGS })),
		...(mentions?.map?.((item) => ({ ...item, kindOf: ETokenMessage.MENTIONS })) || []),
		...ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })),
		...(mk?.map?.((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) || [])
	].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	const store = elements?.length > 0 ? getStore() : null;

	elements.forEach((element, index) => {
		const s = element.s ?? 0;
		const e = element.e ?? 0;
		const contentInElement = t?.substring(s, e);

		if (lastIndex < s) {
			textParts.push(
				<Text key={`text-${index}`} style={themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).body : {}}>
					{t?.slice(lastIndex, s)}
				</Text>
			);
		}

		switch (element?.kindOf) {
			case ETokenMessage.EMOJIS: {
				const srcEmoji = getSrcEmoji(element.emojiid);
				textParts.push(
					<Image
						key={`emoji-${index}`}
						source={{ uri: srcEmoji }}
						style={isOnlyContainEmoji ? markdownStyles(themeValue).onlyIconEmojiInMessage : markdownStyles(themeValue).iconEmojiInMessage}
						resizeMode={'contain'}
					/>
				);
				break;
			}

			case ETokenMessage.MENTIONS: {
				const usersClan = selectAllUserClans(store.getState() as RootState);
				const usersInChannel = selectAllChannelMembers(store.getState() as RootState, currentChannelId as string);
				const mention = MentionUser({
					tagName: contentInElement,
					roleId: element.role_id || '',
					tagUserId: element.user_id,
					mode,
					usersClan,
					usersInChannel
				});

				const { text, link } = parseMarkdownLink(mention);
				const isRoleMention = link.startsWith(TYPE_MENTION.userRoleMention);

				textParts.push(
					<Text
						key={`mention-${index}`}
						style={[
							themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).mention : {},
							isRoleMention && {
								color: themeValue.textRoleLink,
								backgroundColor: themeValue.darkMossGreen
							}
						]}
						onPress={() => onMention?.(isRoleMention ? link.replace('@role', '@') : link)}
					>
						{text}
					</Text>
				);
				break;
			}

			case ETokenMessage.HASHTAGS: {
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

					const urlFormat = link.replace(/##voice|#thread|#stream|#%22|%22|"|#/g, '');
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

					textParts.push(
						<Text
							key={`hashtag-${index}`}
							style={[
								themeValue && payloadChannel?.channel_id === 'undefined'
									? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).privateChannel
									: themeValue && !!payloadChannel?.channel_id
										? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).hashtag
										: {}
							]}
							onPress={() => {
								if (!payloadChannel?.channel_id) return;
								onChannelMention?.(payloadChannel);
							}}
						>
							{payloadChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE ||
							payloadChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE ? (
								<CustomIcon name="volume-up" size={size.s_14} color={Colors.textLink} style={{ marginTop: 10 }} />
							) : payloadChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? (
								<CustomIcon name="thread-icon" size={size.s_14} color={Colors.textLink} style={{ marginTop: 10 }} />
							) : payloadChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ? (
								<CustomIcon name="stream" size={size.s_14} color={Colors.textLink} style={{ marginTop: 10 }} />
							) : payloadChannel?.channel_id === 'undefined' ? (
								<Feather name="lock" size={size.s_14} color={themeValue.text} style={{ marginTop: 10 }} />
							) : null}
							{payloadChannel?.channel_id === 'undefined' ? 'private-channel' : text}
						</Text>
					);
				} else {
					textParts.push(<Text key={`hashtag-${index}`}>{contentInElement}</Text>);
				}
				break;
			}

			case ETokenMessage.MARKDOWNS: {
				switch (element.type) {
					case EBacktickType.SINGLE:
					case EBacktickType.CODE:
						textParts.push(
							<Text key={`code-${index}`} style={themeValue ? markdownStyles(themeValue).code_inline : {}}>
								{' '}
								{contentInElement?.startsWith('`') && contentInElement?.endsWith('`')
									? contentInElement?.slice(1, -1)
									: contentInElement}{' '}
							</Text>
						);
						break;

					case EBacktickType.PRE:
						markdownBlackParts.push(
							<View key={`pre-${index}`} style={themeValue ? markdownStyles(themeValue).fence : {}}>
								<Text style={themeValue ? markdownStyles(themeValue).code_block : {}}>{contentInElement}</Text>
							</View>
						);
						break;

					case EBacktickType.TRIPLE:
						markdownBlackParts.push(
							<View key={`pre-${index}`} style={themeValue ? markdownStyles(themeValue).fence : {}}>
								<Text style={themeValue ? markdownStyles(themeValue).code_block : {}}>
									{contentInElement?.startsWith('```') && contentInElement?.endsWith('```')
										? contentInElement?.slice(3, -3)
										: contentInElement}
								</Text>
							</View>
						);
						break;

					case EBacktickType.BOLD:
						textParts.push(
							<Text key={`bold-${index}`} style={themeValue ? markdownStyles(themeValue).boldText : {}}>
								{contentInElement}
							</Text>
						);
						break;
					case EBacktickType.VOICE_LINK:
					case EBacktickType.LINK: {
						const { clanId, channelId, canvasId } = extractIds(contentInElement);

						if (contentInElement.includes('canvas') && canvasId && clanId && channelId) {
							textParts.push(<RenderCanvasItem key={`canvas-${index}`} clanId={clanId} channelId={channelId} canvasId={canvasId} />);
						} else if (contentInElement.includes('unknown')) {
							textParts.push(
								<Text key={`private-${index}`}>
									<Text style={themeValue ? markdownStyles(themeValue).privateChannel : {}}>private-channel</Text>
								</Text>
							);
						} else if (isOpenLink) {
							textParts.push(
								<Text
									key={`link-${index}`}
									style={themeValue ? markdownStyles(themeValue).link : {}}
									onPress={() => openUrl(contentInElement, null)}
									onLongPress={onLongPress}
								>
									{contentInElement}
								</Text>
							);
						}
						break;
					}

					case EBacktickType.LINKYOUTUBE:
						if (isYouTubeLink(contentInElement)) {
							const videoUrl = getYouTubeEmbedUrl(contentInElement);
							const widthScreen = Dimensions.get('screen').width;
							textParts.push(
								<View key={`youtube-${index}`} style={{ width: widthScreen - size.s_70, display: 'flex', gap: size.s_4 }}>
									<Text
										style={[themeValue ? markdownStyles(themeValue).link : {}]}
										onPress={() => openUrl(contentInElement, null)}
										onLongPress={onLongPress}
									>
										{contentInElement}
									</Text>
									<View style={{ display: 'flex', flexDirection: 'row' }}>
										<View style={themeValue ? markdownStyles(themeValue).borderLeftView : {}} />
										<View style={themeValue ? markdownStyles(themeValue).viewYoutube : {}}>
											<WebView
												source={{ uri: videoUrl }}
												allowsFullscreenVideo={true}
												javaScriptEnabled={true}
												domStorageEnabled={true}
											/>
										</View>
									</View>
								</View>
							);
						} else {
							textParts.push(
								<Text
									key={`link-${index}`}
									style={themeValue ? markdownStyles(themeValue).link : {}}
									onPress={() => openUrl(contentInElement, null)}
									onLongPress={onLongPress}
								>
									{contentInElement}
								</Text>
							);
						}
						break;

					default:
						textParts.push(<Text key={`text-${index}`}>{contentInElement}</Text>);
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

	if (isEdited) {
		textParts.push(
			<Text key="edited" style={themeValue ? markdownStyles(themeValue).editedText : {}}>
				{` ${translate('edited')}`}
			</Text>
		);
	}

	return (
		<View
			style={{
				flexDirection: 'row',
				flexWrap: 'wrap',
				alignItems: 'center',
				...(isNumberOfLine && {
					flex: 1,
					maxHeight: isMessageReply ? size.s_17 : size.s_20 * 10 - size.s_10,
					overflow: 'hidden'
				})
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
			<Text>{textParts}</Text>
			{markdownBlackParts && markdownBlackParts?.length > 0 && markdownBlackParts.map((item) => item)}
		</View>
	);
};
