import { ActionEmitEvent, ETypeSearch, Icons, VerifyIcon } from '@mezon/mobile-components';
import { Block, baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel, selectCurrentClan, selectMembersClanCount } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import { style } from './styles';

interface IProps {
	onPress: () => void;
	onOpenEvent: () => void;
}

const ChannelListHeader = ({ onPress, onOpenEvent }: IProps) => {
	const currentClan = useSelector(selectCurrentClan);
	const { themeValue } = useTheme();
	const { t } = useTranslation(['clanMenu']);
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const currentChannel = useSelector(selectCurrentChannel);

	const styles = style(themeValue);
	const members = useSelector(selectMembersClanCount);
	const previousClanName = useRef<string | null>(null);

	useEffect(() => {
		previousClanName.current = currentClan?.clan_name || '';
	}, [currentClan?.clan_name]);

	const clanName = !currentClan?.id || currentClan?.id === '0' ? previousClanName.current : currentClan?.clan_name;

	const navigateToSearchPage = () => {
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL,
			params: {
				typeSearch: ETypeSearch.SearchAll,
				currentChannel
			}
		});
	};

	const onOpenInvite = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_INVITE_CHANNEL);
	};
	return (
		<View style={[styles.container]}>
			<TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.listHeader}>
				<View style={styles.titleNameWrapper}>
					<Text numberOfLines={1} style={styles.titleServer}>
						{clanName}
					</Text>
					<VerifyIcon width={size.s_18} height={size.s_18} color={baseColor.blurple} />
				</View>
				<Block flexDirection={'row'} alignItems={'center'}>
					<Text numberOfLines={1} style={styles.subTitle}>
						{`${members} ${t('info.members')}`}
					</Text>
					<Block
						width={size.s_4}
						height={size.s_4}
						borderRadius={size.s_4}
						backgroundColor={themeValue.textDisabled}
						marginHorizontal={size.s_8}
					/>
					<Text numberOfLines={1} style={styles.subTitle}>
						Community
					</Text>
				</Block>
			</TouchableOpacity>
			<Block marginTop={size.s_10} flexDirection={'row'} gap={size.s_8}>
				<TouchableOpacity activeOpacity={0.8} onPress={navigateToSearchPage} style={styles.wrapperSearch}>
					<Icons.MagnifyingIcon color={themeValue.text} height={size.s_18} width={size.s_18} />
					<Text style={styles.placeholderSearchBox}>{t('search')}</Text>
				</TouchableOpacity>
				<TouchableOpacity activeOpacity={0.8} onPress={onOpenInvite} style={styles.iconWrapper}>
					<Icons.UserPlusIcon height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
				<TouchableOpacity activeOpacity={0.8} onPress={onOpenEvent} style={styles.iconWrapper}>
					<Icons.CalendarIcon height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
			</Block>
		</View>
	);
};

export default memo(ChannelListHeader);
