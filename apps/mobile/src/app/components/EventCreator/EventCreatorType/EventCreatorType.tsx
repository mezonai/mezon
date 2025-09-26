import { ActionEmitEvent } from '@mezon/mobile-components';
import { Fonts, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	selectAllTextChannel,
	selectChannelById,
	selectCurrentClanId,
	selectEventById,
	selectVoiceChannelAll,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelStatusEnum, OptionEvent } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, FlatList, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonButton, { EMezonButtonTheme } from '../../../componentUI/MezonButton';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import MezonOption, { IMezonOptionData } from '../../../componentUI/MezonOption';
import MezonSelect from '../../../componentUI/MezonSelect';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type CreateEventScreenType = typeof APP_SCREEN.MENU_CLAN.CREATE_EVENT;
export const EventCreatorType = memo(function ({ navigation, route }: MenuClanScreenProps<CreateEventScreenType>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { onGoBack, eventId } = route.params || {};

	const { t } = useTranslation(['eventCreator']);
	const voicesChannel = useSelector(selectVoiceChannelAll);
	const textChannels = useSelector(selectAllTextChannel);
	const [searchText, setSearchText] = useState<string>('');
	const currentClanId = useSelector(selectCurrentClanId);
	const currentEvent = useAppSelector((state) => selectEventById(state, currentClanId ?? '', eventId ?? ''));
	const currentEventChannel = useSelector((state) => selectChannelById(state, currentEvent ? currentEvent.channel_id || '' : ''));

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: t('screens.eventType.headerTitle'),
			headerTitleStyle: {
				fontSize: Fonts.size.h7,
				color: themeValue.textDisabled
			},
			headerLeft: () => <View />,
			headerRight: () => (
				<TouchableOpacity
					style={{ marginRight: 20 }}
					onPress={() => {
						onGoBack?.();
						navigation.navigate(APP_SCREEN.HOME);
					}}
				>
					<MezonIconCDN icon={IconCDN.closeLargeIcon} height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
				</TouchableOpacity>
			)
		});
	}, [navigation, onGoBack, t, themeValue.textDisabled, themeValue.textStrong]);

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
					disabled: !voicesChannel?.length || !!currentEvent,
					icon: <MezonIconCDN icon={IconCDN.channelVoice} color={themeValue.text} />
				},
				{
					title: t('fields.channelType.somewhere.title'),
					description: t('fields.channelType.somewhere.description'),
					value: OptionEvent.OPTION_LOCATION,
					textStyle: {
						fontWeight: 'bold'
					},
					disabled: !!currentEvent,
					icon: <MezonIconCDN icon={IconCDN.locationIcon} color={themeValue.text} />
				},
				{
					title: t('fields.channelType.privateEvent.title'),
					description: t('fields.channelType.privateEvent.description'),
					value: OptionEvent.PRIVATE_EVENT,
					textStyle: {
						fontWeight: 'bold'
					},
					disabled: !!currentEvent,
					icon: <MezonIconCDN icon={IconCDN.channelVoiceLock} color={themeValue.text} />
				}
			] satisfies IMezonOptionData,
		[]
	);

	const filteredOptionsChannels = useMemo(() => {
		return textChannels.filter((user) => user.channel_label.toLowerCase().includes(searchText.toLowerCase()));
	}, [searchText, textChannels]);

	const renderItem = ({ item }: { item: ChannelsEntity }) => {
		return (
			<Pressable key={`channel_event_${item.channel_id}`} onPress={() => hanleSelectChannel(item)} style={styles.items}>
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
				return <MezonIconCDN icon={IconCDN.channelTextLock} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
			}
			return <MezonIconCDN icon={IconCDN.channelText} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
		} else {
			if (isPrivate) {
				return <MezonIconCDN icon={IconCDN.threadLockIcon} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
			}
			return <MezonIconCDN icon={IconCDN.threadIcon} height={size.s_24} width={size.s_24} color={themeValue.channelNormal} />;
		}
	};

	const channels = voicesChannel?.map((item) => ({
		title: item.channel_label,
		value: item.channel_id,
		icon: <MezonIconCDN icon={IconCDN.channelVoice} height={20} width={20} color={themeValue.text} />
	}));

	const [eventType, setEventType] = useState<OptionEvent>();
	const [channelID, setChannelID] = useState<string>(channels?.[0]?.value || '');
	const [location, setLocation] = useState<string>('');
	const [eventChannel, setEventChannel] = useState<ChannelsEntity>();

	const isExistChannelVoice = Boolean(currentEvent?.channel_voice_id);
	const isExistAddress = Boolean(currentEvent?.address);
	const isExistPrivateEvent = currentEvent?.is_private;

	useEffect(() => {
		if (currentEvent && currentEventChannel) {
			if (isExistChannelVoice) {
				setEventType(OptionEvent.OPTION_SPEAKER);
				setChannelID(currentEvent.channel_voice_id);
			} else if (isExistAddress) {
				setEventType(OptionEvent.OPTION_LOCATION);
			} else if (isExistPrivateEvent) {
				setEventType(OptionEvent.PRIVATE_EVENT);
			}
			setEventChannel(currentEventChannel);
		}
	}, [currentEvent, currentEventChannel, isExistAddress, isExistChannelVoice, isExistPrivateEvent]);

	function handleEventTypeChange(value: OptionEvent) {
		setEventType(value);
	}

	function handlePressNext() {
		if (!eventType) {
			Toast.show({
				type: 'error',
				text1: t('notify.type')
			});
			return;
		}
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
			channelId: eventType === OptionEvent.OPTION_SPEAKER ? channelID : '',
			location: eventType === OptionEvent.OPTION_LOCATION ? location : '',
			eventChannelId: eventChannel?.channel_id || '',
			isPrivate: eventType === OptionEvent.PRIVATE_EVENT,
			onGoBack,
			currentEvent: currentEvent || null
		});
	}

	function handleChannelIDChange(value: string | number) {
		setChannelID(value as string);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	}

	const handleSearchText = debounce((value: string) => {
		setSearchText(value);
	}, 500);

	const handleOpenSelectChannel = () => {
		handleShowBottomSheetChannel();
	};

	const hanleSelectChannel = (item: ChannelsEntity) => {
		setEventChannel(item);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleShowBottomSheetChannel = () => {
		const data = {
			children: (
				<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10, flex: 1, gap: size.s_10 }}>
					<MezonInput
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectUser')}
						onTextChange={handleSearchText}
						prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					/>
					<View style={{ flex: 1, borderRadius: size.s_8 }}>
						<FlatList data={filteredOptionsChannels} contentContainerStyle={{ flexGrow: 1 }} renderItem={renderItem} />
					</View>
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View style={styles.container}>
			<View style={styles.feedSection}>
				<ScrollView>
					<View style={styles.headerSection}>
						<Text style={styles.title}>{t('screens.eventType.title')}</Text>
						<Text style={styles.subtitle}>{t('screens.eventType.subtitle')}</Text>
					</View>

					<MezonOption data={options} value={eventType} onChange={handleEventTypeChange} />

					{eventType && eventType === OptionEvent.OPTION_SPEAKER && !!voicesChannel?.length && (
						<MezonSelect
							prefixIcon={<MezonIconCDN icon={IconCDN.channelVoice} height={20} width={20} color={themeValue.textStrong} />}
							title={t('fields.channel.title')}
							titleUppercase
							onChange={handleChannelIDChange}
							data={channels}
							initValue={currentEvent?.channel_voice_id}
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

					{eventType !== OptionEvent.PRIVATE_EVENT && (
						<View style={styles.headerSection}>
							<Text style={styles.title}>{t('screens.channelSelection.title')}</Text>
							<Text style={styles.subtitle}>{t('screens.channelSelection.description')}</Text>
						</View>
					)}

					{eventType !== OptionEvent.PRIVATE_EVENT && (
						<TouchableOpacity style={styles.fakeInput} onPress={handleOpenSelectChannel}>
							{!!eventChannel && channelIcon(eventChannel?.type, eventChannel?.channel_private === ChannelStatusEnum.isPrivate)}
							<Text style={styles.inputValue}>{eventChannel?.channel_label || t('fields.channel.title')} </Text>
							<View style={styles.chevronDownIcon}>
								<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
							</View>
						</TouchableOpacity>
					)}
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
		</View>
	);
});
