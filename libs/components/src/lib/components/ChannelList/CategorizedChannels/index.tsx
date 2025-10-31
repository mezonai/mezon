import { useAuth, useCategory, usePermissionChecker, UserRestrictionZone } from '@mezon/core';
import {
	categoriesActions,
	channelsActions,
	defaultNotificationCategoryActions,
	FAVORITE_CATEGORY_ID,
	selectCategoryExpandStateByCategoryId,
	selectCurrentClanCreatorId,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ICategory, ICategoryChannel, IChannel } from '@mezon/utils';
import { EPermission, generateE2eId, MouseButton } from '@mezon/utils';
import React, { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { CategorySetting } from '../../CategorySetting';
import type { Coords } from '../../ChannelLink';
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
	const { t } = useTranslation('common');
	const { handleDeleteCategory } = useCategory();
	const confirmDeleteCategory = async () => {
		await handleDeleteCategory({
			category: { ...category, channels: [] }
		});
		closeDeleteModal();
	};

	return (
		<ModalConfirm
			handleCancel={closeDeleteModal}
			modalName={category.category_name || ''}
			handleConfirm={confirmDeleteCategory}
			title="delete"
			buttonName={t('deleteCategory')}
			message={t('cannotBeUndone')}
			customModalName={t('category')}
		/>
	);
};

const CategorizedItem: React.FC<CategorizedChannelsProps> = ({ category }) => {
	const { userProfile } = useAuth();
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const categoryExpandState = useAppSelector((state) => selectCategoryExpandStateByCategoryId(state, category.id));
	const [hasAdminPermission, hasClanPermission, hasChannelManagePermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.manageChannel
	]);
	const isClanOwner = currentClanCreatorId === userProfile?.user?.id;

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
				toggleCollapseCategory={handleToggleCategory}
				collapseCategory={!categoryExpandState}
				category={category}
			/>
		);
	}, [coords, category, categoryExpandState]);

	const [openCategoryEdit, closeCategoryEdit] = useModal(() => {
		return <CategorySetting onClose={closeCategoryEdit} category={category} />;
	}, [coords, category]);

	const handleMouseClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (category.id === FAVORITE_CATEGORY_ID) {
			return;
		}
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		if (event.button === MouseButton.RIGHT) {
			await dispatch(
				defaultNotificationCategoryActions.getDefaultNotificationCategory({
					clanId: currentClanId as string,
					categoryId: category?.id ?? ''
				})
			);
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
			<div
				className="flex flex-row px-2 relative gap-1"
				onMouseDown={handleMouseClick}
				ref={panelRef}
				role={'button'}
				data-e2e={generateE2eId('clan_page.side_bar.channel_list.category')}
			>
				<button
					onClick={handleToggleCategory}
					className="text-theme-primary flex items-center px-0.5 w-full font-title tracking-wide text-theme-primary-hover uppercase text-sm font-medium"
				>
					{categoryExpandState ? <Icons.ArrowDown /> : <Icons.ArrowRight />}
					<span className="one-line" data-e2e={generateE2eId('clan_page.side_bar.channel_list.category.name')}>
						{category.category_name}
					</span>
				</button>

				{!category.isFavor && (
					<UserRestrictionZone policy={isShowCreateChannel}>
						<button
							className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
							onClick={() => handleOpenCreateChannelModal(category)}
							data-e2e={generateE2eId('clan_page.side_bar.button.add_channel')}
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
