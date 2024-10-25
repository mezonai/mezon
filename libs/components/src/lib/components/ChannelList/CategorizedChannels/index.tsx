import { useAuth, useCategory, usePermissionChecker, UserRestrictionZone } from '@mezon/core';
import {
	categoriesActions,
	channelsActions,
	defaultNotificationCategoryActions,
	selectCategoryExpandStateByCategoryId,
	selectCategoryIdSortChannel,
	selectChannelMetaEntities,
	selectCtrlKFocusChannel,
	selectCtrlKSelectedChannelId,
	selectCurrentChannelId,
	selectCurrentClan,
	useAppDispatch
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelThreads, EPermission, ICategory, ICategoryChannel, IChannel, MouseButton } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { CategorySetting } from '../../CategorySetting';
import { Coords } from '../../ChannelLink';
import ModalConfirm from '../../ModalConfirm';
import PanelCategory from '../../PanelCategory';
import ChannelListItem, { ChannelListItemRef } from '../ChannelListItem';

type CategorizedChannelsProps = {
	category: ICategoryChannel;
	channelRefs: React.RefObject<Record<string, ChannelListItemRef | null>>;
};

export interface IChannelLinkPermission {
	hasAdminPermission: boolean;
	hasClanPermission: boolean;
	hasChannelManagePermission: boolean;
	isClanOwner: boolean;
}

const CategorizedChannels: React.FC<CategorizedChannelsProps> = ({ category, channelRefs }) => {
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const categoryExpandState = useSelector(selectCategoryExpandStateByCategoryId(category.clan_id || '', category.id));
	const [hasAdminPermission, hasClanPermission, hasChannelManagePermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.manageChannel
	]);
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
	const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);
	const ctrlKFocusChannel = useSelector(selectCtrlKFocusChannel);

	const { handleDeleteCategory } = useCategory();
	const dispatch = useAppDispatch();
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

	const handleToggleCategory = () => {
		const payload = {
			clanId: category.clan_id || '',
			categoryId: category.id,
			expandState: !categoryExpandState
		};
		dispatch(categoriesActions.setCategoryExpandState(payload));
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
		dispatch(channelsActions.setCurrentCategory(paramCategory));
	};

	const handleOpenCreateChannelModal = (category: ICategoryChannel) => {
		const payload = {
			clanId: category.clan_id || '',
			categoryId: category.id,
			expandState: true
		};
		dispatch(categoriesActions.setCategoryExpandState(payload));
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

	useEffect(() => {
		if (!ctrlKFocusChannel) return;
		const focusChannel = ctrlKFocusChannel;
		const { id, parentId } = focusChannel as { id: string; parentId: string };
		if (id && parentId && parentId !== '0' && channelRefs.current) {
			channelRefs.current[parentId]?.scrollIntoThread(id);
		} else if (id && channelRefs.current) {
			channelRefs.current[id]?.scrollIntoChannel();
		}
		dispatch(categoriesActions.setCtrlKFocusChannel(null));
	}, [ctrlKFocusChannel]);

	return (
		<div>
			{category.category_name && (
				<div className="flex flex-row px-2 relative gap-1" onMouseDown={handleMouseClick} ref={panelRef} role={'button'}>
					<button
						onClick={() => {
							handleToggleCategory();
						}}
						className="dark:text-channelTextLabel text-colorTextLightMode flex items-center px-0.5 w-full font-title tracking-wide dark:hover:text-gray-100 hover:text-black uppercase text-sm font-semibold"
					>
						{categoryExpandState ? <Icons.ArrowDown /> : <Icons.ArrowRight />}
						<span className="one-line">{category.category_name}</span>
					</button>
					<button
						onClick={handleSortByName}
						className="focus-visible:outline-none dark:text-channelTextLabel text-colorTextLightMode dark:hover:text-white hover:text-black"
					>
						<Icons.UpDownIcon />
					</button>
					<UserRestrictionZone policy={isShowCreateChannel}>
						<button
							className="focus-visible:outline-none dark:text-channelTextLabely text-colorTextLightMode dark:hover:text-white hover:text-black"
							onClick={() => handleOpenCreateChannelModal(category)}
						>
							<Icons.Plus />
						</button>
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
			<ChannelList
				channels={category?.channels || []}
				categoryExpandState={categoryExpandState}
				channelRefs={channelRefs}
				permissions={permissions}
			/>
		</div>
	);
};
export default memo(CategorizedChannels);

type ChannelListProps = {
	channels: IChannel[];
	categoryExpandState: boolean;
	channelRefs: React.RefObject<Record<string, ChannelListItemRef | null>>;
	permissions: IChannelLinkPermission;
};

const ChannelList: React.FC<ChannelListProps> = ({ channels, categoryExpandState, channelRefs, permissions }) => {
	const ctrlKSelectedChannelId = useSelector(selectCtrlKSelectedChannelId);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const refItem = useCallback((component: ChannelListItemRef | null) => {
		channelRefs.current && (channelRefs.current[component?.channelId as string] = component);
	}, []);

	const allChannelMetaEntities = useSelector(selectChannelMetaEntities);

	const isUnreadChannel = (channelId: string) => {
		return allChannelMetaEntities[channelId]?.lastSeenTimestamp < allChannelMetaEntities[channelId]?.lastSentTimestamp;
	};

	return (
		<div className="mt-[5px] space-y-0.5 text-contentTertiary">
			{channels.reduce<React.ReactNode[]>((acc, channel) => {
				const shouldRender =
					categoryExpandState ||
					isUnreadChannel(channel.id) ||
					channel.id === ctrlKSelectedChannelId ||
					channel.type === ChannelType.CHANNEL_TYPE_VOICE;

				if (shouldRender) {
					acc.push(
						<ChannelListItem
							ref={refItem}
							isActive={currentChannelId === channel.id}
							key={channel.id}
							channel={channel as ChannelThreads}
							permissions={permissions}
						/>
					);
				}
				return acc;
			}, [])}
		</div>
	);
};
