import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { categoriesActions, selectCategoryExpandStateByCategoryId, selectCategoryIdSortChannel, useAppDispatch } from '@mezon/store-mobile';
import { ChannelThreads, ICategoryChannel, IChannel } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChannelsPositionRef } from '../../../ChannelList';
import { ChannelListItem, IThreadActiveType } from '../ChannelListItem';
import ChannelListSectionHeader from '../ChannelListSectionHeader';
import { style } from './styles';

interface IChannelListSectionProps {
	data: ICategoryChannel;
	onLongPressCategory: (channel: ICategoryChannel) => void;
	onLongPressChannel: (channel: ChannelThreads) => void;
	onLongPressThread: (thread: ChannelThreads) => void;
	channelsPositionRef: ChannelsPositionRef;
}

const ChannelListSection = memo(
	({ data, onLongPressCategory, onLongPressChannel, onLongPressThread, channelsPositionRef }: IChannelListSectionProps) => {
		const styles = style(useTheme().themeValue);
		const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);
		const dispatch = useAppDispatch();
		const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, data?.category_id));

		const handleOnPressSortChannel = useCallback(() => {
			dispatch(
				categoriesActions.setCategoryIdSortChannel({
					isSortChannelByCategoryId: !categoryIdSortChannel[data?.category_id],
					categoryId: data?.category_id,
					clanId: data?.clan_id
				})
			);
		}, [categoryIdSortChannel, data?.category_id, dispatch]);

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
			onLongPressCategory(data);
		}, [data, onLongPressCategory]);

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
					onPressSortChannel={handleOnPressSortChannel}
					isCollapsed={categoryExpandState}
					category={data}
				/>

				{data?.channels?.map((item: IChannel, index: number) => {
					return (
						<View key={`${item?.id}`} onLayout={(event) => handlePositionChannel(item, event)}>
							<ChannelListItem
								data={item}
								key={`${item.id}_channel_item` + index}
								onLongPress={() => {
									onLongPressChannel(item);
								}}
								onLongPressThread={onLongPressThread}
							/>
						</View>
					);
				})}
			</View>
		);
	}
);
export default ChannelListSection;
