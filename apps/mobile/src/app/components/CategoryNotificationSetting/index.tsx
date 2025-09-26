import { optionNotification } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	defaultNotificationCategoryActions,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import MezonOption from '../../componentUI/MezonOption';
import { style } from './styles';

const CategoryNotificationSetting = ({ category }: { category: ICategoryChannel }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation('clanNotificationsSetting');
	const styles = style(themeValue);
	const defaultCategoryNotificationSetting = useAppSelector((state) => selectDefaultNotificationCategory(state, category?.category_id as string));
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);

	const handleNotificationClanChange = (value: number) => {
		const body = {
			category_id: category?.id,
			notification_type: value,
			clan_id: currentClanId || ''
		};
		dispatch(defaultNotificationCategoryActions.setDefaultNotificationCategory(body));
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: size.s_50 }}>
			<MezonOption
				value={defaultCategoryNotificationSetting?.notification_setting_type}
				onChange={handleNotificationClanChange}
				data={optionNotification(t)}
			/>
		</ScrollView>
	);
};
export default CategoryNotificationSetting;
