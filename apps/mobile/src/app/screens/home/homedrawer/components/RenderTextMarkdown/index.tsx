import { ActionEmitEvent } from '@mezon/mobile-components';
import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { RootState } from '@mezon/store-mobile';
import {
	channelsActions,
	getStore,
	selectAllChannelMembers,
	selectAllUserClans,
	selectChannelByIdAndClanId,
	selectClanById
} from '@mezon/store-mobile';
import type { IExtendedMessage } from '@mezon/utils';
import { EBacktickType, ETokenMessage, getSrcEmoji } from '@mezon/utils';
import type { TFunction } from 'i18next';
import { useCallback, useMemo } from 'react';
import { DeviceEventEmitter, Linking, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import LinkOptionModal from '../LinkOptions/LinkOptionModal';
import { MentionUser } from '../MarkdownFormatText/MentionUser';
import RenderCanvasItem from '../RenderCanvasItem';
import { HashtagChannel } from './components/HashtagChannel';
import RenderYoutubeVideo from './components/RenderYoutubeVideo';
import { styles as componentStyles, getMessageReplyMaxHeight } from './index.styles';

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

export const checkUrl = async (url: string, clanId: string, channelId: string) => {
	const store = getStore();
	if (!clanId || !channelId) {
		await Linking.openURL(url);
		return;
	}
	const userClan = selectClanById(clanId)(store.getState() as RootState);
	if (userClan?.id) {
		const response = await store.dispatch(channelsActions.fetchChannels({ clanId: userClan?.id, noCache: true }));
		if (response?.meta?.requestStatus === 'fulfilled') {
			const targetChannel = response?.payload?.channels?.find((channel) => channel?.channel_id === channelId);
			if (targetChannel?.channel_id) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, targetChannel);
				return;
			}
		}
	}
	Linking.openURL(url);
};

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
			fontWeight: 'bold'
		},
		heading2: {
			color: commonHeadingStyle.color,
			fontSize: size.h2,
			fontWeight: 'bold'
		},
		heading3: {
			color: commonHeadingStyle.color,
			fontSize: size.h3,
			fontWeight: 'bold'
		},
		heading4: {
			color: commonHeadingStyle.color,
			fontSize: size.h4,
			fontWeight: 'bold'
		},
		heading5: {
			color: commonHeadingStyle.color,
			fontSize: size.h5,
			fontWeight: 'bold'
		},
		heading6: {
			color: commonHeadingStyle.color,
			fontSize: size.h6,
			fontWeight: 'bold'
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
			backgroundColor: colors.secondaryLight,
			fontWeight: '600',
			fontSize: size.medium
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
	isNumberOfLine,
	isMessageReply,
	mode,
	isHiddenHashtag,
	currentChannelId,
	isOpenLink = true,
	isOnlyContainEmoji,
	isUnReadChannel = false,
	isLastMessage = false,
	isBuzzMessage = false
}: IMarkdownProps) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();

	const { t, embed, mentions = [], hg = [], ej = [], mk = [] } = content || {};
	const embedNotificationMessage = embed?.[0]?.title;
	let lastIndex = 0;
	const textParts: React.ReactNode[] = [];
	const textTripleParts: React.ReactNode[] = [];
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
						<FastImage
							source={{ uri: srcEmoji }}
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
					roleId: !!element?.role_id && element?.role_id !== '0' ? element?.role_id : '',
					tagUserId: !!element?.user_id && element?.user_id !== '0' ? element?.user_id : '',
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
						onPress={() => {
							DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, isRoleMention ? link.replace('@role', '@') : link);
						}}
					>
						{text || contentInElement}
					</Text>
				);
				break;
			}

			case ETokenMessage.HASHTAGS: {
				if (!isHiddenHashtag) {
					textParts.push(
						<HashtagChannel
							key={`hashtag-${index}`}
							element={element}
							index={index}
							themeValue={themeValue}
							isUnReadChannel={isUnReadChannel}
							isLastMessage={isLastMessage}
							isBuzzMessage={isBuzzMessage}
						/>
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
						textTripleParts.push(
							<Text key={`code-triple-${index}`} style={themeValue ? markdownStyles(themeValue).code_block : {}}>
								{(contentInElement?.startsWith('```') && contentInElement?.endsWith('```')
									? contentInElement?.slice(3, -3)
									: contentInElement
								)?.replace(/^\n+|\n+$/g, '')}
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

							const channelFound = selectChannelByIdAndClanId(store.getState() as any, clanId, channelIdOnLink);

							if ((channelIdOnLink && channelFound?.id) || ((element?.channelId || element?.channelid) && element?.channelLabel)) {
								textParts.push(
									<HashtagChannel
										key={`hashtag-${index}`}
										element={element}
										index={index}
										themeValue={themeValue}
										isUnReadChannel={isUnReadChannel}
										isLastMessage={isLastMessage}
										isBuzzMessage={isBuzzMessage}
										channelIdOverride={channelIdOnLink}
										clanIdOverride={element?.clanId || clanId}
										channelEntityOverride={channelFound}
									/>
								);
								break;
							} else {
								textParts.push(
									<Text
										key={`hashtag-${index}`}
										style={themeValue ? markdownStyles(themeValue).link : {}}
										onPress={() => checkUrl(contentInElement, clanId, channelIdOnLink)}
									>
										{contentInElement}
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

					case EBacktickType.LINKYOUTUBE: {
						const videoId = extractYoutubeVideoId(contentInElement);
						if (videoId) {
							markdownBlackParts.push(
								<RenderYoutubeVideo
									videoKey={`youtube-linkyoutube-${videoId}-${index}`}
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
					}

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
			<Text key={`edited-${textParts}`} style={themeValue ? markdownStyles(themeValue).editedText : {}}>
				{` ${translate('edited')}`}
			</Text>
		);
	}

	const isCodeTripleOnly = useMemo(() => {
		return (
			textParts?.[0]?.key?.includes('code-triple') &&
			textParts?.length <= 2 &&
			(textParts.length === 1 || textParts[1]?.key?.includes('edited'))
		);
	}, [textParts]);

	if (isCodeTripleOnly) {
		const fenceStyle = themeValue
			? markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage, isTabletLandscape).fence
			: undefined;

		return <View style={fenceStyle}>{textTripleParts}</View>;
	}

	const localStyles = componentStyles(themeValue);
	const containerStyle = [
		localStyles.containerWrapper,
		isNumberOfLine && localStyles.containerWithLineLimit,
		isNumberOfLine && { maxHeight: getMessageReplyMaxHeight(isMessageReply) }
	];

	return (
		<View style={containerStyle}>
			{isMessageReply && <View style={localStyles.messageReplyOverlay} />}

			<View style={localStyles.textPartsContainer}>
				<View style={localStyles.textPartsColumn}>
					{textParts?.length > 0 && <Text key={`textParts${t}_${lastIndex}`}>{textParts}</Text>}
					{markdownBlackParts?.length > 0 &&
						markdownBlackParts.map((item, index) => <View key={`markdown-black-part-${index}`}>{item}</View>)}
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
