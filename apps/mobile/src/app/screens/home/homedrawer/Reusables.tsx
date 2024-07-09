import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { DirectEntity, UsersClanEntity } from '@mezon/store-mobile';
import Images from '../../../../assets/Images';
import { MezonButton } from '../../../temp-ui';
import MezonAvatar from '../../../temp-ui/MezonAvatar';
import { style } from './styles';
import { useTheme } from '@mezon/mobile-ui';

export const ChannelListContext = React.createContext({} as any);
export interface IFriendListItemProps {
	dmGroup?: DirectEntity;
	user?: UsersClanEntity;
	isSent?: boolean;
	onPress: (directParamId?: string, type?: number, userId?: string, dmGroup?: DirectEntity) => void;
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
				priority: FastImage.priority.normal,
			}}
			resizeMode={FastImage.resizeMode.cover}
		/>
	);
});

export const FriendListItem = React.memo((props: IFriendListItemProps) => {
	const { dmGroup, user, isSent, onPress } = props;
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View>
			{dmGroup?.channel_id ? (
				<TouchableOpacity
					disabled={isSent}
					onPress={() => {
						onPress(dmGroup.channel_id || '', dmGroup.type || 0, '', dmGroup);
					}}
					style={[styles.friendItemWrapper, isSent && styles.friendItemWrapperInvited]}
				>
					<View style={styles.friendItemContent}>
						{Array.isArray(dmGroup?.channel_avatar) && dmGroup?.channel_avatar?.length > 1 ? (
							<Image source={Images.AVATAR_GROUP} style={{ width: 40, height: 40, borderRadius: 50 }} />
						) : (
							<FastImage
								style={{ width: 40, height: 40, borderRadius: 50 }}
								source={{
									uri: dmGroup.channel_avatar?.at(0),
								}}
								resizeMode={FastImage.resizeMode.cover}
							/>
						)}
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{dmGroup?.channel_label}
						</Text>
					</View>
					<View>
						<MezonButton
							viewContainerStyle={[styles.inviteButton, isSent && styles.invitedButton]}
							disabled={isSent}
							onPress={() => {
								onPress(dmGroup.channel_id || '', dmGroup.type || 0, '', dmGroup);
							}}
						>
							{isSent ? 'Sent' : 'Invite'}
						</MezonButton>
					</View>
				</TouchableOpacity>
			) : (
				<TouchableOpacity
					disabled={isSent}
					onPress={() => {
						onPress('', 0, user?.id);
					}}
					style={[styles.friendItemWrapper, isSent && styles.friendItemWrapperInvited]}
				>
					<View style={styles.friendItemContent}>
						<MezonAvatar userName={user?.user?.display_name} avatarUrl={user?.user?.avatar_url} />
						<Text style={styles.friendItemName} numberOfLines={1} ellipsizeMode="tail">
							{user?.user?.display_name}
						</Text>
					</View>
					<View>
						<MezonButton
							viewContainerStyle={[styles.inviteButton, isSent && styles.invitedButton]}
							disabled={isSent}
							onPress={() => {
								onPress('', 0, user?.id);
							}}
						>
							{isSent ? 'Sent' : 'Invite'}
						</MezonButton>
					</View>
				</TouchableOpacity>
			)}
		</View>
	);
});
