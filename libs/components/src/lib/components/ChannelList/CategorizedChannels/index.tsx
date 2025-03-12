import { useAuth, useCategory, usePermissionChecker, UserRestrictionZone } from '@mezon/core';
import {
	categoriesActions,
	channelsActions,
	defaultNotificationCategoryActions,
	selectCategoryExpandStateByCategoryId,
	selectCategoryIdSortChannel,
	selectCurrentChannel,
	selectCurrentClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, ICategory, ICategoryChannel, IChannel, MouseButton } from '@mezon/utils';
import React, { memo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { CategorySetting } from '../../CategorySetting';
import { Coords } from '../../ChannelLink';
import ModalConfirm from '../../ModalConfirm';
import PanelCategory from '../../PanelCategory';

type CategorizedChannelsProps = {
	category: ICategoryChannel;
};

export interface IChannelLinkPermission {
	hasAdminPermission: boolean;
	hasClanPermission: boolean;
	hasChannelManagePermission: boolean;
	isClanOwner: boolean;
}

interface DeleteCategoryModalProps {
	category: { category_name: string; id: string; channels?: IChannel[] };
	closeDeleteModal: () => void;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({ category, closeDeleteModal }) => {
	const { handleDeleteCategory } = useCategory();
	const currentChannel = useSelector(selectCurrentChannel);
	const confirmDeleteCategory = async () => {
		await handleDeleteCategory({
			category: { ...category, channels: [] },
			currenChannel: currentChannel as IChannel
		});
		closeDeleteModal();
	};

	return (
		<ModalConfirm
			handleCancel={closeDeleteModal}
			modalName={category.category_name || ''}
			handleConfirm={confirmDeleteCategory}
			title="delete"
			buttonName="Delete category"
			message="This cannot be undone"
			customModalName="Category"
		/>
	);
};

const CategorizedItem: React.FC<CategorizedChannelsProps> = ({ category }) => {
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, category.id));
	const [hasAdminPermission, hasClanPermission, hasChannelManagePermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.manageChannel
	]);
	const isClanOwner = currentClan?.creator_id === userProfile?.user?.id;

	const panelRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});

	const [openDeleteCategoryModal, closeDeleteModal] = useModal(() => {
		return (
			<DeleteCategoryModal
				category={{ ...category, category_name: category.category_name || 'Default Name', channels: [] }}
				closeDeleteModal={closeDeleteModal}
			/>
		);
	});

	const [isShowCategorySetting, setIsShowCategorySetting] = useState<boolean>(false);
	const categoryIdSortChannel = useSelector(selectCategoryIdSortChannel);

	const dispatch = useAppDispatch();
	const isShowCreateChannel = isClanOwner || hasAdminPermission || hasChannelManagePermission || hasClanPermission;

	const handleOpenEditCategory = () => {
		openCategoryEdit();
		closeRightClickModal();
	};

	const [openRightClickModal, closeRightClickModal] = useModal(() => {
		return (
			<PanelCategory
				coords={coords}
				setIsShowPanelChannel={closeRightClickModal}
				onDeleteCategory={openDeleteCategoryModal}
				openEditCategory={handleOpenEditCategory}
				category={category}
			/>
		);
	}, [coords, category]);

	const [openCategoryEdit, closeCategoryEdit] = useModal(() => {
		return <CategorySetting onClose={closeCategoryEdit} category={category} />;
	}, [coords, category]);

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		if (event.button === MouseButton.RIGHT) {
			await dispatch(defaultNotificationCategoryActions.getDefaultNotificationCategory({ categoryId: category?.id ?? '' }));
			const distanceToBottom = windowHeight - event.clientY;
			setCoords({ mouseX, mouseY, distanceToBottom });
			openRightClickModal();
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

	const openModalCreateNewChannel = (paramCategory: ICategory) => {
		dispatch(channelsActions.openCreateNewModalChannel({ clanId: paramCategory.clan_id as string, isOpen: true }));
		dispatch(
			channelsActions.setCurrentCategory({
				clanId: paramCategory.clan_id as string,
				category: paramCategory
			})
		);
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

	return (
		category.category_name && (
			<div className="flex flex-row px-2 relative gap-1" onMouseDown={handleMouseClick} ref={panelRef} role={'button'}>
				<button
					onClick={handleToggleCategory}
					className="dark:text-channelTextLabel text-colorTextLightMode flex items-center px-0.5 w-full font-title tracking-wide dark:hover:text-gray-100 hover:text-black uppercase text-sm font-semibold"
				>
					{categoryExpandState ? <Icons.ArrowDown /> : <Icons.ArrowRight />}
					<span className="one-line">{category.category_name}</span>
				</button>
				{!category.isFavor && (
					<UserRestrictionZone policy={isShowCreateChannel}>
						<button
							className="focus-visible:outline-none dark:text-channelTextLabely text-colorTextLightMode dark:hover:text-white hover:text-black"
							onClick={() => handleOpenCreateChannelModal(category)}
						>
							<Icons.Plus />
						</button>
					</UserRestrictionZone>
				)}

				{isShowCategorySetting && <CategorySetting onClose={handleCloseCategorySetting} category={category} />}
			</div>
		)
	);
};
export default memo(CategorizedItem);
