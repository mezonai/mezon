import { useTheme } from '@mezon/mobile-ui';
import { ETokenMessage, IExtendedMessage, getSrcEmoji } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Text } from 'react-native';
import FastImage from 'react-native-fast-image';
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

const contentTitle = (t, styles, styleText) => {
	const [title] = (t ?? '').split(' | ');
	return <Text style={[styles.message, styleText && styleText]}>{title}</Text>;
};

const pattern = /^Tokens sent:.*\|.*/;
const checkTokenMessage = (text: string) => {
	return pattern.test(text);
};

const EmojiMarkup = ({ shortname, emojiid }: IEmojiMarkup) => {
	const srcEmoji = getSrcEmoji(emojiid);

	if (!srcEmoji) {
		return shortname;
	}
	return `${EMOJI_KEY}${srcEmoji}${EMOJI_KEY}`;
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

		while (endIndex !== -1) {
			const textPart = formatEmojiInText.slice(startIndex, endIndex);
			if (textPart) {
				parts.push(
					<Text key={`${endIndex}_${textPart}`} style={[styles.message, props?.styleText && props?.styleText]}>
						{textPart}
					</Text>
				);
			}

			startIndex = endIndex + EMOJI_KEY.length;
			endIndex = formatEmojiInText.indexOf(EMOJI_KEY, startIndex);

			if (endIndex !== -1) {
				const emojiUrl = formatEmojiInText.slice(startIndex, endIndex);
				parts.push(<FastImage style={styles.emoji} source={{ uri: emojiUrl }} resizeMode="contain" />);
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
	};

	return (
		<Text style={[styles.dmMessageContainer, props?.styleText && props?.styleText]} numberOfLines={1}>
			{checkTokenMessage(t) ? contentTitle(t, styles, props?.styleText) : convertTextToEmoji()}
		</Text>
	);
};
