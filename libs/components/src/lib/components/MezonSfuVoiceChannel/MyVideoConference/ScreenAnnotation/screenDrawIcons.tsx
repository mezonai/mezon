interface IconProps {
	className?: string;
}

export const ScreenDrawPointerIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path fill="currentColor" d="M6 3 18.5 12.2 12.8 13.1 15.8 19.2 13.2 20.4 10.3 14.3 6 18.2Z" />
	</svg>
);

export const ScreenDrawPenIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path
			fill="currentColor"
			d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z"
		/>
	</svg>
);

export const ScreenDrawTextIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path
			fill="currentColor"
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2h-6v13a1 1 0 1 1-2 0V6H5a1 1 0 0 1-1-1Z"
		/>
	</svg>
);

export const ScreenDrawEraserIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<g transform="rotate(-45 12 12)">
			<rect x="3.5" y="8" width="17" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
			<path fill="currentColor" d="M10 8H5.5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2H10Z" />
		</g>
		<path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M13.5 21H21" />
	</svg>
);

export const ScreenDrawUndoIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M3.51 14.99a9 9 0 1 0 7.24-11.9C7.48 3.55 5.33 5.91 3 8m0 0V2m0 6h6"
		/>
	</svg>
);

export const ScreenDrawRedoIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M20.49 14.99a9 9 0 1 1-7.24-11.9C16.52 3.55 18.67 5.91 21 8m0 0V2m0 6h-6"
		/>
	</svg>
);

export const ScreenDrawTrashIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path
			fill="currentColor"
			d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z"
		/>
		<path
			fill="currentColor"
			fillRule="evenodd"
			clipRule="evenodd"
			d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
		/>
	</svg>
);

export const ScreenDrawGripIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<g fill="currentColor">
			<circle cx="9" cy="6" r="1.6" />
			<circle cx="15" cy="6" r="1.6" />
			<circle cx="9" cy="12" r="1.6" />
			<circle cx="15" cy="12" r="1.6" />
			<circle cx="9" cy="18" r="1.6" />
			<circle cx="15" cy="18" r="1.6" />
		</g>
	</svg>
);

export const ScreenDrawCloseIcon = ({ className }: IconProps) => (
	<svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
	</svg>
);
