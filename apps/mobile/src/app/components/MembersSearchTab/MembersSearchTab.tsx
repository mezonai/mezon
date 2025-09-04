import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelMembersEntity,
	DirectEntity,
	directActions,
	getStore,
	selectClanMemberMetaUserId,
	selectCurrentDM,
	useAppDispatch
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, FlatList, Keyboard, View } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import UserProfile from '../../screens/home/homedrawer/components/UserProfile';
import { EmptySearchPage } from '../EmptySearchPage';
import { MemberItem } from '../MemberStatus/MemberItem';
import { DMGroupItem } from './DMGroupItem';
import style from './MembersSearchTab.styles';

type MembersSearchTabProps = {
	listMemberSearch: any;
	listDMGroupSearch?: DirectEntity[];
};

const MembersSearchTab = ({ listMemberSearch, listDMGroupSearch }: MembersSearchTabProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();

	const store = getStore();

	const handleNavigateToDMGroup = useCallback(
		(id: string) => {
			Keyboard.dismiss();
			if (!isTabletLandscape) {
				navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
					directMessageId: id
				});
			}
			dispatch(directActions.setDmGroupCurrentId(id));
		},
		[navigation, dispatch, isTabletLandscape]
	);

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

	const data = useMemo(() => (listMemberSearch ?? []).concat(listDMGroupSearch ?? []), [listMemberSearch, listDMGroupSearch]);

	const renderItem = useCallback(
		({ item, index }) => {
			if (!item?.type) {
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
			}

			return <DMGroupItem dmGroupData={item} navigateToDirectMessage={() => handleNavigateToDMGroup(item.id)} />;
		},
		[onDetailMember, store, styles, themeValue]
	);

	const keyExtractor = useCallback((item, index) => `${item?.['id']}_member_search_${index}}`, []);

	return (
		<View style={[styles.container, { backgroundColor: data?.length > 0 ? themeValue.primary : themeValue.secondary }]}>
			<FlatList
				data={data}
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
