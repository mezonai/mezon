import { ActionEmitEvent } from '@mezon/mobile-components';
import { Block, size } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store';
import { User } from 'mezon-js';
import React, { useEffect, useRef } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { MezonBottomSheet } from '../../componentUI';
import UserProfile from '../../screens/home/homedrawer/components/UserProfile';
import { styles } from './styles';

interface IUserInformationBottomSheetProps {
	userId?: string;
	user?: User;
	onClose: () => void;
	showAction?: boolean;
	showRole?: boolean;
	currentChannel?: ChannelsEntity;
}

export const UserInformationBottomSheet = React.memo((props: IUserInformationBottomSheetProps) => {
	const { onClose, userId, user, showAction = true, showRole = true, currentChannel } = props;
	const bottomSheetRef = useRef(null);
	const snapPoints = ['60%'];
	useEffect(() => {
		const showUserInfoBottomSheetListener = DeviceEventEmitter.addListener(
			ActionEmitEvent.SHOW_INFO_USER_BOTTOM_SHEET,
			({ isHiddenBottomSheet }) => {
				isHiddenBottomSheet && bottomSheetRef.current?.close();
			}
		);
		return () => {
			showUserInfoBottomSheetListener.remove();
		};
	}, []);

	useEffect(() => {
		if (bottomSheetRef) {
			if (userId || user) {
				bottomSheetRef.current?.present();
			} else {
				bottomSheetRef.current?.close();
			}
		}
	}, [userId, user]);
	return (
		<MezonBottomSheet
			ref={bottomSheetRef}
			snapPoints={snapPoints}
			heightFitContent={true}
			onDismiss={onClose}
			style={styles.bottomSheet}
			handleComponent={() => {
				return (
					<View style={styles.bottomSheetBarWrapper}>
						<View style={styles.bottomSheetBar} />
					</View>
				);
			}}
		>
			<Block overflow="hidden" borderTopLeftRadius={size.s_14} borderTopRightRadius={size.s_14}>
				<UserProfile
					userId={userId}
					user={user}
					onClose={onClose}
					showAction={showAction}
					showRole={showRole}
					currentChannel={currentChannel}
				></UserProfile>
			</Block>
		</MezonBottomSheet>
	);
});
