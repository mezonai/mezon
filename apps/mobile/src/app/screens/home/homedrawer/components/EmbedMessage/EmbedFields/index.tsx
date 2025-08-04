import { useTheme } from '@mezon/mobile-ui';
import { EMessageComponentType, IFieldEmbed } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { EmbedAnimation } from './EmbedAnimation';
import { EmbedDatePicker } from './EmbedDatePicker';
import { EmbedInput } from './EmbedInput';
import { EmbedRadioGroup } from './EmbedRadioGroup';
import { EmbedSelect } from './EmbedSelect';
import { style } from './styles';

interface EmbedFieldsProps {
	message_id: string;
	fields: IFieldEmbed[];
}

export const EmbedFields = memo(({ message_id, fields }: EmbedFieldsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const groupedFields = useMemo(() => {
		return fields.reduce<IFieldEmbed[][]>((acc, field) => {
			if (!field?.inline) {
				acc.push([field]);
			} else {
				const lastRow = acc[acc.length - 1];
				if (lastRow && lastRow?.[0]?.inline && lastRow?.length < 3) {
					lastRow.push(field);
				} else {
					acc.push([field]);
				}
			}
			return acc;
		}, []);
	}, [fields]);

	return (
		<View style={styles.container}>
			{!!groupedFields?.length &&
				groupedFields.map((field, index) => (
					<View key={`fieldGroup${index}`}>
						{!!field.length &&
							field.map((fieldItem, fieldIndex) => (
								<View key={`field${index}-${fieldIndex}`} style={styles.field}>
									{!!fieldItem?.name && <Text style={styles.name}>{fieldItem?.name}</Text>}
									{!!fieldItem?.value && <Text style={styles.value}>{fieldItem?.value}</Text>}
									{!!fieldItem?.inputs && (
										<View>
											{fieldItem?.inputs?.type === EMessageComponentType.INPUT && (
												<EmbedInput
													messageId={message_id}
													input={fieldItem?.inputs?.component}
													buttonId={fieldItem?.inputs?.id}
												/>
											)}
											{fieldItem?.inputs?.type === EMessageComponentType.SELECT && (
												<EmbedSelect
													select={fieldItem?.inputs?.component}
													messageId={message_id}
													buttonId={fieldItem?.inputs?.id}
												/>
											)}

											{fieldItem?.inputs?.type === EMessageComponentType.DATEPICKER && (
												<EmbedDatePicker
													input={fieldItem?.inputs?.component}
													messageId={message_id}
													buttonId={fieldItem?.inputs?.id}
												/>
											)}
											{fieldItem?.inputs?.type === EMessageComponentType.RADIO && fieldItem?.inputs?.component?.length && (
												<EmbedRadioGroup
													options={fieldItem?.inputs?.component}
													message_id={message_id}
													idRadio={fieldItem?.inputs?.id}
													max_options={fieldItem?.inputs?.max_options}
												/>
											)}
											{fieldItem?.inputs?.type === EMessageComponentType.ANIMATION && fieldItem?.inputs?.component && (
												<EmbedAnimation
													key={`embed_animation_${message_id}`}
													animationOptions={fieldItem?.inputs?.component}
													themeValue={themeValue}
												/>
											)}
										</View>
									)}
								</View>
							))}
					</View>
				))}
		</View>
	);
});
