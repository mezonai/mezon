import { ActionEmitEvent, load, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	clansActions,
	directActions,
	getStoreAsync,
	selectCurrentClanId,
	selectOrderedClans,
	selectOrderedClansWithGroups,
	useAppDispatch
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, InteractionManager, Platform, TouchableOpacity, Vibration, View } from 'react-native';
import { NestableDraggableFlatList } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import { ClanGroup } from '../../../../../components/ClanGroup';
import { ClanGroupPreview } from '../../../../../components/ClanGroupPreview';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { ClanIcon } from '../ClanIcon';
import CreateClanTemplate from '../CreateClanTemplate';
import JoinClanModal from '../JoinClanModal';
import { style } from './styles';

const GROUP = 'group';
const CLAN = 'clan';
const CHECK_INTERVAL_MS = 300;
const GROUPING_THRESHOLD_MIN = 0.2;
const GROUPING_THRESHOLD_MAX = 0.8;
const MARGIN_ICON = size.s_10;
const DEFAULT_CLAN_ICON_HEIGHT = size.s_42;

export const ListClanPopup = React.memo(({ hideActive = false }: { hideActive?: boolean }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation();
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const orderedClansWithGroups = useSelector(selectOrderedClansWithGroups);
	const clans = useSelector(selectOrderedClans);
	const currentClanId = useSelector(selectCurrentClanId);
	const [isDragging, setIsDragging] = useState(false);
	const [targetPreview, setTargetPreview] = useState<{ [key: string]: number | null }>({});
	const [groupingTargetIndex, setGroupingTargetIndex] = useState<number | null>(null);
	const dragIndexRef = useRef<number | null>(null);
	const lastTargetCanGroupIndexRef = useRef<number | null>(null);
	const animationValuesRef = useRef<any>(null);
	const iconDimensionsRef = useRef<{ width: number; height: number } | null>(null);
	const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		dispatch(clansActions.initializeClanGroupOrder());
	}, [dispatch]);

	const groupClans = useMemo(() => {
		if (!orderedClansWithGroups?.length) return [];

		try {
			return orderedClansWithGroups.reduce((acc, item) => {
				if (item?.type === CLAN) {
					acc.push(item);
				}

				if (item?.type === GROUP && item?.group?.clanIds?.length > 0) {
					const validClanIds = item.group.clanIds.filter((clanId) => clans?.find((c) => c?.clan_id === clanId));

					if (validClanIds.length > 0) {
						acc.push({
							...item,
							group: {
								...item.group,
								clanIds: validClanIds
							}
						});
					}
				}

				return acc;
			}, []);
		} catch (error) {
			console.error('Error in groupClans: ', error);
			return [];
		}
	}, [orderedClansWithGroups, clans]);

	const clanIconSpacing = useMemo(() => {
		const height = iconDimensionsRef.current?.height || DEFAULT_CLAN_ICON_HEIGHT;
		return height + MARGIN_ICON;
	}, []);

	const handleDrag = useCallback(
		(drag: () => void) => () => {
			dispatch(clansActions.collapseAllGroups());
			InteractionManager.runAfterInteractions(() => {
				requestAnimationFrame(() => {
					drag();
				});
			});
		},
		[dispatch]
	);

	const clearGroupingState = useCallback(() => {
		lastTargetCanGroupIndexRef.current = null;
		setTargetPreview({});
		setGroupingTargetIndex(null);
	}, []);

	const checkCanGroupRealTime = useCallback(() => {
		if (dragIndexRef.current === null || !animationValuesRef.current?.isDraggingCell?.value || !animationValuesRef.current?.hoverAnim?.value) {
			return;
		}

		const fromItem = groupClans[dragIndexRef.current];
		if (!fromItem || fromItem?.type !== CLAN) {
			clearGroupingState();
			return;
		}

		const hoverDistance = animationValuesRef.current.hoverAnim.value;
		const indexOffset = Math.abs(hoverDistance) / clanIconSpacing;
		const fractionalPart = indexOffset % 1;
		const isGrouping = fractionalPart >= GROUPING_THRESHOLD_MIN && fractionalPart <= GROUPING_THRESHOLD_MAX;

		if (isGrouping) {
			let targetIndex: number;
			if (hoverDistance > 0) {
				targetIndex = dragIndexRef.current + Math.ceil(indexOffset);
			} else {
				targetIndex = dragIndexRef.current - Math.ceil(indexOffset);
			}

			if (targetIndex === groupClans.length) {
				clearGroupingState();
				return;
			}

			if (targetIndex !== dragIndexRef.current) {
				const targetItem = groupClans[targetIndex];
				if (targetItem) {
					if (Platform.OS === 'android' && lastTargetCanGroupIndexRef.current !== targetIndex) {
						Vibration.vibrate(30);
					}
					lastTargetCanGroupIndexRef.current = targetIndex;
					if (targetItem?.type === CLAN) {
						setTargetPreview({
							[targetItem?.clan?.clan_id]: targetIndex
						});
						setGroupingTargetIndex(null);
					} else {
						setTargetPreview({});
						setGroupingTargetIndex(targetIndex);
					}
					return;
				}
			}
		}

		clearGroupingState();
	}, [clanIconSpacing, clearGroupingState, groupClans]);

	useEffect(() => {
		if (isDragging) {
			checkIntervalRef.current = setInterval(() => {
				checkCanGroupRealTime();
			}, CHECK_INTERVAL_MS);
		}

		return () => {
			if (checkIntervalRef.current) {
				clearInterval(checkIntervalRef.current);
				checkIntervalRef.current = null;
			}
		};
	}, [isDragging, checkCanGroupRealTime]);

	const onCreateClanModal = useCallback(() => {
		const data = {
			children: <CreateClanTemplate />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const onJoinNewClanModal = useCallback(() => {
		const data = {
			children: <JoinClanModal />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const handleAnimValInit = useCallback((animVals: any) => {
		animationValuesRef.current = animVals;
	}, []);

	const getIconLayout = useCallback((dimensions: { width: number; height: number }) => {
		iconDimensionsRef.current = dimensions;
	}, []);

	const handleDragBegin = useCallback(
		(index: number) => {
			dragIndexRef.current = index;
			clearGroupingState();
			setIsDragging(true);
		},
		[clearGroupingState]
	);

	const handleDragEnd = useCallback(
		({ data, from }) => {
			if (checkIntervalRef.current) {
				clearInterval(checkIntervalRef.current);
				checkIntervalRef.current = null;
			}

			try {
				const fromItem = groupClans[from];
				const toItem = groupClans[lastTargetCanGroupIndexRef.current];

				if (lastTargetCanGroupIndexRef.current !== null && fromItem?.type === CLAN && !!toItem) {
					requestAnimationFrame(() => {
						if (toItem?.type === GROUP) {
							dispatch(
								clansActions.addClanToGroup({
									groupId: toItem?.group?.id,
									clanId: fromItem?.clan?.clan_id
								})
							);
						} else {
							dispatch(
								clansActions.createClanGroup({
									clanIds: [fromItem?.clan?.clan_id, toItem?.clan?.clan_id]
								})
							);
						}
					});
				} else {
					const newClanGroupOrder = data?.map((item) => ({
						type: item?.type,
						id: item?.id,
						...(item?.type === GROUP ? { groupId: item?.group?.id } : { clanId: item?.clan?.clan_id })
					}));
					dispatch(clansActions.updateClanGroupOrder(newClanGroupOrder));
				}
			} catch (error) {
				console.error('Error in handleDragEnd', error);
			} finally {
				dragIndexRef.current = null;
				clearGroupingState();
				setIsDragging(false);
			}
		},
		[groupClans, dispatch, clearGroupingState]
	);

	const handleChangeClan = useCallback(
		async (clanId: string) => {
			const store = await getStoreAsync();
			const clanPreviousId = await load(STORAGE_CLAN_ID);
			store.dispatch(clansActions.listClanUnreadMsgIndicator({ clanIds: [clanPreviousId] }));
			if (isTabletLandscape) {
				navigation.navigate(APP_SCREEN.HOME as never);
				store.dispatch(directActions.setDmGroupCurrentId(''));
			}
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			save(STORAGE_CLAN_ID, clanId);
			store.dispatch(clansActions.setCurrentClanId(clanId));
			requestAnimationFrame(async () => {
				const promises = [];
				promises.push(store.dispatch(clansActions.joinClan({ clanId })));
				promises.push(store.dispatch(clansActions.changeCurrentClan({ clanId })));
				await Promise.allSettled(promises);
			});
		},
		[isTabletLandscape, navigation]
	);

	const groupPreview = useMemo(() => {
		const targetIndex = Object.values(targetPreview)[0];
		if (targetIndex == null) return null;
		return groupClans[targetIndex];
	}, [targetPreview, groupClans]);

	const renderItem = useCallback(
		({ item, drag, isActive, getIndex }) => {
			if (isActive && item?.type === CLAN && groupPreview) {
				return <ClanGroupPreview targetItem={groupPreview} dragItem={item} clans={clans} />;
			}

			const index = getIndex();
			if (item?.type === GROUP) {
				return (
					<ClanGroup
						key={`group-${item?.group?.id}`}
						group={item?.group}
						onClanPress={handleChangeClan}
						clans={clans}
						drag={handleDrag(drag)}
						isActive={isActive}
						isGroupingTarget={groupingTargetIndex === index}
					/>
				);
			} else {
				return (
					<ClanIcon
						key={`clan-${item?.clan?.clan_id}`}
						data={item?.clan}
						onPress={handleChangeClan}
						drag={handleDrag(drag)}
						isActive={isActive}
						isActiveCurrentClan={currentClanId === item?.clan?.clan_id}
						onLayout={getIconLayout}
						hideActive={hideActive}
					/>
				);
			}
		},
		[groupPreview, clans, groupingTargetIndex, handleChangeClan, handleDrag, currentClanId, getIconLayout, hideActive]
	);

	const ListFooter = useMemo(
		() => (
			<View>
				{clans?.length === 0 && (
					<TouchableOpacity style={styles.createClan} onPress={onJoinNewClanModal}>
						<View style={styles.wrapperPlusClan}>
							<MezonIconCDN icon={IconCDN.joinClanIcon} useOriginalColor={true} width={size.s_30} height={size.s_30} />
						</View>
					</TouchableOpacity>
				)}
				<TouchableOpacity style={styles.createClan} onPress={onCreateClanModal}>
					<View style={styles.wrapperPlusClan}>
						<MezonIconCDN icon={IconCDN.plusLargeIcon} color={baseColor.blurple} width={size.s_18} height={size.s_18} />
					</View>
				</TouchableOpacity>
			</View>
		),
		[clans, onCreateClanModal, onJoinNewClanModal]
	);

	return (
		<View style={styles.clansBox}>
			<NestableDraggableFlatList
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
				scrollEnabled={false}
				removeClippedSubviews={false}
				data={groupClans}
				keyExtractor={(item, index) => `${item?.id}_${index}_item`}
				onDragBegin={handleDragBegin}
				onDragEnd={handleDragEnd}
				onAnimValInit={handleAnimValInit}
				renderItem={renderItem}
				ListEmptyComponent={<View />}
				ListFooterComponent={ListFooter}
				activationDistance={40}
			/>
		</View>
	);
});
