import { debounce } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { listQuickMenuAccess, selectQuickMenuLoadingStatus, selectQuickMenusByChannelId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { QUICK_MENU_TYPE } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import LoadingModal from '../../../../../components/LoadingModal/LoadingModal';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './styles';

interface QuickMenuModalProps {
	channelId: string;
	isVisible: boolean;
	onClose: () => void;
}

const QuickMenuItem = memo(({ item, onSelect, styles, themeValue }: { item: any; onSelect: (item: any) => void; styles: any; themeValue: any }) => (
	<Pressable android_ripple={{ color: themeValue.secondaryLight }} style={styles.quickMenuItem} onPress={() => onSelect(item)}>
		<View style={styles.quickMenuContent}>
			<Text style={styles.quickMenuTitle}>{item.menu_name}</Text>
		</View>
		<Text style={styles.quickMenuBotTag}>Bot</Text>
	</Pressable>
));

const EmptyState = memo(({ searchText, styles, themeValue, t }: { searchText: string; styles: any; themeValue: any; t: any }) => (
	<View style={styles.emptyState}>
		<MezonIconCDN icon={IconCDN.quickAction} width={size.s_40} height={size.s_40} color={themeValue.text} />
		<Text style={styles.emptyStateText}>{searchText ? t('quickMenu.noQuickMenu') : t('quickMenu.noQuickMenuAvailable')}</Text>
	</View>
));

export const QuickMenuModal = React.memo(({ channelId, isVisible, onClose }: QuickMenuModalProps) => {
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const [searchText, setSearchText] = useState('');
	const [debouncedSearchText, setDebouncedSearchText] = useState('');
	const { t } = useTranslation(['common']);

	const debouncedSetSearchText = useMemo(
		() =>
			debounce((value: string) => {
				setSearchText(value);
				setDebouncedSearchText(value);
			}, 300),
		[]
	);

	const quickMenus = useAppSelector((state) => selectQuickMenusByChannelId(state as any, channelId || ''));
	const isLoading = useAppSelector((state) => selectQuickMenuLoadingStatus(state as any));

	const filteredQuickMenus = useMemo(() => {
		if (!debouncedSearchText.trim()) {
			return quickMenus;
		}
		return quickMenus.filter((item) => item.menu_name?.toLowerCase().includes(debouncedSearchText.toLowerCase()));
	}, [quickMenus, debouncedSearchText]);

	useEffect(() => {
		dispatch(listQuickMenuAccess({ channelId: channelId, menuType: QUICK_MENU_TYPE.QUICK_MENU }));
	}, [channelId, dispatch]);

	const handleSelectQuickMenu = useCallback(
		(quickMenu: any) => {
			onClose();
		},
		[onClose]
	);

	const handleClose = useCallback(() => {
		debouncedSetSearchText('');
		onClose();
	}, [onClose, debouncedSetSearchText]);

	const handleClearSearch = useCallback(() => {
		debouncedSetSearchText('');
	}, [debouncedSetSearchText]);

	const renderQuickMenuItem = useCallback(
		({ item }: { item: any }) => <QuickMenuItem item={item} onSelect={handleSelectQuickMenu} styles={styles} themeValue={themeValue} />,
		[styles, themeValue, handleSelectQuickMenu]
	);

	const keyExtractor = useCallback((item: any) => item.id?.toString() || Math.random().toString(), []);

	const getItemLayout = useCallback(
		(_: any, index: number) => ({
			length: size.s_60,
			offset: size.s_60 * index,
			index
		}),
		[]
	);

	return (
		<Modal
			visible={isVisible}
			animationType={'fade'}
			transparent={true}
			onRequestClose={handleClose}
			supportedOrientations={['portrait', 'landscape']}
		>
			<View style={styles.quickMenuModalContainer}>
				<View style={styles.quickMenuModalBox}>
					<View style={styles.quickMenuModalHeader}>
						<Text style={styles.quickMenuModalTitle}>
							{t('quickMenu.title')} ({filteredQuickMenus?.length || 0})
						</Text>
						<Pressable onPress={handleClose} style={styles.closeButton}>
							<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
						</Pressable>
					</View>

					<View style={styles.searchContainer}>
						<View style={styles.searchInputContainer}>
							<MezonIconCDN icon={IconCDN.magnifyingIcon} width={size.s_12} height={size.s_12} color={themeValue.text} />
							<TextInput
								style={styles.searchInput}
								placeholder={t('quickMenu.searchPlaceholder')}
								placeholderTextColor={themeValue.text}
								value={searchText}
								onChangeText={debouncedSetSearchText}
								autoCapitalize="none"
								autoCorrect={false}
							/>
							{searchText.length > 0 && (
								<Pressable onPress={handleClearSearch} style={styles.clearButton}>
									<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_14} height={size.s_14} color={themeValue.text} />
								</Pressable>
							)}
						</View>
					</View>

					{isLoading === 'loading' ? (
						<View style={styles.loadingContainer}>
							<LoadingModal isVisible={true} />
						</View>
					) : filteredQuickMenus && filteredQuickMenus.length > 0 ? (
						<FlatList
							data={filteredQuickMenus}
							renderItem={renderQuickMenuItem}
							keyExtractor={keyExtractor}
							getItemLayout={getItemLayout}
							showsVerticalScrollIndicator={true}
							contentContainerStyle={styles.quickMenuList}
							removeClippedSubviews={true}
							maxToRenderPerBatch={5}
							windowSize={5}
							initialNumToRender={5}
							updateCellsBatchingPeriod={50}
						/>
					) : (
						<EmptyState searchText={searchText} styles={styles} themeValue={themeValue} t={t} />
					)}
				</View>
				<Pressable onPress={handleClose} />
			</View>
		</Modal>
	);
});
