import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string;
}

export const ZoomInIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props} className={className}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M19.9604 11.4802C19.9604 13.8094 19.0227 15.9176 17.5019 17.4512C16.9332 18.0247 16.2834 18.5173 15.5716 18.9102C14.3594 19.5793 12.9658 19.9604 11.4802 19.9604C6.79672 19.9604 3 16.1637 3 11.4802C3 6.79672 6.79672 3 11.4802 3C16.1637 3 19.9604 6.79672 19.9604 11.4802Z"
					stroke="#333333"
					strokeWidth="2"
				></path>{' '}
				<path d="M18.1553 18.1553L21.8871 21.8871" stroke="#333333" strokeWidth="2" strokeLinecap="round"></path>{' '}
				<path d="M8 11.5492H15.0983" stroke="#333333" strokeWidth="2" strokeLinecap="round"></path>{' '}
				<path d="M8 11.5492H15.0983" stroke="#333333" strokeWidth="2" strokeLinecap="round"></path>{' '}
				<path d="M11.5492 15.0984L11.5492 8.00006" stroke="#333333" strokeWidth="2" strokeLinecap="round"></path>{' '}
			</g>
		</svg>
	);
};

export const ZoomOutIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props} className={className}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"
				></path>{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M7 11C7 10.4477 7.44772 10 8 10H14C14.5523 10 15 10.4477 15 11C15 11.5523 14.5523 12 14 12H8C7.44772 12 7 11.5523 7 11Z"
				></path>{' '}
			</g>
		</svg>
	);
};

export const FitViewIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
			<title>fit-to-screen</title>
			<g strokeWidth="0"></g>
			<g strokeLinecap="round" strokeLinejoin="round"></g>
			<g>
				<polygon points="22 16 24 16 24 8 16 8 16 10 22 10 22 16"></polygon>
				<polygon points="8 24 16 24 16 22 10 22 10 16 8 16 8 24"></polygon>
				<path d="M26,28H6a2.0023,2.0023,0,0,1-2-2V6A2.0023,2.0023,0,0,1,6,4H26a2.0023,2.0023,0,0,1,2,2V26A2.0023,2.0023,0,0,1,26,28ZM6,6V26H26.0012L26,6Z"></path>
			</g>
		</svg>
	);
};

export const LockIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props} className={className}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path d="M13 14C13 13.4477 12.5523 13 12 13C11.4477 13 11 13.4477 11 14V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V14Z"></path>{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M7 8.12037C5.3161 8.53217 4 9.95979 4 11.7692V17.3077C4 19.973 6.31545 22 9 22H15C17.6846 22 20 19.973 20 17.3077V11.7692C20 9.95979 18.6839 8.53217 17 8.12037V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V8.12037ZM15 7V8H9V7C9 6.64936 9.06015 6.31278 9.17071 6C9.58254 4.83481 10.6938 4 12 4C13.3062 4 14.4175 4.83481 14.8293 6C14.9398 6.31278 15 6.64936 15 7ZM6 11.7692C6 10.866 6.81856 10 8 10H16C17.1814 10 18 10.866 18 11.7692V17.3077C18 18.7208 16.7337 20 15 20H9C7.26627 20 6 18.7208 6 17.3077V11.7692Z"
				></path>{' '}
			</g>
		</svg>
	);
};

export const UnlockIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props} className={className}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M16.584 6C15.8124 4.2341 14.0503 3 12 3C9.23858 3 7 5.23858 7 8V10.0288M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C16.8802 10 17.7202 10 18.362 10.327C18.9265 10.6146 19.3854 11.0735 19.673 11.638C20 12.2798 20 13.1198 20 14.8V16.2C20 17.8802 20 18.7202 19.673 19.362C19.3854 19.9265 18.9265 20.3854 18.362 20.673C17.7202 21 16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 17.8802 4 16.2V14.8C4 13.1198 4 12.2798 4.32698 11.638C4.6146 11.0735 5.07354 10.6146 5.63803 10.327C5.99429 10.1455 6.41168 10.0647 7 10.0288Z"
					stroke="#000000"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
			</g>
		</svg>
	);
};
