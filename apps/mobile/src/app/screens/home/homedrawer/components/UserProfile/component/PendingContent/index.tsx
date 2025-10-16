import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { baseColor, size, useTheme, verticalScale } from '@mezon/mobile-ui';
import { FriendsEntity, friendsActions, useAppDispatch } from '@mezon/store-mobile';
import Clipboard from '@react-native-clipboard/clipboard';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { EFriendState } from '../..';
import MezonAvatar from '../../../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { SeparatorWithLine } from '../../../../../../../components/Common';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
interface IPendingContentProps {
	targetUser: FriendsEntity;
	userName: string;
	onClose?: () => void;
}

export const PendingContent = memo((props: IPendingContentProps) => {
	const { targetUser, onClose, userName } = props;
	const { themeValue } = useTheme();
	const { t } = useTranslation(['userProfile']);
	const dispatch = useAppDispatch();

	const handleRemoveFriend = () => {
		const body = {
			usernames: [],
			ids: [targetUser?.user?.id]
		};
		dispatch(friendsActions.sendRequestDeleteFriend(body));
		onClose();
	};

	const handleAcceptFriend = () => {
		const body = {
			usernames: [targetUser?.user?.username],
			ids: [targetUser?.user?.id],
			isAcceptingRequest: true
		};
		dispatch(friendsActions.sendRequestAddFriend(body));
		onClose();
	};

	const actionList = [
		{
			id: 1,
			text: t('pendingContent.acceptFriend'),
			action: handleAcceptFriend,
			isWarning: false,
			isShow: [EFriendState.ReceivedRequestFriend].includes(targetUser?.state)
		},
		{
			id: 2,
			text:
				targetUser?.state === EFriendState.ReceivedRequestFriend ? t('pendingContent.rejectFriend') : t('pendingContent.cancelFriendRequest'),
			action: handleRemoveFriend,
			isWarning: false,
			isShow: [EFriendState.ReceivedRequestFriend, EFriendState.SentRequestFriend].includes(targetUser?.state)
		},
		{
			id: 3,
			text: t('pendingContent.removeFriend'),
			action: handleRemoveFriend,
			isWarning: false,
			isShow: [EFriendState.Friend].includes(targetUser?.state)
		},
		{
			id: 4,
			text: t('pendingContent.copyUsername'),
			action: () => {
				Clipboard.setString(targetUser?.user?.username || '');
				Toast.show({
					type: 'success',
					props: {
						text2: t('pendingContent.copiedUserName', { username: targetUser?.user?.username }),
						leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} />
					}
				});
			},
			isWarning: false,
			isShow: true
		}
	];

	return (
		<View>
			<View style={{ flexDirection: 'row', marginTop: size.s_15, padding: size.s_20, alignItems: 'center' }}>
				<MezonAvatar
					width={size.s_34}
					height={size.s_34}
					avatarUrl={targetUser?.user?.avatar_url || ''}
					username={userName}
					isBorderBoxImage={false}
				/>

				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontSize: verticalScale(16),
							marginLeft: 0,
							marginRight: 0,
							textAlign: 'center',
							alignItems: 'center',
							alignContent: 'center',
							justifyContent: 'center',
							color: themeValue.white
						}}
					>
						{userName}
					</Text>
				</View>

				<TouchableOpacity onPress={() => onClose()}>
					<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_32} width={size.s_32} color={themeValue.text} />
				</TouchableOpacity>
			</View>
			<View style={{ marginHorizontal: size.s_10, backgroundColor: themeValue.secondary, borderRadius: size.s_10 }}>
				<FlatList
					data={actionList}
					keyExtractor={(item) => item.id.toString()}
					ItemSeparatorComponent={SeparatorWithLine}
					renderItem={({ item }) => {
						const { text, isWarning, action, isShow } = item;
						if (!isShow) return null;
						return (
							<TouchableOpacity onPress={action}>
								<View style={{ padding: size.s_14 }}>
									<Text
										style={{
											color: isWarning ? baseColor.redStrong : themeValue.text
										}}
									>
										{text}
									</Text>
								</View>
							</TouchableOpacity>
						);
					}}
				/>
			</View>
		</View>
	);
});
