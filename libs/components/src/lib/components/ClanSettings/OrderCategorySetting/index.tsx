import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CategoriesEntity } from '@mezon/store';
import { categoriesActions, listChannelRenderAction, selectAllCategories, selectCurrentClanId, useAppDispatch, useAppSelector } from '@mezon/store';
import type { ICategoryChannel } from '@mezon/utils';
import type { ApiCategoryOrderUpdate } from 'mezon-js/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CategoryOrderSetting = () => {
	const { t } = useTranslation('common');
	const categoryList: CategoriesEntity[] = useAppSelector(selectAllCategories);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const [categoryListState, setCategoryListState] = useState<CategoriesEntity[]>(categoryList);
	const [hasChanged, setHasChanged] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 4 }
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setCategoryListState((items) => {
			const oldIndex = items.findIndex((item) => item.category_id === active.id);
			const newIndex = items.findIndex((item) => item.category_id === over.id);
			if (oldIndex === -1 || newIndex === -1) return items;
			setHasChanged(true);
			return arrayMove(items, oldIndex, newIndex);
		});
	};

	const handleSave = () => {
		const listCate: ICategoryChannel[] = [];
		const categoriesOrderChanges: ApiCategoryOrderUpdate[] =
			categoryListState.map((category, index) => {
				listCate.push({
					...category,
					id: category.id,
					channels: []
				});
				return {
					category_id: category.category_id,
					order: index + 1
				};
			}) || [];

		dispatch(
			categoriesActions.updateCategoriesOrder({
				clan_id: currentClanId || '',
				categories: categoriesOrderChanges
			})
		);

		dispatch(listChannelRenderAction.sortCategoryChannel({ listCategoryOrder: listCate, clanId: currentClanId || '' }));

		setHasChanged(false);
	};

	const handleReset = () => {
		setCategoryListState(categoryList);
		setHasChanged(false);
	};

	const validCategories = categoryListState.filter((category) => category.category_id);

	return (
		<div className="overflow-y-auto">
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={validCategories.map((category) => category.category_id as string)} strategy={verticalListSortingStrategy}>
					{validCategories.map((category, index) => (
						<SortableCategoryRow key={category.category_id} category={category} isLast={index === validCategories.length - 1} />
					))}
				</SortableContext>
			</DndContext>
			{hasChanged && (
				<div className="flex flex-row justify-end gap-[20px] mt-10">
					<button onClick={handleReset} className="rounded px-4 py-1.5 hover:underline ">
						{t('reset')}
					</button>
					<button onClick={handleSave} className="btn-primary btn-primary-hover rounded-lg px-4 py-1.5 text-nowrap ">
						{t('saveChanges')}
					</button>
				</div>
			)}
		</div>
	);
};

type SortableCategoryRowProps = {
	category: CategoriesEntity;
	isLast: boolean;
};

const SortableCategoryRow = ({ category, isLast }: SortableCategoryRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.category_id as string });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${!isLast ? 'border-b' : ''} cursor-grab bg-item-hover ${
				isDragging ? 'border-b-4 border-b-green-500 dark:border-b-green-500' : ''
			}`}
			{...attributes}
			{...listeners}
		>
			<p className="p-2 truncate uppercase">{category.category_name}</p>
		</div>
	);
};

export default CategoryOrderSetting;
