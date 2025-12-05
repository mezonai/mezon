/* eslint-disable react/jsx-no-duplicate-props */
import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string;
}

export const ChatIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-purple-600', ...props }) => {
	return (
		<svg
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="comments"
			style={{ maxWidth: '40px' }}
			className={className}
			{...props}
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zm4 0h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"
			></path>
		</svg>
	);
};

export const HttpRequestIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-blue-500', ...props }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" className={className} {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M40 20C40 8.95314 31.0469 0 20 0C8.95314 0 0 8.95314 0 20C0 31.0469 8.95314 40 20 40C31.0469 40 40 31.0469 40 20ZM20 36.9458C18.8852 36.9458 17.1378 35.967 15.4998 32.6985C14.7964 31.2918 14.1961 29.5431 13.7526 27.6847H26.1898C25.8045 29.5403 25.2044 31.2901 24.5002 32.6985C22.8622 35.967 21.1148 36.9458 20 36.9458ZM12.9064 20C12.9064 21.6097 13.0087 23.164 13.2003 24.6305H26.7997C26.9913 23.164 27.0936 21.6097 27.0936 20C27.0936 18.3903 26.9913 16.836 26.7997 15.3695H13.2003C13.0087 16.836 12.9064 18.3903 12.9064 20ZM20 3.05419C21.1149 3.05419 22.8622 4.03078 24.5001 7.30039C25.2066 8.71408 25.8072 10.4067 26.192 12.3153H13.7501C14.1933 10.4047 14.7942 8.71254 15.4998 7.30064C17.1377 4.03083 18.8851 3.05419 20 3.05419ZM30.1478 20C30.1478 18.4099 30.0543 16.8617 29.8227 15.3695H36.3042C36.7252 16.842 36.9458 18.3964 36.9458 20C36.9458 21.6036 36.7252 23.158 36.3042 24.6305H29.8227C30.0543 23.1383 30.1478 21.5901 30.1478 20ZM26.2767 4.25512C27.6365 6.36019 28.711 9.132 29.3774 12.3153H35.1046C33.2511 8.668 30.107 5.78346 26.2767 4.25512ZM10.6226 12.3153H4.89293C6.75147 8.66784 9.89351 5.78341 13.7232 4.25513C12.3635 6.36021 11.289 9.13201 10.6226 12.3153ZM3.05419 20C3.05419 21.603 3.27743 23.1575 3.69484 24.6305H10.1217C9.94619 23.142 9.85222 21.5943 9.85222 20C9.85222 18.4057 9.94619 16.858 10.1217 15.3695H3.69484C3.27743 16.8425 3.05419 18.397 3.05419 20ZM26.2766 35.7427C27.6365 33.6393 28.711 30.868 29.3774 27.6847H35.1046C33.251 31.3322 30.1068 34.2179 26.2766 35.7427ZM13.7234 35.7427C9.89369 34.2179 6.75155 31.3324 4.89293 27.6847H10.6226C11.289 30.868 12.3635 33.6393 13.7234 35.7427Z"
				fill="#8F87F7"
			/>
		</svg>
	);
};

export const WebhookIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-cyan-500', ...props }) => {
	return (
		<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
			<g>
				<path
					fill="currentColor"
					d="M34.409,19.061C12.582,56.712-0.007,100.458,0,147.018c-0.007,46.574,12.582,90.313,34.409,127.973 l24.071-13.965c-19.467-33.586-30.642-72.46-30.65-114.008c0.008-41.541,11.183-80.4,30.65-113.993L34.409,19.061z"
				/>
				<path
					fill="currentColor"
					d="M97.8,52.439c-16.124,27.822-25.439,60.17-25.431,94.579c-0.008,34.416,9.307,66.772,25.431,94.594 l24.072-13.957c-13.765-23.772-21.674-51.24-21.681-80.637c0.008-29.39,7.916-56.859,21.681-80.63L97.8,52.439z"
				/>
				<path
					fill="currentColor"
					d="M477.599,19.061L453.52,33.025c19.468,33.594,30.651,72.452,30.658,113.993 c-0.007,41.548-11.19,80.422-30.658,114.008l24.079,13.965c21.827-37.66,34.409-81.399,34.401-127.973 C512.008,100.458,499.426,56.712,477.599,19.061z"
				/>
				<path
					fill="currentColor"
					d="M390.129,66.388c13.765,23.772,21.673,51.24,21.681,80.63c-0.008,29.397-7.916,56.865-21.681,80.637 l24.071,13.957c16.125-27.822,25.439-60.178,25.439-94.594c0-34.409-9.314-66.758-25.439-94.579L390.129,66.388z"
				/>
				<path
					fill="currentColor"
					d="M185.293,194.253v-0.008c-8.101-13.98-12.766-30.012-12.766-47.228c0-17.201,4.665-33.233,12.766-47.22 l-24.072-13.95c-10.414,17.961-16.532,38.881-16.524,61.17c-0.008,22.296,6.11,43.223,16.524,61.185L185.293,194.253z"
				/>
				<path
					fill="currentColor"
					d="M350.779,208.21v-0.007c10.414-17.962,16.532-38.889,16.524-61.185c0.008-22.289-6.11-43.209-16.524-61.178 l-24.071,13.965c8.1,13.98,12.766,30.012,12.774,47.213c-0.008,17.216-4.673,33.248-12.774,47.228L350.779,208.21z"
				/>
				<path
					fill="currentColor"
					d="M294.598,310.814c-6.802-19.007-12.374-36.684-16.186-51.51c-1.906-7.401-3.358-14.095-4.319-19.806 c-0.969-5.695-1.406-10.437-1.391-13.642c0-23.441,0-35.922,0-42.647c13.672-6.325,23.18-20.128,23.18-36.191 c0-22.012-17.853-39.873-39.88-39.873c-22.028,0-39.881,17.861-39.881,39.873c0,16.063,9.507,29.866,23.188,36.191 c0,6.725,0,19.206,0,42.647c0.022,4.289-0.8,11.244-2.521,19.675c-2.99,14.81-8.639,34.308-16.086,55.89 c-11.167,32.41-26.354,69.662-42.686,104.609c-15.433,33.078-31.949,64.075-46.751,86.909h39.227 c8.5-14.464,17.109-30.527,25.586-47.513c1.76-3.519,3.504-7.124,5.241-10.721l124.892,30.704 c5.111,9.653,10.237,18.868,15.325,27.53h39.181c-11.059-17.078-23.11-38.736-34.908-62.423 C326.715,392.273,308.201,348.834,294.598,310.814z M248.845,322.058c2.56-7.186,4.919-14.127,7.148-20.928 c1.192,3.666,2.429,7.37,3.735,11.167c7.001,20.313,15.432,42.202,24.694,64.26l-51.616-12.689 C238.6,349.618,244.018,335.538,248.845,322.058z M211.04,414.17c4.488-9.761,8.877-19.622,13.104-29.506l71.414,17.554 c2.69,6.025,5.404,12.013,8.17,17.946c3.02,6.448,6.072,12.773,9.138,19.037L211.04,414.17z"
				/>
			</g>
		</svg>
	);
};

export function IfIcon({ className = 'w-10 h-10 text-green-500', ...props }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="map-signs"
			style={{ maxWidth: '40px' }}
			className={className}
			{...props}
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M12 13v8m0-18v3M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"
			></path>
		</svg>
	);
}
export function SwitchIcon({ className = 'w-10 h-10 text-purple-500', ...props }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="map-signs"
			style={{ maxWidth: '40px' }}
			className={className}
			{...props}
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M12 13v8m0-18v3M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"
			></path>
		</svg>
	);
}

export const ResponseIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-emerald-500', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
			<path
				d="M16.1391 2.95907L7.10914 5.95907C1.03914 7.98907 1.03914 11.2991 7.10914 13.3191L9.78914 14.2091L10.6791 16.8891C12.6991 22.9591 16.0191 22.9591 18.0391 16.8891L21.0491 7.86907C22.3891 3.81907 20.1891 1.60907 16.1391 2.95907ZM16.4591 8.33907L12.6591 12.1591C12.5091 12.3091 12.3191 12.3791 12.1291 12.3791C11.9391 12.3791 11.7491 12.3091 11.5991 12.1591C11.3091 11.8691 11.3091 11.3891 11.5991 11.0991L15.3991 7.27907C15.6891 6.98907 16.1691 6.98907 16.4591 7.27907C16.7491 7.56907 16.7491 8.04907 16.4591 8.33907Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export const EditFieldIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-green-500', ...props }) => {
	return (
		<svg
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="pen"
			style={{ maxWidth: '40px' }}
			className={className}
			{...props}
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
			></path>
		</svg>
	);
};

export const SchedulerIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-gray-600', ...props }) => {
	return (
		<svg
			viewBox="0 0 24 24"
			width="1em"
			height="1em"
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="clock"
			style={{ maxWidth: '40px' }}
			className={className}
			{...props}
		>
			<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<path d="M12 6v6l4 2"></path>
				<circle cx="12" cy="12" r="10"></circle>
			</g>
		</svg>
	);
};

export const CodeIcon: React.FC<IconProps> = ({ className = 'w-10 h-10 text-indigo-600', ...props }) => {
	return (
		<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M16 4C14 4 11 5 11 9C11 13 11 15 11 18C11 21 6 23 6 23C6 23 11 25 11 28C11 31 11 35 11 39C11 43 14 44 16 44"
					stroke="#000000"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
				<path
					d="M32 4C34 4 37 5 37 9C37 13 37 15 37 18C37 21 42 23 42 23C42 23 37 25 37 28C37 31 37 35 37 39C37 43 34 44 32 44"
					stroke="#000000"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
			</g>
		</svg>
	);
};
