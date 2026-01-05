import { channelMembersActions, galleryActions, selectCurrentClanId, selectCurrentUserId, useAppDispatch } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import Canvas from '../../Canvas';
import ChannelFiles from '../../ChannelFiles';
import MediaChannel from '../../MediaChannel/MediaChannel';
import { MemberListStatus } from '../../MemberStatus';
import PinMessage from '../../PinMessage';
import AssetsHeader from '../AssetsHeader';
import { threadDetailContext } from '../MenuThreadDetail';
import styles from './style';

export const AssetsViewer = React.memo(({ channelId }: { channelId: string }) => {
	const { t } = useTranslation(['common']);
	const currentChannel = useContext(threadDetailContext);
	const [tabActive, setTabActive] = useState<number>(0);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentUserId = useSelector(selectCurrentUserId);
	const dispatch = useAppDispatch();

	const isChatWithMyself = useMemo(() => {
		return currentChannel?.type === ChannelType.CHANNEL_TYPE_DM && currentChannel?.userIds?.[0] === currentUserId;
	}, [currentChannel?.type, currentChannel?.userIds?.[0], currentUserId]);

	const actualTabIndex = useMemo(() => {
		if (isChatWithMyself) {
			return tabActive + 1;
		}

		return tabActive;
	}, [tabActive, isChatWithMyself]);

	const headerTablist = useMemo(() => {
		const tabList = [
			{
				title: t('members')
			},
			{
				title: t('media')
			},
			{
				title: t('files')
			},
			{
				title: t('pins')
			},
			{
				title: 'Canvas'
			}
		];

		if (isChatWithMyself) {
			return tabList.slice(1, -1);
		}

		if (currentChannel?.type !== ChannelType.CHANNEL_TYPE_DM && currentChannel?.type !== ChannelType.CHANNEL_TYPE_GROUP) {
			return tabList;
		}

		return tabList.slice(0, -1);
	}, [currentChannel?.type, isChatWithMyself, t]);

	const handelHeaderTabChange = useCallback(
		(index: number) => {
			setTabActive(index);
			if (index === 0) {
				dispatch(channelMembersActions.fetchChannelMembers({ clanId: currentClanId, channelId, channelType: currentChannel?.type }));
			}
			if (index === 1 || index === 2) {
				dispatch(galleryActions.clearGalleryChannel({ channelId }));
				dispatch(galleryActions.resetGalleryPagination({ channelId }));
				dispatch(
					galleryActions.fetchGalleryAttachments({
						clanId: currentClanId,
						channelId,
						limit: 30,
						direction: 'before',
						fileType: 'all',
						mediaFilter: 'all'
					})
				);
			}
		},
		[channelId, currentChannel?.type, currentClanId, dispatch]
	);

	return (
		<View style={styles.wrapper}>
			<AssetsHeader tabActive={tabActive} onChange={handelHeaderTabChange} tabList={headerTablist} />
			<View style={styles.container}>
				{actualTabIndex === 0 ? (
					<MemberListStatus currentChannel={currentChannel} currentUserId={currentUserId} />
				) : actualTabIndex === 1 ? (
					<MediaChannel
						channelId={channelId}
						isDM={[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)}
					/>
				) : actualTabIndex === 4 ? (
					<Canvas
						channelId={
							currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD && currentChannel?.parent_id
								? currentChannel?.parent_id
								: [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
									? currentChannel?.channelId
									: channelId
						}
						clanId={currentClanId}
					/>
				) : actualTabIndex === 2 ? (
					<ChannelFiles
						currentChannelId={
							[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
								? currentChannel?.channelId
								: channelId
						}
						isDM={[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)}
					/>
				) : (
					<PinMessage
						currentChannelId={
							[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
								? currentChannel?.channelId
								: channelId
						}
						currentClanId={
							[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type) ? '0' : currentClanId
						}
					/>
				)}
			</View>
		</View>
	);
});
