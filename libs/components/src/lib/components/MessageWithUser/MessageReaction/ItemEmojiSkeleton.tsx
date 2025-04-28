import React from 'react';

type ItemEmojiSkeletonProps = {
	className?: string;
};

const ItemEmojiSkeleton: React.FC<ItemEmojiSkeletonProps> = ({ className = '' }) => {
	return (
		<div
			style={{ height: 24, width: 48 }}
			className={`rounded-md w-16 flex flex-row
      justify-center items-center relative
      dark:bg-[#2B2D31] bg-gray-100 border-[#313338]
      ${className}`}
		></div>
	);
};

export default ItemEmojiSkeleton;
