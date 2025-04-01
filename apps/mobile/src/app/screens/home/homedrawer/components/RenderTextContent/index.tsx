import { mentionRegex, mentionRegexSplit } from '@mezon/mobile-components';
import { Colors } from '@mezon/mobile-ui';
import React from 'react';
import { Text } from 'react-native';
import { highlightEmojiRegex } from '../../../../../utils/helpers';
import { styles } from './RenderTextContent.styles';

export const renderTextContent = (text: string) => {
	const renderChannelMention = (channelLabel: string) => {
		return (
			<Text>
				<Text style={styles.contentMessageMention}>{channelLabel.slice(1, -1) || ''}</Text>
			</Text>
		);
	};

	const renderUserMention = (id: string) => {
		return (
			<Text>
				<Text style={styles.contentMessageMention}>{`@${id?.slice(2, -1)}`}</Text>
			</Text>
		);
	};

	const renderMention = (id: string) => {
		return id.startsWith('@') ? <Text>{renderUserMention(id)}</Text> : id.startsWith('<#') ? renderChannelMention(id) : <Text />;
	};

	const renderTextWithMention = (text: string, matchesMention: RegExpMatchArray) => {
		const parts = text
			?.split(mentionRegexSplit)
			?.filter(Boolean)
			?.filter((i) => i !== '@' && i !== '#');
		return parts?.map?.((part, index) => (
			<Text key={`${index}-${part}-renderTextWithMention'}`}>
				{!part ? (
					<Text />
				) : matchesMention.includes(part) ? (
					renderMention(part)
				) : highlightEmojiRegex.test(part) ? (
					<Text style={styles.contentMessageBox}>{renderTextWithEmoji(part)}</Text>
				) : (
					<Text>{part}</Text>
				)}
			</Text>
		));
	};

	const renderTextWithEmoji = (text: string) => {
		const parts = text?.split?.(highlightEmojiRegex);
		return parts?.map?.((part, index) => {
			const isHighlighted = highlightEmojiRegex.test(part);
			return (
				<Text key={`${index}-${part}-renderTextWithMention`} style={isHighlighted && { fontWeight: 'bold', color: Colors.bgViolet }}>
					{part}
				</Text>
			);
		});
	};

	const matchesMention = text?.match(mentionRegex);
	if (matchesMention?.length) {
		return <Text>{renderTextWithMention(text, matchesMention)}</Text>;
	} else {
		return <Text>{renderTextWithEmoji(text)}</Text>;
	}
};
