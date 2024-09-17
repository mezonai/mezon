import { useAuth, useCategory, useEscapeKey, useOnClickOutside, UserRestrictionZone, useUserRestriction } from '@mezon/core';
import {
	categoriesActions,
	channelsActions,
	defaultNotificationCategoryActions,
	selectCategoryIdSortChannel,
	selectCurrentChannelId,
	selectCurrentClan,
	selectTheme,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelThreads, EPermission, ICategory, ICategoryChannel, IChannel, MouseButton } from '@mezon/utils';
import { Tooltip } from 'flowbite-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import CategorySetting from '../../CategorySetting';
import { Coords } from '../../ChannelLink';
import ModalConfirm from '../../ModalConfirm';
import PanelCategory from '../../PanelCategory';
import ChannelListItem, { ChannelListItemRef } from '../ChannelListItem';

type CategorizedChannelsProps = {
	category: ICategoryChannel;
};

export interface IChannelLinkPermission {
	hasAdminPermission: boolean;
	hasClanPermission: boolean;
	hasChannelManagePermission: boolean;
	isClanOwner: boolean;
}

const CategorizedChannels: React.FC<CategorizedChannelsProps> = ({ category }) => {
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const hasAdminPermission = useUserRestriction([EPermission.administrator]);
	const hasClanPermission = useUserRestriction([EPermission.manageClan]);
	const hasChannelManagePermission = useUserRestriction([EPermission.manageChannel]);
	const isClanOwner = currentClan?.creator_id === userProfile?.user?.id;

	const permissions = useMemo(
		() => ({
			hasAdminPermission,
			hasClanPermission,
			hasChannelManagePermission,
			isClanOwner
		}),
		[hasAdminPermission, hasClanPermission, hasChannelManagePermission, isClanOwner]
	);

	const panelRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const [isShowPanelCategory, setIsShowPanelCategory] = useState<boolean>(false);
	const [showModal, setShowModal] = useState(false);
	const [isShowCategorySetting, setIsShowCategorySetting] = useState<boolean>(false);
	const [isShowCategoryChannels, setIsShowCategoryChannels] = useState<boolean>(true);
	const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);
	const { handleDeleteCategory } = useCategory();
	const dispatch = useAppDispatch();
	const location = useLocation();
	const channelRefs = useRef<Record<string, ChannelListItemRef | null>>({});
	const isShowCreateChannel = isClanOwner || hasAdminPermission || hasChannelManagePermission || hasClanPermission;

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		if (event.button === MouseButton.RIGHT) {
			await dispatch(defaultNotificationCategoryActions.getDefaultNotificationCategory({ categoryId: category?.id ?? '' }));
			const distanceToBottom = windowHeight - event.clientY;
			setCoords({ mouseX, mouseY, distanceToBottom });
			setIsShowPanelCategory(!isShowPanelCategory);
		}
	};

	useEscapeKey(() => dispatch(channelsActions.openCreateNewModalChannel(false)));

	const handleToggleCategory = () => {
		setIsShowCategoryChannels(!isShowCategoryChannels);
	};

	const handleCloseCategorySetting = () => {
		setIsShowCategorySetting(false);
	};

	const handleSortByName = () => {
		dispatch(
			categoriesActions.setCategoryIdSortChannel({ isSortChannelByCategoryId: !categoryIdSortChannel[category.id], categoryId: category.id })
		);
	};

	const openModalCreateNewChannel = (paramCategory: ICategory) => {
		dispatch(channelsActions.openCreateNewModalChannel(true));
		dispatch(channelsActions.getCurrentCategory(paramCategory));
	};

	const handleOpenCreateChannelModal = (category: ICategoryChannel) => {
		setIsShowCategoryChannels(true);
		openModalCreateNewChannel(category);
	};

	const openModalDeleteCategory = () => {
		setShowModal(true);
		setIsShowPanelCategory(false);
	};

	const confirmDeleteCategory = async () => {
		handleDeleteCategory({ category });
		setShowModal(false);
	};

	useOnClickOutside(panelRef, () => setIsShowPanelCategory(false));

	useEscapeKey(() => setIsShowPanelCategory(false));

	useEffect(() => {
		const focusChannel = location.state?.focusChannel ?? {};
		const { id, parentId } = focusChannel as { id: string; parentId: string };
		if (id && parentId && parentId !== '0') {
			channelRefs.current[parentId]?.scrollIntoThread(id);
		} else if (id) {
			channelRefs.current[id]?.scrollIntoChannel();
		}
	}, [location]);

	const appearanceTheme = useSelector(selectTheme);
	const isLightMode = useMemo(() => {
		return appearanceTheme === 'light';
	}, [appearanceTheme]);

	return (
		<div>
			{category.category_name && (
				<div className="flex flex-row px-2 relative gap-1 items-center" onMouseDown={handleMouseClick} ref={panelRef} role={'button'}>
					<button
						onClick={() => {
							handleToggleCategory();
						}}
						className="dark:text-channelTextLabel text-colorTextLightMode flex items-center px-0.5 w-full font-title tracking-wide dark:hover:text-gray-100 hover:text-black uppercase text-sm font-semibold"
					>
						{isShowCategoryChannels ? <Icons.ArrowDown /> : <Icons.ArrowRight />}
						<span className="one-line">{category.category_name}</span>
					</button>
					<Tooltip content="Sort channel" trigger="hover" animation="duration-500" style={isLightMode ? 'light' : 'dark'}>
						<button
							onClick={handleSortByName}
							className="focus-visible:outline-none dark:text-channelTextLabel text-colorTextLightMode dark:hover:text-white hover:text-black h-full flex items-center"
						>
							<Icons.UpDownIcon />
						</button>
					</Tooltip>
					<UserRestrictionZone policy={isShowCreateChannel}>
						<Tooltip
							className="h-fit"
							content="Create channel"
							trigger="hover"
							animation="duration-500"
							style={isLightMode ? 'light' : 'dark'}
						>
							<button
								className="focus-visible:outline-none dark:text-channelTextLabely text-colorTextLightMode dark:hover:text-white hover:text-black h-full flex items-center"
								onClick={() => handleOpenCreateChannelModal(category)}
							>
								<Icons.Plus />
							</button>
						</Tooltip>
					</UserRestrictionZone>

					{isShowPanelCategory && (
						<PanelCategory
							coords={coords}
							setIsShowPanelChannel={setIsShowPanelCategory}
							onDeleteCategory={openModalDeleteCategory}
							setOpenSetting={setIsShowCategorySetting}
							category={category}
						/>
					)}

					{showModal && (
						<ModalConfirm
							handleCancel={() => setShowModal(false)}
							modalName={category.category_name || ''}
							handleConfirm={confirmDeleteCategory}
							title="delete"
							buttonName="Delete category"
							message="This cannot be undone"
							customModalName="Category"
						/>
					)}

					{isShowCategorySetting && <CategorySetting onClose={handleCloseCategorySetting} category={category} />}
				</div>
			)}
			{isShowCategoryChannels && (
				<div className="mt-[5px] space-y-0.5 text-contentTertiary">
					{category?.channels
						?.filter((channel: IChannel) => {
							const categoryIsOpen = isShowCategoryChannels;
							return categoryIsOpen || channel?.unread;
						})
						.map((channel: IChannel) => {
							return (
								<ChannelListItem
									ref={(component) => (channelRefs.current[channel.id] = component)}
									isActive={currentChannelId === channel.id}
									key={channel.id}
									channel={channel as ChannelThreads}
									permissions={permissions}
								/>
							);
						})}
				</div>
			)}
		</div>
	);
};
export default CategorizedChannels;
