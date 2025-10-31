import { useTheme, type Attributes } from '@mezon/mobile-ui';
import type { TFunction } from 'i18next';
import { Text, View } from 'react-native';
import { styles as rawTextStyles } from './RenderRawText.styles';
import { markdownStyles } from './index';

export type IRawTextProps = {
	text: string;
	isEdited?: boolean;
	isNumberOfLine?: boolean;
	isBuzzMessage?: boolean;
	translate?: TFunction;
};

export const RenderRawText = ({ text, isEdited, translate, isNumberOfLine, isBuzzMessage }: IRawTextProps) => {
	const { themeValue } = useTheme();
	const styles = rawTextStyles(themeValue);

	const renderTextPlainContain = (themeValue: Attributes, text: string, isBuzzMessage: boolean) => {
		const lines = text?.split('\n');
		const headingFormattedLines = [];
		let hasHeadings = false;

		if (!lines?.length) {
			return (
				<Text key={`text-end_${text}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
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
							style={[themeValue ? markdownStyles(themeValue, false, false, isBuzzMessage)?.[`heading${headingLevel}`] : {}]}
						>
							{headingText}
							{idx !== lines.length - 1 ? '\n' : ''}
						</Text>
					);
				} else {
					headingFormattedLines.push(
						<Text key={`line-${idx}_${line}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
							{line}
							{idx !== lines.length - 1 ? '\n' : ''}
						</Text>
					);
				}
			} else {
				headingFormattedLines.push(
					<Text key={`line-${idx}_${line}`} style={[themeValue ? markdownStyles(themeValue).body : {}]}>
						{line}
						{idx !== lines.length - 1 ? '\n' : ''}
					</Text>
				);
			}
		});

		if (!hasHeadings) {
			return (
				<Text key={`text-end_${text}`} style={[themeValue ? markdownStyles(themeValue, false, false, isBuzzMessage).body : {}]}>
					{text}
				</Text>
			);
		} else {
			return <Text key={`heading-text`}>{headingFormattedLines}</Text>;
		}
	};
	return (
		<View style={isNumberOfLine ? styles.numberLineContainer : undefined}>
			<View style={styles.textPartsContainer}>
				{renderTextPlainContain(themeValue, text, isBuzzMessage)}
				{isEdited && (
					<Text key={`edited-${text}`} style={styles.editedText}>
						{translate('edited')}
					</Text>
				)}
			</View>
		</View>
	);
};
