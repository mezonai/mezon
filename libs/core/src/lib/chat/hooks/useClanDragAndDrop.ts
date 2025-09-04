import { ClanGroupItem, clansActions } from '@mezon/store';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export function useClanDragAndDrop(clans: string[], setItems: (items: string[]) => void) {
	const dispatch = useDispatch();
	const [potentialDrag, setPotentialDrag] = useState<string | null>(null);
	const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [draggedItem, setDraggedItem] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [overItem, setOverItem] = useState<string | null>(null);

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!startPoint || !potentialDrag) return;
			const dx = Math.abs(e.clientX - startPoint.x);
			const dy = Math.abs(e.clientY - startPoint.y);
			if (!isDragging && (dx > 5 || dy > 5)) {
				setIsDragging(true);
				setDraggedItem(potentialDrag);
			}
			if (isDragging) {
				setDragPosition({ x: e.clientX, y: e.clientY });
			}
		};

		const onUp = () => {
			if (isDragging && draggedItem && overItem && draggedItem !== overItem) {
				const oldIndex = clans.indexOf(draggedItem);
				const newIndex = clans.indexOf(overItem);
				const newItems = [...clans];
				newItems.splice(oldIndex, 1);
				newItems.splice(newIndex, 0, draggedItem);
				setItems(newItems);
				dispatch(clansActions.updateClansOrder(newItems));
			}
			setPotentialDrag(null);
			setStartPoint(null);
			setDraggedItem(null);
			setIsDragging(false);
			setDragPosition(null);
			setOverItem(null);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [startPoint, potentialDrag, isDragging, draggedItem, overItem, clans, dispatch, setItems]);

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
		setStartPoint({ x: e.clientX, y: e.clientY });
		setPotentialDrag(id);
		setDragOffset({
			x: e.clientX - e.currentTarget.getBoundingClientRect().left,
			y: e.clientY - e.currentTarget.getBoundingClientRect().top
		});
	};

	const handleMouseEnter = (id: string) => {
		if (isDragging && draggedItem !== id) {
			setOverItem(id);
		}
	};

	return {
		draggingState: { isDragging, draggedItem, dragPosition, dragOffset, overItem },
		handleMouseDown,
		handleMouseEnter
	};
}

export function useClanGroupDragAndDrop(items: ClanGroupItem[], setItems: (items: ClanGroupItem[]) => void, userId: string) {
	const dispatch = useDispatch();
	const [potentialDrag, setPotentialDrag] = useState<string | null>(null);
	const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [draggedItem, setDraggedItem] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [overItem, setOverItem] = useState<string | null>(null);
	const [dropZone, setDropZone] = useState<'top' | 'center' | 'bottom' | null>(null);
	const [groupIntent, setGroupIntent] = useState<{ targetId: string; draggedId: string } | null>(null);
	const [draggedFromGroup, setDraggedFromGroup] = useState<{ groupId: string; clanId: string } | null>(null);

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!startPoint || !potentialDrag) return;
			const dx = Math.abs(e.clientX - startPoint.x);
			const dy = Math.abs(e.clientY - startPoint.y);
			if (!isDragging && (dx > 5 || dy > 5)) {
				setIsDragging(true);
				setDraggedItem(potentialDrag);

				if (!draggedFromGroup) {
					dispatch(clansActions.collapseAllGroups());
				}
			}
			if (isDragging) {
				setDragPosition({ x: e.clientX, y: e.clientY });
			}
		};

		const onUp = () => {
			if (isDragging && draggedItem && overItem && draggedItem !== overItem) {
				const draggedItemData = items.find((item) => item.id === draggedItem);
				const overItemData = items.find((item) => item.id === overItem);

				if (overItem.startsWith('gap-')) {
					const gapIndex = parseInt(overItem.replace('gap-', ''));

					if (draggedFromGroup) {
						dispatch(
							clansActions.removeClanFromGroup({
								groupId: draggedFromGroup.groupId,
								clanId: draggedFromGroup.clanId,
								userId
							})
						);

						const newClanItem: ClanGroupItem = {
							type: 'clan',
							id: draggedFromGroup.clanId,
							clanId: draggedFromGroup.clanId
						};

						const newItems = [...items];
						newItems.splice(gapIndex, 0, newClanItem);

						setItems(newItems);
						dispatch(clansActions.updateClanGroupOrder({ userId, order: newItems }));
					} else {
						const oldIndex = items.findIndex((item) => item.id === draggedItem);
						if (oldIndex !== -1) {
							const newItems = [...items];
							const [movedItem] = newItems.splice(oldIndex, 1);

							const insertIndex = oldIndex < gapIndex ? gapIndex - 1 : gapIndex;
							newItems.splice(insertIndex, 0, movedItem);

							setItems(newItems);
							dispatch(clansActions.updateClanGroupOrder({ userId, order: newItems }));
						}
					}

					setPotentialDrag(null);
					setStartPoint(null);
					setDraggedItem(null);
					setIsDragging(false);
					setDragPosition(null);
					setOverItem(null);
					setDropZone(null);
					setGroupIntent(null);
					setDraggedFromGroup(null);
					return;
				}

				if (draggedFromGroup) {
					dispatch(
						clansActions.removeClanFromGroup({
							groupId: draggedFromGroup.groupId,
							clanId: draggedFromGroup.clanId,
							userId
						})
					);

					if (dropZone === 'center') {
						if (overItemData?.type === 'clan' && overItemData.clanId) {
							dispatch(
								clansActions.createClanGroup({
									clanIds: [overItemData.clanId, draggedFromGroup.clanId],
									userId
								})
							);
						} else if (overItemData?.type === 'group' && overItemData.groupId) {
							dispatch(
								clansActions.addClanToGroup({
									groupId: overItemData.groupId,
									clanId: draggedFromGroup.clanId,
									userId
								})
							);
						}
					} else if (dropZone === 'top' || dropZone === 'bottom') {
						const targetIndex = items.findIndex((item) => item.id === overItem);

						if (targetIndex !== -1) {
							const newClanItem: ClanGroupItem = {
								type: 'clan',
								id: draggedFromGroup.clanId,
								clanId: draggedFromGroup.clanId
							};

							const newItems = [...items];
							const insertIndex = dropZone === 'top' ? targetIndex : targetIndex + 1;
							newItems.splice(insertIndex, 0, newClanItem);

							setItems(newItems);
							dispatch(clansActions.updateClanGroupOrder({ userId, order: newItems }));
						}
					} else {
						dispatch(clansActions.initializeClanGroupOrder({ userId }));
					}
				} else {
					let isGroupingIntent = false;

					if (draggedItemData?.type === 'clan' && overItemData?.type === 'group') {
						isGroupingIntent = true;
					} else if (dropZone === 'center' && draggedItemData?.type === 'clan' && overItemData?.type === 'clan') {
						isGroupingIntent = true;
					}

					if (isGroupingIntent) {
						if (draggedItemData?.type === 'clan' && overItemData?.type === 'clan' && draggedItemData.clanId && overItemData.clanId) {
							dispatch(
								clansActions.createClanGroup({
									clanIds: [overItemData.clanId, draggedItemData.clanId],
									userId
								})
							);
						} else if (
							draggedItemData?.type === 'clan' &&
							overItemData?.type === 'group' &&
							draggedItemData.clanId &&
							overItemData.groupId
						) {
							dispatch(
								clansActions.addClanToGroup({
									groupId: overItemData.groupId,
									clanId: draggedItemData.clanId,
									userId
								})
							);
						}
					} else if (dropZone === 'top' || dropZone === 'bottom') {
						const oldIndex = items.findIndex((item) => item.id === draggedItem);
						const newIndex = items.findIndex((item) => item.id === overItem);

						if (oldIndex !== -1 && newIndex !== -1) {
							const newItems = [...items];
							const [movedItem] = newItems.splice(oldIndex, 1);

							const insertIndex = dropZone === 'top' ? newIndex : newIndex + 1;
							newItems.splice(insertIndex, 0, movedItem);

							setItems(newItems);
							dispatch(clansActions.updateClanGroupOrder({ userId, order: newItems }));
						}
					}
				}
			}

			setPotentialDrag(null);
			setStartPoint(null);
			setDraggedItem(null);
			setIsDragging(false);
			setDragPosition(null);
			setOverItem(null);
			setDropZone(null);
			setGroupIntent(null);
			setDraggedFromGroup(null);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);

		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [startPoint, potentialDrag, isDragging, draggedItem, overItem, dropZone, items, dispatch, setItems, draggedFromGroup, userId]);

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string, fromGroup?: { groupId: string; clanId: string }) => {
		setStartPoint({ x: e.clientX, y: e.clientY });
		setPotentialDrag(id);

		let offsetX, offsetY;

		if (fromGroup) {
			offsetX = 20;
			offsetY = 10;
		} else {
			const rect = e.currentTarget.getBoundingClientRect();
			offsetX = e.clientX - rect.left;
			offsetY = e.clientY - rect.top;
		}

		setDragOffset({ x: offsetX, y: 10 });

		if (fromGroup) {
			setDraggedFromGroup(fromGroup);
		}
	};

	const handleMouseEnter = (id: string, mouseY: number, elementRect: DOMRect) => {
		if (isDragging && draggedItem !== id) {
			setOverItem(id);

			if (id.startsWith('gap-')) {
				setDropZone(null);
				setGroupIntent(null);
				return;
			}

			const elementHeight = elementRect.height;
			const relativeY = mouseY - elementRect.top;

			const topZone = elementHeight * 0.4;
			const bottomZone = elementHeight * 0.6;

			let zone: 'top' | 'center' | 'bottom';
			if (relativeY < topZone) {
				zone = 'top';
			} else if (relativeY > bottomZone) {
				zone = 'bottom';
			} else {
				zone = 'center';
			}

			setDropZone(zone);

			const draggedItemData = items.find((item) => item.id === draggedItem);
			const overItemData = items.find((item) => item.id === id);

			const shouldShowGroupIntent =
				(draggedItemData?.type === 'clan' && overItemData?.type === 'group') ||
				(draggedItemData?.type === 'clan' &&
					overItemData?.type === 'clan' &&
					zone === 'center' &&
					relativeY > elementHeight * 0.45 &&
					relativeY < elementHeight * 0.55) ||
				(draggedFromGroup && overItemData?.type === 'group') ||
				(draggedFromGroup &&
					overItemData?.type === 'clan' &&
					zone === 'center' &&
					relativeY > elementHeight * 0.45 &&
					relativeY < elementHeight * 0.55);

			if (draggedItem && shouldShowGroupIntent) {
				setGroupIntent({ targetId: id, draggedId: draggedItem });
			} else {
				setGroupIntent(null);
			}
		}
	};

	return {
		draggingState: {
			isDragging,
			draggedItem,
			dragPosition,
			dragOffset,
			overItem,
			dropZone,
			groupIntent,
			draggedFromGroup
		},
		handleMouseDown,
		handleMouseEnter
	};
}

export function useExpandedGroupDragAndDrop(groupId: string, clanIds: string[]) {
	const dispatch = useDispatch();
	const [potentialDrag, setPotentialDrag] = useState<string | null>(null);
	const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [draggedItem, setDraggedItem] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [overItem, setOverItem] = useState<string | null>(null);
	const [dropZone, setDropZone] = useState<'top' | 'bottom' | null>(null);

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!startPoint || !potentialDrag) return;
			const dx = Math.abs(e.clientX - startPoint.x);
			const dy = Math.abs(e.clientY - startPoint.y);
			if (!isDragging && (dx > 5 || dy > 5)) {
				setIsDragging(true);
				setDraggedItem(potentialDrag);
			}
			if (isDragging) {
				setDragPosition({ x: e.clientX, y: e.clientY });
			}
		};

		const onUp = () => {
			if (isDragging && draggedItem && overItem && draggedItem !== overItem) {
				const oldIndex = clanIds.indexOf(draggedItem);
				const newIndex = clanIds.indexOf(overItem);

				if (oldIndex !== -1 && newIndex !== -1) {
					const newClanIds = [...clanIds];
					const [movedClan] = newClanIds.splice(oldIndex, 1);

					const insertIndex = dropZone === 'top' ? newIndex : newIndex + 1;
					newClanIds.splice(insertIndex, 0, movedClan);

					dispatch(
						clansActions.reorderClansInGroup({
							groupId,
							clanIds: newClanIds
						})
					);
				}
			}

			setPotentialDrag(null);
			setStartPoint(null);
			setDraggedItem(null);
			setIsDragging(false);
			setDragPosition(null);
			setOverItem(null);
			setDropZone(null);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);

		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
	}, [startPoint, potentialDrag, isDragging, draggedItem, overItem, dropZone, clanIds, groupId, dispatch]);

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, clanId: string) => {
		setStartPoint({ x: e.clientX, y: e.clientY });
		setPotentialDrag(clanId);
		setDragOffset({
			x: 20,
			y: 10
		});
	};

	const handleMouseEnter = (clanId: string, mouseY: number, elementRect: DOMRect) => {
		if (isDragging && draggedItem !== clanId) {
			setOverItem(clanId);

			// Calculate drop zone for reordering
			const elementHeight = elementRect.height;
			const relativeY = mouseY - elementRect.top;
			const midPoint = elementHeight / 2;

			const zone = relativeY < midPoint ? 'top' : 'bottom';
			setDropZone(zone);
		}
	};

	return {
		draggingState: {
			isDragging,
			draggedItem,
			dragPosition,
			dragOffset,
			overItem,
			dropZone
		},
		handleMouseDown,
		handleMouseEnter
	};
}
