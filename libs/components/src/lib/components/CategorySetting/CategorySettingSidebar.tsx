import { useCategory } from '@mezon/core';
import { selectWelcomeChannelByClanId } from '@mezon/store';
import type { ICategoryChannel } from '@mezon/utils';
import { generateE2eId } from '@mezon/utils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { ItemObjProps } from '../ClanSettings/ItemObj';
import { categorySettingList } from '../ClanSettings/ItemObj';
import SettingItem from '../ClanSettings/SettingItem';
import ModalConfirm from '../ModalConfirm';

interface ICategorySettingSidebarProps {
	onClickItem: (settingItem: ItemObjProps) => void;
	handleMenu: (value: boolean) => void;
	currentSetting: ItemObjProps;
	category: ICategoryChannel;
	displayCategoryName?: string;
}

const CategorySettingSidebar: React.FC<ICategorySettingSidebarProps> = ({
	onClickItem,
	handleMenu,
	currentSetting,
	category,
	displayCategoryName
}) => {
	const { t } = useTranslation('clan');
	const [showModal, setShowModal] = useState(false);
	const { handleDeleteCategory } = useCategory();
	const handleClickButtonSidebar = (setting: ItemObjProps) => {
		onClickItem(setting);
	};
	const welcomeChannel = useSelector((state) => selectWelcomeChannelByClanId(state, category.clan_id as string));

	const openModalDeleteCategory = () => {
		if (hasWelcomeChannel) {
			toast.error(t('categoryOverview.hasWelcomeChannelError'));
			return;
		}
		setShowModal(true);
	};

	const confirmDeleteCategory = async () => {
		handleDeleteCategory({ category });
		setShowModal(false);
	};
	const hasWelcomeChannel = useMemo(() => {
		if (!category?.channels || !category?.channels?.length) {
			return false;
		}
		if (!welcomeChannel) {
			return false;
		}
		return (category.channels as string[]).includes(welcomeChannel);
	}, [category?.channels, welcomeChannel]);

	return (
		<div className="flex flex-row flex-1 justify-end">
			<div className="w-[220px] py-[60px] pl-5 pr-[6px]">
				<p className="text-[#84ADFF] pl-[10px] pb-[6px] font-bold text-sm tracking-wider uppercase truncate">
					{displayCategoryName ?? category.category_name}
				</p>
				{categorySettingList.map((settingItem) => (
					<SettingItem
						key={settingItem.id}
						name={settingItem.name}
						active={currentSetting.id === settingItem.id}
						onClick={() => handleClickButtonSidebar(settingItem)}
						handleMenu={handleMenu}
					/>
				))}
				<div className={'border-t-[0.08px] dark:border-borderDividerLight border-bgModifierHoverLight'}></div>
				<button
					className={`mt-[5px] text-red-500 w-full py-1 px-[10px] mb-1 text-[16px] font-medium rounded text-left hover:bg-[#f67e882a] ${hasWelcomeChannel ? 'text-red-500' : ''}`}
					onClick={openModalDeleteCategory}
					data-e2e={generateE2eId('clan_page.modal.delete_category.button.delete')}
				>
					{t('categoryOverview.deleteCategory')}
				</button>
				{showModal && (
					<ModalConfirm
						handleCancel={() => setShowModal(false)}
						modalName={category?.category_name || ''}
						handleConfirm={confirmDeleteCategory}
						title="delete"
						buttonName={t('categoryOverview.deleteCategoryButton')}
						message={t('categoryOverview.cannotBeUndone')}
						customModalName={t('categoryOverview.categoryLabel')}
					/>
				)}
			</div>
		</div>
	);
};

export default CategorySettingSidebar;
