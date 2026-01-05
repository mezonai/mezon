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
	const realTimeChannel = useAppSelector((state) => selectChannelById(state, channel.channelId || ''));
	const categoryName = useMemo(() => {
		if (realTimeChannel?.categoryName) {
			return realTimeChannel.categoryName;
		}
		if (realTimeChannel?.categoryId) {
			const category = listCategory.find((cat) => cat.id === realTimeChannel.categoryId);
			return category?.categoryName || '';
		}
		return '';
	}, [realTimeChannel?.categoryName, realTimeChannel?.categoryId, listCategory]);
	const dispatch = useAppDispatch();
	const navigator = useAppNavigation();
	const handleMoveChannelToNewCategory = useCallback(
		async (category: CategoriesEntity) => {
			const updateChannel: IUpdateChannelRequest = {
				categoryId: category.id,
				categoryName: category.categoryName,
				channelId: realTimeChannel?.channelId ?? '',
				channelLabel: realTimeChannel?.channelLabel ?? '',
				app_id: '',
				parent_id: realTimeChannel?.parent_id,
				channel_private: realTimeChannel?.channel_private
			};
			await dispatch(channelsActions.changeCategoryOfChannel(updateChannel)).then(() => {
				const channelLink = navigator.toChannelPage(realTimeChannel?.channelId ?? '', realTimeChannel?.clanId ?? '');
				navigator.navigate(channelLink);
			});
		},
		[dispatch, navigator, realTimeChannel]
	);

	const listCateUpdate = useMemo(() => {
		return listCategory.filter((cate) => cate.id !== realTimeChannel?.categoryId);
	}, [listCategory, channel.categoryId, realTimeChannel?.categoryId]);

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];

		listCateUpdate.map((category) => {
			menuItems.push(
				<Menu.Item
					key={category.id}
					className={'bg-item-theme-hover text-theme-primary-hover uppercase font-medium text-left cursor-pointer truncate'}
					onClick={() => handleMoveChannelToNewCategory(category)}
				>
					{category.categoryName ?? ''}
				</Menu.Item>
			);
		});

		return <>{menuItems}</>;
	}, [listCateUpdate, handleMoveChannelToNewCategory]);

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] pb-7 pr-[10px] pl-[40px] overflow-x-hidden min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<div className="text-theme-primary text-[15px] flex flex-col gap-4">
				<h3 className="font-bold text-xl text-theme-primary-active">{t('categoryManagement.title')}</h3>

				<p className="text-xs font-bold text-theme-primary">{t('categoryManagement.channelName')}</p>
				<div className="bg-input-secondary border-theme-primary rounded-lg pl-3 py-2 w-full  outline-none text-theme-message">
					{realTimeChannel.channelLabel}
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
