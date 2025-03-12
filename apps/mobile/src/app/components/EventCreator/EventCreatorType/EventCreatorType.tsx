import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Icons, SpeakerIcon, ThreadIcon, ThreadIconLocker } from '@mezon/mobile-components';
import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectAllTextChannel, selectVoiceChannelAll } from '@mezon/store-mobile';
import { ChannelStatusEnum, OptionEvent } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonButton, { EMezonButtonTheme } from '../../../componentUI/MezonButton2';
import MezonInput from '../../../componentUI/MezonInput';
import MezonOption, { IMezonOptionData } from '../../../componentUI/MezonOption';
import MezonSelect from '../../../componentUI/MezonSelect';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import Backdrop from '../../BottomSheetRootListener/backdrop';
import { style } from './styles';

type CreateEventScreenType = typeof APP_SCREEN.MENU_CLAN.CREATE_EVENT;
export const EventCreatorType = memo(function ({ navigation, route }: MenuClanScreenProps<CreateEventScreenType>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { onGoBack } = route.params || {};

	const { t } = useTranslation(['eventCreator']);
	const voicesChannel = useSelector(selectVoiceChannelAll);
	const textChannels = useSelector(selectAllTextChannel);
	const BottomSheetRef = useRef<BottomSheetModal>(null);
	const [searchText, setSearchText] = useState<string>('');

	navigation.setOptions({
		headerTitle: t('screens.eventType.headerTitle'),
		headerTitleStyle: {
			fontSize: Fonts.size.h7,
			color: themeValue.textDisabled
		},
		headerLeft: () => <View />,
		headerRight: () => (
			<TouchableOpacity style={{ marginRight: 20 }} onPress={handleClose}>
				<Icons.CloseLargeIcon height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
			</TouchableOpacity>
		)
	});

	function handleClose() {
		onGoBack?.();
		navigation.navigate(APP_SCREEN.HOME);
	}

	useEffect(() => {
		return onGoBack?.();
	}, []);

	const options = useMemo(
		() =>
			[
				{
					title: t('fields.channelType.voiceChannel.title'),
					description: t('fields.channelType.voiceChannel.description'),
					value: OptionEvent.OPTION_SPEAKER,
					textStyle: {
						fontWeight: 'bold'
					},
					disabled: !voicesChannel?.length,
					icon: <Icons.VoiceNormalIcon color={themeValue.text} />
				},
				{
					title: t('fields.channelType.somewhere.title'),
					description: t('fields.channelType.somewhere.description'),
					value: OptionEvent.OPTION_LOCATION,
					textStyle: {
						fontWeight: 'bold'
					},
					icon: <Icons.LocationIcon color={themeValue.text} />
				}
			] satisfies IMezonOptionData,
		[]
	);

	const filteredOptionsChannels = useMemo(() => {
		return textChannels.filter((user) => user.channel_label.toLowerCase().includes(searchText.toLowerCase()));
	}, [searchText, textChannels]);

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<Pressable onPress={() => hanleSelectChannel(item)} style={styles.items}>
				{channelIcon(item.type, item.channel_private === ChannelStatusEnum.isPrivate)}
				<Text style={styles.inputValue} numberOfLines={1} ellipsizeMode="tail">
					{item.channel_label}
				</Text>
			</Pressable>
		);
	};

	const channelIcon = (type: ChannelType, isPrivate: boolean) => {
		if (type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (isPrivate) {
				return <Icons.TextLockIcon height={size.s_24} width={size.s_24} />;
			}
			return <Icons.TextIcon height={size.s_24} width={size.s_24} />;
		} else {
			if (isPrivate) {
				return <ThreadIconLocker height={size.s_24} width={size.s_24} />;
			}
			return <ThreadIcon height={size.s_24} width={size.s_24} />;
		}
	};

	const snapPoints = useMemo(() => {
		return ['90%'];
	}, []);

	const channels = voicesChannel?.map((item) => ({
		title: item.channel_label,
		value: item.channel_id,
		icon: <SpeakerIcon height={20} width={20} color={themeValue.text} />
	}));

	const [eventType, setEventType] = useState<OptionEvent>();
	const [channelID, setChannelID] = useState<string>(channels?.[0]?.value || '');
	const [location, setLocation] = useState<string>('');
	const [eventChannel, setEventChannel] = useState<ChannelsEntity>();

	function handleEventTypeChange(value: OptionEvent) {
		setEventType(value);
	}

	function handlePressNext() {
		if (eventType === OptionEvent.OPTION_LOCATION) {
			if (location?.trim()?.length === 0) {
				Toast.show({
					type: 'error',
					text1: t('notify.locationBlank')
				});
				return;
			}
		}

		navigation.navigate(APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS, {
			type: eventType,
			channelId: eventType === OptionEvent.OPTION_SPEAKER ? channelID : null,
			location: eventType === OptionEvent.OPTION_LOCATION ? location : null,
			eventChannelId: eventChannel?.channel_id || '',
			onGoBack
		});
	}

	function handleChannelIDChange(value: string | number) {
		setChannelID(value as string);
	}

	const handleSearchText = debounce((value: string) => {
		setSearchText(value);
	}, 500);

	const handleOpenSelectChannel = () => {
		BottomSheetRef?.current?.present();
	};

	const hanleSelectChannel = (item: ChannelsEntity) => {
		setEventChannel(item);
		BottomSheetRef?.current?.dismiss();
	};

	return (
		<View style={styles.container}>
			<View style={styles.feedSection}>
				<ScrollView>
					<View style={styles.headerSection}>
						<Text style={styles.title}>{t('screens.eventType.title')}</Text>
						<Text style={styles.subtitle}>{t('screens.eventType.subtitle')}</Text>
					</View>

					<MezonOption data={options} onChange={handleEventTypeChange} />

					{eventType && eventType === OptionEvent.OPTION_SPEAKER && !!voicesChannel?.length && (
						<MezonSelect
							prefixIcon={<Icons.VoiceNormalIcon height={20} width={20} color={themeValue.textStrong} />}
							title={t('fields.channel.title')}
							titleUppercase
							onChange={handleChannelIDChange}
							data={channels}
						/>
					)}

					{eventType && eventType === OptionEvent.OPTION_LOCATION && (
						<MezonInput
							onTextChange={setLocation}
							value={location}
							inputWrapperStyle={styles.input}
							label={t('fields.address.title')}
							titleUppercase
							placeHolder={t('fields.address.placeholder')}
						/>
					)}

					<Text style={styles.bottomDescription}>{t('screens.eventType.description')}</Text>

					<View style={styles.headerSection}>
						<Text style={styles.title}>{t('screens.channelSelection.title')}</Text>
						<Text style={styles.subtitle}>{t('screens.channelSelection.description')}</Text>
					</View>

					<TouchableOpacity style={styles.fakeInput} onPress={handleOpenSelectChannel}>
						{!!eventChannel && channelIcon(eventChannel?.type, eventChannel?.channel_private === ChannelStatusEnum.isPrivate)}
						<Text style={styles.inputValue}>{eventChannel?.channel_label || t('fields.channel.title')} </Text>
						<View style={styles.chevronDownIcon}>
							<Icons.ChevronSmallDownIcon height={size.s_20} width={size.s_20} color={themeValue.text} />
						</View>
					</TouchableOpacity>
				</ScrollView>
			</View>

			<View style={styles.btnWrapper}>
				<MezonButton
					title={t('actions.next')}
					titleStyle={styles.titleMezonBtn}
					type={EMezonButtonTheme.SUCCESS}
					containerStyle={styles.mezonBtn}
					onPress={handlePressNext}
				/>
			</View>
			<BottomSheetModal
				ref={BottomSheetRef}
				snapPoints={snapPoints}
				backdropComponent={Backdrop}
				backgroundStyle={{ backgroundColor: themeValue.primary }}
			>
				<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10, flex: 1, gap: size.s_10 }}>
					<MezonInput
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectUser')}
						onTextChange={handleSearchText}
						prefixIcon={<Icons.MagnifyingIcon color={themeValue.text} height={20} width={20} />}
					/>
					<View style={{ flex: 1, borderRadius: size.s_8 }}>
						<BottomSheetFlatList data={filteredOptionsChannels} renderItem={renderItem} />
					</View>
				</View>
			</BottomSheetModal>
		</View>
	);
});
