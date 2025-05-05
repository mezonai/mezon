import { PlusAltIcon, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	clansActions,
	ClansEntity,
	directActions,
	getStoreAsync,
	RootState,
	selectCurrentStreamInfo,
	selectOrderedClans,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { NestableDraggableFlatList, RenderItemParams } from 'react-native-draggable-flatlist';
import { useSelector, useStore } from 'react-redux';
import { useWebRTCStream } from '../../../../../components/StreamContext/StreamContext';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { ClanIcon } from '../ClanIcon';
import CreateClanModal from '../CreateClanModal';
import { style } from './styles';

export const ListClanPopup = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isVisibleCreateClanModal, setIsVisibleCreateClanModal] = useState<boolean>(false);
	const timerRef = useRef(null);
	const navigation = useNavigation();
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const store = useStore();
	const { disconnect } = useWebRTCStream();
	const clans = useSelector(selectOrderedClans);
	useEffect(() => {
		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	const visibleCreateClanModal = useCallback((value: boolean) => {
		setIsVisibleCreateClanModal(value);
	}, []);

	const handleLeaveChannel = useCallback(async () => {
		const currentStreamInfo = selectCurrentStreamInfo(store.getState() as RootState);
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
			disconnect();
			// const idStreamByMe = streamChannelMember?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
			// dispatch(usersStreamActions.remove(idStreamByMe));
		}
	}, [disconnect, dispatch, store]);

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
			handleLeaveChannel();
		},
		[isTabletLandscape, navigation]
	);

	const renderItem = ({ item, drag, isActive }: RenderItemParams<ClansEntity>) => {
		return <ClanIcon data={item} onPress={handleChangeClan} drag={drag} isActive={isActive} />;
	};

	return (
		<View style={styles.clansBox}>
			<NestableDraggableFlatList
				scrollEnabled={false}
				data={clans?.map?.((clan) => ({ ...clan, key: clan?.id })) || []}
				keyExtractor={(clan, index) => `${clan?.clan_id}_${index}_clan_item`}
				onDragEnd={handleDragEnd}
				renderItem={renderItem}
				ListEmptyComponent={<View />}
				ListFooterComponent={() => {
					return (
						<TouchableOpacity style={styles.createClan} onPress={() => visibleCreateClanModal(!isVisibleCreateClanModal)}>
							<View style={styles.wrapperPlusClan}>
								<PlusAltIcon width={size.s_14} height={size.s_14} />
							</View>
						</TouchableOpacity>
					);
				}}
				activationDistance={15}
			/>
			<CreateClanModal visible={isVisibleCreateClanModal} setVisible={visibleCreateClanModal} />
		</View>
	);
});
