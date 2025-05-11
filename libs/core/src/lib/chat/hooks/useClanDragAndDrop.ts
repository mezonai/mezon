import { clansActions } from '@mezon/store';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DRAG_ITEM_TYPES, DRAG_THRESHOLD, DraggedItemType, GROUP_PREFIX } from './constant/constants';

type DraggedItem = { id: string; type: DraggedItemType };

export function useClanDragAndDrop(
	clans: string[],
	setItems: (items: string[]) => void,
	clanGroups: { id: string; clanIds: string[] }[]
) {
	const dispatch = useDispatch();

	const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [dropIndex, setDropIndex] = useState<number | null>(null);
	const [collisionItem, setCollisionItem] = useState<string | null>(null);

	const itemRects = useRef<Record<string, DOMRect>>({});

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string, type: DraggedItemType) => {
		setStartPoint({ x: e.clientX, y: e.clientY });
		setDraggedItem({ id, type });

		const rect = e.currentTarget.getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		});
	};

	const handleMouseEnter = (id: string) => {
		const el = document.querySelector(`[data-id="${id}"]`);
		if (el) {
			itemRects.current[id] = el.getBoundingClientRect();
		}
	};

	const handleDragOverItem = (index: number) => {
		if (isDragging) {
			setDropIndex(index);
			setCollisionItem(null);
		}
	};

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!startPoint || !draggedItem) return;

			const dx = Math.abs(e.clientX - startPoint.x);
			const dy = Math.abs(e.clientY - startPoint.y);

			if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
				setIsDragging(true);
			}

			if (isDragging) {
				setDragPosition({ x: e.clientX, y: e.clientY });

				let foundCollision: string | null = null;
				for (const [id, rect] of Object.entries(itemRects.current)) {
					if (id === draggedItem.id) continue;

					if (
						e.clientX >= rect.left &&
						e.clientX <= rect.right &&
						e.clientY >= rect.top &&
						e.clientY <= rect.bottom
					) {
						foundCollision = id;
						break;
					}
				}

				if (foundCollision) {
					setCollisionItem(foundCollision);
					setDropIndex(null);
					return;
				}

				let foundIndex: number | null = null;
				for (let i = 0; i < clans.length; i++) {
					const id = clans[i];
					const rect = itemRects.current[id];
					if (!rect) continue;
					const middleY = rect.top + rect.height / 2;
					if (e.clientY < middleY) {
						foundIndex = i;
						break;
					}
				}

				setCollisionItem(null);
				setDropIndex(foundIndex);
			}
		};

		const onUp = () => {
			if (isDragging && draggedItem) {
				const parentGroup = clanGroups.find(g => g.clanIds.includes(draggedItem.id));

				if (collisionItem) {
					const isGroup = collisionItem.startsWith(GROUP_PREFIX);

					if (isGroup) {
						// ✅ TH1.1: Kéo vào 1 group → thêm vào group
						dispatch(clansActions.addClanToGroup({
							groupId: collisionItem,
							clanId: draggedItem.id
						}));

						const newItems = clans.filter(id => id !== draggedItem.id);
						setItems(newItems);
					} else {
						// ✅ TH1.2: Tạo group mới từ dragged + collision
						const newGroupId = `${GROUP_PREFIX}${Date.now()}`;

						dispatch(clansActions.createClanGroup({
							groupId: newGroupId,
							clanIds: [draggedItem.id, collisionItem]
						}));

						const newItems = clans.filter(id => id !== draggedItem.id && id !== collisionItem);
						newItems.push(newGroupId);
						setItems(newItems);

						const draggedGroup = clanGroups.find(g => g.clanIds.includes(draggedItem.id));
						if (draggedGroup) {
							dispatch(clansActions.removeClanFromGroup({
								groupId: draggedGroup.id,
								clanId: draggedItem.id
							}));
						}
						const collisionGroup = clanGroups.find(g => g.clanIds.includes(collisionItem));
						if (collisionGroup) {
							dispatch(clansActions.removeClanFromGroup({
								groupId: collisionGroup.id,
								clanId: collisionItem
							}));
						}
					}
				} else if (dropIndex !== null) {
					const newItems = clans.filter(id => id !== draggedItem.id);
					newItems.splice(dropIndex, 0, draggedItem.id);
					setItems(newItems);

					if (draggedItem.type !== DRAG_ITEM_TYPES.GROUP && parentGroup) {
						dispatch(clansActions.removeClanFromGroup({
							groupId: parentGroup.id,
							clanId: draggedItem.id
						}));
					}

					const targetId = newItems[dropIndex + 1] || '';
					dispatch(clansActions.reorderClan({
						source: {
							id: draggedItem.id,
							type: parentGroup ? DRAG_ITEM_TYPES.CLAN_IN_GROUP : DRAG_ITEM_TYPES.CLAN
						},
						target: targetId ? { id: targetId, type: DRAG_ITEM_TYPES.CLAN } : { id: '', type: DRAG_ITEM_TYPES.CLAN }
					}));
				}
			}

			// Reset
			setStartPoint(null);
			setDraggedItem(null);
			setIsDragging(false);
			setDragPosition(null);
			setDropIndex(null);
			setCollisionItem(null);
			itemRects.current = {};
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [startPoint, isDragging, draggedItem, collisionItem, dropIndex, clans, clanGroups, dispatch]);

	return {
		draggingState: {
			isDragging,
			draggedItem,
			dragPosition,
			dragOffset,
			dropIndex,
			collisionItem
		},
		handleMouseDown,
		handleMouseEnter,
		handleDragOverItem
	};
}
