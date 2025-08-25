import { ActionEmitEvent, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { clansActions, directActions, getStoreAsync, selectOrderedClans, selectOrderedClansWithGroups, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { NestableDraggableFlatList } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import { ClanGroup } from '../../../../../components/ClanGroup';
import { ClanGroupPreview } from '../../../../../components/ClanGroupPreview';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { ClanIcon } from '../ClanIcon';
import CreateClanModal from '../CreateClanModal';
import { style } from './styles';

const GROUP = 'group';
const CLAN = 'clan';
const DISTANCE_OFFSET = 10;
const PREVIEW_DEBOUNCE_MS = 750;

export const ListClanPopup = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const timerRef = useRef(null);
	const navigation = useNavigation();
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const orderedClansWithGroups = useSelector(selectOrderedClansWithGroups);
	const clans = useSelector(selectOrderedClans);
	const iconDimensionsRef = useRef<{ width: number; height: number } | null>(null);
	const animationValuesRef = useRef<any>(null);
	const dragIndexRef = useRef<number | null>(null);
	const placeholderIndexRef = useRef<number | null>(null);
	const groupPreviewIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [groupPreviewMap, setGroupPreviewMap] = useState<{ [key: string]: number | null }>({});

	useEffect(() => {
		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	useEffect(() => {
		dispatch(clansActions.initializeClanGroupOrder());
	}, []);

	useEffect(() => {
		if (isDragging && animationValuesRef.current?.isDraggingCell?.value) {
			groupPreviewIntervalRef.current = setInterval(() => {
				checkCanGroupRealTime();
			}, PREVIEW_DEBOUNCE_MS);
		}

		return () => {
			if (groupPreviewIntervalRef.current) {
				clearInterval(groupPreviewIntervalRef.current);
				groupPreviewIntervalRef.current = null;
			}
		};
	}, [isDragging]);

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

	const checkCanGroupRealTime = () => {
		if (
			!isDragging ||
			!animationValuesRef.current?.isDraggingCell?.value ||
			dragIndexRef.current === null ||
			placeholderIndexRef.current === null
		) {
			return;
		}

		const fromItem = groupClans[dragIndexRef.current];
		const toItem = groupClans[placeholderIndexRef.current];

		if (!fromItem || !toItem) return;

		let currentDragDistance = 0;
		if (animationValuesRef.current?.hoverAnim?.value) {
			const indexDiff = Math.abs(placeholderIndexRef.current - dragIndexRef.current);
			const multiIndexDistanceOffset = DISTANCE_OFFSET * indexDiff;
			currentDragDistance = Math.abs(animationValuesRef.current.hoverAnim.value) + DISTANCE_OFFSET + multiIndexDistanceOffset;
		}

		const currentThreshold = calculateDynamicThreshold(dragIndexRef.current, placeholderIndexRef.current);
		const canGroup =
			currentThreshold !== null && currentDragDistance !== null && fromItem?.type === CLAN && currentDragDistance < currentThreshold;
		canGroup
			? setGroupPreviewMap({
					[toItem?.clan?.clan_id ?? toItem?.group?.id]: placeholderIndexRef.current
				})
			: setGroupPreviewMap({});
	};

	const onCreateClanModal = useCallback(() => {
		const data = {
			children: <CreateClanModal />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const handleAnimValInit = useCallback((animVals: any) => {
		animationValuesRef.current = animVals;
	}, []);

	const getIconLayout = useCallback((dimensions: { width: number; height: number }) => {
		iconDimensionsRef.current = dimensions;
	}, []);

	const calculateDynamicThreshold = (from: number, to: number) => {
		const minDistance = iconDimensionsRef.current?.height;
		const maxDistance = minDistance * 2;
		const fromIndex = Math.min(from, to);
		const toIndex = Math.max(from, to);
		const indexDiff = Math.abs(to - from);
		const baseThreshold = (minDistance + maxDistance) / 2;

		try {
			let expandedGroupsCount = 0;
			let expandedGroupsItemCount = 0;

			groupClans.slice(fromIndex, toIndex + 1).forEach((item) => {
				if (item?.type === GROUP && item?.group?.clanIds?.length > 0 && item?.group?.isExpanded) {
					expandedGroupsCount++;
					expandedGroupsItemCount += 1 + item.group.clanIds.length;
				}
			});

			if (expandedGroupsItemCount > 0) {
				const adjustedIndexDiff = indexDiff - expandedGroupsCount;
				const thresholdMultiplier = expandedGroupsItemCount + adjustedIndexDiff;
				return baseThreshold * thresholdMultiplier - thresholdMultiplier;
			}

			return baseThreshold * indexDiff - indexDiff;
		} catch (error) {
			console.error('Error in calculateDynamicThreshold: ', error);
			return 0;
		}
	};

	const handlePlaceholderIndexChange = useCallback(
		(placeholderIndex: number) => {
			if (!isDragging) return;
			placeholderIndexRef.current = placeholderIndex;
		},
		[isDragging]
	);

	const handleDragBegin = useCallback((index: number) => {
		setIsDragging(true);
		dragIndexRef.current = index;
		placeholderIndexRef.current = index;
	}, []);

	const handleDragEnd = useCallback(
		({ data, from, to }) => {
			setIsDragging(false);
			dragIndexRef.current = null;
			placeholderIndexRef.current = null;

			if (from === to) {
				return;
			}

			try {
				const fromItem = groupClans[from];
				const toItem = groupClans[to];

				if (fromItem?.type === GROUP || groupPreviewMap?.[toItem?.clan?.clan_id ?? toItem?.group?.id] === undefined) {
					const newClanGroupOrder = data?.map((item) => {
						if (item?.type === GROUP) {
							return {
								type: GROUP,
								id: item?.id,
								groupId: item?.group?.id
							};
						} else if (item?.type === CLAN) {
							return {
								type: CLAN,
								id: item?.id,
								clanId: item?.clan?.clan_id
							};
						}
					});

					dispatch(clansActions.updateClanGroupOrder(newClanGroupOrder));
				} else if (groupPreviewMap?.[toItem?.clan?.clan_id ?? toItem?.group?.id] !== undefined) {
					requestAnimationFrame(() => {
						if (toItem?.type === GROUP) {
							dispatch(
								clansActions.addClanToGroup({
									groupId: toItem?.group?.id,
									clanId: fromItem?.clan?.clan_id
								})
							);
						} else if (toItem?.type === CLAN) {
							dispatch(
								clansActions.createClanGroup({
									clanIds: [fromItem?.clan?.clan_id, toItem?.clan?.clan_id]
								})
							);
						}
					});
				}
			} catch (error) {
				console.error('Error in handleDragEnd', error);
			} finally {
				setGroupPreviewMap({});
			}
		},
		[groupClans, groupPreviewMap]
	);

	const handleChangeClan = useCallback(
		async (clanId: string) => {
			const store = await getStoreAsync();
			if (isTabletLandscape) {
				navigation.navigate(APP_SCREEN.HOME as never);
				store.dispatch(directActions.setDmGroupCurrentId(''));
			}
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			save(STORAGE_CLAN_ID, clanId);
			store.dispatch(clansActions.setCurrentClanId(clanId));
			requestAnimationFrame(async () => {
				const promises = [];
				promises.push(store.dispatch(clansActions.joinClan({ clanId: clanId })));
				promises.push(store.dispatch(clansActions.changeCurrentClan({ clanId: clanId })));
				await Promise.allSettled(promises);
			});
		},
		[isTabletLandscape, navigation]
	);

	const renderItem = ({ item, drag, isActive }) => {
		if (item?.type === GROUP) {
			return (
				<>
					<ClanGroup
						key={`group-${item?.group?.id}`}
						group={item?.group}
						onClanPress={handleChangeClan}
						clans={clans}
						drag={drag}
						isActive={isActive}
					/>
					{groupPreviewMap?.[item?.group?.id] !== undefined && (
						<ClanGroupPreview targetItem={item} dragItem={groupClans[dragIndexRef.current]} clans={clans} />
					)}
				</>
			);
		} else if (item?.type === CLAN) {
			return (
				<>
					<ClanIcon
						key={`clan-${item?.clan?.clan_id}`}
						data={item?.clan}
						onPress={handleChangeClan}
						drag={drag}
						isActive={isActive}
						onLayout={getIconLayout}
					/>
					{groupPreviewMap?.[item?.clan?.clan_id] !== undefined && (
						<ClanGroupPreview targetItem={item} dragItem={groupClans[dragIndexRef.current]} clans={clans} />
					)}
				</>
			);
		}
	};

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
				onPlaceholderIndexChange={handlePlaceholderIndexChange}
				renderItem={renderItem}
				ListEmptyComponent={<View />}
				ListFooterComponent={() => {
					return (
						<TouchableOpacity style={styles.createClan} onPress={onCreateClanModal}>
							<View style={styles.wrapperPlusClan}>
								<MezonIconCDN icon={IconCDN.plusLargeIcon} color={baseColor.blurple} width={size.s_18} height={size.s_18} />
							</View>
						</TouchableOpacity>
					);
				}}
				activationDistance={40}
			/>
		</View>
	);
});
