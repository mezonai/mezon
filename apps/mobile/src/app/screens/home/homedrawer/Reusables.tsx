import { useTheme } from '@mezon/mobile-ui';
import { ChannelType, User } from 'mezon-js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Images from '../../../../assets/Images';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { MezonButton } from '../../../componentUI/MezonButton';
import { style } from './styles';

export type Receiver = {
	channel_id?: string;
	channel_label?: string;
	channel_avatar?: string[];
	type?: ChannelType;
	user?: User;
	id?: string;
};

export interface IFriendListItemProps {
	dmGroup?: Receiver;
	user?: Receiver;
	isSent?: boolean;
	onPress: (directParamId?: string, type?: number, dmGroup?: Receiver) => void;
}

export interface IListMemberInviteProps {
	urlInvite: string;
	searchTerm: string;
	channelID?: string;
}

export const FastImageRes = React.memo(({ uri, isCirle = false }: { uri: string; isCirle?: boolean }) => {
	return (
		<FastImage
			style={[{ width: '100%', height: '100%' }, isCirle && { borderRadius: 50 }]}
			source={{
				uri: uri,
				headers: { Authorization: 'someAuthToken' },
				priority: FastImage.priority.normal
			}}
			resizeMode={FastImage.resizeMode.cover}
		/>
	);
});

export const FriendListItem = React.memo((props: IFriendListItemProps) => {
	const { dmGroup, user, isSent, onPress } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation();
	const styles = style(themeValue);

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
							<Image source={Images.AVATAR_GROUP} style={{ width: 40, height: 40, borderRadius: 50 }} />
						) : (
							<MezonAvatar avatarUrl={dmGroup?.channel_avatar?.at(0)} username={dmGroup?.channel_label} height={40} width={40} />
						)}
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{dmGroup?.channel_label}
						</Text>
					</View>
					<View>
						<MezonButton
							viewContainerStyle={[styles.inviteButton]}
							disabled={isSent}
							onPress={() => {
								onPress(dmGroup.channel_id || '', dmGroup.type || 0, dmGroup);
							}}
						>
							{isSent ? t('btnSent') : t('btnInvite')}
						</MezonButton>
					</View>
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
					<View>
						<MezonButton
							viewContainerStyle={[styles.inviteButton]}
							disabled={isSent}
							onPress={() => {
								onPress('', 0, user);
							}}
						>
							{isSent ? t('btnSent') : t('btnInvite')}
						</MezonButton>
					</View>
				</TouchableOpacity>
			)}
		</View>
	);
});
