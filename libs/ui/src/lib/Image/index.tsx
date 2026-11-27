export type ImageProps = {
	src: string;
	alt?: string;
	width?: number;
	height?: number;
	placeholder?: string;
	loading?: 'lazy' | 'eager';
	onClick?: () => void;
	className?: string;
	draggable?: 'true' | 'false';
};

function Image({ loading = 'lazy', src, alt = 'image', className, draggable, ...rest }: ImageProps) {
	return <img {...rest} src={src} alt={alt} loading={loading} className={className} draggable={draggable} />;
}

export default Image;
