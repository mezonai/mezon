import { useTheme } from '@mezon/mobile-ui';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import ChannelList from './ChannelList';
import ProfileBar from './ProfileBar';
import ServerList from './ServerList';
import UserEmptyClan from './UserEmptyClan';
import { style } from './styles';

const ChannelListWrapper = React.memo(
	() => {
		const [showChannelList, setShowChannelList] = useState(false);

		useEffect(() => {
			const splashTask = requestAnimationFrame(async () => {
				setShowChannelList(true);
			});
			return () => cancelAnimationFrame(splashTask);
		}, []);
		if (!showChannelList) return null;
		return (
			<>
				<UserEmptyClan />
				<ChannelList />
			</>
		);
	},
	() => true
);

const ServerAndChannelList = React.memo(({ isTablet }: { isTablet?: boolean }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={[styles.containerDrawerContent, { backgroundColor: isTablet ? themeValue.tertiary : themeValue.primary }]}>
			<View style={styles.container}>
				<View style={styles.rowContainer}>
					<ServerList />
					<ChannelListWrapper />
				</View>
				{isTablet && <ProfileBar />}
			</View>
			{isTablet && <View style={styles.wall}></View>}
		</View>
	);
});

export default ServerAndChannelList;
