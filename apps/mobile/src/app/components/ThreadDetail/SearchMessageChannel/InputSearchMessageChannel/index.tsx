import { ACTIVE_TAB, type IOption, type IUerMention } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Tooltip from 'react-native-walkthrough-tooltip';
import { SearchMessageChannelContext } from '..';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import ListOptionSearch from '../ListOptionSearch';
import { style } from './InputSearchMessageChannel.styles';

type InputSearchMessageChannelProps = {
	onChangeText: (value: string) => void;
	onChangeOptionFilter: (option: IOption) => void;
	inputValue: string;
	userMention: IUerMention;
	optionFilter: IOption;
	onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
	nameChannel?: string;
	isClearSearch?: boolean;
};

const InputSearchMessageChannel = ({
	onChangeText,
	onChangeOptionFilter,
	inputValue,
	userMention,
	optionFilter,
	onKeyPress,
	nameChannel,
	isClearSearch = false
}: InputSearchMessageChannelProps) => {
	const navigation = useNavigation<any>();
	const { activeTab } = useContext(SearchMessageChannelContext);
	const [textInput, setTextInput] = useState<string>(inputValue);
	const [isVisibleToolTip, setIsVisibleToolTip] = useState<boolean>(false);
	const inputSearchRef = useRef(null);
	const { t } = useTranslation(['searchMessageChannel']);

	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const shouldShowTooltip = useMemo(() => {
		if (nameChannel) return true;

		return activeTab === ACTIVE_TAB.MESSAGES;
	}, [nameChannel, activeTab]);

	const shouldShowBadge = useMemo(
		() => nameChannel || optionFilter?.title || userMention?.display,
		[nameChannel, optionFilter?.title, userMention?.display]
	);

	const badgeText = useMemo(() => {
		if (optionFilter?.title || userMention?.display) {
			return `${optionFilter?.title || ''} ${userMention?.display || ''}`;
		}
		return `in:${nameChannel || ''}`;
	}, [optionFilter?.title, userMention?.display, nameChannel]);

	const debouncedOnChangeText = useCallback(
		debounce((e) => {
			onChangeText(e);
		}, 300),
		[]
	);

	const handleTextChange = useCallback(
		(e) => {
			setTextInput(e);
			debouncedOnChangeText(e);
			if (!e?.length) {
				onChangeOptionFilter(null);
			}
		},
		[debouncedOnChangeText, onChangeOptionFilter]
	);

	const clearTextInput = () => {
		setTextInput('');
		onChangeText('');
		onChangeOptionFilter(null);
	};

	useEffect(() => {
		if (isClearSearch) {
			setTextInput('');
			onChangeText('');
		}
	}, [isClearSearch, nameChannel]);

	useEffect(() => {
		if (optionFilter || userMention) {
			setTextInput(' ');
			onChangeText(' ');
		}
	}, [userMention, optionFilter]);

	const onGoBack = () => {
		navigation.goBack();
	};

	return (
		<View style={styles.wrapper}>
			<TouchableOpacity onPress={onGoBack} style={styles.backButton}>
				<View style={styles.backButtonInner}>
					<MezonIconCDN icon={IconCDN.backArrowLarge} width={size.s_20} height={size.s_20} color={themeValue.text} />
				</View>
			</TouchableOpacity>
			<View style={styles.searchBox}>
				<View style={styles.iconWrapper}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
				</View>
				{shouldShowBadge ? (
					<View
						style={[
							styles.badge,
							{
								backgroundColor: themeValue.badgeHighlight,
								marginRight: Platform.OS === 'ios' ? size.s_6 : 0
							}
						]}
					>
						<Text numberOfLines={1} style={styles.textBadgeHighLight}>
							{badgeText}
						</Text>
					</View>
				) : null}
				<TextInput
					onKeyPress={onKeyPress}
					ref={inputSearchRef}
					value={textInput}
					onChangeText={handleTextChange}
					style={styles.input}
					placeholderTextColor={themeValue.textDisabled}
					placeholder={optionFilter?.title || userMention?.display ? '' : t('search')}
					autoFocus
				/>
				{textInput?.length ? (
					<Pressable onPress={clearTextInput} style={styles.btnClear}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={18} width={18} color={themeValue.text} />
					</Pressable>
				) : null}
			</View>
			{shouldShowTooltip && (
				<Tooltip
					isVisible={isVisibleToolTip}
					closeOnBackgroundInteraction={true}
					disableShadow={true}
					closeOnContentInteraction={true}
					content={
						<ListOptionSearch
							onPressOption={(option) => {
								onChangeOptionFilter(option);
								if (inputSearchRef.current) {
									inputSearchRef.current.focus();
								}
								setIsVisibleToolTip(false);
							}}
							isSearchGlobal={!nameChannel}
						/>
					}
					contentStyle={{ minWidth: size.s_220, padding: 0, borderRadius: size.s_10, backgroundColor: themeValue.primary }}
					arrowSize={{ width: 0, height: 0 }}
					placement="bottom"
					onClose={() => setIsVisibleToolTip(false)}
					showChildInTooltip={false}
					topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
				>
					<TouchableOpacity
						activeOpacity={0.7}
						onPress={() => {
							setIsVisibleToolTip(true);
							if (inputSearchRef.current) {
								inputSearchRef.current.focus();
							}
						}}
						style={styles.listSearchIcon}
					>
						<MezonIconCDN icon={IconCDN.filterHorizontalIcon} width={20} height={20} color={themeValue.textStrong} />
					</TouchableOpacity>
				</Tooltip>
			)}
		</View>
	);
};

export default memo(InputSearchMessageChannel);
