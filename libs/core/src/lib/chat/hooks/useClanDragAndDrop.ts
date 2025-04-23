// useClanDragAndDrop.ts
import { clansActions } from '@mezon/store';
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
