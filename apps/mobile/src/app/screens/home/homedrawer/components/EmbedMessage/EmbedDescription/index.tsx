import { useTheme } from '@mezon/mobile-ui';
import { IExtendedMessage, processText } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { RenderTextMarkdownContent } from '../../RenderTextMarkdown';
import { style } from './styles';

interface EmbedDescriptionProps {
	description: string;
}

const cleanupString = (text: string) => {
	const cleaned = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '')
		.join('\n');

	return cleaned;
};

export const EmbedDescription = memo(({ description }: EmbedDescriptionProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const cleanedString = cleanupString(description);
	const { links, markdowns, voiceRooms } = processText(cleanedString);

	const markdownContent = useMemo(() => {
		const markdown: IExtendedMessage = {
			t: cleanedString,
			hg: [],
			ej: [],
			lk: links || [],
			mk: markdowns || [],
			vk: voiceRooms || [],
			mentions: []
		};

		return markdown;
	}, [description, links, markdowns, voiceRooms]);

	return (
		<View style={styles.container}>
			<RenderTextMarkdownContent content={markdownContent} />
		</View>
	);
});
