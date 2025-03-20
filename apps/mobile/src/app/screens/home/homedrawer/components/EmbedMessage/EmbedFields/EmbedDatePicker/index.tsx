import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@mezon/mobile-ui';
import { embedActions, useAppDispatch } from '@mezon/store-mobile';
import { IMessageDatePicker } from '@mezon/utils';
import moment from 'moment';
import { memo, useEffect, useState } from 'react';
import MezonDateTimePicker from '../../../../../../../componentUI/MezonDateTimePicker';
import { style } from './styles';

type EmbedInputProps = {
	input: IMessageDatePicker;
	buttonId: string;
	messageId: string;
};

export const EmbedDatePicker = memo(({ input, buttonId, messageId }: EmbedInputProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { dismiss } = useBottomSheetModal();
	const [date, setDate] = useState<Date>();

	useEffect(() => {
		handleDatePicked(new Date());
	}, []);

	const handleDatePicked = (value: Date) => {
		dismiss();
		setDate(value);
		const formattedDate = moment(value).format('YYYY-MM-DD');
		dispatch(
			embedActions.addEmbedValue({
				message_id: messageId,
				data: {
					id: buttonId,
					value: formattedDate
				}
			})
		);
	};

	return <MezonDateTimePicker value={date} onChange={(value) => handleDatePicked(value)} containerStyle={styles.datepicker} />;
});
