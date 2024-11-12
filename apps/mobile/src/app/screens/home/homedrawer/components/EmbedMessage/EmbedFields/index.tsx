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
			{!!groupedFields?.length &&
				groupedFields.map((field, index) => (
					<View key={`fieldGroup${index}`}>
						{!!field.length &&
							field.map((fieldItem, fieldIndex) => (
								<View key={`field${index}-${fieldIndex}`}>
									<Text style={styles.name}>{fieldItem.name}:</Text>
									<Text style={styles.value}>{fieldItem.value}</Text>
								</View>
							))}
					</View>
				))}
		</View>
	);
});
