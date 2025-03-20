import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { categoriesActions, selectCategoryExpandStateByCategoryId, useAppDispatch } from '@mezon/store-mobile';
import { ICategoryChannel } from '@mezon/utils';
import React, { memo, useCallback } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { ChannelsPositionRef } from '../../../ChannelList';
import CategoryMenu from '../../CategoryMenu';
import { IThreadActiveType } from '../ChannelListItem';
import ChannelListSectionHeader from '../ChannelListSectionHeader';
import { style } from './styles';

interface IChannelListSectionProps {
	data: ICategoryChannel;
	channelsPositionRef: ChannelsPositionRef;
}

const ChannelListSection = memo(({ data, channelsPositionRef }: IChannelListSectionProps) => {
	const styles = style(useTheme().themeValue);
	const dispatch = useAppDispatch();
	const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, data?.category_id));

	const toggleCollapse = useCallback(
		(category: ICategoryChannel) => {
			const payload = {
				clanId: category.clan_id || '',
				categoryId: category.id,
				expandState: !categoryExpandState
			};
			dispatch(categoriesActions.setCategoryExpandState(payload));
		},
		[dispatch, categoryExpandState]
	);

	const onLongPressHeader = useCallback(() => {
		const dataBottomSheet = {
			heightFitContent: true,
			children: <CategoryMenu category={data} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data: dataBottomSheet });
	}, [data]);

	if (!data?.category_name?.trim()) {
		return;
	}

	const handlePositionChannel = (item, event) => {
		const { y } = event.nativeEvent.layout;
		let threadY = 0;
		const heightChannel = y;
		if (item?.threads?.length) {
			const threadActives = item?.threads.filter((thread: { active: IThreadActiveType }) => thread?.active === IThreadActiveType.Active);
			threadActives?.forEach((thread) => {
				const threadHeight = size.s_36;
				threadY += threadHeight;
				channelsPositionRef.current = {
					...channelsPositionRef.current,
					[`${thread.id}`]: {
						cateId: item?.category_id,
						height: y + threadY
					}
				};
			});
		}
		channelsPositionRef.current = {
			...channelsPositionRef.current,
			[`${item.id}`]: {
				height: heightChannel,
				cateId: item?.category_id
			}
		};
	};

	return (
		<View style={styles.channelListSection}>
			<ChannelListSectionHeader
				title={data.category_name}
				onPress={toggleCollapse}
				onLongPress={onLongPressHeader}
				isCollapsed={categoryExpandState}
				category={data}
			/>

			{/* {(data?.channels as IChannel[])?.map((item: IChannel, index: number) => {
				return (
					<View key={`${item.id}_channel_item` + index} onLayout={(event) => handlePositionChannel(item, event)}>
						<ChannelListItem
							data={item}
							isFirstThread={
								item?.type === ChannelType.CHANNEL_TYPE_THREAD &&
								(data?.channels?.[index - 1] as IChannel)?.type !== ChannelType.CHANNEL_TYPE_THREAD
							}
						/>
					</View>
				);
			})} */}
		</View>
	);
});
export default ChannelListSection;
