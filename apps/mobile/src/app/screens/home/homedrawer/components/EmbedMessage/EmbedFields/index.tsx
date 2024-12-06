import { useTheme } from '@mezon/mobile-ui';
import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { EMessageComponentType, IMessageRatioOption, InputComponent, SelectComponent } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { memo, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MezonInput, MezonSelect } from '../../../../../../componentUI';
import { EmbedRadioButton } from './EmbedRadioItem';
import { style } from './styles';

interface Field {
	name: string;
	value: string;
	inline?: boolean;
	options?: IMessageRatioOption[];
	inputs?: SelectComponent | InputComponent;
}

interface EmbedFieldsProps {
	message_id: string;
	fields: Field[];
}

export const EmbedFields = memo(({ message_id, fields }: EmbedFieldsProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [checked, setChecked] = useState<number[]>([]);
	const dispatch = useAppDispatch();
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

	const handleCheckRadioButton = (index: number, option: IMessageRatioOption) => {
		if (!option?.name) {
			setChecked([index]);
			handleRadioValue(option);
			return;
		}
		if (checked.includes(index)) {
			setChecked(checked.filter((check) => check !== index));
			return;
		}
		setChecked([...checked, index]);
		handleRadioValue(option);
	};

	const handleRadioValue = (option: IMessageRatioOption) => {
		dispatch(
			embedActions.addEmbedValueOptions({
				message_id: message_id,
				data: {
					id: option?.value,
					value: option?.value
				}
			})
		);
	};

	const handleChangeDataInput = (value: string, id?: string) => {
		dispatch(
			embedActions.addEmbedValueInput({
				message_id: message_id,
				data: {
					id: id,
					value: value
				},
				multiple: true
			})
		);
	};

	const handleChangeText = debounce((text: string, id: string) => {
		handleChangeDataInput(text, id);
	}, 300);

	const handleChangeSelect = (value: string, id: string) => {
		handleChangeDataInput(value, id);
	};

	return (
		<View>
			{!!groupedFields?.length &&
				groupedFields.map((field, index) => (
					<View key={`fieldGroup${index}`}>
						{!!field.length &&
							field.map((fieldItem, fieldIndex) => (
								<View key={`field${index}-${fieldIndex}`} style={styles.field}>
									{!!fieldItem?.name && <Text style={styles.name}>{fieldItem?.name}:</Text>}
									{!!fieldItem?.value && <Text style={styles.value}>{fieldItem?.value}</Text>}
									{!!fieldItem?.options?.length &&
										fieldItem?.options?.map((optionItem, optionIndex) => (
											<EmbedRadioButton
												key={`Embed_field_option_${optionItem}_${optionIndex}`}
												option={optionItem}
												checked={checked?.includes(optionIndex)}
												onCheck={() => handleCheckRadioButton(optionIndex, optionItem)}
											/>
										))}
									{!!fieldItem?.inputs && (
										<View>
											{fieldItem?.inputs?.type === EMessageComponentType.INPUT ? (
												<MezonInput
													placeHolder={fieldItem?.inputs?.component?.placeholder}
													onTextChange={(text) => handleChangeText(text, fieldItem?.inputs?.id)}
												/>
											) : (
												<MezonSelect
													data={fieldItem?.inputs?.component?.options?.map((item) => {
														return { title: item?.label, value: item?.value };
													})}
													onChange={(value) => handleChangeSelect(value as string, fieldItem?.inputs?.id)}
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
