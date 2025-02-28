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
import { Icons } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
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
			app_url: '',
			parent_id: realTimeChannel?.parent_id,
			channel_private: realTimeChannel?.channel_private
		};
		await dispatch(channelsActions.changeCategoryOfChannel(updateChannel)).then(() => {
			const channelLink = navigator.toChannelPage(realTimeChannel.channel_id ?? '', realTimeChannel.clan_id ?? '');
			navigator.navigate(channelLink);
		});
	};

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink dark:bg-bgPrimary bg-bgLightModeSecond w-1/2 pt-[94px] pb-7 pr-[10px] pl-[40px] overflow-x-hidden min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<div className="dark:text-white text-black text-[15px] flex flex-col gap-4">
				<h3 className="font-bold text-xl">Category</h3>

				<p className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase">Channel name</p>
				<div className="dark:bg-black bg-white pl-3 py-2 w-full border-0 outline-none rounded">{realTimeChannel.channel_label}</div>
				<p className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase mt-4">Category</p>
				<Dropdown
					trigger="click"
					dismissOnClick={false}
					renderTrigger={() => (
						<div className="w-full h-12 rounded-md dark:bg-black bg-white flex flex-row px-3 justify-between items-center uppercase">
							<p>{realTimeChannel.category_name}</p>
							<div>
								<Icons.ArrowDownFill />
							</div>
						</div>
					)}
					label=""
					placement="bottom-start"
					className="dark:bg-black bg-white border-none py-[6px] px-[8px] w-[200px]"
				>
					{listCategory.map((category) => {
						if (category.id !== realTimeChannel.category_id) {
							return (
								<div
									key={category.id}
									className={
										'dark:text-[#B5BAC1] text-textSecondary800 rounded-sm hover:bg-bgSelectItem hover:text-[#fff] uppercase font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none textWhiteHoverImportant m-0 truncate'
									}
									onClick={() => handleMoveChannelToNewCategory(category)}
								>
									{category.category_name ?? ''}
								</div>
							);
						}
					})}
				</Dropdown>
			</div>
		</div>
	);
};

export default SettingCategoryChannel;
