import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import Images from 'apps/mobile/src/assets/Images';
import { ChannelType, User } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import ImageNative from '../../../components/ImageNative';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonButton from '../../../componentUI/MezonButton';
import { style } from './styles';

export type Receiver = {
	channel_id?: string;
	channel_label?: string;
	channel_avatar?: string[];
	type?: ChannelType;
	user?: User;
	id?: string;
	topic?: string;
};

export interface IFriendListItemProps {
	dmGroup?: Receiver;
	user?: Receiver;
	isSent?: boolean;
	actionType?: ActionType;
	onPress: (directParamId?: string, type?: number, dmGroup?: Receiver) => void;
}

export enum ActionType {
	INVITE = 'invite',
	TRANSFER_CLAN = 'transfer_clan'
}

export const FriendListItem = React.memo((props: IFriendListItemProps) => {
	const { dmGroup, user, isSent, actionType, onPress } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation();
	const styles = style(themeValue);
	const isGroupAvatar = !dmGroup?.topic?.includes('avatar-group.png');
	const buttonTitle = useMemo(() => {
		if (actionType === ActionType.TRANSFER_CLAN) {
			return t('transferOwnership.btnTransfer', 'Transfer');
		}
		return isSent ? t('btnSent', 'Sent') : t('btnInvite', 'Invite');
	}, [actionType]);

	return (
		<View>
			{dmGroup?.channel_id ? (
				<TouchableOpacity
					disabled={isSent}
					onPress={() => {
						onPress(dmGroup.channel_id || '', dmGroup.type || 0, dmGroup);
					}}
					style={[styles.friendItemWrapper, isSent && styles.friendItemWrapperInvited]}
				>
					<View style={styles.friendItemContent}>
						{Number(dmGroup.type) === ChannelType.CHANNEL_TYPE_GROUP ? (
							isGroupAvatar ? (
								<View style={styles.groupAvatarWrapper}>
									<ImageNative
										url={createImgproxyUrl(dmGroup?.topic ?? '')}
										style={{ width: '100%', height: '100%' }}
										resizeMode={'cover'}
									/>
								</View>
							) : (
								<Image source={Images.AVATAR_GROUP} style={styles.defaultAvatar} />
							)
						) : (
							<MezonAvatar avatarUrl={dmGroup?.channel_avatar?.at(0)} username={dmGroup?.channel_label} height={size.s_40} width={size.s_40} />
						)}
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{dmGroup?.channel_label}
						</Text>
					</View>
					<MezonButton
						title={isSent ? t('btnSent') : t('btnInvite')}
						containerStyle={[styles.inviteButton]}
						disabled={isSent}
						onPress={() => {
							onPress(dmGroup.channel_id || '', dmGroup.type || 0, dmGroup);
						}}
					/>
				</TouchableOpacity>
			) : (
				<TouchableOpacity
					disabled={isSent}
					onPress={() => {
						onPress('', 0, user);
					}}
					style={[styles.friendItemWrapper, isSent && styles.friendItemWrapperInvited]}
				>
					<View style={styles.friendItemContent}>
						<MezonAvatar username={user?.user?.display_name} avatarUrl={user?.user?.avatar_url} />
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{user?.user?.display_name}
						</Text>
					</View>
					<MezonButton
						containerStyle={[styles.inviteButton]}
						disabled={isSent}
						onPress={() => {
							onPress('', 0, user);
						}}
						title={buttonTitle}
					/>
				</TouchableOpacity>
			)}
		</View>
	);
});
