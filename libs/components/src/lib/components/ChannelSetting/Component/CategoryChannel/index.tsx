import { useAppNavigation } from '@mezon/core';
import {
	CategoriesEntity,
	channelsActions,
	IUpdateChannelRequest,
	selectAllCategories,
	selectChannelById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type CategoryChannelProps = {
	channel: IChannel;
};
const SettingCategoryChannel = (props: CategoryChannelProps) => {
	const { channel } = props;
	const listCategory = useSelector(selectAllCategories);
	const realTimeChannel = useAppSelector((state) => selectChannelById(state, channel.channel_id || ''));
	const dispatch = useAppDispatch();
	const navigator = useAppNavigation();
	const handleMoveChannelToNewCategory = async (category: CategoriesEntity) => {
		const updateChannel: IUpdateChannelRequest = {
			category_id: category.id,
			category_name: category.category_name,
			channel_id: realTimeChannel.channel_id ?? '',
			channel_label: realTimeChannel.channel_label ?? '',
			app_id: '',
			parent_id: realTimeChannel?.parent_id,
			channel_private: realTimeChannel?.channel_private
		};
		await dispatch(channelsActions.changeCategoryOfChannel(updateChannel)).then(() => {
			const channelLink = navigator.toChannelPage(realTimeChannel.channel_id ?? '', realTimeChannel.clan_id ?? '');
			navigator.navigate(channelLink);
		});
	};

	const listCateUpdate = useMemo(() => {
		return listCategory.filter((cate) => cate.id !== realTimeChannel.category_id);
	}, [listCategory, channel.category_id]);

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] pb-7 pr-[10px] pl-[40px] overflow-x-hidden min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<div className="text-theme-primary text-[15px] flex flex-col gap-4">
				<h3 className="font-bold text-xl text-theme-primary-active">Category</h3>

				<p className="text-xs font-bold text-theme-primary">Channel name</p>
				<div className="bg-input-secondary border-theme-primary rounded-lg pl-3 py-2 w-full  outline-none text-theme-message">
					{realTimeChannel.channel_label}
				</div>
				<p className="text-xs font-bold text-theme-primary mt-4">Category</p>

				<Menu className="bg-input-secondary text-theme-primary">
					<Menu.Trigger>
						<div className="w-full h-12 rounded-md border-theme-primary text-theme-message bg-input-secondary  flex flex-row px-3 justify-between items-center uppercase">
							<p>{realTimeChannel.category_name}</p>
							<Icons.ArrowDownFill />
						</div>
					</Menu.Trigger>
					<Menu.Content className="bg-input-secondary text-theme-primary">
						{listCateUpdate.map((category) => {
							return (
								<Menu.Item
									key={category.id}
									className={'bg-item-theme-hover text-theme-primary-hover uppercase font-medium text-left cursor-pointer truncate'}
									onClick={() => handleMoveChannelToNewCategory(category)}
								>
									{category.category_name ?? ''}
								</Menu.Item>
							);
						})}
					</Menu.Content>
				</Menu>
			</div>
		</div>
	);
};

export default SettingCategoryChannel;
