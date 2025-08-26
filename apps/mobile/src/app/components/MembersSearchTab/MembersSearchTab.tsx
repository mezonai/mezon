import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelMembersEntity, getStore, selectClanMemberMetaUserId, selectCurrentDM } from '@mezon/store-mobile';
import React, { memo, useCallback } from 'react';
import { DeviceEventEmitter, FlatList, Keyboard, View } from 'react-native';
import UserProfile from '../../screens/home/homedrawer/components/UserProfile';
import { EmptySearchPage } from '../EmptySearchPage';
import { MemberItem } from '../MemberStatus/MemberItem';
import style from './MembersSearchTab.styles';

type MembersSearchTabProps = {
	listMemberSearch: any;
};
const MembersSearchTab = ({ listMemberSearch }: MembersSearchTabProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const store = getStore();

	const onDetailMember = useCallback(
		(user: ChannelMembersEntity) => {
			const currentDirect = selectCurrentDM(store.getState());
			const directId = currentDirect?.id;
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
							userId={user?.user?.id || user?.id}
							user={user?.user || user}
							onClose={() => {
								DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
							}}
							showAction={!directId}
							showRole={!directId}
							directId={directId}
						/>
					</View>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		},
		[store]
	);

	const renderItem = useCallback(
		({ item, index }) => {
			const userMeta = selectClanMemberMetaUserId(store.getState(), item.id);
			const user = {
				...item,
				metadata: {
					user_status: userMeta?.status
				}
			};
			return (
				<MemberItem
					onPress={onDetailMember}
					isHiddenStatus={!userMeta}
					isOffline={!userMeta?.online}
					isMobile={userMeta?.isMobile}
					user={user}
					key={`${item?.['id']}_member_search_${index}}`}
				/>
			);
		},
		[onDetailMember, store]
	);

	const keyExtractor = useCallback((item, index) => `${item?.['id']}_member_search_${index}}`, []);

	return (
		<View style={[styles.container, { backgroundColor: listMemberSearch?.length > 0 ? themeValue.primary : themeValue.secondary }]}>
			<FlatList
				data={listMemberSearch?.length > 0 ? listMemberSearch : []}
				renderItem={renderItem}
				onScrollBeginDrag={() => Keyboard.dismiss()}
				keyExtractor={keyExtractor}
				initialNumToRender={1}
				maxToRenderPerBatch={1}
				windowSize={4}
				showsVerticalScrollIndicator={false}
				removeClippedSubviews={true}
				keyboardShouldPersistTaps={'handled'}
				disableVirtualization={false}
				contentContainerStyle={{
					backgroundColor: themeValue.secondary,
					paddingBottom: size.s_6
				}}
				style={styles.boxMembers}
				ListEmptyComponent={() => <EmptySearchPage />}
			/>
		</View>
	);
};

export default memo(MembersSearchTab);
