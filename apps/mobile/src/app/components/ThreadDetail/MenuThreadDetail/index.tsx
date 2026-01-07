import type { DirectEntity } from '@mezon/store-mobile';
import { selectCurrentChannel } from '@mezon/store-mobile';
import React, { createContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { style } from './style';

import { useTheme } from '@mezon/mobile-ui';
import type { IChannel } from '@mezon/utils';
import LinearGradient from 'react-native-linear-gradient';
import StatusBarHeight from '../../StatusBarHeight/StatusBarHeight';
import { ActionRow } from '../ActionRow';
import { AssetsViewer } from '../AssetViewer';
import { ThreadHeader } from '../ThreadHeader';

export const threadDetailContext = createContext<IChannel | DirectEntity>(null);

export default function MenuThreadDetail(props: { route: any }) {
	const { themeValue } = useTheme();
	const styles = style();
	const directMessage = props.route?.params?.directMessage as DirectEntity;
	const currentChannel = useSelector(selectCurrentChannel);
	const channel = useMemo(() => {
		if (directMessage?.id) {
			return directMessage;
		}
		return currentChannel;
	}, [directMessage, currentChannel]);

	return (
		<threadDetailContext.Provider value={channel}>
			<View style={{ flex: 1 }}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<StatusBarHeight />
				<View style={styles.container}>
					<ThreadHeader />
					<ActionRow />
					<AssetsViewer channelId={channel?.channelId} />
				</View>
			</View>
		</threadDetailContext.Provider>
	);
}
