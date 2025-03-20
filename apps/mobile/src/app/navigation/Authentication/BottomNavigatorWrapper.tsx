import { load, STORAGE_IS_LAST_ACTIVE_TAB_DM } from '@mezon/mobile-components';
import React, { memo } from 'react';
import { View } from 'react-native';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import BottomNavigator from './BottomNavigator';

const BottomNavigatorWrapper = memo(() => {
	return (
		<View style={{ flex: 1 }}>
			<StatusBarHeight />
			<BottomNavigator isLastActiveTabDm={load(STORAGE_IS_LAST_ACTIVE_TAB_DM) === 'true'} />
		</View>
	);
});

export default BottomNavigatorWrapper;
