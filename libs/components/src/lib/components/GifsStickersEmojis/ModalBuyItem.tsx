import React from 'react';

interface ModalBuyItemProps {
	onConfirm: () => void;
	onCancel: () => void;
}
const ModalBuyItem = React.memo((props: ModalBuyItemProps) => {
	const handleCloseModal = (event: React.MouseEvent<HTMLDivElement>) => {
		event.stopPropagation();
		props.onCancel();
	};
	const handleBuyItem = async () => {
		props.onConfirm();
		props.onCancel();
	};
	return (
		<div
			className="fixed top-0 left-0 h-full w-full flex items-center justify-center bg-black bg-opacity-50 z-50 gap-2 "
			onClick={handleCloseModal}
		>
			<div className="gap-4 p-4 rounded-lg flex bg-bgTertiary flex-col w-[400px]" onClick={(e) => e.stopPropagation()}>
				<h2 className="text-white text-lg font-semibold relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-bgSecondaryHover">
					Unlock Item
				</h2>
				<div className="text-white">This item is locked. Spend 500 tokens to open this item. Please purchase to unlock.</div>
				<div className="flex justify-end gap-2">
					<button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" onClick={props.onCancel}>
						Cancel
					</button>
					<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleBuyItem}>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
});

export default ModalBuyItem;
