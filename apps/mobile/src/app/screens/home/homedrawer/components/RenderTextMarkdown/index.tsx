import { ActionEmitEvent } from '@mezon/mobile-components';
import { Attributes, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	RootState,
	getStore,
	selectAllChannelMembers,
	selectAllUserClans,
	selectChannelsEntities,
	selectHashtagDmEntities
} from '@mezon/store-mobile';
import { EBacktickType, ETokenMessage, IExtendedMessage, getSrcEmoji, isYouTubeLink } from '@mezon/utils';
import { TFunction } from 'i18next';
import { ChannelType } from 'mezon-js';
import { useCallback } from 'react';
import { DeviceEventEmitter, Linking, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import CustomIcon from '../../../../../../../src/assets/CustomIcon';
import ImageNative from '../../../../../components/ImageNative';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import LinkOptionModal from '../LinkOptions/LinkOptionModal';
import { ChannelHashtag } from '../MarkdownFormatText/ChannelHashtag';
import { MentionUser } from '../MarkdownFormatText/MentionUser';
import RenderCanvasItem from '../RenderCanvasItem';
import RenderYoutubeVideo from './components/RenderYoutubeVideo';

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
	stream: '#stream',
	app: '#app'
};
/**
 * custom style for markdown
 * react-native-markdown-display/src/lib/styles.js to see more
 */

export const markdownStyles = (
	colors: Attributes,
	isUnReadChannel?: boolean,
	isLastMessage?: boolean,
	isBuzzMessage?: boolean,
	isTabletLandscape?: boolean
) => {
	const commonHeadingStyle = {
		color: isUnReadChannel ? colors.white : isBuzzMessage ? baseColor.buzzRed : colors.text,
		fontSize: isLastMessage ? size.small : size.medium
	};
	return StyleSheet.create({
		heading1: {
			color: commonHeadingStyle.color,
			fontSize: size.h1,
			fontWeight: '600'
		},
		heading2: {
			color: commonHeadingStyle.color,
			fontSize: size.h2,
			fontWeight: '600'
		},
		heading3: {
			color: commonHeadingStyle.color,
			fontSize: size.h3,
			fontWeight: '600'
		},
		heading4: {
			color: commonHeadingStyle.color,
			fontSize: size.h4,
			fontWeight: '600'
		},
		heading5: {
			color: commonHeadingStyle.color,
			fontSize: size.h5,
			fontWeight: '600'
		},
		heading6: {
			color: commonHeadingStyle.color,
			fontSize: size.h6,
			fontWeight: '600'
		},
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
			borderColor: colors.secondary,
			fontSize: size.h7,
			lineHeight: size.s_24,
			paddingHorizontal: size.s_10
		},
		code_inline: {
			color: colors.text,
			backgroundColor: colors.secondaryLight,
			fontSize: size.medium
		},
		fence: {
			color: colors.text,
			width: isTabletLandscape ? '70%' : '100%',
			backgroundColor: colors.secondaryLight,
			borderColor: colors.black,
			borderRadius: size.s_4,
			overflow: 'hidden',
			paddingVertical: size.s_10
		},
		link: {
			color: colors.textLink,
			fontSize: size.medium,
			textDecorationLine: 'none'
		},
		hashtag: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.textLink,
			backgroundColor: colors.midnightBlue
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
			color: colors.textDisabled,
			marginTop: size.s_2
		},
		mention: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.textLink,
			backgroundColor: colors.midnightBlue
		},
		blockquote: {
			backgroundColor: '#1E1E1E',
			borderColor: '#c7c7c7'
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
			color: colors.textLink
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
		boldText: {
			fontSize: size.medium,
			fontWeight: 'bold',
			color: colors.text
		},
		blockSpacing: {
			paddingVertical: size.s_4,
			width: '99.9%'
		}
	});
};

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

export function extractYoutubeVideoId(url: string) {
	const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[2].length === 11 ? match[2] : null;
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

const renderChannelIcon = (channelType: number, channelId: string, themeValue: Attributes) => {
	if (channelType === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
		return <CustomIcon name="voice" size={size.s_14} color={baseColor.link} style={{ marginTop: size.s_10 }} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_THREAD) {
		return <CustomIcon name="thread" size={size.s_14} color={baseColor.link} style={{ marginTop: size.s_10 }} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_STREAMING) {
		return <CustomIcon name="stream" size={size.s_14} color={baseColor.link} style={{ marginTop: size.s_10 }} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_APP) {
		return <CustomIcon name="app" size={size.s_14} color={baseColor.link} style={{ marginTop: size.s_10 }} />;
	}
	if (channelId === 'undefined') {
		return <Feather name="lock" size={size.s_14} color={themeValue.text} style={{ marginTop: size.s_10 }} />;
	}
	return null;
};

const renderTextPalainContain = (
	themeValue: Attributes,
	text: string,
	lastIndex: number,
	isUnReadChannel: boolean,
	isLastMessage: boolean,
	isBuzzMessage: boolean,
	isLastText = false
) => {
	const lines = text?.split('\n');
	const headingFormattedLines = [];
	let hasHeadings = false;

	if (!lines?.length) {
		return (
			<Text key={`text-end_${lastIndex}_${text}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
				{text}
			</Text>
		);
	}

	lines.forEach((line, idx) => {
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch && themeValue) {
			hasHeadings = true;
			const headingLevel = headingMatch[1].length;
			const headingText = headingMatch[2].trim();

			if (headingLevel) {
				headingFormattedLines.push(
					<Text
						key={`line-${idx}_${headingText}`}
						style={[
							themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage)?.[`heading${headingLevel}`] : {}
						]}
					>
						{headingText}
						{idx !== lines.length - 1 || !isLastText ? '\n' : ''}
					</Text>
				);
			} else {
				headingFormattedLines.push(
					<Text key={`line-${idx}_${line}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
						{line}
						{idx !== lines.length - 1 || !isLastText ? '\n' : ''}
					</Text>
				);
			}
		} else {
			headingFormattedLines.push(
				<Text key={`line-${idx}_${line}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
					{line}
					{idx !== lines.length - 1 || !isLastText ? '\n' : ''}
				</Text>
			);
		}
	});

	if (!hasHeadings) {
		return (
			<Text
				key={`text-end_${lastIndex}_${text}`}
				style={[themeValue ? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage).body : {}]}
			>
				{text}
			</Text>
		);
	} else {
		return <Text key={`heading-text-${lastIndex}`}>{headingFormattedLines}</Text>;
	}
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
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();

	const { t, embed, mentions = [], hg = [], ej = [], mk = [], lk = [] } = content || {};
	const embedNotificationMessage = embed?.[0]?.title;
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

	const handleLongPressLink = useCallback((link: string) => {
		const data = {
			heightFitContent: true,
			children: <LinkOptionModal visible={true} link={link} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	elements.forEach((element, index) => {
		const s = element.s ?? 0;
		const e = element.e ?? 0;
		const contentInElement = t?.substring(s, e);

		if (lastIndex < s && !!(textParts.length || t?.slice?.(lastIndex, s)?.trim())) {
			textParts.push(renderTextPalainContain(themeValue, t?.slice(lastIndex, s) ?? '', index, isUnReadChannel, isLastMessage, isBuzzMessage));
		}

		switch (element?.kindOf) {
			case ETokenMessage.EMOJIS: {
				const srcEmoji = getSrcEmoji(element?.emojiid);
				textParts.push(
					<View key={`emoji-${index}`} style={!isOnlyContainEmoji && markdownStyles(themeValue).emojiInMessageContain}>
						<ImageNative
							url={srcEmoji}
							style={
								isOnlyContainEmoji ? markdownStyles(themeValue).onlyIconEmojiInMessage : markdownStyles(themeValue).iconEmojiInMessage
							}
							resizeMode={'contain'}
						/>
					</View>
				);
				break;
			}

			case ETokenMessage.MENTIONS: {
				const usersClan = selectAllUserClans(store.getState() as RootState);
				const usersInChannel = selectAllChannelMembers(store.getState() as RootState, currentChannelId as string);
				const mention = MentionUser({
					tagName: contentInElement,
					roleId: element?.role_id || '',
					tagUserId: element?.user_id,
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
						{text || contentInElement}
					</Text>
				);
				break;
			}

			case ETokenMessage.HASHTAGS: {
				if (!isHiddenHashtag) {
					const channelsEntities = selectChannelsEntities(store.getState() as any);
					const hashtagDmEntities = selectHashtagDmEntities(store.getState() as any);
					const mention = ChannelHashtag({
						channelHashtagId: element?.channelid,
						mode,
						currentChannelId,
						channelsEntities,
						hashtagDmEntities
					});

					const { text, link } = parseMarkdownLink(mention);

					const urlFormat = link.replace(/##voice|#thread|#stream|#app|#%22|%22|"|#/g, '');
					const dataChannel = urlFormat.split('***');
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
							{renderChannelIcon(payloadChannel?.type, payloadChannel?.channel_id, themeValue)}
							{payloadChannel?.channel_id === 'undefined' ? 'private-channel' : text}
						</Text>
					);
				} else {
					textParts.push(<Text key={`hashtag-${index}`}>{contentInElement}</Text>);
				}
				break;
			}

			case ETokenMessage.MARKDOWNS: {
				switch (element?.type) {
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
					case EBacktickType.TRIPLE: {
						textParts.push(
							<Text key={`code-triple-${index}`}>
								{s !== 0 && '\n'}
								<View
									style={
										themeValue
											? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage, isTabletLandscape)
													.blockSpacing
											: {}
									}
								>
									<View
										key={`pre-${index}`}
										style={
											themeValue
												? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage, isTabletLandscape).fence
												: {}
										}
									>
										<Text style={themeValue ? markdownStyles(themeValue).code_block : {}}>
											{(contentInElement?.startsWith('```') && contentInElement?.endsWith('```')
												? contentInElement?.slice(3, -3)
												: contentInElement
											)?.replace(/^\n+|\n+$/g, '')}
										</Text>
									</View>
								</View>
							</Text>
						);
						break;
					}

					case EBacktickType.BOLD:
						textParts.push(
							<Text key={`bold-${index}`} style={themeValue ? markdownStyles(themeValue).boldText : {}}>
								{contentInElement}
							</Text>
						);
						break;
					case EBacktickType.VOICE_LINK:
					case EBacktickType.LINK: {
						if (isYouTubeLink(contentInElement || '')) {
							const videoId = extractYoutubeVideoId(contentInElement);
							markdownBlackParts.push(
								<RenderYoutubeVideo
									videoKey={`youtube-${index}`}
									videoId={videoId}
									contentInElement={contentInElement}
									onPress={() => openUrl(contentInElement, null)}
									onLongPress={() => handleLongPressLink?.(contentInElement)}
									linkStyle={themeValue ? markdownStyles(themeValue).link : {}}
								/>
							);
							break;
						}
						const { clanId, channelId, canvasId } = extractIds(contentInElement);

						const basePath = '/chat/clans/';
						const contentHasChannelLink =
							contentInElement?.includes(basePath) &&
							contentInElement?.includes('/channels/') &&
							!contentInElement?.includes('/canvas/');
						const contentHasCanvasLink = contentInElement.includes('canvas') && canvasId && clanId && channelId;

						if (contentHasChannelLink) {
							const pathSegments = contentInElement?.split('/') as string[];
							const channelIdOnLink = pathSegments?.[pathSegments?.indexOf('channels') + 1];

							const channelsEntities = selectChannelsEntities(store.getState() as any);
							const hashtagDmEntities = selectHashtagDmEntities(store.getState() as any);
							const channelFound = channelsEntities[channelIdOnLink];

							if (channelIdOnLink && channelFound?.id) {
								const mention = ChannelHashtag({
									channelHashtagId: channelIdOnLink,
									currentChannelId,
									mode,
									hashtagDmEntities,
									channelsEntities
								});

								const { text, link } = parseMarkdownLink(mention);

								const urlFormat = link.replace(/##voice|#thread|#stream|#app|#%22|%22|"|#/g, '');
								const dataChannel = urlFormat.split('***');
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
										{renderChannelIcon(payloadChannel?.type, payloadChannel?.channel_id, themeValue)}
										{payloadChannel?.channel_id === 'undefined' ? 'private-channel' : text}
									</Text>
								);
								break;
							}
						}

						if (contentHasCanvasLink) {
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
									onLongPress={() => handleLongPressLink?.(contentInElement)}
								>
									{contentInElement}
								</Text>
							);
						}
						break;
					}

					case EBacktickType.LINKYOUTUBE:
						if (isYouTubeLink(contentInElement)) {
							const videoId = extractYoutubeVideoId(contentInElement);

							markdownBlackParts.push(
								<RenderYoutubeVideo
									videoKey={`youtube-${index}`}
									videoId={videoId}
									contentInElement={contentInElement}
									onPress={() => openUrl(contentInElement, null)}
									onLongPress={() => handleLongPressLink?.(contentInElement)}
									linkStyle={themeValue ? markdownStyles(themeValue).link : {}}
								/>
							);
						} else {
							textParts.push(
								<Text
									key={`link-${index}`}
									style={themeValue ? markdownStyles(themeValue).link : {}}
									onPress={() => openUrl(contentInElement, null)}
									onLongPress={() => handleLongPressLink?.(contentInElement)}
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
			renderTextPalainContain(
				themeValue,
				t?.slice(lastIndex)?.replace(!textParts?.length ? /^\n|\n$/g : '', ''),
				lastIndex,
				isUnReadChannel,
				isLastMessage,
				isBuzzMessage,
				true
			)
		);
	} else if (embedNotificationMessage) {
		textParts.push(renderTextPalainContain(themeValue, embedNotificationMessage, lastIndex, isUnReadChannel, isLastMessage, isBuzzMessage, true));
	}

	if (isEdited && textParts?.length > 0 && !markdownBlackParts?.length) {
		textParts.push(
			<Text key={`edited-${textParts}`} style={(themeValue ? markdownStyles(themeValue).editedText : {})}>
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

			<View style={{ flexDirection: 'row', gap: size.s_6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
				<View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
					{textParts?.length > 0 && <Text key={`textParts${t}_${lastIndex}`}>{textParts}</Text>}
					{markdownBlackParts?.length > 0 && markdownBlackParts.map((item) => item)}
				</View>
				{isEdited && markdownBlackParts?.length > 0 && (
					<View>
						<Text key={`edited-${textParts}`} style={themeValue ? markdownStyles(themeValue).editedText : {}}>
							{translate('edited')}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
};
