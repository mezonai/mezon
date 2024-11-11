import { useTheme } from '@mezon/mobile-ui';
import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { style } from './styles';

interface Field {
	name: string;
	value: string;
	inline?: boolean;
}

interface EmbedFieldsProps {
	fields: Field[];
}

export const EmbedFields = memo(({ fields }: EmbedFieldsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const groupedFields = useMemo(() => {
		return fields.reduce<Field[][]>((acc, field) => {
			if (!field.inline) {
				acc.push([field]);
			} else {
				const lastRow = acc[acc.length - 1];
				if (lastRow && lastRow[0].inline && lastRow.length < 3) {
					lastRow.push(field);
				} else {
					acc.push([field]);
				}
			}
			return acc;
		}, []);
	}, [fields]);
	return (
		<View>
			{groupedFields.map((field, index) => (
				<View>
					{field.map((f, i) => (
						<View key={`${index}-${i}`}>
							<Text style={styles.name}>{f.name}:</Text>
							<Text style={styles.value}>{f.value}</Text>
						</View>
					))}
				</View>
			))}
		</View>
	);
});
