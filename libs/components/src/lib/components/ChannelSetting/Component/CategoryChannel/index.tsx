import { useAppNavigation } from '@mezon/core';
import type { CategoriesEntity, IUpdateChannelRequest } from '@mezon/store';
import { channelsActions, selectAllCategories, selectChannelById, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export type CategoryChannelProps = {
	channel: IChannel;
};
const SettingCategoryChannel = (props: CategoryChannelProps) => {
	const { channel } = props;
	const { t } = useTranslation('channelSetting');
	const listCategory = useSelector(selectAllCategories);
	const realTimeChannel = useAppSelector((state) => selectChannelById(state, channel.channel_id || '0'));
	const categoryName = useMemo(() => {
		if (realTimeChannel?.category_name) {
			return realTimeChannel.category_name;
		}
		if (realTimeChannel?.category_id) {
			const category = listCategory.find((cat) => cat.id === realTimeChannel.category_id);
			return category?.category_name || '';
		}
		return '';
	}, [realTimeChannel?.category_name, realTimeChannel?.category_id, listCategory]);
	const dispatch = useAppDispatch();
	const navigator = useAppNavigation();
	const handleMoveChannelToNewCategory = useCallback(
		async (category: CategoriesEntity) => {
			const updateChannel: IUpdateChannelRequest = {
				category_id: category.id,
				category_name: category.category_name,
				channel_id: realTimeChannel?.channel_id ?? '',
				channel_label: realTimeChannel?.channel_label ?? '',
				app_id: '',
				parent_id: realTimeChannel?.parent_id,
				channel_private: realTimeChannel?.channel_private
			};
			await dispatch(channelsActions.changeCategoryOfChannel(updateChannel)).then(() => {
				const channelLink = navigator.toChannelPage(realTimeChannel?.channel_id ?? '', realTimeChannel?.clan_id ?? '');
				navigator.navigate(channelLink);
			});
		},
		[dispatch, navigator, realTimeChannel]
	);

	const listCateUpdate = useMemo(() => {
		return listCategory.filter((cate) => cate.id !== realTimeChannel?.category_id);
	}, [listCategory, channel.category_id, realTimeChannel?.category_id]);

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];

		listCateUpdate.map((category) => {
			menuItems.push(
				<Menu.Item
					key={category.id}
					className={'bg-item-theme-hover text-theme-primary-hover uppercase font-medium text-left cursor-pointer truncate'}
					onClick={() => handleMoveChannelToNewCategory(category)}
				>
					{category.category_name ?? ''}
				</Menu.Item>
			);
		});

		return <>{menuItems}</>;
	}, [listCateUpdate, handleMoveChannelToNewCategory]);

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 lg:pt-[94px] sbm:pb-7 pr-[10px] sbm:pr-[10px] pl-[10px] sbm:pl-[40px] overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<div className="text-theme-primary text-[15px] flex flex-col gap-4">
				<h3 className="font-semibold text-xl text-theme-primary-active">{t('categoryManagement.title')}</h3>

				<p className="text-xs font-bold text-theme-primary">{t('categoryManagement.channelName')}</p>
				<div className="bg-input-secondary border-theme-primary rounded-lg pl-3 py-2 w-full  outline-none text-theme-message">
					{realTimeChannel.channel_label}
				</div>
				<p className="text-xs font-bold text-theme-primary mt-4">{t('categoryManagement.category')}</p>

				<Menu menu={menu}>
					<div className="w-full h-12 rounded-md border-theme-primary text-theme-message bg-input-secondary  flex flex-row px-3 justify-between items-center uppercase">
						<p>{categoryName}</p>
						<Icons.ArrowDownFill />
					</div>
				</Menu>
			</div>
		</div>
	);
};

export default SettingCategoryChannel;
