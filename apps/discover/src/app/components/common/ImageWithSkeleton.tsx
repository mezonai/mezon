import React, { useState } from 'react';

interface ImageWithSkeletonProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'fetchPriority'> {
	skeletonClassName?: string;
	fetchPriority?: 'high' | 'low' | 'auto';
}

const ImageFrame: React.FC<ImageWithSkeletonProps> = ({
	src,
	alt,
	className = '',
	skeletonClassName = '',
	onLoad,
	onError,
	fetchPriority,
	...rest
}) => {
	const [loading, setLoading] = useState(true);

	return (
		<div className="relative w-full h-full">
			{loading && <div className={`absolute inset-0 skeleton ${skeletonClassName}`} />}
			<img
				{...rest}
				src={src}
				alt={alt}
				className={`${className} ${loading ? 'invisible' : ''}`}
				ref={(node) => {
					if (node && fetchPriority) node.setAttribute('fetchpriority', fetchPriority);
				}}
				onLoad={(e) => {
					setLoading(false);
					onLoad && onLoad(e);
				}}
				onError={(e) => {
					setLoading(false);
					onError?.(e);
				}}
			/>
		</div>
	);
};

const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = (props) => <ImageFrame key={props.src || ''} {...props} />;

export default ImageWithSkeleton;
