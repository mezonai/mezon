import { useAuth } from '@mezon/core';
import { PlusAltIcon, remove, save, setDefaultChannelLoader, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
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
	const clans = useSelector(selectAllClans).sort((a, b) => {
		const nameA = a.clan_name ?? '';
		const nameB = b.clan_name ?? '';
		return nameA.localeCompare(nameB);
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
			const channelResp = await store.dispatch(channelsActions.fetchChannels({ clanId: clanId }));
			if (channelResp?.payload) {
				await setDefaultChannelLoader(channelResp.payload, clanId);
			}
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
			{clans?.length > 0 ? (
				clans?.map((clan, index) => <ClanIcon data={clan} onPress={handleChangeClan} key={`${index}_${clan?.id}_clan_item`} />)
			) : (
				<View />
			)}

			<Pressable style={styles.createClan} onPress={() => visibleCreateClanModal(!isVisibleCreateClanModal)}>
				<View style={styles.wrapperPlusClan}>
					<PlusAltIcon width={size.s_14} height={size.s_14} />
				</View>
			</Pressable>
			<CreateClanModal visible={isVisibleCreateClanModal} setVisible={visibleCreateClanModal} />
		</View>
	);
});
