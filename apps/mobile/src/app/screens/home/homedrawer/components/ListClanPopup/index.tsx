import { ActionEmitEvent, PlusAltIcon, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { clansActions, ClansEntity, directActions, getStoreAsync, selectOrderedClans, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { NestableDraggableFlatList, RenderItemParams } from 'react-native-draggable-flatlist';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { ClanIcon } from '../ClanIcon';
import CreateClanModal from '../CreateClanModal';
import { style } from './styles';

export const ListClanPopup = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const timerRef = useRef(null);
	const navigation = useNavigation();
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const clans = useSelector(selectOrderedClans);
	useEffect(() => {
		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	const onCreateClanModal = useCallback(() => {
		const data = {
			children: <CreateClanModal />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, []);

	const handleDragEnd = useCallback(
		({ data }) => {
			const newListOrder = data?.map((c) => c?.clan_id);
			dispatch(clansActions.updateClansOrder(newListOrder));
		},
		[dispatch]
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
				await Promise.all(promises);
			});
		},
		[isTabletLandscape, navigation]
	);

	const renderItem = ({ item, drag, isActive }: RenderItemParams<ClansEntity>) => {
		return <ClanIcon key={`clan-${item.clan_id}`} data={item} onPress={handleChangeClan} drag={drag} isActive={isActive} />;
	};

	return (
		<View style={styles.clansBox}>
			<NestableDraggableFlatList
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
				scrollEnabled={false}
				removeClippedSubviews={false}
				data={clans?.map?.((clan) => ({ ...clan, key: clan?.id })) || []}
				keyExtractor={(clan, index) => `${clan?.clan_id}_${index}_clan_item`}
				onDragEnd={handleDragEnd}
				renderItem={renderItem}
				ListEmptyComponent={<View />}
				ListFooterComponent={() => {
					return (
						<TouchableOpacity style={styles.createClan} onPress={onCreateClanModal}>
							<View style={styles.wrapperPlusClan}>
								<PlusAltIcon width={size.s_14} height={size.s_14} />
							</View>
						</TouchableOpacity>
					);
				}}
				activationDistance={40}
			/>
		</View>
	);
});
