declare namespace JSX {
	interface IntrinsicElements {
		'lite-youtube': {
			videoid: string;
			playlabel?: string;
			posterquality?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault';
			params?: string;
			style?: React.CSSProperties;
		};
		'lite-tiktok': {
			videoid: string;
			autoload?: boolean;
			style?: React.CSSProperties;
		};
	}
}
