import { Icons } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { IMessageSelect, IMessageSelectOption } from '@mezon/utils';
import { memo, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import MessageSelect from '../MessageSelect';
import { style } from './styles';

type EmbedSelectProps = {
	select: IMessageSelect;
	messageId: string;
	buttonId: string;
};

export const EmbedSelect = memo(({ select, messageId, buttonId }: EmbedSelectProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [selectedOptions, setSelectedOptions] = useState<IMessageSelectOption[]>([]);

	const checkMultipleSelect = useMemo(() => {
		return (!!select.min_options && select.min_options > 1) || (!!select.max_options && select.max_options >= 2);
	}, [select.min_options, select.max_options]);
	useEffect(() => {
		if (select.valueSelected) {
			handleChangeDataInput(select.valueSelected.value, buttonId);
		}
	}, []);

	const handleChangeDataInput = (value: string, id?: string) => {
		dispatch(
			embedActions.addEmbedValue({
				message_id: messageId,
				data: {
					id: id,
					value: value
				},
				multiple: true,
				onlyChooseOne: !checkMultipleSelect
			})
		);
	};

	const handleSelectChanged = (option) => {
		if ((!select?.max_options || select?.max_options === 1) && selectedOptions?.length === 1) {
			setSelectedOptions([]);
			setSelectedOptions((prev) => [...prev, option]);
		} else if (!selectedOptions.some((opt) => opt?.value === option?.value) && selectedOptions?.length < (select?.max_options || 1)) {
			setSelectedOptions((prev) => [...prev, option]);
		}
		if (selectedOptions?.filter((item) => item?.value === option?.value)?.length > 0) {
			dispatch(
				embedActions.removeEmbedValuel({
					message_id: messageId,
					data: {
						id: buttonId,
						value: option?.value
					},
					multiple: true
				})
			);
			return;
		}
		handleChangeDataInput(option?.value, buttonId);
	};

	useEffect(() => {
		if (select?.valueSelected) {
			handleChangeDataInput(select?.valueSelected?.value, buttonId);
		}
	}, []);

	const handleRemoveOption = (option) => {
		setSelectedOptions((prev) => prev.filter((opt) => opt?.value !== option?.value));
		dispatch(
			embedActions.removeEmbedValuel({
				message_id: messageId,
				data: {
					id: buttonId,
					value: option?.value
				},
				multiple: true
			})
		);
	};

	const SelectOptionItem = ({ option }) => {
		return (
			<View style={styles.selectItem}>
				<Text ellipsizeMode="tail" style={styles.itemTitle} numberOfLines={1}>
					{option?.title}
				</Text>
				<Icons.CircleXIcon height={size.s_20} width={size.s_20} onPress={() => handleRemoveOption(option)} />
			</View>
		);
	};

	const getSelectNote = () => {
		if (select?.min_options && select?.max_options) {
			return `Select from ${select?.min_options} to ${select?.max_options} options`;
		}

		if (select?.max_options) {
			return `Select up to ${select?.max_options} option${select?.max_options > 1 ? 's' : ''}`;
		}

		if (select?.min_options) {
			return `Select at least ${select?.min_options} option${select?.min_options > 1 ? 's' : ''}`;
		}

		return 'Select 1 option';
	};

	return (
		<Block>
			<MessageSelect
				data={select?.options?.map((item) => {
					return { title: item?.label, value: item?.value };
				})}
				onChange={handleSelectChanged}
				placeholder={getSelectNote()}
				defaultValue={{ title: select?.valueSelected?.label, value: select?.valueSelected?.value }}
			/>
			{!!selectedOptions?.length && (
				<View style={styles.selectGroup}>
					{!!selectedOptions?.length && selectedOptions?.map((option) => <SelectOptionItem option={option} />)}
				</View>
			)}
		</Block>
	);
});
