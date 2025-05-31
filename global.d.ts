interface Window {
	ethereum?: {
		request: (args: { method: string; params?: any[] }) => Promise<any>;
		isMetaMask?: boolean;
		selectedAddress?: string;
		networkVersion?: string;
		on?: (event: string, callback: (...args: any[]) => void) => void;
		removeListener?: (event: string, callback: (...args: any[]) => void) => void;
	};
}

declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module '*.jpeg' {
	const content: string;
	export default content;
}

declare module '*.gif' {
	const content: string;
	export default content;
}

declare module '*.svg' {
	const content: string;
	export default content;
}

declare module '*.webp' {
	const content: string;
	export default content;
}
