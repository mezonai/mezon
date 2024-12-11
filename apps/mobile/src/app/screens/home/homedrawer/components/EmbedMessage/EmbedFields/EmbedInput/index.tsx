import { useTheme } from '@mezon/mobile-ui';
import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { IMessageInput } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { memo, useEffect } from 'react';
import { TextInput } from 'react-native';
import { style } from './styles';

type EmbedInputProps = {
	input: IMessageInput;
	buttonId: string;
	messageId: string;
};

export const EmbedInput = memo(({ input, buttonId, messageId }: EmbedInputProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	useEffect(() => {
		handleChange(input.defaultValue);
	}, []);

	const handleChange = (text) => {
		debouncedChangeInput(text);
	};

	const debouncedChangeInput = debounce(async (value: string) => {
		dispatch(
			embedActions.addEmbedValue({
				message_id: messageId,
				data: {
					id: buttonId,
					value: value
				}
			})
		);
	}, 500);

	return (
		<TextInput
			style={styles.TextInput}
			placeholder={input?.placeholder}
			onChange={handleChange}
			multiline={!!input?.textarea}
			keyboardType={input.type === 'number' ? 'numeric' : 'default'}
			defaultValue={input?.defaultValue?.toString()}
		/>
	);
});
