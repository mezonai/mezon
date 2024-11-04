import { useCategory } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { RootState, selectAllClans, selectIsShowEmptyCategory } from '@mezon/store-mobile';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Swing } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import ChannelList from './ChannelList';
import ServerList from './ServerList';
import UserEmptyClan from './UserEmptyClan';
import { style } from './styles';

const ChannelListWrapper = React.memo(() => {
	const clans = useSelector(selectAllClans);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
	const { categorizedChannels: categorizedChannelsRaw } = useCategory();
	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);

	const categorizedChannels = useMemo(() => {
		return categorizedChannelsRaw.map((item) => {
			if (!isShowEmptyCategory && item?.channels?.length === 0) {
				return null;
			}
			return item;
		});
	}, [categorizedChannelsRaw, isShowEmptyCategory]);

	return (
		<>
			{clansLoadingStatus === 'loaded' && !clans?.length ? (
				<UserEmptyClan />
			) : (
				<MemoizedChannelList categorizedChannels={categorizedChannels} />
			)}
		</>
	);
});

const MemoizedChannelList = React.memo(ChannelList, (prevProps, nextProps) => {
	return JSON.stringify(prevProps.categorizedChannels) === JSON.stringify(nextProps.categorizedChannels);
});

const DrawerContent = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const isTabletLandscape = useTabletLandscape();
	const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);

	useEffect(() => {
		const timer = setTimeout(async () => {
			setIsReadyForUse(true);
		}, 2000);
		return () => {
			clearTimeout(timer);
		};
	}, []);
	if (!isReadyForUse)
		return (
			<View style={[styles.containerDrawerEmpty, { backgroundColor: isTabletLandscape ? themeValue.tertiary : themeValue.primary }]}>
				<Swing color={themeValue.text} />
			</View>
		);
	return (
		<View style={[styles.containerDrawerContent, { backgroundColor: isTabletLandscape ? themeValue.tertiary : themeValue.primary }]}>
			<ServerList />
			<ChannelListWrapper />
			{isTabletLandscape && <View style={styles.wall}></View>}
		</View>
	);
});

export default DrawerContent;
