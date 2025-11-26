import { attachmentActions, channelMembersActions, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
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
	const dispatch = useAppDispatch();

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

		if (currentChannel?.type !== ChannelType.CHANNEL_TYPE_DM && currentChannel?.type !== ChannelType.CHANNEL_TYPE_GROUP) {
			return tabList;
		}
		return tabList.slice(0, -1);
	}, [currentChannel?.type, t]);

	const handelHeaderTabChange = useCallback(
		(index: number) => {
			setTabActive(index);
			if (index === 0) {
				dispatch(channelMembersActions.fetchChannelMembers({ clanId: currentClanId, channelId, channelType: currentChannel?.type }));
			}
			if (index === 1 || index === 2) dispatch(attachmentActions.fetchChannelAttachments({ clanId: currentClanId, channelId }));
		},
		[channelId, currentChannel?.type, currentClanId, dispatch]
	);

	return (
		<View style={styles.wrapper}>
			<AssetsHeader tabActive={tabActive} onChange={handelHeaderTabChange} tabList={headerTablist} />
			<View style={styles.container}>
				{tabActive === 0 ? (
					<MemberListStatus />
				) : tabActive === 1 ? (
					<MediaChannel
						channelId={channelId}
						isDM={[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)}
					/>
				) : tabActive === 4 ? (
					<Canvas
						channelId={
							currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD && currentChannel?.parent_id
								? currentChannel?.parent_id
								: [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
									? currentChannel?.channel_id
									: channelId
						}
						clanId={currentClanId}
					/>
				) : tabActive === 2 ? (
					<ChannelFiles
						currentChannelId={
							[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
								? currentChannel?.channel_id
								: channelId
						}
						isDM={[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)}
					/>
				) : (
					<PinMessage
						currentChannelId={
							[ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type)
								? currentChannel?.channel_id
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
