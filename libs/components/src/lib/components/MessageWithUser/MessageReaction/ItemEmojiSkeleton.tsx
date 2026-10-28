import React from 'react';

type ItemEmojiSkeletonProps = {
	className?: string;
};

const ItemEmojiSkeleton: React.FC<ItemEmojiSkeletonProps> = ({ className = '' }) => {
	return (
		<div
			className={`h-6 w-16 rounded-md flex flex-row
      justify-center items-center relative bg-theme-primary
      ${className}`}
		></div>
	);
};

export default ItemEmojiSkeleton;
