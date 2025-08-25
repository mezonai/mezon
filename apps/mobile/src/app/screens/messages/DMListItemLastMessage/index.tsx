import { useTheme } from '@mezon/mobile-ui';
import { ETokenMessage, IExtendedMessage, getSrcEmoji } from '@mezon/utils';
import React, { useCallback, useMemo, useState } from 'react';
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
	const headingMatchRegex = /^(#{1,6})\s+(.+)$/;
	return headingMatchRegex?.test(text?.trim());
};

const EMOJI_KEY = '[ICON_EMOJI]';
const findLastVisibleIndex = (lineText: string, formatted: string) => {
	let iFormatted = 0;
	let iLine = 0;
	let lastIndex = 0;

	while (iLine < lineText?.length && iFormatted < formatted?.length) {
		if (formatted?.startsWith(EMOJI_KEY, iFormatted)) {
			const end = formatted?.indexOf(EMOJI_KEY, iFormatted + EMOJI_KEY.length);
			if (end === -1) break;
			iFormatted = end + EMOJI_KEY.length;
			iLine++;
			lastIndex = iFormatted;
		} else {
			if (lineText?.[iLine] === formatted?.[iFormatted]) {
				lastIndex = iFormatted + 1;
				iFormatted++;
				iLine++;
			} else {
				break;
			}
		}
	}

	return lastIndex;
};

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

	const [isEllipsized, setIsEllipsized] = useState(false);
	const [lastTextIndex, setLastTextIndex] = useState<number | null>(null);

	const handleTextLayout = useCallback(
		(e: any) => {
			try {
				const lines = e?.nativeEvent?.lines;
				if (!lines?.length) return;

				const visibleLineText = lines?.[0]?.text;
				const idx = findLastVisibleIndex(visibleLineText, formatEmojiInText);

				setLastTextIndex((prev) => (prev !== idx ? idx : prev));

				const shouldEllipsize = idx < formatEmojiInText?.length;

				setIsEllipsized((prev) => (prev !== shouldEllipsize ? shouldEllipsize : prev));
			} catch (error) {
				console.error('Error handling text layout:', error);
				setIsEllipsized(false);
			}
		},
		[formatEmojiInText]
	);

	const convertTextToEmoji = useCallback(() => {
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
						<Text key="heading" style={[styles.message, props?.styleText && props?.styleText, { fontWeight: 'bold' }]}>
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
					<Text key={`${endIndex}_${textPart}`} style={[styles.message, props?.styleText && props?.styleText]}>
						{startIndex === 0 ? textPart?.trimStart() : textPart}
					</Text>
				);
			}

			startIndex = endIndex + EMOJI_KEY.length;
			endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);

			if (endIndex !== -1) {
				const emojiUrl = formatEmojiInText.slice(startIndex, endIndex);
				if (!isEllipsized || endIndex < lastTextIndex) {
					parts.push(<ImageNative key={`${emojiUrl}_dm_item_last_${endIndex}`} style={styles.emoji} url={emojiUrl} resizeMode="contain" />);
				}
				startIndex = endIndex + EMOJI_KEY.length;
				endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);
			}
		}

		if (startIndex < formatEmojiInText.length) {
			parts.push(
				<Text key={`${endIndex}_${formatEmojiInText.slice(startIndex)}`} style={[styles.message, props?.styleText && props?.styleText]}>
					{formatEmojiInText.slice(startIndex)}
				</Text>
			);
		}

		return parts;
	}, [formatEmojiInText, lastTextIndex, isEllipsized, props?.styleText, styles.emoji, styles.message]);

	return (
		<View style={styles.container}>
			<Text numberOfLines={1} ellipsizeMode="tail" onTextLayout={handleTextLayout} style={[styles.message, props?.styleText]}>
				{convertTextToEmoji()}
			</Text>
		</View>
	);
};
