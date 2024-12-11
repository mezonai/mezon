import { useTheme } from '@mezon/mobile-ui';
import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { EMessageComponentType, IFieldEmbed, IMessageRatioOption } from '@mezon/utils';
import { memo, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MezonDateTimePicker } from '../../../../../../componentUI';
import { EmbedInput } from './EmbedInput';
import { EmbedRadioButton } from './EmbedRadioItem';
import { EmbedSelect } from './EmbedSelect';
import { style } from './styles';

interface EmbedFieldsProps {
	message_id: string;
	fields: IFieldEmbed[];
}

export const EmbedFields = memo(({ message_id, fields }: EmbedFieldsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [checked, setChecked] = useState<number[]>([]);
	const dispatch = useAppDispatch();
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

	const handleCheckRadioButton = (index: number, option: IMessageRatioOption, radioId: string) => {
		if (!option?.name) {
			setChecked([index]);
			handleRadioValue(option?.value, radioId);
			return;
		}
		if (checked.includes(index)) {
			setChecked(checked.filter((check) => check !== index));
			return;
		}
		setChecked([...checked, index]);
		handleRadioValue(option?.value, radioId);
	};

	const handleRadioValue = (value: string, id: string) => {
		dispatch(
			embedActions.addEmbedValue({
				message_id: message_id,
				data: {
					id: id,
					value: value
				}
			})
		);
	};

	const handleChangeDataInput = (value: string, id?: string) => {
		dispatch(
			embedActions.addEmbedValue({
				message_id: message_id,
				data: {
					id: id,
					value: value
				},
				multiple: true
			})
		);
	};

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
													onSelectionChanged={handleChangeDataInput}
												/>
											)}
											{fieldItem?.inputs?.type === EMessageComponentType.DATEPICKER && (
												<MezonDateTimePicker
													onChange={(value) => handleChangeDataInput(value?.getTime()?.toString(), fieldItem?.inputs?.id)}
												/>
											)}
											{fieldItem?.inputs?.type === EMessageComponentType.RADIO &&
												fieldItem?.inputs?.component?.length &&
												fieldItem?.inputs?.component?.map((optionItem, optionIndex) => (
													<EmbedRadioButton
														key={`Embed_field_option_${optionItem}_${optionIndex}`}
														option={optionItem}
														checked={checked?.includes(optionIndex)}
														onCheck={() => handleCheckRadioButton(optionIndex, optionItem, fieldItem?.inputs?.id)}
													/>
												))}
										</View>
									)}
								</View>
							))}
					</View>
				))}
		</View>
	);
});
