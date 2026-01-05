import { size, useTheme } from '@mezon/mobile-ui';
import { createImgproxyUrl } from '@mezon/utils';
import type { User } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Images from '../../../../assets/Images';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonButton from '../../../componentUI/MezonButton';
import ImageNative from '../../../components/ImageNative';
import { style } from './styles';

export type Receiver = {
	channelId?: string;
	channelLabel?: string;
	channel_avatar?: string;
	type?: ChannelType;
	user?: User;
	id?: string;
	topic?: string;
};

export interface IFriendListItemProps {
	dmGroup?: Receiver;
	user?: Receiver;
	isSent?: boolean;
	onPress: (directParamId?: string, type?: number, dmGroup?: Receiver) => void;
}

export const FriendListItem = memo((props: IFriendListItemProps) => {
	const { dmGroup, user, isSent, onPress } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation(['inviteToChannel']);
	const styles = style(themeValue);
	const isGroupAvatar = !dmGroup?.channel_avatar?.includes('avatar-group.png');

	const priorityName = useMemo(() => {
		return user?.user?.displayName || user?.user?.username || '';
	}, [user?.user?.displayName, user?.user?.username]);

	return (
		<View>
			{dmGroup?.channelId ? (
				<TouchableOpacity
					disabled={isSent}
					onPress={() => {
						onPress(dmGroup.channelId || '', dmGroup?.type || 0, dmGroup);
					}}
					style={[styles.friendItemWrapper, isSent && styles.friendItemWrapperInvited]}
				>
					<View style={styles.friendItemContent}>
						{Number(dmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP ? (
							isGroupAvatar ? (
								<View style={styles.groupAvatarWrapper}>
									<ImageNative
										url={createImgproxyUrl(dmGroup?.channel_avatar ?? '')}
										style={styles.imageFull}
										resizeMode={'cover'}
									/>
								</View>
							) : (
								<Image source={Images.AVATAR_GROUP} style={styles.defaultAvatar} />
							)
						) : (
							<MezonAvatar avatarUrl={dmGroup?.channel_avatar} username={dmGroup?.channelLabel} height={size.s_40} width={size.s_40} />
						)}
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{dmGroup?.channelLabel}
						</Text>
					</View>
					<MezonButton
						title={isSent ? t('btnSent') : t('btnInvite')}
						containerStyle={[styles.inviteButton]}
						disabled={isSent}
						onPress={() => {
							onPress(dmGroup.channelId || '', dmGroup?.type || 0, dmGroup);
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
						<MezonAvatar username={user?.user?.username} avatarUrl={user?.user?.avatarUrl} />
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{priorityName}
						</Text>
					</View>
					<MezonButton
						containerStyle={[styles.inviteButton]}
						disabled={isSent}
						onPress={() => {
							onPress('', 0, user);
						}}
						title={isSent ? t('btnSent') : t('btnInvite')}
					/>
				</TouchableOpacity>
			)}
		</View>
	);
});
