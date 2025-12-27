import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelMembersEntity, DirectEntity } from '@mezon/store-mobile';
import { directActions, getStore, selectCurrentDM, useAppDispatch } from '@mezon/store-mobile';
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

interface IMembersSearchTabProps {
	listMemberSearch: any;
	listDMGroupSearch?: DirectEntity[];
}

const MembersSearchTab = ({ listMemberSearch, listDMGroupSearch }: IMembersSearchTabProps) => {
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();
	const data = useMemo(() => [...(listMemberSearch ?? []), ...(listDMGroupSearch ?? [])], [listMemberSearch, listDMGroupSearch]);
	const styles = useMemo(() => style(themeValue, data.length === 0), [themeValue, data]);

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

	const onDetailMember = useCallback((user: ChannelMembersEntity) => {
		const store = getStore();
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
	}, []);

	const renderItem = useCallback(
		({ item, index }) => {
			if (!item?.type) {
				return (
					<MemberItem isShowUsername isDM={false} onPress={onDetailMember} user={item} key={`${item?.['id']}_member_search_${index}}`} />
				);
			}

			return <DMGroupItem dmGroupData={item} navigateToDirectMessage={() => handleNavigateToDMGroup(item.id)} />;
		},
		[handleNavigateToDMGroup, onDetailMember]
	);

	const keyExtractor = useCallback((item, index) => `${item?.['id']}_member_search_${index}}`, []);

	return (
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
			contentContainerStyle={styles.contentContainerStyle}
			style={styles.boxMembers}
			ListEmptyComponent={() => <EmptySearchPage />}
		/>
	);
};

export default memo(MembersSearchTab);
