import { useTheme } from '@mezon/mobile-ui';
import { ETokenMessage, IExtendedMessage, getSrcEmoji } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import ImageNative from '../../../components/ImageNative';
import { style } from './styles';

interface ElementToken {
	s?: number;
	e?: number;
	kindOf: ETokenMessage;
	emojiid?: string;
}

type IEmojiMarkup = {
	shortname: string;
	emojiid: string;
};

const EmojiMarkup = ({ shortname, emojiid }: IEmojiMarkup) => {
	const srcEmoji = getSrcEmoji(emojiid);

	if (!srcEmoji) {
		return shortname;
	}
	return `${EMOJI_KEY}${srcEmoji}${EMOJI_KEY}`;
};

const isHeadingText = (text?: string) => {
	if (!text) return false;
	const firstLine = text?.trimStart().split('\n')?.[0];
	const headingMatchRegex = /^(#{1,6})\s+(.+)$/;
	return headingMatchRegex?.test(firstLine?.trim());
};

const EMOJI_KEY = '[ICON_EMOJI]';
export const DmListItemLastMessage = (props: { content: IExtendedMessage; styleText?: any }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t, ej = [] } = props.content || {};
	const emojis = Array.isArray(ej) ? ej.map((item) => ({ ...item, kindOf: ETokenMessage.EMOJIS })) : [];
	const elements: ElementToken[] = [...emojis].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	const formatEmojiInText = useMemo(() => {
		let formattedContent = '';
		let lastIndex = 0;

		elements.forEach(({ s = 0, e = 0, kindOf, emojiid }) => {
			const contentInElement = t?.substring?.(s, e);
			if (lastIndex < s) {
				formattedContent += t?.slice?.(lastIndex, s)?.toString() ?? '';
			}
			if (kindOf === ETokenMessage.EMOJIS) {
				formattedContent += EmojiMarkup({ shortname: contentInElement, emojiid: emojiid });
			}
			lastIndex = e;
		});
		if (lastIndex < t?.length) {
			formattedContent += t?.slice?.(lastIndex)?.toString();
		}

		return formattedContent;
	}, [elements, t]);

	const convertTextToEmoji = () => {
		const parts = [];
		let startIndex = 0;
		let endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);

		if (isHeadingText(formatEmojiInText)) {
			const headingMatch = formatEmojiInText?.match(/^#{1,6}\s*([^\n[\]@#:\u{1F600}-\u{1F64F}]+)/u);
			if (headingMatch) {
				let headingContent = headingMatch[1];
				const forbiddenRegex = /```[^`]+?```|(?<!`)`[^`\n]+?`(?!`)/g;
				const firstForbiddenMatch = forbiddenRegex.exec(headingContent);
				if (firstForbiddenMatch) {
					headingContent = headingContent?.slice(0, firstForbiddenMatch?.index);
				}

				if (headingContent.length > 0) {
					parts.push(
						<Text key="heading" numberOfLines={1} style={[styles.message, props?.styleText && props?.styleText, { fontWeight: 'bold' }]}>
							{headingContent}
						</Text>
					);
				}
			}
			return parts;
		}

		while (endIndex !== -1) {
			const textPart = formatEmojiInText.slice(startIndex, endIndex);
			if (textPart) {
				parts.push(
					<Text numberOfLines={1} key={`${endIndex}_${textPart}`} style={[styles.message, props?.styleText && props?.styleText]}>
						{startIndex === 0 ? textPart?.trimStart() : textPart}
					</Text>
				);
			}

			startIndex = endIndex + EMOJI_KEY.length;
			endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);

			if (endIndex !== -1) {
				const emojiUrl = formatEmojiInText.slice(startIndex, endIndex);
				parts.push(
					<View style={styles.emojiWrap} key={`${emojiUrl}_dm_item_last_${endIndex}`}>
						<ImageNative style={styles.emoji} url={emojiUrl} resizeMode="contain" />
					</View>
				);
				startIndex = endIndex + EMOJI_KEY.length;
				endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);
			}
		}

		if (startIndex < formatEmojiInText.length) {
			parts.push(
				<Text
					numberOfLines={1}
					key={`${endIndex}_${formatEmojiInText.slice(startIndex)}`}
					style={[styles.message, props?.styleText && props?.styleText, { flex: 1 }]}
				>
					{formatEmojiInText.slice(startIndex)}
				</Text>
			);
		}

		return parts;
	};

	return <View style={styles.container}>{convertTextToEmoji()}</View>;
};
