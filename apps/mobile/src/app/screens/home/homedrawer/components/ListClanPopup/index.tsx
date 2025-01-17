import { useAuth } from '@mezon/core';
import { PlusAltIcon, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	clansActions,
	getStoreAsync,
	selectAllClans,
	selectCurrentStreamInfo,
	selectStreamMembersByChannelId,
	useAppDispatch,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
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
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);
	const { disconnect } = useWebRTCStream();
	const streamChannelMember = useSelector(selectStreamMembersByChannelId(currentStreamInfo?.streamId || ''));
	const { userProfile } = useAuth();
	const clans = useSelector(selectAllClans);
	clans.sort((a, b) => {
		const nameA = a.clan_name ?? '';
		const nameB = b.clan_name ?? '';

		if (nameA < nameB) {
			return -1;
		}
		if (nameA > nameB) {
			return 1;
		}
		return 0;
	});
	useEffect(() => {
		return () => {
			timerRef?.current && clearTimeout(timerRef.current);
		};
	}, []);

	const visibleCreateClanModal = useCallback((value: boolean) => {
		setIsVisibleCreateClanModal(value);
	}, []);

	const handleLeaveChannel = useCallback(async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
			disconnect();
			const idStreamByMe = streamChannelMember?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
			dispatch(usersStreamActions.remove(idStreamByMe));
		}
	}, [currentStreamInfo, disconnect, streamChannelMember, dispatch, userProfile]);

	const handleChangeClan = useCallback(
		async (clanId: string) => {
			if (isTabletLandscape) navigation.navigate(APP_SCREEN.HOME as never);
			const store = await getStoreAsync();
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			save(STORAGE_CLAN_ID, clanId);
			store.dispatch(clansActions.setCurrentClanId(clanId));
			// const channelResp = await store.dispatch(channelsActions.fetchChannels({ clanId: clanId }));
			// if (channelResp?.payload) {
			// 	await setDefaultChannelLoader(channelResp.payload, clanId);
			// }
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

	return (
		<View style={styles.clansBox}>
			<FlashList
				scrollEnabled={false}
				estimatedItemSize={size.s_48}
				data={clans}
				keyExtractor={(clan) => `${clan?.id}_clan_item`}
				renderItem={({ item }) => <ClanIcon data={item} onPress={handleChangeClan} />}
				ListEmptyComponent={<View />}
				ListFooterComponent={() => {
					return (
						<Pressable style={styles.createClan} onPress={() => visibleCreateClanModal(!isVisibleCreateClanModal)}>
							<View style={styles.wrapperPlusClan}>
								<PlusAltIcon width={size.s_14} height={size.s_14} />
							</View>
						</Pressable>
					);
				}}
			/>
			<CreateClanModal visible={isVisibleCreateClanModal} setVisible={visibleCreateClanModal} />
		</View>
	);
});
