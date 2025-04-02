import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store';
import { User } from 'mezon-js';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import UserProfile from '../../screens/home/homedrawer/components/UserProfile';

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

	useEffect(() => {
		if (userId || user) {
			const data = {
				snapPoints: ['60%'],
				heightFitContent: true,
				hiddenHeaderIndicator: true,
				children: (
					<View
						style={{
							borderTopLeftRadius: size.s_14,
							borderTopRightRadius: size.s_14,
							overflow: 'hidden'
						}}
					>
						<UserProfile
							userId={userId}
							user={user}
							onClose={onClose}
							showAction={showAction}
							showRole={showRole}
							currentChannel={currentChannel}
						/>
					</View>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}
		return () => {
			onClose();
		};
	}, [userId, user]);
	return <View />;
});
