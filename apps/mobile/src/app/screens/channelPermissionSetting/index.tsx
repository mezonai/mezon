import { Icons } from '@mezon/mobile-components';
import { Colors, size, Text, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import { AdvancedView } from './AdvancedView';
import { BasicView } from './BasicView';
import { EPermissionSetting } from './types/channelPermission.enum';

type ChannelPermissionSetting = typeof APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION;
export const ChannelPermissionSetting = ({ navigation, route }: MenuChannelScreenProps<ChannelPermissionSetting>) => {
	const { channelId } = route.params;
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const { themeValue } = useTheme();
	const { t } = useTranslation('channelSetting');
	const [currentTab, setCurrentTab] = useState<EPermissionSetting>(EPermissionSetting.AdvancedView);
	const [isAdvancedEditMode, setIsAdvancedEditMode] = useState(false);

	const onTabChange = (tab: EPermissionSetting) => {
		if (tab === EPermissionSetting.BasicView) {
			setIsAdvancedEditMode(false);
		}
		setCurrentTab(tab);
	};

	const permissionSettingTabs = useMemo(() => {
		return [
			{
				title: t('channelPermission.basicView'),
				type: EPermissionSetting.BasicView
			},
			{
				title: t('channelPermission.advancedView'),
				type: EPermissionSetting.AdvancedView
			}
		];
	}, [t]);

	navigation.setOptions({
		headerTitle: () => (
			<View>
				<Text bold h3 color={themeValue?.white}>
					{t('channelPermission.title')}
				</Text>
			</View>
		),
		headerRight: () => {
			if (currentTab === EPermissionSetting.BasicView) return null;

			if (isAdvancedEditMode) {
				return (
					<TouchableOpacity onPress={() => setIsAdvancedEditMode(false)}>
						<View
							style={{
								marginRight: size.s_20
							}}
						>
							<Text h4 color={themeValue.white}>
								{t('channelPermission.done')}
							</Text>
						</View>
					</TouchableOpacity>
				);
			}
			//TODO: update later
			// return (
			// 	<TouchableOpacity onPress={() => setIsAdvancedEditMode(true)}>
			// 		<Block marginRight={size.s_20}>
			// 			<Text h4 color={themeValue.white}>
			// 				{t('channelPermission.edit')}
			// 			</Text>
			// 		</Block>
			// 	</TouchableOpacity>
			// );
		},
		headerLeft: () => {
			return (
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<View
						style={{
							marginTop: size.s_16
						}}
					>
						<Icons.ArrowLargeLeftIcon color={themeValue.white} height={size.s_22} width={size.s_22} />
					</View>
				</TouchableOpacity>
			);
		}
	});

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.secondary, paddingHorizontal: size.s_12 }}>
			<View
				style={{
					backgroundColor: themeValue.tertiary,
					marginBottom: size.s_10,
					flexDirection: 'row',
					borderRadius: size.s_16,
					gap: size.s_6
				}}
			>
				{permissionSettingTabs.map((tab) => {
					const isActive = currentTab === tab.type;
					return (
						<Pressable
							key={tab.type}
							onPress={() => onTabChange(tab.type)}
							style={{
								flex: 1,
								paddingVertical: size.s_8,
								borderRadius: size.s_16,
								backgroundColor: isActive ? themeValue.bgViolet : themeValue.tertiary
							}}
						>
							<Text center color={isActive ? Colors.white : themeValue.text} h5>
								{tab.title}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{currentTab === EPermissionSetting.BasicView ? (
				<BasicView channel={currentChannel} />
			) : (
				<AdvancedView channel={currentChannel} isAdvancedEditMode={isAdvancedEditMode} />
			)}
		</View>
	);
};
