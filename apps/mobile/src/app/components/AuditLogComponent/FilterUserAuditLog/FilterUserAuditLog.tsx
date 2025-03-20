import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { auditLogFilterActions, selectAllUserClans, selectUserAuditLog, useAppDispatch } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonOption from '../../../componentUI/MezonOption';
import InputSearchAuditLog from '../InputSearchAuditLog/InputSearchAuditLog';

export default function FilterUserAuditLog() {
	const { themeValue } = useTheme();
	const usersClan = useSelector(selectAllUserClans);
	const [searchText, setSearchText] = useState<string>('');
	const navigation = useNavigation<any>();
	const dispatch = useAppDispatch();
	const userAuditLog = useSelector(selectUserAuditLog);
	const [userOption, setUserOption] = useState(userAuditLog?.userId);
	const { t } = useTranslation('auditLog');

	const userOptions = useMemo(
		() =>
			[
				{ title: t('filterUserAuditLog.allUsers'), icon: <Icons.IconPeople height={size.s_30} width={size.s_30} />, value: '' },
				...(usersClan || []).map((item: UsersClanEntity) => ({
					title: item?.user?.display_name || '',
					icon: <MezonAvatar height={size.s_30} width={size.s_30} avatarUrl={item?.user?.avatar_url} username={item?.user?.display_name} />,
					value: item?.user?.id || ''
				}))
			]?.filter((user) => user?.title?.toLowerCase()?.includes(searchText?.toLowerCase())),
		[usersClan, searchText, t]
	);
	const handleOptionChange = useCallback((userId) => {
		const userSelected = userOptions?.find((user) => user?.value === userId);
		dispatch(
			auditLogFilterActions.setUser({
				userId: userSelected?.value || '',
				username: userSelected?.title || ''
			})
		);
		navigation.goBack();
	}, []);
	const handleSearchTerm = useCallback((text) => {
		setSearchText(text);
	}, []);

	return (
		<View
			style={{ width: '100%', height: '100%', backgroundColor: themeValue.primary, paddingHorizontal: size.s_10, paddingVertical: size.s_10 }}
		>
			<InputSearchAuditLog onChangeText={handleSearchTerm} placeHolder={t('filterUserAuditLog.placeholder')} />
			<View style={{ marginVertical: size.s_10 }}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					scrollEventThrottle={16}
					removeClippedSubviews={false}
					nestedScrollEnabled={true}
					bounces={false}
				>
					<MezonOption data={userOptions} onChange={handleOptionChange} value={userOption} />
				</ScrollView>
			</View>
		</View>
	);
}
