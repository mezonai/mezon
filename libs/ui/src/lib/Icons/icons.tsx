import React, { useState } from 'react';

export * from './attachmentThumb';
export * from './iconInEmojiPanel';
export * from './iconRightClick';
export * from './uploadThumbnail';

interface ClassIconProps extends React.HTMLAttributes<SVGElement> {
	fill?: string;
	size?: string;
}

export function Mezon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="false" aria-label="Mezon" viewBox="0 0 28 20" {...props}>
			<path
				fill="currentColor"
				d="M23.021 1.677A21.227 21.227 0 0017.658 0c-.252.462-.483.935-.687 1.418a19.931 19.931 0 00-5.943 0C10.82.935 10.59.462 10.337.005c-1.856.32-3.659.88-5.37 1.677C1.567 6.78.65 11.754 1.111 16.652A21.504 21.504 0 007.691 20c.532-.726 1.004-1.5 1.407-2.309a13.582 13.582 0 01-2.221-1.078c.188-.137.37-.274.547-.428a15.232 15.232 0 0013.152 0c.177.148.36.291.541.428-.707.424-1.453.787-2.22 1.078.408.808.875 1.578 1.405 2.303a21.5 21.5 0 006.58-3.347h.007c.541-5.674-.922-10.6-3.868-14.97zM9.681 13.638c-1.283 0-2.34-1.193-2.34-2.644S8.37 8.35 9.68 8.35c1.308 0 2.359 1.193 2.338 2.644 0 1.451-1.036 2.644-2.339 2.644zm8.635 0c-1.283 0-2.34-1.193-2.34-2.644s1.036-2.644 2.34-2.644c1.302 0 2.36 1.193 2.338 2.644 0 1.451-1.036 2.644-2.338 2.644z"
			/>
		</svg>
	);
}

export const OnlineStatus: React.FC<IconProps> = ({ defaultSize = 'w-[11px] h-[10px]' }) => {
	return (
		<svg viewBox="-0.5 -0.5 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<circle cx="6" cy="6" r="6" fill="#16A34A" />
		</svg>
	);
};

export const OfflineStatus: React.FC<IconProps> = ({ className = 'w-[11px] h-[10px]' }) => {
	return (
		<svg viewBox="-0.5 -0.5 13 13" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
			<rect x="1.5" y="1.5" width="9" height="9" rx="4.5" stroke="#AEAEAE" strokeWidth="3" />
		</svg>
	);
};

export function IconFriends(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_2719_1783)">
				<path
					d="M10 2.34375C10.3238 2.34375 10.5859 2.0816 10.5859 1.75781V0.585938C10.5859 0.262146 10.3238 0 10 0C9.67621 0 9.41406 0.262146 9.41406 0.585938V1.75781C9.41406 2.0816 9.67621 2.34375 10 2.34375Z"
					fill="currentColor"
				/>
				<path
					d="M12.758 3.34396L13.9299 2.17209C14.1588 1.94321 14.1588 1.57242 13.9299 1.34354C13.701 1.11465 13.3302 1.11465 13.1013 1.34354L11.9295 2.51541C11.7006 2.74429 11.7006 3.11508 11.9295 3.34396C12.1584 3.57285 12.5291 3.57285 12.758 3.34396Z"
					fill="currentColor"
				/>
				<path
					d="M7.24197 3.34396C7.47086 3.57285 7.84164 3.57285 8.07053 3.34396C8.29941 3.11508 8.29941 2.74429 8.07053 2.51541L6.89865 1.34354C6.66977 1.11465 6.29898 1.11465 6.0701 1.34354C5.84122 1.57242 5.84122 1.94321 6.0701 2.17209L7.24197 3.34396Z"
					fill="currentColor"
				/>
				<path
					d="M5.27344 8.28125C5.27344 6.98868 4.22226 5.9375 2.92969 5.9375C1.63712 5.9375 0.585938 6.98868 0.585938 8.28125C0.585938 9.57382 1.63712 10.625 2.92969 10.625C4.22226 10.625 5.27344 9.57382 5.27344 8.28125Z"
					fill="currentColor"
				/>
				<path
					d="M10 4.72656C9.03076 4.72656 8.24219 5.51514 8.24219 6.48438C8.24219 8.74573 6.36292 10.625 4.10156 10.625H2.92969C1.31439 10.625 0 11.9394 0 13.5547V19.4141C0 19.7379 0.262146 20 0.585938 20H5.27344C5.59677 20 5.85159 19.7379 5.85159 19.4147L5.85495 13.9352C9.27673 13.129 11.7578 10.0481 11.7578 6.48438C11.7578 5.51514 10.9692 4.72656 10 4.72656Z"
					fill="currentColor"
				/>
				<path
					d="M19.4141 8.28125C19.4141 6.98868 18.3629 5.9375 17.0703 5.9375C15.7777 5.9375 14.7266 6.98868 14.7266 8.28125C14.7266 9.57382 15.7777 10.625 17.0703 10.625C18.3629 10.625 19.4141 9.57382 19.4141 8.28125Z"
					fill="currentColor"
				/>
				<path
					d="M17.0703 10.625H15.8984C14.5511 10.625 13.3246 9.92419 12.5764 8.91772C12.2336 10.1274 11.6363 11.2253 10.8387 12.1654C11.773 12.9901 12.9275 13.6447 14.1449 13.9347L14.1484 19.4147C14.1484 19.7379 14.4032 20 14.7265 20H19.414C19.7378 20 20 19.7379 20 19.4141V13.5547C20 11.9394 18.6856 10.625 17.0703 10.625Z"
					fill="currentColor"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2719_1783">
					<rect width="20" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function IconChat(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M15.946 11.8118C16.8226 10.6243 17.3333 9.19918 17.3333 7.66667C17.3333 3.52453 13.6024 0.166668 9 0.166668C4.39763 0.166668 0.666672 3.52453 0.666672 7.66667C0.666672 11.8088 4.39763 15.1667 9 15.1667C10.2213 15.1667 11.3812 14.9302 12.4263 14.5054L16.164 15.9547C16.8505 16.2209 17.5196 15.5312 17.2327 14.8531L15.946 11.8118Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function IconEditThreeDot(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M9.00003 4.33337C8.30968 4.33337 7.75003 3.77373 7.75003 3.08337C7.75003 2.39302 8.30968 1.83337 9.00003 1.83337C9.69039 1.83337 10.25 2.39302 10.25 3.08337C10.25 3.77373 9.69039 4.33337 9.00003 4.33337Z"
				fill="currentColor"
			/>
			<path
				d="M9.00003 15.1667C8.30967 15.1667 7.75003 14.6071 7.75003 13.9167C7.75003 13.2264 8.30967 12.6667 9.00003 12.6667C9.69039 12.6667 10.25 13.2264 10.25 13.9167C10.25 14.6071 9.69039 15.1667 9.00003 15.1667Z"
				fill="currentColor"
			/>
			<path
				d="M9.00003 9.75004C8.30968 9.75004 7.75003 9.1904 7.75003 8.50004C7.75003 7.80968 8.30968 7.25004 9.00003 7.25004C9.69039 7.25004 10.25 7.80968 10.25 8.50004C10.25 9.1904 9.69039 9.75004 9.00003 9.75004Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function UploadImage(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18 3.5C19.1046 3.5 20 4.39543 20 5.5V17.5C20 18.6046 19.1046 19.5 18 19.5H2C0.89543 19.5 0 18.6046 0 17.5V5.5C0 4.39543 0.895431 3.5 2 3.5L6 3.5L6.44721 2.60557C6.786 1.928 7.47852 1.5 8.23607 1.5H11.614C12.4477 1.5 13.1939 2.01715 13.4867 2.79775L13.75 3.5L18 3.5ZM13.5 11.5C13.5 13.433 11.933 15 10 15C8.067 15 6.5 13.433 6.5 11.5C6.5 9.567 8.067 8 10 8C11.933 8 13.5 9.567 13.5 11.5ZM3 7.5C3.55228 7.5 4 7.05228 4 6.5C4 5.94772 3.55228 5.5 3 5.5C2.44772 5.5 2 5.94772 2 6.5C2 7.05228 2.44772 7.5 3 7.5Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function AddIcon({ fill = 'currentColor', ...props }: ClassIconProps) {
	return (
		<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				fill={fill}
				d="M27.3332 14C27.3332 21.3638 21.3636 27.3333 13.9998 27.3333C6.63604 27.3333 0.666504 21.3638 0.666504 14C0.666504 6.63621 6.63604 0.666672 13.9998 0.666672C21.3636 0.666672 27.3332 6.63621 27.3332 14ZM13.9999 7.00001C14.9203 7.00001 15.6665 7.7462 15.6665 8.66667V12.3333H19.3332C20.2537 12.3333 20.9999 13.0795 20.9999 14C20.9999 14.9205 20.2537 15.6667 19.3332 15.6667H15.6665V19.3333C15.6665 20.2538 14.9203 21 13.9999 21C13.0794 21 12.3332 20.2538 12.3332 19.3333V15.6667H8.66657C7.7461 15.6667 6.9999 14.9205 6.9999 14C6.9999 13.0795 7.7461 12.3333 8.66657 12.3333H12.3332V8.66667C12.3332 7.7462 13.0794 7.00001 13.9999 7.00001Z"
			/>
		</svg>
	);
}

export function Check(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="false" aria-label="Check" viewBox="0 0 16 15.2" {...props}>
			<path d="M7.4 11.17L4 8.62l1-1.36 2 1.53L10.64 4 12 5z" stroke="currentColor" />
		</svg>
	);
}

export function Tick({ fill = 'fill:[#155EEF]', defaultSize = 'w-5 h-5' }: { fill?: string; defaultSize?: string }) {
	return (
		<svg viewBox="0 0 20 20" className={`${defaultSize}`} xmlns="http://www.w3.org/2000/svg">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M17.7071 4.29289C18.0976 4.68342 18.0976 5.31658 17.7071 5.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L2.29289 9.70711C1.90237 9.31658 1.90237 8.68342 2.29289 8.29289C2.68342 7.90237 3.31658 7.90237 3.70711 8.29289L8 12.5858L16.2929 4.29289C16.6834 3.90237 17.3166 3.90237 17.7071 4.29289Z"
				fill={fill}
			/>
		</svg>
	);
}

export function Chevron(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 18 18" fill="none" {...props}>
			<path
				d="M5.20711 5.54289C4.81658 5.15237 4.18342 5.15237 3.79289 5.54289C3.40237 5.93342 3.40237 6.56658 3.79289 6.95711L5.20711 5.54289ZM9 10.75L8.29289 11.4571C8.68342 11.8476 9.31658 11.8476 9.70711 11.4571L9 10.75ZM14.2071 6.95711C14.5976 6.56658 14.5976 5.93342 14.2071 5.54289C13.8166 5.15237 13.1834 5.15237 12.7929 5.54289L14.2071 6.95711ZM3.79289 6.95711L8.29289 11.4571L9.70711 10.0429L5.20711 5.54289L3.79289 6.95711ZM9.70711 11.4571L14.2071 6.95711L12.7929 5.54289L8.29289 10.0429L9.70711 11.4571Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function SettingProfile(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function ChannelBrowser(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg role="img" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fillRule="evenodd"
				d="M18.5 23c.88 0 1.7-.25 2.4-.69l1.4 1.4a1 1 0 0 0 1.4-1.42l-1.39-1.4A4.5 4.5 0 1 0 18.5 23Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
				clipRule="evenodd"
				fill="currentColor"
			></path>
			<path
				d="M3 3a1 1 0 0 0 0 2h18a1 1 0 1 0 0-2H3ZM2 8a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1ZM3 11a1 1 0 1 0 0 2h11a1 1 0 1 0 0-2H3ZM2 16a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1ZM3 19a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H3Z"
				fill="currentColor"
			></path>
		</svg>
	);
}
export function HeadPhoneICon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g clipPath="url(#clip0_2052_1556)">
				<path
					d="M9.99998 2.16663C5.40495 2.16663 1.66663 6.2449 1.66663 11.2575V15.4242C1.66663 15.6334 1.83623 15.803 2.04543 15.803H3.18179V17.3182C3.18179 18.1538 3.8613 18.8333 4.69695 18.8333H5.83332C6.04269 18.8333 6.21212 18.6639 6.21212 18.4545V11.6363C6.21212 11.427 6.04269 11.2575 5.83332 11.2575H4.69695C3.86134 11.2575 3.18179 11.9371 3.18179 12.7727V11.2575C3.18179 7.08016 6.24056 3.68179 9.99998 3.68179C13.7594 3.68179 16.8182 7.08016 16.8182 11.2575V12.7727C16.8182 11.9371 16.1386 11.2575 15.303 11.2575H14.1666C13.9573 11.2575 13.7878 11.427 13.7878 11.6363V18.4545C13.7878 18.6639 13.9573 18.8333 14.1666 18.8333H15.303C16.1386 18.8333 16.8182 18.1538 16.8182 17.3182V15.803H17.9545C18.1637 15.803 18.3333 15.6334 18.3333 15.4242V11.2575C18.3333 6.2449 14.595 2.16663 9.99998 2.16663Z"
					fill="currentColor"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2052_1556">
					<rect width="16.6667" height="16.6667" fill="white" transform="translate(1.66663 2.16663)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function DotIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg role="img" width="24" height="24" viewBox="0 0 4 4" {...props}>
			<circle cx="2" cy="2" r="2" fill="currentColor"></circle>
		</svg>
	);
}

export function MicIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g clipPath="url(#clip0_2052_1555)">
				<path
					d="M3.04222 2.36714C2.71482 2.08598 2.2209 2.1005 1.9107 2.4107C1.58527 2.73614 1.58527 3.26378 1.9107 3.58921L7.08329 8.7618V10.5C7.08329 12.1108 8.38913 13.4166 9.99996 13.4166C10.5023 13.4166 10.9749 13.2897 11.3875 13.0661L12.2978 13.9763C11.6391 14.4126 10.8492 14.6666 9.99996 14.6666C7.69877 14.6666 5.83329 12.8011 5.83329 10.5C5.83329 10.0397 5.4602 9.66663 4.99996 9.66663C4.53972 9.66663 4.16663 10.0397 4.16663 10.5C4.16663 13.4394 6.34076 15.871 9.16867 16.2745C9.16731 16.2939 9.16663 16.3135 9.16663 16.3333V17.1666H7.49996C7.03972 17.1666 6.66663 17.5397 6.66663 18C6.66663 18.4602 7.03972 18.8333 7.49996 18.8333H12.5C12.9602 18.8333 13.3333 18.4602 13.3333 18C13.3333 17.5397 12.9602 17.1666 12.5 17.1666H10.8333V16.3333C10.8333 16.3135 10.8326 16.2939 10.8313 16.2745C11.8203 16.1334 12.7294 15.7442 13.4934 15.1719L16.9107 18.5892C17.2361 18.9147 17.7638 18.9147 18.0892 18.5892C18.3991 18.2793 18.4139 17.786 18.1335 17.4586C18.1172 17.4445 18.1012 17.4298 18.0857 17.4143L3.08583 2.41418C3.07058 2.39893 3.05604 2.38323 3.04222 2.36714Z"
					fill="currentColor"
				/>
				<path
					d="M15.4939 12.4654C15.7136 11.8513 15.8333 11.1896 15.8333 10.5C15.8333 10.0397 15.4602 9.66663 15 9.66663C14.5397 9.66663 14.1666 10.0397 14.1666 10.5C14.1666 10.7023 14.1522 10.9012 14.1243 11.0958L15.4939 12.4654Z"
					fill="currentColor"
				/>
				<path
					d="M12.9166 9.88809V5.08329C12.9166 3.47246 11.6108 2.16663 9.99996 2.16663C8.6996 2.16663 7.598 3.0176 7.22166 4.19303L12.9166 9.88809Z"
					fill="currentColor"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2052_1555">
					<rect width="16.6667" height="16.6667" fill="white" transform="translate(1.66663 2.16663)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function AddPerson(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			className=""
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z" fill="currentColor"></path>
			<path
				d="M16.83 12.93c.26-.27.26-.75-.08-.92A9.5 9.5 0 0 0 12.47 11h-.94A9.53 9.53 0 0 0 2 20.53c0 .81.66 1.47 1.47 1.47h.22c.24 0 .44-.17.5-.4.29-1.12.84-2.17 1.32-2.91.14-.21.43-.1.4.15l-.26 2.61c-.02.3.2.55.5.55h7.64c.12 0 .17-.31.06-.36C12.82 21.14 12 20.22 12 19a3 3 0 0 1 3-3h.5a.5.5 0 0 0 .5-.5V15c0-.8.31-1.53.83-2.07ZM12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
				fill="currentColor"
			></path>
		</svg>
	);
}

export function AddServe(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M10.55 4.4c.13-.24.1-.54-.12-.71L8.6 2.24a1 1 0 0 0-1.24 0l-4 3.15a1 1 0 0 0-.38.79v4.03c0 .43.5.66.82.39l2.28-1.9a3 3 0 0 1 3.84 0c.03.02.08 0 .08-.04V6.42a4 4 0 0 1 .55-2.02ZM7.36 10.23a1 1 0 0 1 1.28 0l1.18.99 2.98 2.48 1.84 1.53a1 1 0 0 1-.67 1.77.1.1 0 0 0-.1.09l-.23 3.06a2 2 0 0 1-2 1.85H4.36a2 2 0 0 1-2-1.85l-.24-3.16a1 1 0 0 1-.76-1.76l6-5Z"
			></path>
			<path
				fill="currentColor"
				d="M12 10.2c0 .14.07.28.18.38l3.74 3.12a3 3 0 0 1 .03 4.58.55.55 0 0 0-.2.37l-.12 1.65a4 4 0 0 1-.17.9c-.12.38.13.8.52.8H20a2 2 0 0 0 2-2V3.61a1.5 1.5 0 0 0-2-1.41l-6.66 2.33A2 2 0 0 0 12 6.42"
			></path>
		</svg>
	);
}

export function PendingFriend(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 20.53A9.53 9.53 0 0 1 11.53 11h.94c1.28 0 2.5.25 3.61.7.41.18.36.77-.05.96a7 7 0 0 0-3.65 8.6c.11.36-.13.74-.5.74H6.15a.5.5 0 0 1-.5-.55l.27-2.6c.02-.26-.27-.37-.41-.16-.48.74-1.03 1.8-1.32 2.9a.53.53 0 0 1-.5.41h-.22C2.66 22 2 21.34 2 20.53Z"
			></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M19 24a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm1-7a1 1 0 1 0-2 0v2c0 .27.1.52.3.7l1 1a1 1 0 0 0 1.4-1.4l-.7-.71V17Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function IConAcceptFriend(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="#8A93E6"
				d="M21.7 5.3a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0l-6-6a1 1 0 1 1 1.4-1.4L9 16.58l11.3-11.3a1 1 0 0 1 1.4 0Z"
			></path>
		</svg>
	);
}

export function IConIgnoreFriend(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="white"
				d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"
			></path>
		</svg>
	);
}

export function IconFriend(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM11.53 11A9.53 9.53 0 0 0 2 20.53c0 .81.66 1.47 1.47 1.47h.22c.24 0 .44-.17.5-.4.29-1.12.84-2.17 1.32-2.91.14-.21.43-.1.4.15l-.26 2.61c-.02.3.2.55.5.55h6.4a.5.5 0 0 0 .35-.85l-.02-.03a3 3 0 1 1 4.24-4.24l.53.52c.2.2.5.2.7 0l1.8-1.8c.17-.17.2-.43.06-.62A9.52 9.52 0 0 0 12.47 11h-.94Z"
			></path>
			<path fill="currentColor" d="M23.7 17.7a1 1 0 1 0-1.4-1.4L18 20.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l5-5Z"></path>
		</svg>
	);
}

export function Bell(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18 9v5a3 3 0 003 3v1H3v-1a3 3 0 003-3V9a6 6 0 1112 0zm-6 12c-1.476 0-2.752-.81-3.445-2h6.89c-.693 1.19-1.97 2-3.445 2z"
			/>
		</svg>
	);
}

export function Pin(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M22 12l-9.899-9.899-1.415 1.413 1.415 1.415-4.95 4.949v.002L5.736 8.465 4.322 9.88l4.243 4.242-5.657 5.656 1.414 1.414 5.657-5.656 4.243 4.242 1.414-1.414-1.414-1.414L19.171 12h.001l1.414 1.414L22 12z"
			/>
		</svg>
	);
}

export function People(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M14 8.006c0 2.205-1.794 4-4 4-2.205 0-4-1.795-4-4s1.794-4 4-4 4 1.795 4 4zm-12 11c0-3.533 3.29-6 8-6 4.711 0 8 2.467 8 6v1H2v-1z"
			/>
			<path
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M14 8.006c0 2.205-1.794 4-4 4-2.205 0-4-1.795-4-4s1.794-4 4-4 4 1.795 4 4zm-12 11c0-3.533 3.29-6 8-6 4.711 0 8 2.467 8 6v1H2v-1z"
			/>
			<path
				fill="currentColor"
				d="M20 20.006h2v-1c0-2.563-1.73-4.565-4.479-5.47 1.541 1.377 2.48 3.27 2.48 5.47v1zM14.883 11.908A4.007 4.007 0 0018 8.006a4.006 4.006 0 00-3.503-3.97A5.977 5.977 0 0116 8.007a5.974 5.974 0 01-1.362 3.804c.082.032.164.064.245.098z"
			/>
		</svg>
	);
}

interface IconProps {
	defaultFill?: string;
	defaultSize?: string;
	isWhite?: boolean;
	size?: string;
	className?: string;
}

export const ThreadIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg x="0" y="0" role="img" xmlns="http://www.w3.org/2000/svg" className={` ${defaultSize} `} viewBox="0 0 24 24">
			<path
				d="M12 2.81a1 1 0 0 1 0-1.41l.36-.36a1 1 0 0 1 1.41 0l9.2 9.2a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.3.13l-9.54-6.72a1 1 0 0 1-.08-1.58l1-1L12 2.8ZM12 21.2a1 1 0 0 1 0 1.41l-.35.35a1 1 0 0 1-1.41 0l-9.2-9.19a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.3-.12l9.54 6.72a1 1 0 0 1 .07 1.58l-1 1 .35.36ZM15.66 16.8a1 1 0 0 1-1.38.28l-8.49-5.66A1 1 0 1 1 6.9 9.76l8.49 5.65a1 1 0 0 1 .27 1.39ZM17.1 14.25a1 1 0 1 0 1.11-1.66L9.73 6.93a1 1 0 0 0-1.11 1.66l8.49 5.66Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export const CanvasIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24" className={` ${defaultSize}`}>
			<path
				d="M19,3H5C3.895,3,3,3.895,3,5v14c0,1.105,0.895,2,2,2h10l6-6V5C21,3.895,20.105,3,19,3z M8,7h8c0.552,0,1,0.448,1,1v0 c0,0.552-0.448,1-1,1H8C7.448,9,7,8.552,7,8v0C7,7.448,7.448,7,8,7z M11,13H8c-0.552,0-1-0.448-1-1v0c0-0.552,0.448-1,1-1h3 c0.552,0,1,0.448,1,1v0C12,12.552,11.552,13,11,13z M14,19.5V14h5.5L14,19.5z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export const TopicIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			width="24"
			height="24"
			fill="currentColor"
			stroke="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			className={`${defaultSize}`}
		>
			<g id="SVGRepo_iconCarrier">
				<path
					d="M5.5 12C5.49988 14.613 6.95512 17.0085 9.2741 18.2127C11.5931 19.4169 14.3897 19.2292 16.527 17.726L19.5 18V12C19.5 8.13401 16.366 5 12.5 5C8.63401 5 5.5 8.13401 5.5 12Z"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				/>
				<path
					d="M9.5 13.25C9.08579 13.25 8.75 13.5858 8.75 14C8.75 14.4142 9.08579 14.75 9.5 14.75V13.25ZM13.5 14.75C13.9142 14.75 14.25 14.4142 14.25 14C14.25 13.5858 13.9142 13.25 13.5 13.25V14.75ZM9.5 10.25C9.08579 10.25 8.75 10.5858 8.75 11C8.75 11.4142 9.08579 11.75 9.5 11.75V10.25ZM15.5 11.75C15.9142 11.75 16.25 11.4142 16.25 11C16.25 10.5858 15.9142 10.25 15.5 10.25V11.75ZM9.5 14.75H13.5V13.25H9.5V14.75ZM9.5 11.75H15.5V10.25H9.5V11.75Z"
					strokeWidth="1.5"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export function TopicIcon2(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path
					d="M8 9.5H15M8 13.5H13M15.6953 19.2318L19.1027 20.3676C19.8845 20.6282 20.6282 19.8844 20.3676 19.1027L19.2318 15.6953M15.3 19.1C15.3 19.1 14.0847 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5C20 14 19.1 15.3 19.1 15.3"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>
			</g>
		</svg>
	);
}

export const MuteBell: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			className={defaultSize}
		>
			<path
				fill="currentColor"
				d="M1.3 21.3a1 1 0 1 0 1.4 1.4l20-20a1 1 0 0 0-1.4-1.4l-20 20ZM3.13 16.13c.11.27.46.28.66.08L15.73 4.27a.47.47 0 0 0-.07-.74 6.97 6.97 0 0 0-1.35-.64.62.62 0 0 1-.38-.43 2 2 0 0 0-3.86 0 .62.62 0 0 1-.38.43A7 7 0 0 0 5 9.5v2.09a.5.5 0 0 1-.13.33l-1.1 1.22A3 3 0 0 0 3 15.15v.28c0 .24.04.48.13.7ZM18.64 9.36c.13-.13.36-.05.36.14v2.09c0 .12.05.24.13.33l1.1 1.22a3 3 0 0 1 .77 2.01v.28c0 .67-.34 1.29-.95 1.56-1.31.6-4 1.51-8.05 1.51-.46 0-.9-.01-1.33-.03a.48.48 0 0 1-.3-.83l8.27-8.28ZM9.18 19.84A.16.16 0 0 0 9 20a3 3 0 1 0 6 0c0-.1-.09-.17-.18-.16a24.84 24.84 0 0 1-5.64 0Z"
			></path>
		</svg>
	);
};

export const UnMuteBell: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5', isWhite = false }) => {
	return (
		<svg x="0" y="0" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" className={` ${defaultSize}`} viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M9.7 2.89c.18-.07.32-.24.37-.43a2 2 0 0 1 3.86 0c.05.2.19.36.38.43A7 7 0 0 1 19 9.5v2.09c0 .12.05.24.13.33l1.1 1.22a3 3 0 0 1 .77 2.01v.28c0 .67-.34 1.29-.95 1.56-1.31.6-4 1.51-8.05 1.51-4.05 0-6.74-.91-8.05-1.5-.61-.28-.95-.9-.95-1.57v-.28a3 3 0 0 1 .77-2l1.1-1.23a.5.5 0 0 0 .13-.33V9.5a7 7 0 0 1 4.7-6.61ZM9.18 19.84A.16.16 0 0 0 9 20a3 3 0 1 0 6 0c0-.1-.09-.17-.18-.16a24.86 24.86 0 0 1-5.64 0Z"
			></path>
		</svg>
	);
};

export const PinRight: React.FC<IconProps> = ({ defaultSize = 'w-6 h-6' }) => {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			className={`${defaultSize}`}
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M19.38 11.38a3 3 0 0 0 4.24 0l.03-.03a.5.5 0 0 0 0-.7L13.35.35a.5.5 0 0 0-.7 0l-.03.03a3 3 0 0 0 0 4.24L13 5l-2.92 2.92-3.65-.34a2 2 0 0 0-1.6.58l-.62.63a1 1 0 0 0 0 1.42l9.58 9.58a1 1 0 0 0 1.42 0l.63-.63a2 2 0 0 0 .58-1.6l-.34-3.64L19 11l.38.38ZM9.07 17.07a.5.5 0 0 1-.08.77l-5.15 3.43a.5.5 0 0 1-.63-.06l-.42-.42a.5.5 0 0 1-.06-.63L6.16 15a.5.5 0 0 1 .77-.08l2.14 2.14Z"
			></path>
		</svg>
	);
};

export function NotJoinedSFU(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg x="0" y="0" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" className="" viewBox="0 0 32 32" {...props}>
			<path
				fill="currentColor"
				d="M20,6a9.9355,9.9355,0,0,0-4,.8418A9.999,9.999,0,1,0,16,25.16,9.998,9.998,0,1,0,20,6ZM12,24A8,8,0,1,1,13.7573,8.2017a9.9734,9.9734,0,0,0,0,15.5986A7.9919,7.9919,0,0,1,12,24Zm8,0a7.9919,7.9919,0,0,1-1.7573-.2,9.9734,9.9734,0,0,0,0-15.5986A7.9972,7.9972,0,1,1,20,24Z"
			/>
		</svg>
	);
}

export function JoinedSFU(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<circle cx="8" cy="8" r="8" fill="currentColor"></circle>{' '}
			</g>
		</svg>
	);
}

export const MemberList: React.FC<IconProps> = ({ defaultSize = 'w-6 h-6', defaultFill = '' }) => {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			className={`${defaultSize}`}
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM18.44 17.27c.15.43.54.73 1 .73h1.06c.83 0 1.5-.67 1.5-1.5a7.5 7.5 0 0 0-6.5-7.43c-.55-.08-.99.38-1.1.92-.06.3-.15.6-.26.87-.23.58-.05 1.3.47 1.63a9.53 9.53 0 0 1 3.83 4.78ZM12.5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20.5a7.5 7.5 0 0 1 15 0c0 .83-.67 1.5-1.5 1.5a.2.2 0 0 1-.2-.16c-.2-.96-.56-1.87-.88-2.54-.1-.23-.42-.15-.42.1v2.1a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5Z"
			></path>
		</svg>
	);
};

export const ThreeDot: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5', className }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={`  ${className}  ${defaultSize}`}>
			<g id="Live area">
				<g id="Vector">
					<path
						d="M5 10C5 10.8284 4.32843 11.5 3.5 11.5C2.67157 11.5 2 10.8284 2 10C2 9.17157 2.67157 8.5 3.5 8.5C4.32843 8.5 5 9.17157 5 10Z"
						fill="currentColor"
					/>
					<path
						d="M18 10C18 10.8284 17.3284 11.5 16.5 11.5C15.6716 11.5 15 10.8284 15 10C15 9.17157 15.6716 8.5 16.5 8.5C17.3284 8.5 18 9.17157 18 10Z"
						fill="currentColor"
					/>
					<path
						d="M10 11.5C10.8284 11.5 11.5 10.8284 11.5 10C11.5 9.17157 10.8284 8.5 10 8.5C9.17157 8.5 8.5 9.17157 8.5 10C8.5 10.8284 9.17157 11.5 10 11.5Z"
						fill="currentColor"
					/>
				</g>
			</g>
		</svg>
	);
};

export const Inbox: React.FC<IconProps & { className?: string }> = ({ defaultSize = 'size-5', className = '' }) => {
	return (
		<svg
			x="0"
			y="0"
			className={`${defaultSize} ${className}`}
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5ZM4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-2.65c-.5 0-.85.5-.85 1a3 3 0 1 1-6 0c0-.5-.35-1-.85-1H5.5A1.5 1.5 0 0 1 4 11.5v-6Z"
				clipRule="evenodd"
			/>
		</svg>
	);
};

export const Help: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-6 h-6' }) => {
	const [isWhite, setIsWhite] = useState<boolean>(false);

	const handleClick = () => {
		setIsWhite(!isWhite);
	};
	return (
		<svg
			onClick={handleClick}
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			className={`dark:hover:text-white hover:text-black ${isWhite ? 'dark:text-white text-black' : 'text-theme-primary'} ${defaultSize}`}
			viewBox="0 0 24 24"
		>
			<circle cx="12" cy="12" r="10" fill="transparent"></circle>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm-.28-16c-.98 0-1.81.47-2.27 1.14A1 1 0 1 1 7.8 7.01 4.73 4.73 0 0 1 11.72 5c2.5 0 4.65 1.88 4.65 4.38 0 2.1-1.54 3.77-3.52 4.24l.14 1a1 1 0 0 1-1.98.27l-.28-2a1 1 0 0 1 .99-1.14c1.54 0 2.65-1.14 2.65-2.38 0-1.23-1.1-2.37-2.65-2.37ZM13 17.88a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export function Speaker({ defaultFill, defaultSize = 'w-5 h-5', className }: IconProps) {
	return (
		<svg
			width="18"
			height="17"
			viewBox="0 0 18 17"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={`${defaultSize} ${defaultFill ? defaultFill : ''} ${className}`}
		>
			<g id="Live area" clipPath="url(#clip0_2155_1604)">
				<g id="Vector">
					<path
						d="M10.1977 0.750516C10.4846 0.889971 10.6667 1.18099 10.6667 1.50001V16.5C10.6667 16.819 10.4846 17.1101 10.1977 17.2495C9.91077 17.389 9.56941 17.3524 9.31856 17.1553L4.24217 13.1667H1.50008C1.03984 13.1667 0.666748 12.7936 0.666748 12.3333V5.66668C0.666748 5.20644 1.03984 4.83334 1.50008 4.83334H4.24217L9.31856 0.844747C9.56941 0.64765 9.91077 0.611061 10.1977 0.750516Z"
						fill="currentColor"
					/>
					<path
						d="M14.5893 3.41075C14.2639 3.08531 13.7363 3.08531 13.4108 3.41075C13.0854 3.73619 13.0854 4.26382 13.4108 4.58926L13.6968 4.87521C15.9748 7.15327 15.9748 10.8467 13.6968 13.1248L13.4108 13.4107C13.0854 13.7362 13.0854 14.2638 13.4108 14.5893C13.7363 14.9147 14.2639 14.9147 14.5893 14.5893L14.8753 14.3033C17.8042 11.3744 17.8042 6.62563 14.8753 3.6967L14.5893 3.41075Z"
						fill="currentColor"
					/>
					<path
						d="M12.9227 5.91075C12.5972 5.58531 12.0696 5.58531 11.7442 5.91075C11.4187 6.23619 11.4187 6.76382 11.7442 7.08926L11.8871 7.23224C12.8634 8.20855 12.8634 9.79146 11.8871 10.7678L11.7442 10.9107C11.4187 11.2362 11.4187 11.7638 11.7442 12.0893C12.0696 12.4147 12.5972 12.4147 12.9227 12.0893L13.0656 11.9463C14.6928 10.3191 14.6928 7.68091 13.0656 6.05373L12.9227 5.91075Z"
						fill="currentColor"
					/>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_2155_1604">
					<rect width="16.6667" height="16.6667" fill="white" transform="translate(0.666748 0.666672)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function Search(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			className="text-theme-primary"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function AddCircle(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" {...props}>
			<circle cx="12" cy="12" r="10" fill="transparent"></circle>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm0-17a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H7a1 1 0 1 1 0-2h4V7a1 1 0 0 1 1-1Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export const Gif: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', isWhite = false, className = '' }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xlinkHref="http://www.w3.org/1999/xlink"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			preserveAspectRatio="xMidYMid meet"
			className={`text-theme-primary text-theme-primary-hover ${className}`}
			style={{ width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px)', contentVisibility: 'visible' }}
		>
			<defs>
				<clipPath id="__lottie_element_129">
					<rect width="24" height="24" x="0" y="0"></rect>
				</clipPath>
				<clipPath id="__lottie_element_131">
					<path d="M0,0 L600,0 L600,600 L0,600z"></path>
				</clipPath>
				<g id="__lottie_element_135">
					<g
						clipPath="url(#__lottie_element_139)"
						transform="matrix(1,0,0,1,0.000030517578125,-0.000030517578125)"
						opacity="1"
						style={{ display: 'block' }}
					>
						<g
							transform="matrix(24.999998092651367,0.0000197777699213475,-0.000019777766283368692,25.000003814697266,300.0060119628906,299.99285888671875)"
							opacity="1"
							style={{ display: 'block' }}
						>
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M3.0299999713897705,3.7190001010894775 C3.0299999713897705,3.7190001010894775 4.604000091552734,3.7190001010894775 4.604000091552734,3.7190001010894775 C4.604000091552734,3.7190001010894775 4.604000091552734,0.8949999809265137 4.604000091552734,0.8949999809265137 C4.604000091552734,0.8949999809265137 7.363999843597412,0.8949999809265137 7.363999843597412,0.8949999809265137 C7.363999843597412,0.8949999809265137 7.363999843597412,-0.5289999842643738 7.363999843597412,-0.5289999842643738 C7.363999843597412,-0.5289999842643738 4.604000091552734,-0.5289999842643738 4.604000091552734,-0.5289999842643738 C4.604000091552734,-0.5289999842643738 4.604000091552734,-2.2960000038146973 4.604000091552734,-2.2960000038146973 C4.604000091552734,-2.2960000038146973 8,-2.2960000038146973 8,-2.2960000038146973 C8,-2.2960000038146973 8,-3.7190001010894775 8,-3.7190001010894775 C8,-3.7190001010894775 3.0299999713897705,-3.7190001010894775 3.0299999713897705,-3.7190001010894775 C3.0299999713897705,-3.7190001010894775 3.0299999713897705,3.7190001010894775 3.0299999713897705,3.7190001010894775z"
								></path>
							</g>
						</g>
						<g
							transform="matrix(24.999998092651367,0,0,25.000003814697266,299.9960021972656,299.99298095703125)"
							opacity="1"
							style={{ display: 'block' }}
						>
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M1.5199999809265137,3.7190001010894775 C1.5199999809265137,3.7190001010894775 -0.05400000140070915,3.7190001010894775 -0.05400000140070915,3.7190001010894775 C-0.05400000140070915,3.7190001010894775 -0.05400000140070915,-3.7190001010894775 -0.05400000140070915,-3.7190001010894775 C-0.05400000140070915,-3.7190001010894775 1.5199999809265137,-3.7190001010894775 1.5199999809265137,-3.7190001010894775 C1.5199999809265137,-3.7190001010894775 1.5199999809265137,3.7190001010894775 1.5199999809265137,3.7190001010894775z"
								></path>
							</g>
						</g>
						<g
							transform="matrix(24.999998092651367,0,0,25.000003814697266,299.9950256347656,299.99298095703125)"
							opacity="1"
							style={{ display: 'block' }}
						>
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M-4.820000171661377,3.869999885559082 C-5.445000171661377,3.869999885559082 -5.998000144958496,3.7079999446868896 -6.480000019073486,3.384999990463257 C-6.961999893188477,3.062000036239624 -7.335000038146973,2.6080000400543213 -7.60099983215332,2.0260000228881836 C-7.867000102996826,1.437000036239624 -8,0.7620000243186951 -8,0 C-8,-0.7549999952316284 -7.860000133514404,-1.4229999780654907 -7.579999923706055,-2.005000114440918 C-7.293000221252441,-2.5869998931884766 -6.879000186920166,-3.0429999828338623 -6.340000152587891,-3.374000072479248 C-5.794000148773193,-3.7049999237060547 -5.144000053405762,-3.869999885559082 -4.388999938964844,-3.869999885559082 C-3.749000072479248,-3.869999885559082 -3.177999973297119,-3.7339999675750732 -2.674999952316284,-3.4609999656677246 C-2.1649999618530273,-3.187999963760376 -1.7799999713897705,-2.802999973297119 -1.5210000276565552,-2.306999921798706 C-1.5210000276565552,-2.306999921798706 -2.739000082015991,-1.434000015258789 -2.739000082015991,-1.434000015258789 C-3.1059999465942383,-2.109999895095825 -3.6519999504089355,-2.447000026702881 -4.377999782562256,-2.447000026702881 C-5.039000034332275,-2.447000026702881 -5.546000003814697,-2.2320001125335693 -5.8979997634887695,-1.8009999990463257 C-6.25,-1.3769999742507935 -6.426000118255615,-0.7760000228881836 -6.426000118255615,0 C-6.426000118255615,0.7829999923706055 -6.25,1.3869999647140503 -5.8979997634887695,1.8109999895095825 C-5.546000003814697,2.234999895095825 -5.039000034332275,2.447000026702881 -4.377999782562256,2.447000026702881 C-4.083000183105469,2.447000026702881 -3.812999963760376,2.3929998874664307 -3.569000005722046,2.2850000858306885 C-3.316999912261963,2.1700000762939453 -3.124000072479248,2.0160000324249268 -2.986999988555908,1.8220000267028809 C-2.986999988555908,1.8220000267028809 -2.986999988555908,0.8949999809265137 -2.986999988555908,0.8949999809265137 C-2.986999988555908,0.8949999809265137 -4.701000213623047,0.8949999809265137 -4.701000213623047,0.8949999809265137 C-4.701000213623047,0.8949999809265137 -4.701000213623047,-0.5070000290870667 -4.701000213623047,-0.5070000290870667 C-4.701000213623047,-0.5070000290870667 -1.4559999704360962,-0.5070000290870667 -1.4559999704360962,-0.5070000290870667 C-1.4559999704360962,-0.5070000290870667 -1.4559999704360962,3.7190001010894775 -1.4559999704360962,3.7190001010894775 C-1.4559999704360962,3.7190001010894775 -2.7279999256134033,3.7190001010894775 -2.7279999256134033,3.7190001010894775 C-2.7279999256134033,3.7190001010894775 -2.933000087738037,3.006999969482422 -2.933000087738037,3.006999969482422 C-3.3570001125335693,3.5820000171661377 -3.9860000610351562,3.869999885559082 -4.820000171661377,3.869999885559082z"
								></path>
							</g>
						</g>
					</g>
				</g>
				<clipPath id="__lottie_element_139">
					<path d="M0,0 L600,0 L600,600 L0,600z"></path>
				</clipPath>
				<filter id="__lottie_element_153" filterUnits="objectBoundingBox" x="0%" y="0%" width="100%" height="100%">
					<feComponentTransfer in="SourceGraphic">
						<feFuncA type="table" tableValues="1.0 0.0"></feFuncA>
					</feComponentTransfer>
				</filter>
				<mask id="__lottie_element_135_2" mask-type="alpha">
					<g filter="url(#__lottie_element_153)">
						<rect width="600" height="600" x="0" y="0" fill="#ffffff" opacity="0"></rect>
						<use xlinkHref="#__lottie_element_135"></use>
					</g>
				</mask>
			</defs>
			<g clipPath="url(#__lottie_element_129)">
				<g
					clipPath="url(#__lottie_element_131)"
					transform="matrix(0.03999999910593033,0,0,0.03999999910593033,0,0)"
					opacity="1"
					style={{ display: 'block' }}
				>
					<g mask="url(#__lottie_element_135_2)" style={{ display: 'block' }}>
						<g transform="matrix(25,0.0000018166268773711636,-0.0000018166268773711636,25,300,300)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M-7,-10 C-8.656999588012695,-10 -10,-8.656999588012695 -10,-7 C-10,-7 -10,7 -10,7 C-10,8.656999588012695 -8.656999588012695,10 -7,10 C-7,10 7,10 7,10 C8.656999588012695,10 10,8.656999588012695 10,7 C10,7 10,-7 10,-7 C10,-8.656999588012695 8.656999588012695,-10 7,-10 C7,-10 -7,-10 -7,-10z"
								></path>
							</g>
						</g>
					</g>
				</g>
			</g>
		</svg>
	);
};

export const Sticker: React.FC<IconProps> = ({ className = '', defaultFill = '#AEAEAE' }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			preserveAspectRatio="xMidYMid meet"
			className={`text-theme-primary text-theme-primary-hover ${className} `}
			style={{ width: '100%', height: '100%', transform: 'translate3d(0px, 0px, 0px)', contentVisibility: 'visible' }}
		>
			<defs>
				<clipPath id="__lottie_element_339">
					<rect width="24" height="24" x="0" y="0"></rect>
				</clipPath>
				<clipPath id="__lottie_element_341">
					<path d="M0,0 L600,0 L600,600 L0,600z"></path>
				</clipPath>
				<g id="__lottie_element_346">
					<g style={{ display: 'block' }} transform="matrix(25,0,0,25,300,300)" opacity="1">
						<g opacity="1" transform="matrix(1,0,0,1,0,0)">
							<path
								fill="currentColor"
								fillOpacity="1"
								d=" M-5.5,-2 C-4.671999931335449,-2 -4,-2.671999931335449 -4,-3.5 C-4,-4.328000068664551 -4.671999931335449,-5 -5.5,-5 C-6.328000068664551,-5 -7,-4.328000068664551 -7,-3.5 C-7,-2.671999931335449 -6.328000068664551,-2 -5.5,-2z M7,-3.5 C7,-2.671999931335449 6.328000068664551,-2 5.5,-2 C4.671999931335449,-2 4,-2.671999931335449 4,-3.5 C4,-4.328000068664551 4.671999931335449,-5 5.5,-5 C6.328000068664551,-5 7,-4.328000068664551 7,-3.5z M-2.9110000133514404,-0.5559999942779541 C-3.2179999351501465,-1.0149999856948853 -3.8399999141693115,-1.1380000114440918 -4.298999786376953,-0.8309999704360962 C-4.757999897003174,-0.5239999890327454 -4.880000114440918,0.09700000286102295 -4.572999954223633,0.5559999942779541 C-3.5880000591278076,2.0269999504089355 -1.9079999923706055,3 0,3 C1.9079999923706055,3 3.5880000591278076,2.0269999504089355 4.572999954223633,0.5559999942779541 C4.880000114440918,0.09700000286102295 4.756999969482422,-0.5239999890327454 4.297999858856201,-0.8309999704360962 C3.8389999866485596,-1.1380000114440918 3.2179999351501465,-1.0149999856948853 2.9110000133514404,-0.5559999942779541 C2.2809998989105225,0.38499999046325684 1.2120000123977661,1 0,1 C-1.2120000123977661,1 -2.2809998989105225,0.38499999046325684 -2.9110000133514404,-0.5559999942779541z"
							></path>
						</g>
					</g>
				</g>
				<g id="__lottie_element_356">
					<g clipPath="url(#__lottie_element_357)" transform="matrix(1,0,0,1,0,0)" opacity="1" style={{ display: 'none' }}>
						<g
							style={{ display: 'block' }}
							transform="matrix(25,0.00002699064862099476,-0.00002699064862099476,25,299.9999084472656,300.0001525878906)"
							opacity="1"
						>
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M-5.5,-5 C-4.671999931335449,-5 -4,-4.328000068664551 -4,-3.5 C-4,-2.671999931335449 -4.671999931335449,-2 -5.5,-2 C-6.328000068664551,-2 -7,-2.671999931335449 -7,-3.5 C-7,-4.328000068664551 -6.328000068664551,-5 -5.5,-5z"
								></path>
							</g>
						</g>
						<g
							style={{ display: 'block' }}
							transform="matrix(25,-0.00003855806789943017,0.00003855806789943017,25,300.0001220703125,300.0002136230469)"
							opacity="1"
						>
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M5.5,-5 C6.328000068664551,-5 7,-4.328000068664551 7,-3.5 C7,-2.671999931335449 6.328000068664551,-2 5.5,-2 C4.671999931335449,-2 4,-2.671999931335449 4,-3.5 C4,-4.328000068664551 4.671999931335449,-5 5.5,-5z"
								></path>
							</g>
						</g>
						<g style={{ display: 'block' }} transform="matrix(25,0,0,25,299.99700927734375,300)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									strokeLinecap="round"
									strokeLinejoin="miter"
									fillOpacity="0"
									strokeMiterlimit="4"
									stroke="rgb(255,255,255)"
									strokeOpacity="1"
									strokeWidth="2"
									d=" M-3.742000102996826,0 C-2.934999942779541,1.2059999704360962 -1.559999942779541,2 0,2 C1.559999942779541,2 2.934999942779541,1.2059999704360962 3.742000102996826,0"
								></path>
							</g>
						</g>
						<g style={{ display: 'block' }} transform="matrix(25,0,0,25,300.0119934082031,300.0119934082031)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									strokeLinecap="butt"
									strokeLinejoin="miter"
									fillOpacity="0"
									strokeMiterlimit="4"
									stroke="rgb(255,255,255)"
									strokeOpacity="1"
									strokeWidth="2"
									d=" M3,11.395999908447266 C3,11.395999908447266 2.997952699661255,7.036206245422363 3.017204999923706,6.98994255065918 C3.0424916744232178,4.799476623535156 4.8052239418029785,3.0345537662506104 7.034482002258301,3.0103445053100586 C7.108546257019043,2.99234938621521 11.405303001403809,3.009446620941162 11.405303001403809,3.009446620941162 C12.519303321838379,3.009446620941162 13.067999839782715,4.3460001945495605 12.279999732971191,5.133999824523926 C12.279999732971191,5.133999824523926 5.133999824523926,12.279999732971191 5.133999824523926,12.279999732971191 C4.3460001945495605,13.067999839782715 3,12.510000228881836 3,11.395999908447266z"
								></path>
							</g>
						</g>
						<g clipPath="url(#__lottie_element_363)" style={{ display: 'block' }} transform="matrix(25,0,0,25,300,300)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M-6,-10 C-6,-10 6,-10 6,-10 C8.208999633789062,-10 10,-8.208999633789062 10,-6 C10,-6 10,2.756999969482422 10,2.756999969482422 C10,3.552999973297119 9.684000015258789,4.315999984741211 9.121000289916992,4.879000186920166 C9.121000289916992,4.879000186920166 4.879000186920166,9.121000289916992 4.879000186920166,9.121000289916992 C4.315999984741211,9.684000015258789 3.552999973297119,10 2.756999969482422,10 C2.756999969482422,10 -6,10 -6,10 C-8.208999633789062,10 -10,8.208999633789062 -10,6 C-10,6 -10,-6 -10,-6 C-10,-8.208999633789062 -8.208999633789062,-10 -6,-10z"
								></path>
							</g>
						</g>
					</g>
				</g>
				<clipPath id="__lottie_element_357">
					<path d="M0,0 L600,0 L600,600 L0,600z"></path>
				</clipPath>
				<clipPath id="__lottie_element_363">
					<path
						fill="#ffffff"
						clipRule="nonzero"
						d=" M10.014676094055176,1.5569427013397217 C9.99467658996582,1.7469426393508911 9.784676551818848,1.9969426393508911 9.614676475524902,2.0069427490234375 C9.444676399230957,2.0169427394866943 9.734676361083984,2.091942548751831 9.734676361083984,2.091942548751831 C9.734676361083984,2.091942548751831 10.09467601776123,2.0669426918029785 10.09467601776123,2.0669426918029785 C10.09467601776123,2.0669426918029785 10.034676551818848,1.3669426441192627 10.014676094055176,1.5569427013397217"
						fillOpacity="1"
					></path>
					<path
						fill="#ffffff"
						clipRule="nonzero"
						d=" M2.0066189765930176,9.544352531433105 C1.9866188764572144,9.734352111816406 1.7766188383102417,9.984352111816406 1.606618881225586,9.994352340698242 C1.4366189241409302,10.004352569580078 1.7266188859939575,10.079352378845215 1.7266188859939575,10.079352378845215 C1.7266188859939575,10.079352378845215 2.0866189002990723,10.054352760314941 2.0866189002990723,10.054352760314941 C2.0866189002990723,10.054352760314941 2.0266189575195312,9.354351997375488 2.0066189765930176,9.544352531433105"
						fillOpacity="1"
					></path>
				</clipPath>
				<filter id="__lottie_element_380" filterUnits="objectBoundingBox" x="0%" y="0%" width="100%" height="100%">
					<feComponentTransfer in="SourceGraphic">
						<feFuncA type="table" tableValues="1.0 0.0"></feFuncA>
					</feComponentTransfer>
				</filter>
				<mask id="__lottie_element_356_2" mask-type="alpha">
					<g filter="url(#__lottie_element_380)">
						<rect width="600" height="600" x="0" y="0" fill="#ffffff" opacity="0"></rect>
						<use xlinkHref="#__lottie_element_356"></use>
					</g>
				</mask>
				<filter id="__lottie_element_381" filterUnits="objectBoundingBox" x="0%" y="0%" width="100%" height="100%">
					<feComponentTransfer in="SourceGraphic">
						<feFuncA type="table" tableValues="1.0 0.0"></feFuncA>
					</feComponentTransfer>
				</filter>
				<mask id="__lottie_element_346_2" mask-type="alpha">
					<g filter="url(#__lottie_element_381)">
						<rect width="600" height="600" x="0" y="0" fill="#ffffff" opacity="0"></rect>
						<use xlinkHref="#__lottie_element_346"></use>
					</g>
				</mask>
			</defs>
			<g clipPath="url(#__lottie_element_339)">
				<g
					clipPath="url(#__lottie_element_341)"
					transform="matrix(0.03999999910593033,0,0,0.03999999910593033,0,0)"
					opacity="1"
					style={{ display: 'block' }}
				>
					<g mask="url(#__lottie_element_356_2)" style={{ display: 'none' }}>
						<g transform="matrix(25,0,0,25,300,300)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="rgb(88,101,242)"
									fillOpacity="1"
									d=" M-6,-10 C-6,-10 6,-10 6,-10 C8.208999633789062,-10 10,-8.208999633789062 10,-6 C10,-6 10,2.756999969482422 10,2.756999969482422 C10,3.552999973297119 9.684000015258789,4.315999984741211 9.121000289916992,4.879000186920166 C9.121000289916992,4.879000186920166 4.879000186920166,9.121000289916992 4.879000186920166,9.121000289916992 C4.315999984741211,9.684000015258789 3.552999973297119,10 2.756999969482422,10 C2.756999969482422,10 -6,10 -6,10 C-8.208999633789062,10 -10,8.208999633789062 -10,6 C-10,6 -10,-6 -10,-6 C-10,-8.208999633789062 -8.208999633789062,-10 -6,-10z"
								></path>
							</g>
						</g>
					</g>
					<g transform="matrix(25,0,0,25,300,300)" opacity="1" style={{ display: 'none' }}>
						<g opacity="1" transform="matrix(1,0,0,1,0,0)">
							<path
								fill="rgb(88,101,242)"
								fillOpacity="1"
								d=" M-6,-10 C-6,-10 6,-10 6,-10 C8.208999633789062,-10 10,-8.208999633789062 10,-6 C10,-6 10,1.5 10,1.5 C10,1.7760000228881836 9.776000022888184,2 9.5,2 C9.5,2 7,2 7,2 C4.238999843597412,2 2,4.238999843597412 2,7 C2,7 2,9.5 2,9.5 C2,9.776000022888184 1.7760000228881836,10 1.5,10 C1.5,10 -6,10 -6,10 C-8.208999633789062,10 -10,8.208999633789062 -10,6 C-10,6 -10,-6 -10,-6 C-10,-8.208999633789062 -8.208999633789062,-10 -6,-10z M9.659000396728516,4 C9.692000389099121,4 9.71399974822998,4.033999919891357 9.699999809265137,4.064000129699707 C9.555000305175781,4.36299991607666 9.359999656677246,4.639999866485596 9.121000289916992,4.879000186920166 C9.121000289916992,4.879000186920166 4.879000186920166,9.121000289916992 4.879000186920166,9.121000289916992 C4.639999866485596,9.359999656677246 4.36299991607666,9.555000305175781 4.064000129699707,9.699999809265137 C4.033999919891357,9.71399974822998 4,9.692000389099121 4,9.659000396728516 C4,9.659000396728516 4,9.17199993133545 4,9.17199993133545 C4,9.17199993133545 4,7 4,7 C4,5.3429999351501465 5.3429999351501465,4 7,4 C7,4 9.17199993133545,4 9.17199993133545,4 C9.17199993133545,4 9.659000396728516,4 9.659000396728516,4z M-5.5,-2 C-4.671999931335449,-2 -4,-2.671999931335449 -4,-3.5 C-4,-4.328000068664551 -4.671999931335449,-5 -5.5,-5 C-6.328000068664551,-5 -7,-4.328000068664551 -7,-3.5 C-7,-2.671999931335449 -6.328000068664551,-2 -5.5,-2z M7,-3.5 C7,-4.328000068664551 6.328000068664551,-5 5.5,-5 C4.671999931335449,-5 4,-4.328000068664551 4,-3.5 C4,-2.671999931335449 4.671999931335449,-2 5.5,-2 C6.328000068664551,-2 7,-2.671999931335449 7,-3.5z M-2.9110000133514404,-0.5559999942779541 C-3.2179999351501465,-1.0149999856948853 -3.8399999141693115,-1.1380000114440918 -4.298999786376953,-0.8309999704360962 C-4.757999897003174,-0.5239999890327454 -4.880000114440918,0.09700000286102295 -4.572999954223633,0.5559999942779541 C-3.5880000591278076,2.0269999504089355 -1.9079999923706055,3 0,3 C1.9079999923706055,3 3.5880000591278076,2.0269999504089355 4.572999954223633,0.5559999942779541 C4.880000114440918,0.09700000286102295 4.756999969482422,-0.5239999890327454 4.297999858856201,-0.8309999704360962 C3.8389999866485596,-1.1380000114440918 3.2179999351501465,-1.0149999856948853 2.9110000133514404,-0.5559999942779541 C2.2809998989105225,0.38499999046325684 1.2120000123977661,1 0,1 C-1.2120000123977661,1 -2.2809998989105225,0.38499999046325684 -2.9110000133514404,-0.5559999942779541z"
							></path>
						</g>
					</g>
					<g mask="url(#__lottie_element_346_2)" style={{ display: 'block' }}>
						<g transform="matrix(25,0,0,25,300,300)" opacity="1">
							<g opacity="1" transform="matrix(1,0,0,1,0,0)">
								<path
									fill="currentColor"
									fillOpacity="1"
									d=" M-6,-10 C-6,-10 6,-10 6,-10 C8.208999633789062,-10 10,-8.208999633789062 10,-6 C10,-6 10,1.5 10,1.5 C10,1.7760000228881836 9.776000022888184,2 9.5,2 C9.5,2 7,2 7,2 C4.238999843597412,2 2,4.238999843597412 2,7 C2,7 2,9.5 2,9.5 C2,9.776000022888184 1.7760000228881836,10 1.5,10 C1.5,10 -6,10 -6,10 C-8.208999633789062,10 -10,8.208999633789062 -10,6 C-10,6 -10,-6 -10,-6 C-10,-8.208999633789062 -8.208999633789062,-10 -6,-10z M9.659000396728516,4 C9.692000389099121,4 9.71399974822998,4.033999919891357 9.699999809265137,4.064000129699707 C9.555000305175781,4.36299991607666 9.359999656677246,4.639999866485596 9.121000289916992,4.879000186920166 C9.121000289916992,4.879000186920166 4.879000186920166,9.121000289916992 4.879000186920166,9.121000289916992 C4.639999866485596,9.359999656677246 4.36299991607666,9.555000305175781 4.064000129699707,9.699999809265137 C4.033999919891357,9.71399974822998 4,9.692000389099121 4,9.659000396728516 C4,9.659000396728516 4,9.17199993133545 4,9.17199993133545 C4,9.17199993133545 4,7 4,7 C4,5.3429999351501465 5.3429999351501465,4 7,4 C7,4 9.17199993133545,4 9.17199993133545,4 C9.17199993133545,4 9.659000396728516,4 9.659000396728516,4z"
								></path>
							</g>
						</g>
					</g>
				</g>
			</g>
		</svg>
	);
};

export const Smile: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5', className = '' }) => {
	return (
		<svg
			className={`${defaultSize} text-theme-primary text-theme-primary-hover ${className}`}
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22ZM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-9.8 1.17a1 1 0 0 1 1.39.27 3.5 3.5 0 0 0 5.82 0 1 1 0 0 1 1.66 1.12 5.5 5.5 0 0 1-9.14 0 1 1 0 0 1 .27-1.4Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const ArrowDown: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5 min-w-4', size = '' }) => {
	return (
		<svg viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${defaultSize} ${size}`}>
			<g id="Live area">
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M14.5892 5.91075C14.9147 6.23619 14.9147 6.76382 14.5892 7.08926L9.58924 12.0893C9.2638 12.4147 8.73616 12.4147 8.41072 12.0893L3.41072 7.08926C3.08529 6.76382 3.08529 6.23619 3.41072 5.91075C3.73616 5.58531 4.2638 5.58531 4.58924 5.91075L8.99998 10.3215L13.4107 5.91075C13.7362 5.58531 14.2638 5.58531 14.5892 5.91075Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export function EyeClose(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M1.3 21.3a1 1 0 1 0 1.4 1.4l20-20a1 1 0 0 0-1.4-1.4l-20 20ZM3.16 16.05c.18.24.53.26.74.05l.72-.72c.18-.18.2-.45.05-.66a15.7 15.7 0 0 1-1.43-2.52.48.48 0 0 1 0-.4c.4-.9 1.18-2.37 2.37-3.72C7.13 6.38 9.2 5 12 5c.82 0 1.58.12 2.28.33.18.05.38 0 .52-.13l.8-.8c.25-.25.18-.67-.15-.79A9.79 9.79 0 0 0 12 3C4.89 3 1.73 10.11 1.11 11.7a.83.83 0 0 0 0 .6c.25.64.9 2.15 2.05 3.75Z"
			></path>
			<path
				fill="currentColor"
				d="M8.18 10.81c-.13.43.36.65.67.34l2.3-2.3c.31-.31.09-.8-.34-.67a4 4 0 0 0-2.63 2.63ZM12.85 15.15c-.31.31-.09.8.34.67a4.01 4.01 0 0 0 2.63-2.63c.13-.43-.36-.65-.67-.34l-2.3 2.3Z"
			></path>
			<path
				fill="currentColor"
				d="M9.72 18.67a.52.52 0 0 0-.52.13l-.8.8c-.25.25-.18.67.15.79 1.03.38 2.18.61 3.45.61 7.11 0 10.27-7.11 10.89-8.7a.83.83 0 0 0 0-.6c-.25-.64-.9-2.15-2.05-3.75a.49.49 0 0 0-.74-.05l-.72.72a.51.51 0 0 0-.05.66 15.7 15.7 0 0 1 1.43 2.52c.06.13.06.27 0 .4-.4.9-1.18 2.37-2.37 3.72C16.87 17.62 14.8 19 12 19c-.82 0-1.58-.12-2.28-.33Z"
			></path>
		</svg>
	);
}

export function EyeOpen(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" d="M15.56 11.77c.2-.1.44.02.44.23a4 4 0 1 1-4-4c.21 0 .33.25.23.44a2.5 2.5 0 0 0 3.32 3.32Z"></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M22.89 11.7c.07.2.07.4 0 .6C22.27 13.9 19.1 21 12 21c-7.11 0-10.27-7.11-10.89-8.7a.83.83 0 0 1 0-.6C1.73 10.1 4.9 3 12 3c7.11 0 10.27 7.11 10.89 8.7Zm-4.5-3.62A15.11 15.11 0 0 1 20.85 12c-.38.88-1.18 2.47-2.46 3.92C16.87 17.62 14.8 19 12 19c-2.8 0-4.87-1.38-6.39-3.08A15.11 15.11 0 0 1 3.15 12c.38-.88 1.18-2.47 2.46-3.92C7.13 6.38 9.2 5 12 5c2.8 0 4.87 1.38 6.39 3.08Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export const ArrowRight: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5 min-w-4' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area">
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M5.91083 3.41075C6.23626 3.08531 6.7639 3.08531 7.08934 3.41075L12.0893 8.41075C12.4148 8.73619 12.4148 9.26382 12.0893 9.58926L7.08934 14.5893C6.7639 14.9147 6.23626 14.9147 5.91083 14.5893C5.58539 14.2638 5.58539 13.7362 5.91083 13.4107L10.3216 9L5.91083 4.58926C5.58539 4.26382 5.58539 3.73619 5.91083 3.41075Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export const LongCorner: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg width="12" height="36" viewBox="0 0 12 36" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 1V31.6667C1 33.5076 2.49238 35 4.33333 35H11" stroke="#6A6A6A" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
};

export const ShortCorner: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1.5 1V7.66667C1.5 9.50762 2.99238 11 4.83333 11H11.5" stroke="#6A6A6A" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
};

export const Sent: React.FC<IconProps> = () => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ">
			<g id="Live area">
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M17.7071 4.29289C18.0976 4.68342 18.0976 5.31658 17.7071 5.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L2.29289 9.70711C1.90237 9.31658 1.90237 8.68342 2.29289 8.29289C2.68342 7.90237 3.31658 7.90237 3.70711 8.29289L8 12.5858L16.2929 4.29289C16.6834 3.90237 17.3166 3.90237 17.7071 4.29289Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export function Plus(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
			<path fill="currentColor" d="M13 5a1 1 0 1 0-2 0v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V5Z"></path>
		</svg>
	);
}

export const Close: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-4 h-4' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={`  ${defaultSize}`}>
			<g id="Live area">
				<path
					fill="currentColor"
					id="Vector"
					d="M2.29289 16.2929C1.90237 16.6834 1.90237 17.3166 2.29289 17.7071C2.68342 18.0976 3.31658 18.0976 3.70711 17.7071L10 11.4142L16.2929 17.7071C16.6834 18.0976 17.3166 18.0976 17.7071 17.7071C18.0976 17.3166 18.0976 16.6834 17.7071 16.2929L11.4142 10L17.7071 3.70711C18.0976 3.31658 18.0976 2.68342 17.7071 2.29289C17.3166 1.90237 16.6834 1.90237 16.2929 2.29289L10 8.58579L3.70711 2.2929C3.31658 1.90237 2.68342 1.90237 2.29289 2.2929C1.90237 2.68342 1.90237 3.31658 2.29289 3.70711L8.58579 10L2.29289 16.2929Z"
				/>
			</g>
		</svg>
	);
};

export const IconOr: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			className={defaultSize}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M19.12 2a.5.5 0 0 1 .43.76L8.22 21.64a.75.75 0 0 1-.64.36h-2.7a.5.5 0 0 1-.43-.76L15.78 2.36a.75.75 0 0 1 .64-.36h2.7Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const IconTick: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M21.7 5.3a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0l-6-6a1 1 0 1 1 1.4-1.4L9 16.58l11.3-11.3a1 1 0 0 1 1.4 0Z"
			></path>
		</svg>
	);
};

export const Forum: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="live area" clipPath="url(#clip0_2541_3331)">
				<g id="Vector">
					<path
						d="M13.0153 5.32968C11.8863 3.02422 9.52441 1.5 6.87514 1.5C3.08433 1.5 0.000301025 4.56653 0.000301025 8.33578C0.000301025 9.36013 0.220218 10.3419 0.65427 11.2573L0.0116679 14.4707C-0.070127 14.8798 0.290724 15.2414 0.699855 15.1604L3.95286 14.5173C4.39086 14.725 4.84398 14.883 5.30955 14.9919C4.26594 10.049 8.01257 5.40928 13.0153 5.32968Z"
						fill="#AEAEAE"
					/>
					<path
						d="M19.3459 16.2572C19.4581 16.0205 19.5557 15.7792 19.6393 15.534H19.6178C21.0806 11.2405 18.0044 6.72796 13.463 6.50824C9.55543 6.32817 6.30875 9.45614 6.30875 13.3357C6.30875 17.1017 9.36965 20.1659 13.1345 20.1713C14.1557 20.17 15.1345 19.9501 16.0472 19.5172C19.6099 20.2215 19.3321 20.1714 19.4139 20.1714C19.7842 20.1714 20.0608 19.8321 19.9885 19.4706L19.3459 16.2572Z"
						fill="#AEAEAE"
					/>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_2541_3331">
					<rect width="20" height="20" fill="white" transform="translate(0 0.5)" />
				</clipPath>
			</defs>
		</svg>
	);
};

export const Announcement: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area" clipPath="url(#clip0_2541_1180)">
				<g id="Vector">
					<path
						d="M8 12.5H3.5C1.567 12.5 0 10.933 0 8.99998C0 7.06698 1.567 5.49998 3.5 5.49998H8L12.3243 1.53606C12.9657 0.948107 14 1.40311 14 2.27321V15.7267C14 16.5968 12.9657 17.0518 12.3243 16.4639L8 12.5Z"
						fill="#AEAEAE"
					/>
					<path
						d="M16 8.99998C16 8.44769 16.4477 7.99998 17 7.99998H19C19.5523 7.99998 20 8.44769 20 8.99998C20 9.55226 19.5523 9.99998 19 9.99998H17C16.4477 9.99998 16 9.55226 16 8.99998Z"
						fill="#AEAEAE"
					/>
					<path
						d="M19.6 4.79998C20.0418 4.46861 20.1314 3.84181 19.8 3.39998C19.4686 2.95815 18.8418 2.86861 18.4 3.19998L16.4 4.69998C15.9582 5.03135 15.8686 5.65815 16.2 6.09998C16.5314 6.54181 17.1582 6.63135 17.6 6.29998L19.6 4.79998Z"
						fill="#AEAEAE"
					/>
					<path
						d="M16.2 11.9C15.8686 12.3418 15.9582 12.9686 16.4 13.3L18.4 14.8C18.8418 15.1313 19.4686 15.0418 19.8 14.6C20.1314 14.1582 20.0418 13.5313 19.6 13.2L17.6 11.7C17.1582 11.3686 16.5314 11.4581 16.2 11.9Z"
						fill="#AEAEAE"
					/>
					<path
						d="M7 14H4L5.67566 19.027C5.86935 19.608 6.41315 20 7.02566 20C7.99695 20 8.68281 19.0484 8.37566 18.127L7 14Z"
						fill="#AEAEAE"
					/>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_2541_1180">
					<rect width="20" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export const Private: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area" clipPath="url(#clip0_2604_2865)">
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M5 6V5C5 2.23858 7.23858 0 10 0C12.7614 0 15 2.23858 15 5V6H16C17.1046 6 18 6.89543 18 8V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V8C2 6.89543 2.89543 6 4 6H5ZM7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5V6H7V5ZM10 10.75C10.6904 10.75 11.25 11.3096 11.25 12V14C11.25 14.6904 10.6904 15.25 10 15.25C9.30964 15.25 8.75 14.6904 8.75 14V12C8.75 11.3096 9.30964 10.75 10 10.75Z"
					fill="#AEAEAE"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2604_2865">
					<rect width="20" height="20" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export const SpeakerLocked: React.FC<IconProps> = ({ defaultFill, defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			className={`${defaultSize} ${defaultFill ? defaultFill : ''}`}
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"
			></path>
			<path
				fill="currentColor"
				d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"
			></path>
		</svg>
	);
};

export const HashtagLocked: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={`block  ${defaultSize}`}>
			<g>
				<path
					d="M17.4393 9.4715L17.6833 8.6585H11.7483C11.5857 8.6585 11.4231 8.49589 11.4231 8.33329V7.76419H9.14667L10.2036 3.86175H8.41496L7.35805 7.76419H3.37431L2.8865 9.4715H6.87024L6.05724 12.3983H2.1548L1.66699 14.1056H5.65073L4.51252 18.3333H6.30114L7.43935 14.1056H10.5288L9.39057 18.3333H11.1792L12.3174 14.1056H16.3011L16.7889 12.3983H12.8052L13.6182 9.4715H17.4393ZM10.9353 12.3983H7.84585L8.65886 9.4715H11.7483L10.9353 12.3983Z"
					fill="currentColor"
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M13.2117 3.45524V3.13004C13.2117 2.31703 13.8621 1.66663 14.6751 1.66663C15.4881 1.66663 16.1385 2.31703 16.1385 3.13004V3.45524H16.4637C16.7889 3.45524 17.0328 3.69915 17.0328 4.02435V6.95118C17.0328 7.27638 16.7889 7.52028 16.4637 7.52028H12.8865C12.5613 7.52028 12.3174 7.27638 12.3174 6.95118V4.02435C12.3174 3.69915 12.5613 3.45524 12.8865 3.45524H13.2117ZM13.7808 3.13004C13.7808 2.64224 14.1873 2.23573 14.6751 2.23573C15.1629 2.23573 15.5694 2.64224 15.5694 3.13004V3.45524H13.7808V3.13004ZM14.6751 4.83736C14.919 4.83736 15.0816 4.99996 15.0816 5.24386V5.81297C15.0816 6.05687 14.919 6.21947 14.6751 6.21947C14.4312 6.21947 14.2686 6.05687 14.2686 5.81297V5.24386C14.3499 4.99996 14.5125 4.83736 14.6751 4.83736Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export function HashtagWarning(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg className="icon_d8bfb3" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M18.09 1.63c.4-.7 1.43-.7 1.82 0l3.96 6.9c.38.66-.12 1.47-.91 1.47h-7.92c-.79 0-1.3-.81-.91-1.48l3.96-6.9Zm.46 1.87h.9c.3 0 .52.26.5.55l-.22 2.02c-.01.16-.17.26-.33.23a1.92 1.92 0 0 0-.8 0c-.16.03-.32-.07-.33-.23l-.21-2.02a.5.5 0 0 1 .5-.55ZM19 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
				clipRule="evenodd"
				className=""
			></path>
			<path
				fill="currentColor"
				d="M11.45 8c.35 0 .6.35.55.7-.02.2-.02.4 0 .6.04.35-.2.7-.55.7h-1.6l-.67 4h4.97l.26-1.55c.05-.27.31-.45.59-.45h.92c.31 0 .55.28.5.58L16.18 14H20a1 1 0 1 1 0 2h-4.15l-.86 5.16a1 1 0 0 1-1.98-.32l.8-4.84H8.86l-.86 5.16A1 1 0 0 1 6 20.84L6.82 16H3a1 1 0 1 1 0-2h4.15l.67-4H4a1 1 0 0 1 0-2h4.15l.86-5.16a1 1 0 1 1 1.98.32L10.19 8h1.26Z"
				className=""
			></path>
		</svg>
	);
}

export const Hashtag: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5', className = '' }) => {
	return (
		<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={`block ${defaultSize} ${className}`}>
			<g className="translate-x-[1px] translate-y-[2px]">
				<path
					d="M3.56915 15.415L4.73001 11.0721H0.666992L1.13341 9.31012H5.20679L6.00489 6.28358H1.94187L2.41865 4.53192H6.48167L7.55961 0.5H9.38382L8.29552 4.53192H11.4568L12.5347 0.5H14.3589L13.2706 4.53192H17.3337L16.8672 6.28358H12.8042L11.9854 9.31012H16.0484L15.582 11.0721H11.519L10.3581 15.415H8.54427L9.69477 11.0721H6.54386L5.383 15.415H3.56915ZM7.02064 9.31012H10.1716L10.98 6.28358H7.8291L7.02064 9.31012Z"
					fill="currentColor"
					strokeWidth="1.2"
				/>
			</g>
		</svg>
	);
};

export const Location: React.FC<IconProps> = ({ defaultFill }) => {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
			className={`w-5 h-5  ${defaultFill}`}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23c3 0 9-8.03 9-13a9 9 0 1 0-18 0c0 4.97 6 13 9 13Zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const Reply: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	const [isWhite, setIsWhite] = useState<boolean>(false);

	const handleClick = () => {
		setIsWhite(!isWhite);
	};
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			onClick={handleClick}
			className={` ${defaultSize}`}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5 4C5.55228 4 6 4.44772 6 5V12C6 13.1046 6.89543 14 8 14H17.5858L15.2929 11.7071C14.9024 11.3166 14.9024 10.6834 15.2929 10.2929C15.6834 9.90237 16.3166 9.90237 16.7071 10.2929L20.7071 14.2929C20.8946 14.4804 21 14.7348 21 15C21 15.2652 20.8946 15.5196 20.7071 15.7071L16.7071 19.7071C16.3166 20.0976 15.6834 20.0976 15.2929 19.7071C14.9024 19.3166 14.9024 18.6834 15.2929 18.2929L17.5858 16H8C5.79086 16 4 14.2091 4 12V5C4 4.44772 4.44772 4 5 4Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export const ReplyCorner: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg width="32" height="20" viewBox="0 0 32 10" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 9V6C1 3.23858 3.23858 1 6 1H31" stroke="#535353" strokeLinecap="round" />
		</svg>
	);
};

export function PenEdit(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z"
			></path>
		</svg>
	);
}

export const ViewRole: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	const [isWhite, setIsWhite] = useState<boolean>(false);

	const handleClick = () => {
		setIsWhite(!isWhite);
	};

	return (
		<svg
			className={isWhite ? 'dark:text-white text-black' : 'text-theme-primary'}
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			onClick={handleClick}
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path fill="currentColor" d="M15.56 11.77c.2-.1.44.02.44.23a4 4 0 1 1-4-4c.21 0 .33.25.23.44a2.5 2.5 0 0 0 3.32 3.32Z"></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M22.89 11.7c.07.2.07.4 0 .6C22.27 13.9 19.1 21 12 21c-7.11 0-10.27-7.11-10.89-8.7a.83.83 0 0 1 0-.6C1.73 10.1 4.9 3 12 3c7.11 0 10.27 7.11 10.89 8.7Zm-4.5-3.62A15.11 15.11 0 0 1 20.85 12c-.38.88-1.18 2.47-2.46 3.92C16.87 17.62 14.8 19 12 19c-2.8 0-4.87-1.38-6.39-3.08A15.11 15.11 0 0 1 3.15 12c.38-.88 1.18-2.47 2.46-3.92C7.13 6.38 9.2 5 12 5c2.8 0 4.87 1.38 6.39 3.08Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const ImageThumbnail: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" className={defaultSize}>
			<path
				fill={defaultFill}
				fillRule="evenodd"
				d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5Zm13.35 8.13 3.5 4.67c.37.5.02 1.2-.6 1.2H5.81a.75.75 0 0 1-.59-1.22l1.86-2.32a1.5 1.5 0 0 1 2.34 0l.5.64 2.23-2.97a2 2 0 0 1 3.2 0ZM10.2 5.98c.23-.91-.88-1.55-1.55-.9a.93.93 0 0 1-1.3 0c-.67-.65-1.78-.01-1.55.9a.93.93 0 0 1-.65 1.12c-.9.26-.9 1.54 0 1.8.48.14.77.63.65 1.12-.23.91.88 1.55 1.55.9a.93.93 0 0 1 1.3 0c.67.65 1.78.01 1.55-.9a.93.93 0 0 1 .65-1.12c.9-.26.9-1.54 0-1.8a.93.93 0 0 1-.65-1.12Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const SyncIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" className={`${defaultSize}`}>
			<path
				fill={defaultFill}
				d="M21 2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 1 1 0-2h3.93A8 8 0 0 0 6.97 5.78a1 1 0 0 1-1.26-1.56A9.98 9.98 0 0 1 20 6V3a1 1 0 0 1 1-1ZM3 22a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H5.07a8 8 0 0 0 11.96 2.22 1 1 0 1 1 1.26 1.56A9.99 9.99 0 0 1 4 18v3a1 1 0 0 1-1 1Z"
			></path>
		</svg>
	);
};

export const LockIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" className={`${defaultSize}`}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M6 9h1V6a5 5 0 0 1 10 0v3h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm9-3v3H9V6a3 3 0 1 1 6 0Zm-1 8a2 2 0 0 1-1 1.73V18a1 1 0 1 1-2 0v-2.27A2 2 0 1 1 14 14Z"
			></path>
		</svg>
	);
};
export const UnLockIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" className={`${defaultSize}`}>
			<path
				fill={defaultFill}
				fillRule="evenodd"
				d="M7 7a5 5 0 0 1 9.843-1.25 1 1 0 0 1-1.937.5A3 3 0 0 0 9 7v3h8.4c.88 0 1.6.72 1.6 1.6v7c0 1.32-1.08 2.4-2.4 2.4H7.4C6.08 21 5 19.92 5 18.6v-7c0-.88.72-1.6 1.6-1.6H7V7Zm5 5.25a1.75 1.75 0 0 0-.75 3.332V18a.75.75 0 0 0 1.5 0v-2.418A1.75 1.75 0 0 0 12 12.25Z"
			></path>
		</svg>
	);
};

export const PlusIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" className={defaultSize}>
			<g fill="none" fillRule="evenodd">
				<path d="m0 0h16v16h-16z" />
				<path
					d="m8 13.5c-3.032 0-5.5-2.468-5.5-5.5s2.468-5.5 5.5-5.5 5.5 2.468 5.5 5.5-2.468 5.5-5.5 5.5zm-7-5.5c0 1.857.737 3.637 2.05 4.95s3.093 2.05 4.95 2.05 3.637-.737 4.95-2.05 2.05-3.093 2.05-4.95-.737-3.637-2.05-4.95-3.093-2.05-4.95-2.05c-3.866 0-7 3.134-7 7zm8-3h-2v2h-2v2h2v2h2v-2h2v-2h-2z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export const RoleIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5 min-w-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="23" height="20" fill="none" viewBox="0 0 24 24" className={defaultSize}>
			<path
				fill={defaultFill}
				fillRule="evenodd"
				d="M3.47 5.18c.27-.4.64-.74 1.1-.96l6.09-3.05a3 3 0 0 1 2.68 0l6.1 3.05A2.83 2.83 0 0 1 21 6.75v3.5a14.17 14.17 0 0 1-8.42 12.5c-.37.16-.79.16-1.16 0A14.18 14.18 0 0 1 3 9.77V6.75c0-.57.17-1.11.47-1.57Zm2.95 10.3A12.18 12.18 0 0 0 12 20.82a12.18 12.18 0 0 0 5.58-5.32A9.49 9.49 0 0 0 12.47 14h-.94c-1.88 0-3.63.55-5.11 1.49ZM12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
			></path>
		</svg>
	);
};

export const MemberIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5 min-w-5' }) => {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
			className={defaultSize}
		>
			<path
				fill="currentColor"
				d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM11.53 11A9.53 9.53 0 0 0 2 20.53c0 .81.66 1.47 1.47 1.47h.22c.24 0 .44-.17.5-.4.29-1.12.84-2.17 1.32-2.91.14-.21.43-.1.4.15l-.26 2.61c-.02.3.2.55.5.55h11.7a.5.5 0 0 0 .5-.55l-.27-2.6c-.02-.26.27-.37.41-.16.48.74 1.03 1.8 1.32 2.9.06.24.26.41.5.41h.22c.81 0 1.47-.66 1.47-1.47A9.53 9.53 0 0 0 12.47 11h-.94Z"
			></path>
		</svg>
	);
};

export const EscIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className={`${defaultSize}`}>
			<circle cx="12" cy="12" r="10" fill="transparent"></circle>
			<path
				fill={defaultFill}
				stroke="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm4.7-15.7a1 1 0 0 0-1.4 0L12 10.58l-3.3-3.3a1 1 0 0 0-1.4 1.42L10.58 12l-3.3 3.3a1 1 0 1 0 1.42 1.4L12 13.42l3.3 3.3a1 1 0 0 0 1.4-1.42L13.42 12l3.3-3.3a1 1 0 0 0 0-1.4Z"
			></path>
		</svg>
	);
};

export const CopyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => {
	return (
		<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
			<path
				d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	);
};
export const PasteIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
			<path
				fillRule="evenodd"
				d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
				clipRule="evenodd"
			/>
		</svg>
	);
};

export const RightIcon: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-5 h-5 dark:text-[#B5BAC1] text-black dark:group-hover:text-white">
			<path
				fillRule="evenodd"
				d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
				clipRule="evenodd"
				fill="currentColor"
			/>
		</svg>
	);
};

export function TrashIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="" {...props}>
			<path
				fill="currentColor"
				d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z"
				className=""
			></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export const Locked: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
			<path
				fillRule="evenodd"
				d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
				clipRule="evenodd"
				fill="#AEAEAE"
			/>
		</svg>
	);
};

export const Download: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-6 h-6' }) => {
	return (
		<svg
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={`${defaultSize}`}
		>
			<path
				fill="currentColor"
				d="M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
				className={defaultFill}
			></path>
		</svg>
	);
};

export const OpenMenu: React.FC<IconProps> = ({ defaultFill = 'currentColor', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 297" className={defaultSize}>
			<g>
				<g>
					<g>
						<path
							fill="currentColor"
							d="M280.214,39.211H16.786C7.531,39.211,0,46.742,0,55.997v24.335c0,9.256,7.531,16.787,16.786,16.787h263.428     c9.255,0,16.786-7.531,16.786-16.787V55.997C297,46.742,289.469,39.211,280.214,39.211z"
						/>
						<path
							fill="currentColor"
							d="M280.214,119.546H16.786C7.531,119.546,0,127.077,0,136.332v24.336c0,9.255,7.531,16.786,16.786,16.786h263.428     c9.255,0,16.786-7.531,16.786-16.786v-24.336C297,127.077,289.469,119.546,280.214,119.546z"
						/>
						<path
							fill="currentColor"
							d="M280.214,199.881H16.786C7.531,199.881,0,207.411,0,216.668v24.335c0,9.255,7.531,16.786,16.786,16.786h263.428     c9.255,0,16.786-7.531,16.786-16.786v-24.335C297,207.411,289.469,199.881,280.214,199.881z"
						/>
					</g>
				</g>
			</g>
		</svg>
	);
};

export const TrendingGifs: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2 19V5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Zm16-9.59V13a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1h-6a1 1 0 1 0 0 2h3.59l-5.09 5.09-1.8-1.8a1 1 0 0 0-1.4 0l-4 4a1 1 0 1 0 1.4 1.42L9 13.4l1.8 1.8a1 1 0 0 0 1.4 0L18 9.4Z"
				clipRule="evenodd"
				className="#FFFFFF"
			></path>
		</svg>
	);
};

export const BackToCategoriesGif: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M3.3 11.3a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4-1.4L6.42 13H20a1 1 0 1 0 0-2H6.41l3.3-3.3a1 1 0 0 0-1.42-1.4l-5 5Z"
				className={defaultFill}
			></path>
		</svg>
	);
};

export const SmilingFace: React.FC<IconProps> = ({ defaultFill = 'currentColor', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg width="18" height="18" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_2372_24105)">
				<path
					d="M12.5 2C7.00797 2 2.5 6.50742 2.5 12C2.5 17.4926 7.00797 22 12.5 22C17.992 22 22.5 17.4926 22.5 12C22.5 6.50742 17.992 2 12.5 2ZM8.98438 6.72656C9.95367 6.72656 10.7422 7.51508 10.7422 8.48438C10.7422 8.80824 10.4801 9.07031 10.1562 9.07031C9.83238 9.07031 9.57031 8.80824 9.57031 8.48438C9.57031 8.16109 9.30711 7.89844 8.98438 7.89844C8.66164 7.89844 8.39844 8.16109 8.39844 8.48438C8.39844 8.80824 8.13637 9.07031 7.8125 9.07031C7.48863 9.07031 7.22656 8.80824 7.22656 8.48438C7.22656 7.51508 8.01508 6.72656 8.98438 6.72656ZM12.5 17.2734C9.59207 17.2734 7.22656 14.9079 7.22656 12C7.22656 11.6761 7.48863 11.4141 7.8125 11.4141C8.13637 11.4141 8.39844 11.6761 8.39844 12C8.39844 14.2614 10.2386 16.1016 12.5 16.1016C14.7614 16.1016 16.6016 14.2614 16.6016 12C16.6016 11.6761 16.8636 11.4141 17.1875 11.4141C17.5114 11.4141 17.7734 11.6761 17.7734 12C17.7734 14.9079 15.4079 17.2734 12.5 17.2734ZM17.1875 9.07031C16.8636 9.07031 16.6016 8.80824 16.6016 8.48438C16.6016 8.16109 16.3384 7.89844 16.0156 7.89844C15.6929 7.89844 15.4297 8.16109 15.4297 8.48438C15.4297 8.80824 15.1676 9.07031 14.8438 9.07031C14.5199 9.07031 14.2578 8.80824 14.2578 8.48438C14.2578 7.51508 15.0463 6.72656 16.0156 6.72656C16.9849 6.72656 17.7734 7.51508 17.7734 8.48438C17.7734 8.80824 17.5114 9.07031 17.1875 9.07031Z"
					stroke={defaultFill}
				/>
			</g>
			<defs>
				<clipPath id="clip0_2372_24105">
					<rect width="20" height="20" fill="white" transform="translate(2.5 2)" />
				</clipPath>
			</defs>
		</svg>
	);
};

export function DarkModeIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
			<path
				fillRule="evenodd"
				d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

export function MinusCircleIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g clipPath="url(#clip0_403_3438)">
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM8.00005 10.75C7.30969 10.75 6.75005 11.3096 6.75005 12C6.75005 12.6904 7.30969 13.25 8.00005 13.25H16C16.6904 13.25 17.25 12.6904 17.25 12C17.25 11.3096 16.6904 10.75 16 10.75H8.00005Z"
					fill="#F23F43"
				/>
			</g>
			<defs>
				<clipPath id="clip0_403_3438">
					<rect width="20" height="20" fill="white" transform="translate(2 2)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function ConvertAccount(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g clipPath="url(#clip0_403_2187)">
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M16.2929 2.29289C16.6834 1.90237 17.3166 1.90237 17.7071 2.29289L21.7071 6.29289C22.0976 6.68342 22.0976 7.31658 21.7071 7.70711L17.7071 11.7071C17.3166 12.0976 16.6834 12.0976 16.2929 11.7071C15.9024 11.3166 15.9024 10.6834 16.2929 10.2929L18.5858 8L5 8C4.44772 8 4 7.55228 4 7C4 6.44771 4.44772 6 5 6L18.5858 6L16.2929 3.70711C15.9024 3.31658 15.9024 2.68342 16.2929 2.29289ZM7.70711 12.2929C8.09763 12.6834 8.09763 13.3166 7.70711 13.7071L5.41421 16L19 16C19.5523 16 20 16.4477 20 17C20 17.5523 19.5523 18 19 18L5.41421 18L7.70711 20.2929C8.09763 20.6834 8.09763 21.3166 7.70711 21.7071C7.31658 22.0976 6.68342 22.0976 6.29289 21.7071L2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17C2 16.7348 2.10536 16.4804 2.29289 16.2929L6.29289 12.2929C6.68342 11.9024 7.31658 11.9024 7.70711 12.2929Z"
					fill="currentColor"
				/>
			</g>
			<defs>
				<clipPath id="clip0_403_2187">
					<rect width="20" height="20" fill="white" transform="translate(22 2) rotate(90)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function CreateCategoryIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			fill="none"
			viewBox="0 0 24 24"
			className="text-theme-primary-hover"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-7l-1.4-2.1A2 2 0 0 0 8.92 2H5Zm7 7a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3H8a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function CheckIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check2" viewBox="0 0 16 16" {...props}>
			<path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0" />
		</svg>
	);
}

export function CloseIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="25"
			height="25"
			fill="currentColor"
			className="bi bi-x-circle-fill"
			viewBox="0 0 16 16"
			{...props}
		>
			<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
		</svg>
	);
}

export function ArrowLeftCircle(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			className="bi bi-arrow-left-circle"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				fillRule="evenodd"
				d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"
			/>
		</svg>
	);
}

export function ArrowLeftCircleActive(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			className="bi bi-arrow-left-circle-fill"
			viewBox="0 0 16 16"
			{...props}
		>
			<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z" />
		</svg>
	);
}

export function ArrowDownFill(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			className="bi bi-caret-down-fill text-theme-primary"
			viewBox="0 0 16 16"
			{...props}
		>
			<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
		</svg>
	);
}

export function FiltersIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M22 5a1 1 0 0 1-1 1h-8.2a2.5 2.5 0 1 1 0-2H21a1 1 0 0 1 1 1ZM6 5c0 .34.04.67.11 1H3a1 1 0 0 1 0-2h3.11A4.5 4.5 0 0 0 6 5ZM22 19a1 1 0 0 1-1 1h-8.2a2.5 2.5 0 1 1 0-2H21a1 1 0 0 1 1 1ZM6 19c0 .34.04.67.11 1H3a1 1 0 1 1 0-2h3.11A4.5 4.5 0 0 0 6 19ZM21 13a1 1 0 1 0 0-2h-3.2a2.5 2.5 0 1 0 0 2H21ZM11.11 13a4.5 4.5 0 0 1 0-2H3a1 1 0 1 0 0 2h8.11Z"
			></path>
		</svg>
	);
}

export function ImageUploadIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8.67c0 .12-.34.17-.39.06A2.87 2.87 0 0 0 19 12a3 3 0 0 0-2.7 1.7c-.1.18-.36.22-.48.06l-.47-.63a2 2 0 0 0-3.2 0L9.93 16.1l-.5-.64a1.5 1.5 0 0 0-2.35 0l-1.86 2.32A.75.75 0 0 0 5.81 19h5.69c.28 0 .5.23.54.5.17.95.81 1.68 1.69 2.11.11.06.06.39-.06.39H5a3 3 0 0 1-3-3V5Zm8.2.98c.23-.91-.88-1.55-1.55-.9a.93.93 0 0 1-1.3 0c-.67-.65-1.78-.01-1.55.9a.93.93 0 0 1-.65 1.12c-.9.26-.9 1.54 0 1.8.48.14.77.63.65 1.12-.23.91.88 1.55 1.55.9a.93.93 0 0 1 1.3 0c.67.65 1.78.01 1.55-.9a.93.93 0 0 1 .65-1.12c.9-.26.9-1.54 0-1.8a.93.93 0 0 1-.65-1.12Z"
				clipRule="evenodd"
			></path>
			<path fill="currentColor" d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"></path>
		</svg>
	);
}
export function UploadSoundIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<g id="SVGRepo_iconCarrier">
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H8C8.55228 21 9 21.4477 9 22C9 22.5523 8.55228 23 8 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM19.3053 13.2807C19.7026 12.897 20.3357 12.9081 20.7193 13.3053C22.4269 15.0736 22.4269 17.9264 20.7193 19.6947C20.3357 20.0919 19.7026 20.103 19.3053 19.7193C18.9081 19.3357 18.897 18.7026 19.2807 18.3053C20.2398 17.3121 20.2398 15.6879 19.2807 14.6947C18.897 14.2974 18.9081 13.6643 19.3053 13.2807ZM18 12C18 10.7639 16.5889 10.0584 15.6 10.8L12.6667 13H12C10.3431 13 9 14.3431 9 16V17C9 18.6569 10.3431 20 12 20H12.6667L15.6 22.2C16.5889 22.9416 18 22.2361 18 21V12ZM13.8667 14.6L16 13V20L13.8667 18.4C13.5205 18.1404 13.0994 18 12.6667 18H12C11.4477 18 11 17.5523 11 17V16C11 15.4477 11.4477 15 12 15H12.6667C13.0994 15 13.5205 14.8596 13.8667 14.6Z"
					fill="currentColor"
				></path>
			</g>
		</svg>
	);
}

export function AvatarUser(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			enableBackground="new 0 0 128 128"
			id="Layer_1"
			version="1.1"
			viewBox="0 0 128 128"
			xmlSpace="preserve"
		>
			<circle cx="64" cy="64" fill="#4B5F83" id="circle" r="64" />
			<g id="icon">
				<path d="M64,99h35c0-16-10.4-29-24.6-33.4C80.1,62,84,55.7,84,48.5c0-11-9-20-20-20" fill="#E6E6E6" id="right" />
				<path d="M64,28.5c-11,0-20,9-20,20c0,7.2,3.9,13.6,9.6,17.1C39.4,70,29,83,29,99h35" fill="#FFFFFF" id="left" />
			</g>
		</svg>
	);
}

export function IconEvents({ defaultSize = 'w-5 h-5 ' }) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={defaultSize}
		>
			<path
				fill="currentColor"
				d="M7 1a1 1 0 0 1 1 1v.75c0 .14.11.25.25.25h7.5c.14 0 .25-.11.25-.25V2a1 1 0 1 1 2 0v.75c0 .14.11.25.25.25H19a3 3 0 0 1 3 3 1 1 0 0 1-1 1H3a1 1 0 0 1-1-1 3 3 0 0 1 3-3h.75c.14 0 .25-.11.25-.25V2a1 1 0 0 1 1-1Z"
			></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2 10a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-9Zm3.5 2a.5.5 0 0 0-.5.5v3c0 .28.22.5.5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function IconClockChannel() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 120 90" className="w-[120px]">
			<linearGradient id="a" gradientUnits="userSpaceOnUse" x1="35.37" x2="52.77" y1="10.71" y2="31.55">
				<stop offset="0" stopColor="#4788ff" />
				<stop offset="1" stopColor="#365dec" />
			</linearGradient>
			<linearGradient id="b" gradientUnits="userSpaceOnUse" x1="48.13" x2="106.86" y1="55.69" y2="85.26">
				<stop offset="0" stopColor="#ffd01a" />
				<stop offset="1" stopColor="#ffa600" />
			</linearGradient>
			<path d="m83.7 65.31h-47.4v-41.6a23.7 23.7 0 0 1 47.4 0zm-34.49-12.9h21.58v-28.7a10.79 10.79 0 0 0 -21.58 0z" fill="url(#a)" />
			<path
				d="m9.13 17.87 3.39-1.19a.89.89 0 0 0 0-1.68l-3.39-1.18a.88.88 0 0 1 -.55-.55l-1.18-3.39a.89.89 0 0 0 -1.68 0l-1.19 3.39a.89.89 0 0 1 -.54.55l-3.4 1.18a.89.89 0 0 0 0 1.68l3.41 1.19a.9.9 0 0 1 .54.54l1.18 3.39a.89.89 0 0 0 1.68 0l1.18-3.39a.89.89 0 0 1 .55-.54z"
				fill="#776bff"
			/>
			<g fill="#00e0a7">
				<rect
					height="4.29"
					rx="1.43"
					transform="matrix(.70710678 -.70710678 .70710678 .70710678 17.64 83.79)"
					width="2.86"
					x="108.54"
					y="18.46"
				/>
				<rect
					height="4.29"
					rx="1.43"
					transform="matrix(.70710678 -.70710678 .70710678 .70710678 14.29 91.89)"
					width="2.86"
					x="116.63"
					y="26.55"
				/>
				<rect
					height="4.29"
					rx="1.43"
					transform="matrix(.70710678 .70710678 -.70710678 .70710678 49.15 -77.45)"
					width="2.86"
					x="116.63"
					y="18.46"
				/>
				<rect
					height="4.29"
					rx="1.43"
					transform="matrix(.70710678 .70710678 -.70710678 .70710678 52.5 -69.35)"
					width="2.86"
					x="108.54"
					y="26.55"
				/>
			</g>
			<circle cx="110.16" cy="71.6" fill="#ff87ff" r="2.22" />
			<rect fill="url(#b)" height="56.67" rx="3.23" width="85.13" x="17.43" y="33.33" />
			<rect fill="#ffd01a" height="56.67" rx="3.23" width="66.95" x="17.43" y="33.33" />
			<g fill="none" strokeMiterlimit="10">
				<g stroke="#ffa600" strokeWidth="2.262054">
					<path d="m17.43 81.75h85.14" />
					<path d="m17.43 41.58h66.95" />
					<path d="m84.38 75.05h18.19" />
					<path d="m84.38 68.36h18.19" />
					<path d="m84.38 61.66h18.19" />
					<path d="m84.38 54.97h18.19" />
					<path d="m84.38 48.28h18.19" />
					<path d="m84.38 41.58h18.19" />
				</g>
				<path d="m43.24 15.61a18.72 18.72 0 0 1 10.44-9.41" stroke="#9ecdff" strokeLinecap="round" strokeWidth="4.095565" />
			</g>
			<circle cx="50.91" cy="55.98" fill="#270813" r="5.96" />
			<path d="m50.91 56-5.36 11.83a2.05 2.05 0 0 0 1.87 2.89h7a2.05 2.05 0 0 0 1.87-2.89z" fill="#270813" />
		</svg>
	);
}

export function IconPhoneDM({ defaultSize = 'w-5 h-5 ' }) {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={defaultSize}
		>
			<path
				fill="currentColor"
				d="M2 7.4A5.4 5.4 0 0 1 7.4 2c.36 0 .7.22.83.55l1.93 4.64a1 1 0 0 1-.43 1.25L7 10a8.52 8.52 0 0 0 7 7l1.12-2.24a1 1 0 0 1 1.19-.51l5.06 1.56c.38.11.63.46.63.85C22 19.6 19.6 22 16.66 22h-.37C8.39 22 2 15.6 2 7.71V7.4ZM13 3a1 1 0 0 1 1-1 8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 0 0-6-6 1 1 0 0 1-1-1Z"
			></path>
			<path fill="currentColor" d="M13 7a1 1 0 0 1 1-1 4 4 0 0 1 4 4 1 1 0 1 1-2 0 2 2 0 0 0-2-2 1 1 0 0 1-1-1Z"></path>
		</svg>
	);
}

export function IconMeetDM({ isShowMeetDM = false, defaultSize = 'w-5 h-5', isShowLine = false, ...props }) {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={defaultSize}
			{...props}
		>
			<path
				fill="currentColor"
				d="M4 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2.12a1 1 0 0 0 .55.9l3 1.5a1 1 0 0 0 1.45-.9V7.62a1 1 0 0 0-1.45-.9l-3 1.5a1 1 0 0 0-.55.9V7a3 3 0 0 0-3-3H4Z"
			></path>
			{isShowLine && (
				<>
					{' '}
					<line
						x1="4"
						y1="20"
						x2="20"
						y2="4"
						stroke="white"
						strokeLinecap="round"
						strokeWidth="3.5"
						className={`line-animation ${!isShowMeetDM ? 'line-retract' : ''}`}
					/>
					<line
						x1="4"
						y1="20"
						x2="20"
						y2="4"
						stroke="black"
						strokeLinecap="round"
						strokeWidth="1.5"
						className={`line-animation ${!isShowMeetDM ? 'line-retract' : ''}`}
					/>
				</>
			)}
		</svg>
	);
}

export function IconAddFriendDM({ defaultSize = 'w-5 h-5' }) {
	return (
		<svg
			className={defaultSize}
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM16.62 13.17c-.22.29-.65.37-.92.14-.34-.3-.7-.57-1.09-.82-.52-.33-.7-1.05-.47-1.63.11-.27.2-.57.26-.87.11-.54.55-1 1.1-.92 1.6.2 3.04.92 4.15 1.98.3.27-.25.95-.65.95a3 3 0 0 0-2.38 1.17ZM15.19 15.61c.13.16.02.39-.19.39a3 3 0 0 0-1.52 5.59c.2.12.26.41.02.41h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5a7.5 7.5 0 0 1 13.19-4.89ZM9.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 22Z"
			></path>
			<path fill="currentColor" d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"></path>
		</svg>
	);
}

export function IconUserProfileDM({ defaultSize = 'w-5 h-5 ' }) {
	return (
		<svg
			className={defaultSize}
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M23 12.38c-.02.38-.45.58-.78.4a6.97 6.97 0 0 0-6.27-.08.54.54 0 0 1-.44 0 8.97 8.97 0 0 0-11.16 3.55c-.1.15-.1.35 0 .5.37.58.8 1.13 1.28 1.61.24.24.64.15.8-.15.19-.38.39-.73.58-1.02.14-.21.43-.1.4.15l-.19 1.96c-.02.19.07.37.23.47A8.96 8.96 0 0 0 12 21a.4.4 0 0 1 .38.27c.1.33.25.65.4.95.18.34-.02.76-.4.77L12 23a11 11 0 1 1 11-10.62ZM15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
				clipRule="evenodd"
			></path>
			<path fill="currentColor" d="M24 19a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"></path>
		</svg>
	);
}

export function IconReplyMessDeleted() {
	return (
		<svg width="8" height="8" viewBox="0 0 8 8" className=" ml-[2px] mt-1">
			<path
				d="M0.809739 3.59646L5.12565 0.468433C5.17446 0.431163 5.23323 0.408043 5.2951 0.401763C5.35698 0.395482 5.41943 0.406298 5.4752 0.432954C5.53096 0.45961 5.57776 0.50101 5.61013 0.552343C5.64251 0.603676 5.65914 0.662833 5.6581 0.722939V2.3707C10.3624 2.3707 11.2539 5.52482 11.3991 7.21174C11.4028 7.27916 11.3848 7.34603 11.3474 7.40312C11.3101 7.46021 11.2554 7.50471 11.1908 7.53049C11.1262 7.55626 11.0549 7.56204 10.9868 7.54703C10.9187 7.53201 10.857 7.49695 10.8104 7.44666C8.72224 5.08977 5.6581 5.63359 5.6581 5.63359V7.28135C5.65831 7.34051 5.64141 7.39856 5.60931 7.44894C5.5772 7.49932 5.53117 7.54004 5.4764 7.5665C5.42163 7.59296 5.3603 7.60411 5.29932 7.59869C5.23834 7.59328 5.18014 7.57151 5.13128 7.53585L0.809739 4.40892C0.744492 4.3616 0.691538 4.30026 0.655067 4.22975C0.618596 4.15925 0.599609 4.08151 0.599609 4.00269C0.599609 3.92386 0.618596 3.84612 0.655067 3.77562C0.691538 3.70511 0.744492 3.64377 0.809739 3.59646Z"
				fill="currentColor"
			></path>
		</svg>
	);
}

export function IConShareEventLocation() {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M13 16V5.41l3.3 3.3a1 1 0 1 0 1.4-1.42l-5-5a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 1.4 1.42L11 5.4V16a1 1 0 1 0 2 0Z"
			></path>
			<path
				fill="currentColor"
				d="M4 15a1 1 0 0 1 1-1h2a1 1 0 1 0 0-2H5a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3h-2a1 1 0 1 0 0 2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z"
			></path>
		</svg>
	);
}

export function IconShareEventVoice() {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M16.3 14.7a1 1 0 0 1 0-1.4l2.5-2.5a3.95 3.95 0 1 0-5.6-5.6l-2.5 2.5a1 1 0 1 1-1.4-1.4l2.5-2.5a5.95 5.95 0 1 1 8.4 8.4l-2.5 2.5a1 1 0 0 1-1.4 0ZM7.7 9.3a1 1 0 0 1 0 1.4l-2.5 2.5a3.95 3.95 0 0 0 5.6 5.6l2.5-2.5a1 1 0 1 1 1.4 1.4l-2.5 2.5a5.95 5.95 0 0 1-8.4-8.4l2.5-2.5a1 1 0 0 1 1.4 0Z"
			></path>
			<path fill="currentColor" d="M14.7 10.7a1 1 0 1 0-1.4-1.4l-4 4a1 1 0 0 0 1.4 1.4l4-4Z"></path>
		</svg>
	);
}

export function WebhooksIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d5408a"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="m7.7 16.95 3.68-6.76a1 1 0 0 0-.5-1.4A3 3 0 1 1 15 6a1 1 0 1 0 2 0 5 5 0 1 0-7.85 4.1L5.95 16a2 2 0 1 0 1.78 3h8.54a2 2 0 1 0 0-2H7.73l-.02-.05Z"
				className="text-theme-primary"
			></path>
			<path
				fill="currentColor"
				d="M13.8 6.86A2 2 0 1 0 12.16 8l4.53 6.58a1 1 0 0 0 .82.43h.5a3 3 0 1 1-1.98 5.25 1 1 0 0 0-.66-.25h-.01a1 1 0 0 0-.66 1.75A4.98 4.98 0 0 0 23 18a5 5 0 0 0-4.97-5L13.8 6.86ZM5.97 13.88a1 1 0 0 1-.72 1.21 3 3 0 1 0 2.73 5.16 1 1 0 1 1 1.33 1.5A4.98 4.98 0 0 1 1 18a5 5 0 0 1 3.75-4.84 1 1 0 0 1 1.22.72Z"
				className="text-theme-primary"
			></path>
		</svg>
	);
}

export function ClockIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="detailsIcon_d5408a"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1-18a1 1 0 1 0-2 0v7c0 .27.1.52.3.7l3 3a1 1 0 0 0 1.4-1.4L13 11.58V5Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}
export function OwnerIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="false" role="img" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="#F0B132"
				d="M5 18a1 1 0 0 0-1 1 3 3 0 0 0 3 3h10a3 3 0 0 0 3-3 1 1 0 0 0-1-1H5ZM3.04 7.76a1 1 0 0 0-1.52 1.15l2.25 6.42a1 1 0 0 0 .94.67h14.55a1 1 0 0 0 .95-.71l1.94-6.45a1 1 0 0 0-1.55-1.1l-4.11 3-3.55-5.33.82-.82a.83.83 0 0 0 0-1.18l-1.17-1.17a.83.83 0 0 0-1.18 0l-1.17 1.17a.83.83 0 0 0 0 1.18l.82.82-3.61 5.42-4.41-3.07Z"
			></path>
		</svg>
	);
}

export function ThreadIconLocker(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg x="0" y="0" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
			<path
				d="M12 2.81a1 1 0 0 1 0-1.41l.36-.36a1 1 0 0 1 1.41 0l9.2 9.2a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.3.13l-9.54-6.72a1 1 0 0 1-.08-1.58l1-1L12 2.8ZM12 21.2a1 1 0 0 1 0 1.41l-.35.35a1 1 0 0 1-1.41 0l-9.2-9.19a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.3-.12l9.54 6.72A1 1 0 0 1 13 19v.15a1 1 0 0 1-.35.69l-1 1 .35.36ZM14.66 16.32c.1-.39.26-.75.45-1.09l-8.2-5.47a1 1 0 1 0-1.12 1.66l8.13 5.42a3 3 0 0 1 .74-.52ZM16.43 13.8c.62-.43 1.36-.7 2.15-.78a1 1 0 0 0-.37-.43L9.73 6.93a1 1 0 0 0-1.11 1.66l7.81 5.21Z"
				fill="currentColor"
			></path>
			<path
				fillRule="evenodd"
				d="M16 18h.5v-.5a2.5 2.5 0 0 1 5 0v.5h.5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Zm4-.5v.5h-2v-.5a1 1 0 1 1 2 0Z"
				clipRule="evenodd"
				fill="currentColor"
			></path>
		</svg>
	);
}

export function IconRemove({ className = '', fill = 'currentColor' }: { className?: string; fill?: string }) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={className}
		>
			<path
				fill={fill}
				d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"
			></path>
		</svg>
	);
}

export function HomepageDownload(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" className="icon-2tQ9Jt" {...props}>
			<g fill="currentColor">
				<path d="M17.707 10.708L16.293 9.29398L13 12.587V2.00098H11V12.587L7.70697 9.29398L6.29297 10.708L12 16.415L17.707 10.708Z"></path>
				<path d="M18 18.001V20.001H6V18.001H4V20.001C4 21.103 4.897 22.001 6 22.001H18C19.104 22.001 20 21.103 20 20.001V18.001H18Z"></path>
			</g>
		</svg>
	);
}

export function HomepageMenu(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path fillRule="evenodd" clipRule="evenodd" d="M19.5 8.25H4.5V6.75H19.5V8.25Z" fill="#fcfcfc"></path>
				<path fillRule="evenodd" clipRule="evenodd" d="M19.5 12.75H4.5V11.25H19.5V12.75Z" fill="#fcfcfc"></path>
				<path fillRule="evenodd" clipRule="evenodd" d="M19.5 17.25H4.5V15.75H19.5V17.25Z" fill="#fcfcfc"></path>
			</g>
		</svg>
	);
}

export function MenuClose(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			viewBox="0 -0.5 21 21"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="currentColor"
			className=""
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<title>close [#1511]</title> <desc>Created with Sketch.</desc> <defs> </defs>
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					<g id="Dribbble-Light-Preview" transform="translate(-419.000000, -240.000000)" fill="currentColor">
						<g id="icons" transform="translate(56.000000, 160.000000)">
							<polygon
								id="close-[#1511]"
								points="375.0183 90 384 98.554 382.48065 100 373.5 91.446 364.5183 100 363 98.554 371.98065 90 363 81.446 364.5183 80 373.5 88.554 382.48065 80 384 81.446"
							></polygon>
						</g>
					</g>
				</g>
			</g>
		</svg>
	);
}

export function GooglePlay(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<mask id="mask0_87_8320" maskUnits="userSpaceOnUse" x="7" y="3" width="24" height="26">
					<path
						d="M30.0484 14.4004C31.3172 15.0986 31.3172 16.9014 30.0484 17.5996L9.75627 28.7659C8.52052 29.4459 7 28.5634 7 27.1663L7 4.83374C7 3.43657 8.52052 2.55415 9.75627 3.23415L30.0484 14.4004Z"
						fill="#C4C4C4"
					></path>
				</mask>
				<g mask="url(#mask0_87_8320)">
					<path
						d="M7.63473 28.5466L20.2923 15.8179L7.84319 3.29883C7.34653 3.61721 7 4.1669 7 4.8339V27.1664C7 27.7355 7.25223 28.2191 7.63473 28.5466Z"
						fill="url(#paint0_linear_87_8320)"
					></path>
					<path
						d="M30.048 14.4003C31.3169 15.0985 31.3169 16.9012 30.048 17.5994L24.9287 20.4165L20.292 15.8175L24.6923 11.4531L30.048 14.4003Z"
						fill="url(#paint1_linear_87_8320)"
					></path>
					<path
						d="M24.9292 20.4168L20.2924 15.8179L7.63477 28.5466C8.19139 29.0232 9.02389 29.1691 9.75635 28.766L24.9292 20.4168Z"
						fill="url(#paint2_linear_87_8320)"
					></path>
					<path
						d="M7.84277 3.29865L20.2919 15.8177L24.6922 11.4533L9.75583 3.23415C9.11003 2.87878 8.38646 2.95013 7.84277 3.29865Z"
						fill="url(#paint3_linear_87_8320)"
					></path>
				</g>
				<defs>
					<linearGradient id="paint0_linear_87_8320" x1="15.6769" y1="10.874" x2="7.07106" y2="19.5506" gradientUnits="userSpaceOnUse">
						<stop stopColor="#00C3FF"></stop> <stop offset="1" stopColor="#1BE2FA"></stop>
					</linearGradient>
					<linearGradient id="paint1_linear_87_8320" x1="20.292" y1="15.8176" x2="31.7381" y2="15.8176" gradientUnits="userSpaceOnUse">
						<stop stopColor="#FFCE00"></stop> <stop offset="1" stopColor="#FFEA00"></stop>
					</linearGradient>
					<linearGradient id="paint2_linear_87_8320" x1="7.36932" y1="30.1004" x2="22.595" y2="17.8937" gradientUnits="userSpaceOnUse">
						<stop stopColor="#DE2453"></stop> <stop offset="1" stopColor="#FE3944"></stop>
					</linearGradient>
					<linearGradient id="paint3_linear_87_8320" x1="8.10725" y1="1.90137" x2="22.5971" y2="13.7365" gradientUnits="userSpaceOnUse">
						<stop stopColor="#11D574"></stop> <stop offset="1" stopColor="#01F176"></stop>
					</linearGradient>
				</defs>
			</g>
		</svg>
	);
}

export function AppStore(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<circle cx="16" cy="16" r="14" fill="url(#paint0_linear_87_8317)"></circle>
				<path
					d="M18.4468 8.65403C18.7494 8.12586 18.5685 7.45126 18.0428 7.14727C17.5171 6.84328 16.8456 7.02502 16.543 7.55318L16.0153 8.47442L15.4875 7.55318C15.1849 7.02502 14.5134 6.84328 13.9877 7.14727C13.462 7.45126 13.2811 8.12586 13.5837 8.65403L14.748 10.6864L11.0652 17.1149H8.09831C7.49173 17.1149 7 17.6089 7 18.2183C7 18.8277 7.49173 19.3217 8.09831 19.3217H18.4324C18.523 19.0825 18.6184 18.6721 18.5169 18.2949C18.3644 17.7279 17.8 17.1149 16.8542 17.1149H13.5997L18.4468 8.65403Z"
					fill="white"
				></path>
				<path
					d="M11.6364 20.5419C11.449 20.3328 11.0292 19.9987 10.661 19.8888C10.0997 19.7211 9.67413 19.8263 9.45942 19.9179L8.64132 21.346C8.33874 21.8741 8.51963 22.5487 9.04535 22.8527C9.57107 23.1567 10.2425 22.975 10.5451 22.4468L11.6364 20.5419Z"
					fill="white"
				></path>
				<path
					d="M22.2295 19.3217H23.9017C24.5083 19.3217 25 18.8277 25 18.2183C25 17.6089 24.5083 17.1149 23.9017 17.1149H20.9653L17.6575 11.3411C17.4118 11.5757 16.9407 12.175 16.8695 12.8545C16.778 13.728 16.9152 14.4636 17.3271 15.1839C18.7118 17.6056 20.0987 20.0262 21.4854 22.4468C21.788 22.975 22.4594 23.1567 22.9852 22.8527C23.5109 22.5487 23.6918 21.8741 23.3892 21.346L22.2295 19.3217Z"
					fill="white"
				></path>
				<defs>
					<linearGradient id="paint0_linear_87_8317" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
						<stop stopColor="#2AC9FA"></stop> <stop offset="1" stopColor="#1F65EB"></stop>
					</linearGradient>
				</defs>
			</g>
		</svg>
	);
}

export function MessageIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"></path>
		</svg>
	);
}

export function SelectFileIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" className="" {...props}>
			<g fill="none" fillRule="evenodd">
				<path d="m0 0h18v18h-18z" />
				<path
					d="m13.5 8.25v4.5c0 .8284271-.6715729 1.5-1.5 1.5h-10.5c-.82842712 0-1.5-.6715729-1.5-1.5v-10.5c0-.82842712.67157288-1.5 1.5-1.5h7.5-3v1.5h-4.5v10.5h10.5v-4.5zm-5.28-.5325 2.655 3.5325h-8.25l2.0625-2.6475 1.47 1.77zm3.78-5.4675h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25h1.5z"
					fill="currentColor"
					transform="translate(2.25 1.5)"
				/>
			</g>
		</svg>
	);
}

export function LeaveClanIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d90b3d"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path fill="currentColor" d="M9 12a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z" className=""></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2.75 3.02A3 3 0 0 1 5 2h10a3 3 0 0 1 3 3v7.64c0 .44-.55.7-.95.55a3 3 0 0 0-3.17 4.93l.02.03a.5.5 0 0 1-.35.85h-.05a.5.5 0 0 0-.5.5 2.5 2.5 0 0 1-3.68 2.2l-5.8-3.09A3 3 0 0 1 2 16V5a3 3 0 0 1 .76-1.98Zm1.3 1.95A.04.04 0 0 0 4 5v11c0 .36.2.68.49.86l5.77 3.08a.5.5 0 0 0 .74-.44V8.02a.5.5 0 0 0-.32-.46l-6.63-2.6Z"
				clipRule="evenodd"
				className=""
			></path>
			<path
				fill="currentColor"
				d="M15.3 16.7a1 1 0 0 1 1.4-1.4l4.3 4.29V16a1 1 0 1 1 2 0v6a1 1 0 0 1-1 1h-6a1 1 0 1 1 0-2h3.59l-4.3-4.3Z"
				className=""
			></path>
		</svg>
	);
}

export const IconLock = ({ defaultFill = '#AEAEAE', defaultSize = 'w-6 h-6' }) => {
	return (
		<svg
			className={defaultSize}
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M6 9h1V6a5 5 0 0 1 10 0v3h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Zm9-3v3H9V6a3 3 0 1 1 6 0Zm-1 8a2 2 0 0 1-1 1.73V18a1 1 0 1 1-2 0v-2.27A2 2 0 1 1 14 14Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const IconClock = ({ defaultFill = '#AEAEAE', defaultSize = 'w-6 h-6' }) => {
	return (
		<svg
			className={defaultSize}
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1-18a1 1 0 1 0-2 0v7c0 .27.1.52.3.7l3 3a1 1 0 0 0 1.4-1.4L13 11.58V5Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export const PhoneOff = ({ defaultFill = 'white', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={defaultSize}>
			<path
				d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z"
				fill={defaultFill}
			/>
		</svg>
	);
};

export const IconLoadingTyping = ({
	iconFill = 'dark:fill-textDarkTheme fill-textPrimaryLight',
	width = '18',
	height = '8',
	bgFill = 'bg-transparent'
}) => {
	return (
		<span className={`rounded-lg flex items-center justify-center px-[2px] py-[1px] ${bgFill}`}>
			<svg
				id="dots"
				width={width}
				height={height}
				viewBox="0 0 100 60"
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				xmlnsXlink="http://www.w3.org/1999/xlink"
			>
				<circle id="dot1" cx="13" cy="30" r="13" className={iconFill}></circle>
				<circle id="dot2" cx="50" cy="30" r="13" className={iconFill}></circle>
				<circle id="dot3" cx="86" cy="30" r="13" className={iconFill}></circle>
			</svg>
		</span>
	);
};

export function SearchIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M17.0392 15.6244C18.2714 14.084 19.0082 12.1301 19.0082 10.0041C19.0082 5.03127 14.9769 1 10.0041 1C5.03127 1 1 5.03127 1 10.0041C1 14.9769 5.03127 19.0082 10.0041 19.0082C12.1301 19.0082 14.084 18.2714 15.6244 17.0392L21.2921 22.707C21.6828 23.0977 22.3163 23.0977 22.707 22.707C23.0977 22.3163 23.0977 21.6828 22.707 21.2921L17.0392 15.6244ZM10.0041 17.0173C6.1308 17.0173 2.99087 13.8774 2.99087 10.0041C2.99087 6.1308 6.1308 2.99087 10.0041 2.99087C13.8774 2.99087 17.0173 6.1308 17.0173 10.0041C17.0173 13.8774 13.8774 17.0173 10.0041 17.0173Z"
					fill="currentColor"
				></path>{' '}
			</g>
		</svg>
	);
}

export function GlobalIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d7acc7 w-6"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0Zm-4.16 5.85A9 9 0 0 0 15 3.52V4a3 3 0 0 1-3 3h-.77c-.13 0-.23.1-.23.23A2.77 2.77 0 0 1 8.23 10c-.13 0-.23.1-.23.23v1.52c0 .14.11.25.25.25H13a3 3 0 0 1 3 3v.77c0 .13.1.23.23.23 1.2 0 2.23.77 2.61 1.85ZM3.18 10.18A9 9 0 0 0 11 20.94v-2.7c0-.14-.1-.24-.23-.24h-.65A2.12 2.12 0 0 1 8 15.88c0-.56-.22-1.1-.62-1.5l-4.2-4.2Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function TVIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d7acc7 w-6"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M4 3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H4ZM6 20a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H6Z"
				className=""
			></path>
		</svg>
	);
}

export function GamingConsoleIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d7acc7 w-6"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M20.97 4.06c0 .18.08.35.24.43.55.28.9.82 1.04 1.42.3 1.24.75 3.7.75 7.09v4.91a3.09 3.09 0 0 1-5.85 1.38l-1.76-3.51a1.09 1.09 0 0 0-1.23-.55c-.57.13-1.36.27-2.16.27s-1.6-.14-2.16-.27c-.49-.11-1 .1-1.23.55l-1.76 3.51A3.09 3.09 0 0 1 1 17.91V13c0-3.38.46-5.85.75-7.1.15-.6.49-1.13 1.04-1.4a.47.47 0 0 0 .24-.44c0-.7.48-1.32 1.2-1.47l2.93-.62c.5-.1 1 .06 1.36.4.35.34.78.71 1.28.68a42.4 42.4 0 0 1 4.4 0c.5.03.93-.34 1.28-.69.35-.33.86-.5 1.36-.39l2.94.62c.7.15 1.19.78 1.19 1.47ZM20 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 7a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 1 1 0-2h1V7Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function ToolIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d7acc7 w-6"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M19.94 7.03c.58-.28 1.27.01 1.46.62l1 3.1c.2.6-.19 1.25-.81 1.36l-6.73 1.2 4.71 4.98c.44.46.37 1.2-.14 1.57l-2.62 1.92c-.52.38-1.25.21-1.55-.35l-3.22-6.06-3.29 6.07c-.3.56-1.03.72-1.54.35l-2.63-1.93a1.05 1.05 0 0 1-.14-1.57l4.7-4.98-6.72-1.2c-.62-.11-1-.75-.81-1.36l1-3.1c.2-.61.88-.9 1.45-.63l6.24 3.01-.93-6.84C9.3 2.56 9.77 2 10.41 2h3.2c.63 0 1.12.56 1.04 1.18l-.88 6.85 6.17-3Z"
				className=""
			></path>
		</svg>
	);
}

export function UtilitiesIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon_d7acc7 w-6"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M7.8 15.77c.7.43 1.2 1.14 1.2 1.96V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.27c0-.82.5-1.53 1.2-1.96a8.06 8.06 0 0 0 .12-13.63c-.6-.39-1.32.09-1.32.8v5.98a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V2.94c0-.71-.72-1.19-1.32-.8a8.06 8.06 0 0 0 .12 13.63Z"
				className=""
			></path>
		</svg>
	);
}

export function CloseButton(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"
					fill="currentColor"
				></path>{' '}
			</g>
		</svg>
	);
}

export function CompassIcon({ height = '24px', width = '24px' }) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none" viewBox="0 0 24 24">
			<path fill="currentColor" d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0ZM7.74 9.3A2 2 0 0 1 9.3 7.75l7.22-1.45a1 1 0 0 1 1.18 1.18l-1.45 7.22a2 2 0 0 1-1.57 1.57l-7.22 1.45a1 1 0 0 1-1.18-1.18L7.74 9.3Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function AppDirectoryFooterRobot() {
	return (
		<svg width="120" height="64" viewBox="0 0 134 71" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_6215_282581)">
				<g clipPath="url(#clip1_6215_282581)">
					<path
						d="M121.173 33L98.7023 32.8879C97.7547 32.8823 97 32.1255 97 31.1894L97.1135 11.6761C97.1192 10.7456 97.8909 10 98.8328 10L121.303 10.1121C122.245 10.1121 123.006 10.8745 123 11.8106L122.887 31.3239C122.887 32.2544 122.115 33.0056 121.167 33H121.173Z"
						fill="#D3D7DB"
					/>
					<path
						d="M115.975 15.7456H104.03C103.404 15.7456 102.896 16.2476 102.896 16.8667V26.1329C102.896 26.7521 103.404 27.254 104.03 27.254H115.975C116.602 27.254 117.11 26.7521 117.11 26.1329V16.8667C117.11 16.2476 116.602 15.7456 115.975 15.7456Z"
						fill="#7F88FD"
					/>
					<path
						d="M106.851 23.8907V19.1091C106.851 18.868 107.1 18.6999 107.327 18.7952L113.189 21.1888C113.473 21.3065 113.473 21.7045 113.189 21.8222L107.327 24.2158C107.1 24.3111 106.851 24.143 106.851 23.9019V23.8907Z"
						fill="#5765F0"
					/>
				</g>
				<g clipPath="url(#clip2_6215_282581)">
					<path
						d="M34.2906 4.05298L2.3788 11.8087C1.41479 12.043 0.819333 13.0308 1.04881 14.015L6.54713 37.5962C6.77661 38.5804 7.74413 39.1883 8.70814 38.954L40.62 31.1983C41.584 30.964 42.1795 29.9762 41.95 28.992L36.4517 5.41082C36.2222 4.42662 35.2547 3.81869 34.2906 4.05298Z"
						fill="#D3D7DB"
					/>
					<path
						d="M23.6816 28.9828C23.5385 28.9828 23.4014 28.9158 23.312 28.8002L16.2362 19.9148L11.3482 28.1429C11.2111 28.3742 10.919 28.4472 10.6925 28.3072C10.466 28.1673 10.3944 27.8691 10.5315 27.6378L15.7713 18.8193C15.8488 18.6854 15.9918 18.5941 16.1468 18.5881C16.3018 18.582 16.4508 18.6428 16.5522 18.7646L23.3418 27.2909L24.9274 13.3177C24.9453 13.1351 25.0705 12.9769 25.2374 12.916C25.4043 12.8551 25.601 12.8977 25.7262 13.0256L32.951 20.1339C33.1417 20.3225 33.1477 20.6268 32.9629 20.8216C32.7781 21.0163 32.4801 21.0224 32.2893 20.8338L25.756 14.4071L24.1525 28.5507C24.1286 28.7454 23.9975 28.9097 23.8127 28.9645C23.771 28.9767 23.7233 28.9828 23.6816 28.9828Z"
						fill="#5765F0"
					/>
					<path
						d="M10.9432 30.7171C12.4707 30.7171 13.7091 29.4528 13.7091 27.8932C13.7091 26.3336 12.4707 25.0693 10.9432 25.0693C9.41559 25.0693 8.17725 26.3336 8.17725 27.8932C8.17725 29.4528 9.41559 30.7171 10.9432 30.7171Z"
						fill="#7F88FD"
					/>
					<path
						d="M25.5652 16.1658C27.0928 16.1658 28.3312 14.9015 28.3312 13.3419C28.3312 11.7824 27.0928 10.5181 25.5652 10.5181C24.0377 10.5181 22.7993 11.7824 22.7993 13.3419C22.7993 14.9015 24.0377 16.1658 25.5652 16.1658Z"
						fill="#7F88FD"
					/>
					<path
						d="M23.7234 31.0945C25.251 31.0945 26.4894 29.8302 26.4894 28.2706C26.4894 26.7111 25.251 25.4468 23.7234 25.4468C22.1959 25.4468 20.9575 26.7111 20.9575 28.2706C20.9575 29.8302 22.1959 31.0945 23.7234 31.0945Z"
						fill="#7F88FD"
					/>
					<path
						d="M32.6233 23.5051C34.1509 23.5051 35.3893 22.2409 35.3893 20.6813C35.3893 19.1217 34.1509 17.8574 32.6233 17.8574C31.0958 17.8574 29.8574 19.1217 29.8574 20.6813C29.8574 22.2409 31.0958 23.5051 32.6233 23.5051Z"
						fill="#7F88FD"
					/>
					<path
						d="M16.1829 21.8987C17.7105 21.8987 18.9488 20.6344 18.9488 19.0748C18.9488 17.5153 17.7105 16.251 16.1829 16.251C14.6553 16.251 13.417 17.5153 13.417 19.0748C13.417 20.6344 14.6553 21.8987 16.1829 21.8987Z"
						fill="#7F88FD"
					/>
				</g>
				<g clipPath="url(#clip3_6215_282581)">
					<path
						d="M93.683 72.7676C90.4984 73.9264 87.3303 73.4792 86.6532 71.7795C85.976 70.0799 87.8186 67.75 90.642 65.8878C94.118 63.5945 97.0891 64.0824 97.9837 66.6197C98.8168 68.9902 97.3723 71.4298 93.6871 72.7717L93.683 72.7676Z"
						fill="#66BCFF"
					/>
					<path
						d="M37.0094 77.8135C36.8452 83.1156 40.7602 88.0397 46.4973 88.7065L65.4815 90.9225C71.2268 91.5934 76.1842 87.7022 77.2635 82.5098C77.3579 82.0747 77.4235 81.6315 77.4523 81.1802C77.5261 80.2938 77.481 79.383 77.3127 78.4559L75.3019 62.5209C74.5919 58.6378 71.4074 55.6655 67.4513 55.206L52.9608 53.5145C49.0048 53.051 45.2087 55.206 43.6083 58.8208L37.9163 73.8572C37.5347 74.7192 37.2761 75.5893 37.1407 76.4716C37.0668 76.9189 37.0217 77.3662 37.0094 77.8094V77.8135Z"
						fill="url(#paint0_linear_6215_282581)"
					/>
					<path
						d="M57.906 56.0112L57.9881 56.1698C58.1564 56.5113 58.2754 56.861 58.3451 57.231C58.4354 57.658 58.4518 58.0971 58.3985 58.5362L57.0196 70.1246C56.995 71.1818 57.787 72.0804 58.8417 72.2064L69.4377 73.4425C70.7345 73.593 71.8507 72.5276 71.7399 71.2387L70.8207 60.6018C70.6442 58.5688 69.0478 56.9342 67 56.6984L58.1564 55.6656C57.9635 55.6412 57.8198 55.8445 57.906 56.0153V56.0112Z"
						fill="#FF8C19"
					/>
					<path
						d="M58.3451 57.231C58.4354 57.6579 58.4518 58.097 58.3985 58.5362L57.0196 70.1245C56.995 71.1817 57.787 72.0803 58.8417 72.2064L68.6292 73.3489C69.175 72.9789 69.5239 72.3161 69.4746 71.572L68.7811 61.8582C68.6169 59.4388 67.3201 58.2841 65.3175 58.0482L58.341 57.235L58.3451 57.231Z"
						fill="#FFE75C"
					/>
					<path
						d="M50.2657 61.5103C50.6758 59.0397 49.7211 56.827 48.1332 56.5682C46.5454 56.3095 44.9257 58.1026 44.5156 60.5733C44.1054 63.044 45.0602 65.2566 46.648 65.5154C48.2359 65.7742 49.8556 63.981 50.2657 61.5103Z"
						fill="black"
					/>
					<path
						d="M76.8187 22.9998L56.8763 19.3661L57.4441 16.3069C57.974 13.4516 60.7455 11.5587 63.6272 12.0837L73.7296 13.9244C76.2805 14.3892 77.9702 16.818 77.5011 19.3454L76.8228 23.0005L76.8187 22.9998Z"
						fill="#66BCFF"
					/>
					<path
						d="M36.0903 32.2085C35.8851 37.3155 35.7948 41.715 38.4664 43.8863C41.4294 46.2894 42.6769 46.5293 46.6904 48.1028C53.199 50.6563 69.5116 51.433 77.7808 52.3722C89.4479 53.6978 92.1564 35.2825 89.9485 27.252C88.8364 22.702 86.1771 20.4209 82.1964 19.4857C75.6796 17.9569 57.4342 14.2242 52.0254 14.9764C48.1637 15.5132 40.941 17.3307 38.7906 21.8156C37.4241 24.6497 36.2175 29.098 36.0903 32.2085Z"
						fill="url(#paint1_linear_6215_282581)"
					/>
					<path
						d="M52.8419 33.5257C52.1853 39.1451 53.006 46.5576 60.0276 47.1065L79.2662 48.5296C81.7983 48.7166 83.3167 47.4358 84.3795 45.6589C87.2932 41.9954 90.4532 24.56 82.3974 23.5598L63.602 20.4614C56.0059 18.9854 53.5067 27.7722 52.8419 33.5257Z"
						fill="#ED5B00"
					/>
					<path
						d="M52.8011 34.0257C52.2183 39.4011 53.1088 46.5696 59.7119 47.0778L78.2241 48.4359C80.8874 48.6595 82.7834 46.5289 83.9448 44.0527C86.4522 38.7017 87.4084 25.6984 82.213 24.633C82.213 24.633 66.0276 21.7664 61.0045 21.0671C55.9815 20.3677 53.2443 28.4186 52.8011 34.0216V34.0257Z"
						fill="black"
					/>
					<path
						d="M45.5865 39.4785C43.2227 42.4264 39.8658 41.3977 38.134 37.1853L37.9452 36.7299C36.2134 32.5215 37.3214 26.8371 40.4116 24.1006C43.5017 21.3641 46.8997 22.4945 47.9585 26.6175C49.0172 30.7405 47.9502 36.5266 45.5824 39.4745L45.5865 39.4785Z"
						fill="url(#paint2_linear_6215_282581)"
					/>
					<path
						d="M41.9419 30.947C42.2608 28.5695 41.5668 26.5168 40.3917 26.3621C39.2167 26.2074 38.0056 28.0092 37.6868 30.3867C37.3679 32.7641 38.0619 34.8168 39.237 34.9716C40.412 35.1263 41.623 33.3244 41.9419 30.947Z"
						fill="#FFE75C"
					/>
					<path
						d="M74.2555 52.0263L74.5879 51.0016C74.8259 50.2616 74.3129 49.4931 73.5332 49.424L65.2599 48.688C64.4802 48.6189 63.8359 49.2858 63.9385 50.0542L64.0821 51.1318L74.2472 52.0263H74.2555Z"
						fill="url(#paint3_linear_6215_282581)"
					/>
					<path
						d="M51.9966 59.1099C52.1731 59.9191 52.407 60.6469 52.7189 61.2893C52.7886 61.452 52.8871 61.6024 52.9651 61.7569C53.002 61.8342 53.0513 61.9074 53.1005 61.9765C53.1457 62.0497 53.1908 62.1188 53.2318 62.192C53.2811 62.2611 53.3344 62.3262 53.3837 62.3912C53.437 62.4563 53.4699 62.5295 53.5314 62.5864C53.6422 62.7084 53.7284 62.8385 53.8474 62.9442C54.2824 63.3956 54.7379 63.7656 55.2386 64.0177C55.3699 64.0705 55.4807 64.1559 55.6161 64.1966C55.6818 64.221 55.7434 64.2495 55.8049 64.2779C55.8706 64.3023 55.9403 64.3145 56.0019 64.343C56.0676 64.3633 56.1291 64.3958 56.1989 64.4121C56.2686 64.4284 56.3384 64.4446 56.4041 64.4609C56.5354 64.5097 56.6872 64.5137 56.8268 64.5422C56.8637 64.5463 56.8965 64.5625 56.9335 64.5625L57.0443 64.5707C57.1181 64.5788 57.192 64.5869 57.2659 64.5951C57.3397 64.6113 57.4218 64.5991 57.4957 64.6032C57.5737 64.6032 57.6516 64.6032 57.7296 64.6113C57.8896 64.6113 58.0538 64.5951 58.2179 64.5951C58.3862 64.5829 58.5586 64.5503 58.7268 64.5381C59.4204 64.4446 60.1714 64.2413 60.9511 63.9567C61.3409 63.8266 61.7349 63.6395 62.1371 63.4688L62.7403 63.1719C62.8429 63.1191 62.9455 63.0784 63.044 63.0215L63.3477 62.8507C64.1684 62.4238 64.981 61.883 65.8387 61.3666L66.0931 61.2121C67.9891 60.0654 70.4637 60.6591 71.6168 62.5376C72.5853 64.1112 72.3186 66.0873 71.0916 67.36C70.1846 68.3033 69.2079 69.206 68.0917 70.007L67.6772 70.312C67.5418 70.4136 67.3858 70.5031 67.2422 70.6007C66.9467 70.7877 66.6553 70.9788 66.3558 71.1618L65.416 71.6782L65.178 71.8042C65.0959 71.8449 65.0138 71.8815 64.9318 71.9222L64.4311 72.1499C63.0933 72.7516 61.6241 73.2152 60.04 73.4591C59.6379 73.5079 59.2398 73.5567 58.8335 73.5893C58.4231 73.6055 58.0128 73.6258 57.5983 73.6218L56.9704 73.5893C56.7611 73.573 56.5518 73.573 56.3425 73.5364L55.7105 73.451L55.3945 73.4022C55.2878 73.3859 55.1852 73.3575 55.0785 73.3372C54.66 73.2355 54.2373 73.1542 53.8269 73.0078L53.2113 72.8045C53.0061 72.7354 52.805 72.6419 52.604 72.5605C52.4029 72.4751 52.2018 72.3898 52.0089 72.2922L51.4303 71.9832L51.143 71.8246C51.0486 71.7717 50.9583 71.7107 50.8681 71.6497C50.6834 71.5318 50.5028 71.4098 50.3264 71.2878C50.1417 71.1699 49.9816 71.0276 49.8093 70.8934C49.641 70.7593 49.4728 70.6251 49.3086 70.4828C49.1486 70.3364 48.9926 70.19 48.8408 70.0396C48.6848 69.8891 48.533 69.7427 48.3935 69.576C48.1103 69.2548 47.823 68.9417 47.585 68.592C47.4619 68.4213 47.3347 68.2505 47.2198 68.0756L46.8915 67.543C46.7807 67.3641 46.6781 67.1852 46.5878 66.9981L46.3128 66.4411C46.2185 66.2581 46.1487 66.0629 46.0748 65.8718C46.001 65.6807 45.9271 65.4896 45.8573 65.2985C45.607 64.5259 45.41 63.7412 45.3197 62.9483C45.1227 61.3707 45.2376 59.789 45.685 58.3333C46.202 56.654 47.9913 55.7066 49.6862 56.2149C50.8393 56.5605 51.6519 57.4916 51.8899 58.5813L52.0007 59.0937L51.9966 59.1099Z"
						fill="url(#paint4_linear_6215_282581)"
					/>
					<path d="M63.4769 45.7137L60.5669 48.0327L71.4722 61.4668L74.3822 59.1478L63.4769 45.7137Z" fill="#FFE75C" />
					<path d="M62.3733 46.2775L61.3564 47.0879L72.4058 60.6994L73.4227 59.889L62.3733 46.2775Z" fill="#FFC619" />
					<path
						d="M60.9346 42.5849L62.4613 44.4675L59.5517 46.7852L58.0251 44.9026C57.7009 44.5041 57.7665 43.9226 58.1687 43.6014L59.6214 42.4426C60.0236 42.1214 60.6104 42.1864 60.9346 42.5849Z"
						fill="#FF78B9"
					/>
					<path d="M62.3109 44.2777L59.4009 46.5967L60.5686 48.0351L63.4786 45.7161L62.3109 44.2777Z" fill="#808AFF" />
					<path
						d="M73.5703 62.9356L75.3842 61.4922L76.5209 64.1636C76.6687 64.5052 76.2665 64.8223 75.9628 64.6109L73.5703 62.9356Z"
						fill="black"
					/>
					<path
						d="M73.5702 62.9356L73.7672 63.0738L75.4743 61.7117L75.38 61.4921L74.3827 59.146L71.4731 61.4677L73.5702 62.9356Z"
						fill="#FFF2A6"
					/>
					<path
						d="M70.3281 63.7938C70.2542 63.7938 70.1762 63.7857 70.1023 63.7694C69.4868 63.6474 69.0846 63.0497 69.2077 62.4398C69.2447 62.265 70.1147 58.0972 73.0407 56.7554C73.6152 56.4952 74.2923 56.7391 74.5591 57.3084C74.8258 57.8776 74.5755 58.5486 74.0009 58.8128C72.4497 59.5244 71.6331 61.9966 71.4525 62.8871C71.3417 63.4238 70.8657 63.7938 70.3322 63.7938H70.3281Z"
						fill="black"
					/>
					<path
						d="M69.4418 63.0416C68.9453 63.0416 68.4857 62.7163 68.342 62.2162C68.3256 62.1593 67.9357 60.7809 67.9727 59.2154C68.026 56.9181 68.9945 55.2713 70.7017 54.5841C71.2844 54.3483 71.9534 54.6248 72.1914 55.2063C72.4294 55.7877 72.1462 56.4464 71.5635 56.6822C69.4459 57.5361 70.5334 61.5575 70.5417 61.5981C70.714 62.1999 70.3611 62.8261 69.7537 62.9969C69.6511 63.0253 69.5444 63.0416 69.4418 63.0416Z"
						fill="black"
					/>
					<path
						d="M94.1669 48.3345H93.3092C93.9248 46.9764 93.3256 45.8867 91.9468 45.8867C90.5679 45.8867 88.9223 46.9764 88.2328 48.3345H87.1043C85.7664 48.3345 84.1701 49.408 83.5299 50.7335C82.8938 52.059 82.6188 54.8728 83.9567 54.8728H91.0193C92.3571 54.8728 94.7948 52.055 95.4309 50.7335C96.067 49.408 95.5007 48.3345 94.1669 48.3345Z"
						fill="#8CD9FF"
					/>
					<path
						d="M99.1409 51.2212H79.1964C77.8011 51.2212 76.5207 51.9978 75.8887 53.2339L64.3653 75.7519C63.7415 76.9717 64.6361 78.4192 66.0191 78.4192H85.9636C87.3589 78.4192 88.6392 77.6426 89.2712 76.4065L100.795 53.8885C101.418 52.6687 100.524 51.2212 99.1409 51.2212Z"
						fill="#FF78B9"
					/>
					<path
						d="M95.9115 68.6896C95.7679 68.6896 95.6201 68.6611 95.4765 68.6042C95.456 68.5961 93.359 67.7462 91.0608 67.1445C90.4494 66.9859 90.0841 66.3678 90.2483 65.762C90.4083 65.1561 91.0321 64.7943 91.6436 64.9569C94.0976 65.5953 96.2562 66.4736 96.3465 66.5102C96.9293 66.7501 97.2083 67.4088 96.9662 67.9861C96.7856 68.4253 96.3588 68.6896 95.9074 68.6896H95.9115Z"
						fill="black"
					/>
					<path
						d="M96.0348 68.3112C95.5177 68.3112 95.0499 67.9615 94.9227 67.4411C94.9186 67.4248 94.3523 65.2372 92.5261 64.1272C91.9885 63.8019 91.8161 63.1025 92.1485 62.5699C92.4768 62.0372 93.1827 61.8665 93.7203 62.1958C96.3754 63.8019 97.1182 66.7905 97.1511 66.9165C97.2988 67.5264 96.9171 68.1364 96.3057 68.2787C96.2154 68.299 96.1292 68.3112 96.0389 68.3112H96.0348Z"
						fill="black"
					/>
					<path
						d="M96.289 68.1853C96.1535 68.1853 96.0181 68.1609 95.8868 68.1122C95.2958 67.8926 94.9963 67.242 95.2179 66.6565C95.2261 66.6321 96.1617 64.0623 95.1399 62.0374C94.8567 61.4763 95.0865 60.7973 95.6488 60.5167C96.211 60.2361 96.9004 60.4638 97.1836 61.0209C98.6568 63.9403 97.4134 67.303 97.36 67.4453C97.1877 67.9007 96.7527 68.1813 96.289 68.1813V68.1853Z"
						fill="black"
					/>
					<mask id="mask0_6215_282581" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="45" y="56" width="28" height="18">
						<path
							d="M51.9966 59.1099C52.1731 59.9191 52.407 60.6469 52.7189 61.2893C52.7886 61.452 52.8871 61.6024 52.9651 61.7569C53.002 61.8342 53.0513 61.9074 53.1005 61.9765C53.1457 62.0497 53.1908 62.1188 53.2318 62.192C53.2811 62.2611 53.3344 62.3262 53.3837 62.3912C53.437 62.4563 53.4699 62.5295 53.5314 62.5864C53.6422 62.7084 53.7284 62.8385 53.8474 62.9442C54.2824 63.3956 54.7379 63.7656 55.2386 64.0177C55.3699 64.0705 55.4807 64.1559 55.6161 64.1966C55.6818 64.221 55.7434 64.2495 55.8049 64.2779C55.8706 64.3023 55.9403 64.3145 56.0019 64.343C56.0676 64.3633 56.1291 64.3958 56.1989 64.4121C56.2686 64.4284 56.3384 64.4446 56.4041 64.4609C56.5354 64.5097 56.6872 64.5137 56.8268 64.5422C56.8637 64.5463 56.8965 64.5625 56.9335 64.5625L57.0443 64.5707C57.1181 64.5788 57.192 64.5869 57.2659 64.5951C57.3397 64.6113 57.4218 64.5991 57.4957 64.6032C57.5737 64.6032 57.6516 64.6032 57.7296 64.6113C57.8896 64.6113 58.0538 64.5951 58.2179 64.5951C58.3862 64.5829 58.5586 64.5503 58.7268 64.5381C59.4204 64.4446 60.1714 64.2413 60.9511 63.9567C61.3409 63.8266 61.7349 63.6395 62.1371 63.4688L62.7403 63.1719C62.8429 63.1191 62.9455 63.0784 63.044 63.0215L63.3477 62.8507C64.1684 62.4238 64.981 61.883 65.8387 61.3666L66.0931 61.2121C67.9891 60.0654 70.4637 60.6591 71.6168 62.5376C72.5853 64.1112 72.3186 66.0873 71.0916 67.36C70.1846 68.3033 69.2079 69.206 68.0917 70.007L67.6772 70.312C67.5418 70.4136 67.3858 70.5031 67.2422 70.6007C66.9467 70.7877 66.6553 70.9788 66.3558 71.1618L65.416 71.6782L65.178 71.8042C65.0959 71.8449 65.0138 71.8815 64.9318 71.9222L64.4311 72.1499C63.0933 72.7516 61.6241 73.2152 60.04 73.4591C59.6379 73.5079 59.2398 73.5567 58.8335 73.5893C58.4231 73.6055 58.0128 73.6258 57.5983 73.6218L56.9704 73.5893C56.7611 73.573 56.5518 73.573 56.3425 73.5364L55.7105 73.451L55.3945 73.4022C55.2878 73.3859 55.1852 73.3575 55.0785 73.3372C54.66 73.2355 54.2373 73.1542 53.8269 73.0078L53.2113 72.8045C53.0061 72.7354 52.805 72.6419 52.604 72.5605C52.4029 72.4751 52.2018 72.3898 52.0089 72.2922L51.4303 71.9832L51.143 71.8246C51.0486 71.7717 50.9583 71.7107 50.8681 71.6497C50.6834 71.5318 50.5028 71.4098 50.3264 71.2878C50.1417 71.1699 49.9816 71.0276 49.8093 70.8934C49.641 70.7593 49.4728 70.6251 49.3086 70.4828C49.1486 70.3364 48.9926 70.19 48.8408 70.0396C48.6848 69.8891 48.533 69.7427 48.3935 69.576C48.1103 69.2548 47.823 68.9417 47.585 68.592C47.4619 68.4213 47.3347 68.2505 47.2198 68.0756L46.8915 67.543C46.7807 67.3641 46.6781 67.1852 46.5878 66.9981L46.3128 66.4411C46.2185 66.2581 46.1487 66.0629 46.0748 65.8718C46.001 65.6807 45.9271 65.4896 45.8573 65.2985C45.607 64.5259 45.41 63.7412 45.3197 62.9483C45.1227 61.3707 45.2376 59.789 45.685 58.3333C46.202 56.654 47.9913 55.7066 49.6862 56.2149C50.8393 56.5605 51.6519 57.4916 51.8899 58.5813L52.0007 59.0937L51.9966 59.1099Z"
							fill="url(#paint5_linear_6215_282581)"
						/>
					</mask>
					<g mask="url(#mask0_6215_282581)">
						<path
							d="M65.346 73.0276C63.4336 73.0276 61.4843 71.7467 60.3763 69.7503C59.0959 67.4489 59.2108 64.8263 60.6964 62.5574C60.8975 62.2524 61.3078 62.163 61.6197 62.3622C61.9275 62.5614 62.0178 62.9681 61.8167 63.2771C60.6102 65.1231 60.5117 67.2537 61.5459 69.116C62.4118 70.6733 63.9384 71.7101 65.3501 71.7101C65.3665 71.7101 65.3788 71.7101 65.3911 71.7101C65.7563 71.7101 66.0518 71.9988 66.0559 72.3607C66.06 72.7267 65.7646 73.0235 65.3993 73.0276C65.3829 73.0276 65.3665 73.0276 65.346 73.0276Z"
							fill="#3F99F2"
						/>
						<path
							d="M54.0728 74.3656C53.9333 74.3656 53.7897 74.3209 53.6707 74.2314C52.2425 73.1539 51.5326 70.9257 51.8568 68.5511C52.2302 65.8065 53.8225 63.6271 56.1083 62.7203C56.4489 62.5862 56.8388 62.7488 56.9742 63.0863C57.1096 63.4238 56.9455 63.8101 56.6049 63.9442C54.7705 64.6721 53.4901 66.4611 53.1782 68.726C52.9197 70.6086 53.445 72.3976 54.4791 73.1783C54.7705 73.3979 54.8279 73.8126 54.6063 74.1054C54.475 74.2762 54.278 74.3656 54.0769 74.3656H54.0728Z"
							fill="#3F99F2"
						/>
						<path
							d="M45.968 67.5914C45.6479 67.5914 45.3648 67.3596 45.3114 67.0343C44.8846 64.3954 46.0829 61.5776 48.1554 60.3293C49.2347 59.6788 51.4794 58.9103 54.389 61.045C54.6845 61.2605 54.7461 61.6752 54.5286 61.968C54.3111 62.2607 53.8925 62.3217 53.597 62.1062C51.8816 60.8457 50.2401 60.6221 48.8489 61.4597C47.2197 62.4396 46.284 64.6963 46.6288 66.8269C46.6862 67.1888 46.44 67.5263 46.0747 67.5832C46.0378 67.5873 46.005 67.5914 45.968 67.5914Z"
							fill="#3F99F2"
						/>
					</g>
					<path
						d="M64.5524 31.3322C64.5973 30.3654 63.8609 29.5464 62.9077 29.5031C61.9546 29.4597 61.1455 30.2083 61.1007 31.1751C61.0559 32.142 61.7922 32.9609 62.7454 33.0043C63.6986 33.0477 64.5076 32.2991 64.5524 31.3322Z"
						fill="#57F287"
					/>
					<path
						d="M80.3698 33.2116C80.4147 32.2448 79.6783 31.4258 78.7251 31.3824C77.7719 31.3391 76.9629 32.0877 76.9181 33.0545C76.8733 34.0214 77.6096 34.8403 78.5628 34.8837C79.516 34.9271 80.325 34.1785 80.3698 33.2116Z"
						fill="#57F287"
					/>
					<path
						d="M71.5676 41.1743C70.8577 41.1743 70.0985 41.0604 69.3023 40.7799C65.1657 39.3161 64.6609 35.5427 64.6445 35.3842L65.966 35.2256C65.9824 35.3516 66.4092 38.3524 69.7496 39.5356C72.8891 40.6457 75.4744 38.4297 75.5032 38.4093L76.3855 39.4015C76.2829 39.4909 74.3172 41.1783 71.5676 41.1783V41.1743Z"
						fill="#57F287"
					/>
					<path
						d="M69.3231 40.5438C68.0058 41.9182 65.9047 42.7111 64.8828 41.2473C64.1236 40.1616 65.1372 38.7385 66.0319 37.8887L69.3231 40.5438Z"
						fill="#57F287"
					/>
				</g>
			</g>
			<defs>
				<linearGradient id="paint0_linear_6215_282581" x1="54.0812" y1="105.874" x2="61.7915" y2="39.8299" gradientUnits="userSpaceOnUse">
					<stop offset="0.12" stopColor="#FFC619" />
					<stop offset="0.2" stopColor="#FFBB19" />
					<stop offset="0.33" stopColor="#FF9F19" />
					<stop offset="0.41" stopColor="#FF8C19" />
					<stop offset="0.83" stopColor="#ED5F00" />
				</linearGradient>
				<linearGradient id="paint1_linear_6215_282581" x1="89.9675" y1="27.266" x2="36.7523" y2="41.5251" gradientUnits="userSpaceOnUse">
					<stop stopColor="#FFC618" />
					<stop offset="0.31" stopColor="#FFAD19" />
					<stop offset="1" stopColor="#FF7D12" />
				</linearGradient>
				<linearGradient id="paint2_linear_6215_282581" x1="47.5925" y1="26.364" x2="38.0004" y2="37.8641" gradientUnits="userSpaceOnUse">
					<stop stopColor="#FFE75C" />
					<stop offset="1" stopColor="#FFC619" />
				</linearGradient>
				<linearGradient id="paint3_linear_6215_282581" x1="68.9357" y1="52.0565" x2="69.5352" y2="48.957" gradientUnits="userSpaceOnUse">
					<stop offset="0.02" stopColor="#FFB619" />
					<stop offset="1" stopColor="#FFC619" />
				</linearGradient>
				<linearGradient id="paint4_linear_6215_282581" x1="65.5227" y1="55.3447" x2="50.0355" y2="71.4104" gradientUnits="userSpaceOnUse">
					<stop stopColor="#8CD9FF" />
					<stop offset="0.8" stopColor="#66BCFF" />
				</linearGradient>
				<linearGradient id="paint5_linear_6215_282581" x1="65.5227" y1="55.3447" x2="50.0355" y2="71.4104" gradientUnits="userSpaceOnUse">
					<stop stopColor="#8CD9FF" />
					<stop offset="0.8" stopColor="#66BCFF" />
				</linearGradient>
				<clipPath id="clip0_6215_282581">
					<rect width="134" height="71" fill="white" />
				</clipPath>
				<clipPath id="clip1_6215_282581">
					<rect width="26" height="23" fill="white" transform="translate(97 10)" />
				</clipPath>
				<clipPath id="clip2_6215_282581">
					<rect width="41" height="35" fill="white" transform="translate(1 4)" />
				</clipPath>
				<clipPath id="clip3_6215_282581">
					<rect width="65" height="79" fill="white" transform="translate(36 12)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export function SortByBigSizeBtn(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className=""
			{...props}
		>
			<path
				fill="currentColor"
				d="M15 11a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5ZM2 20c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5ZM13 20c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v5ZM2 9c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5Z"
				className=""
			></path>
		</svg>
	);
}

export function EmptyUnread(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5ZM4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5h-2.65c-.5 0-.85.5-.85 1a3 3 0 1 1-6 0c0-.5-.35-1-.85-1H5.5A1.5 1.5 0 0 1 4 11.5v-6Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function EmptyUnreadStyle(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg {...props} aria-hidden="true" role="img" width="104" height="80" viewBox="0 0 104 80" fill="none">
			<path
				d="M95.6718 1.80634C95.6718 0.808724 94.863 0 93.8654 0C92.8678 0 92.0591 0.808724 92.0591 1.80634V3.64278C92.0591 4.64039 92.8678 5.44911 93.8654 5.44911C94.863 5.44911 95.6718 4.64039 95.6718 3.64278V1.80634Z"
				fill="#ADF3FF"
			></path>
			<path
				d="M95.6713 16.3574C95.6713 15.3598 94.8625 14.5511 93.8649 14.5511C92.8673 14.5511 92.0586 15.3598 92.0586 16.3574V18.1939C92.0586 19.1915 92.8673 20.0002 93.8649 20.0002C94.8625 20.0002 95.6713 19.1915 95.6713 18.1939V16.3574Z"
				fill="#ADF3FF"
			></path>
			<path
				d="M102.194 11.8412C103.191 11.8412 104 11.0325 104 10.0349C104 9.03724 103.191 8.22852 102.194 8.22852H100.357C99.3596 8.22852 98.5509 9.03724 98.5509 10.0349C98.5509 11.0325 99.3596 11.8412 100.357 11.8412H102.194Z"
				fill="#ADF3FF"
			></path>
			<path
				d="M87.6434 11.7413C88.641 11.7413 89.4497 10.9325 89.4497 9.93494C89.4497 8.93733 88.641 8.1286 87.6434 8.1286H85.8069C84.8093 8.1286 84.0006 8.93733 84.0006 9.93494C84.0006 10.9325 84.8093 11.7413 85.8069 11.7413H87.6434Z"
				fill="#ADF3FF"
			></path>
			<path
				d="M11.1501 74.4573L15.3147 73.0684C15.5192 72.9747 15.6925 72.8241 15.814 72.6347C15.9354 72.4454 16 72.225 16 72C16 71.775 15.9354 71.5546 15.814 71.3653C15.6925 71.1759 15.5192 71.0253 15.3147 70.9316L11.1501 69.5427C10.8657 69.4142 10.6378 69.1862 10.5094 68.9016L9.01446 64.7348C8.94423 64.521 8.80835 64.3349 8.62619 64.203C8.44403 64.071 8.22488 64 7.99999 64C7.77511 64 7.55597 64.071 7.37381 64.203C7.19165 64.3349 7.05576 64.521 6.98554 64.7348L5.49057 68.9016C5.36216 69.1862 5.13433 69.4142 4.84986 69.5427L0.685276 70.9316C0.480802 71.0253 0.307523 71.1759 0.186045 71.3653C0.0645662 71.5546 0 71.775 0 72C0 72.225 0.0645662 72.4454 0.186045 72.6347C0.307523 72.8241 0.480802 72.9747 0.685276 73.0684L4.84986 74.4573C5.0011 74.5032 5.1387 74.5858 5.25046 74.6976C5.36222 74.8094 5.44469 74.9471 5.49057 75.0984L6.98554 79.2652C7.05576 79.479 7.19165 79.6651 7.37381 79.797C7.55597 79.929 7.77511 80 7.99999 80C8.22488 80 8.44403 79.929 8.62619 79.797C8.80835 79.6651 8.94423 79.479 9.01446 79.2652L10.5094 75.0984C10.5553 74.9471 10.6378 74.8094 10.7495 74.6976C10.8613 74.5858 10.9989 74.5032 11.1501 74.4573Z"
				fill="#FFD01A"
			></path>
		</svg>
	);
}

export function EmptyMention(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg {...props} aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M16.44 6.96c.29 0 .51.25.47.54l-.82 6.34c-.02.08-.03.2-.03.34 0 .71.28 1.07.85 1.07.49 0 .94-.21 1.36-.63.43-.42.77-1 1.02-1.72.26-.75.38-1.57.38-2.48 0-1.35-.29-2.54-.87-3.56a5.92 5.92 0 0 0-2.45-2.35 7.68 7.68 0 0 0-3.61-.83c-1.55 0-2.96.37-4.22 1.1a7.66 7.66 0 0 0-2.96 3.07 9.53 9.53 0 0 0-1.09 4.66c0 1.45.26 2.77.78 3.95a6.3 6.3 0 0 0 2.47 2.81 8.3 8.3 0 0 0 4.36 1.05 12.43 12.43 0 0 0 5.35-1.18.5.5 0 0 1 .7.24l.46 1.07c.1.22.02.47-.19.59-.77.43-1.69.77-2.75 1.02-1.23.3-2.48.44-3.76.44-2.18 0-4-.44-5.48-1.33a8.1 8.1 0 0 1-3.27-3.57 11.93 11.93 0 0 1-1.07-5.12c0-2.24.47-4.19 1.4-5.84a9.7 9.7 0 0 1 3.86-3.8c1.62-.9 3.4-1.34 5.36-1.34 1.8 0 3.4.37 4.8 1.12 1.4.72 2.5 1.76 3.28 3.1a8.86 8.86 0 0 1 1.16 4.56c0 1.36-.23 2.57-.7 3.64a5.81 5.81 0 0 1-1.92 2.47c-.82.58-1.76.87-2.81.87a2.4 2.4 0 0 1-1.6-.5c-.4-.35-.65-.78-.73-1.32-.3.55-.74 1-1.36 1.34a4.3 4.3 0 0 1-2.03.48A3.4 3.4 0 0 1 8 16C7.33 15.16 7 14 7 12.5c0-1.14.2-2.16.6-3.05.43-.89 1-1.57 1.73-2.06a4.3 4.3 0 0 1 4.27-.31c.47.29.82.68 1.07 1.16l.3-.95c.06-.2.25-.33.46-.33h1.02Zm-5.06 8.24c.8 0 1.45-.35 1.97-1.04.51-.7.77-1.6.77-2.7 0-.88-.18-1.56-.53-2.03a1.76 1.76 0 0 0-1.5-.73c-.8 0-1.45.35-1.97 1.04a4.28 4.28 0 0 0-.78 2.67c0 .9.17 1.58.51 2.06.36.49.87.73 1.53.73Z"
			></path>
		</svg>
	);
}

export function SortBySmallSizeBtn(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			fill="currentColor"
			height="200px"
			width="200px"
			version="1.1"
			id="Capa_1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 490.2 490.2"
			xmlSpace="preserve"
			className=""
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<g>
					{' '}
					<g>
						{' '}
						<path d="M128.4,106.5c0,12.1-9.8,21.9-21.9,21.9H21.9C9.8,128.4,0,118.6,0,106.5V21.9C0,9.8,9.8,0,21.9,0h84.6 c12.1,0,21.9,9.8,21.9,21.9L128.4,106.5L128.4,106.5z M309.3,21.9c0-12.1-9.8-21.9-21.9-21.9h-84.6c-12.1,0-21.9,9.8-21.9,21.9 v84.6c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9V21.9z M490.2,21.9c0-12.1-9.8-21.9-21.9-21.9h-84.6 c-12.1,0-21.9,9.8-21.9,21.9v84.6c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9V21.9z M309.3,202.8 c0-12.1-9.8-21.9-21.9-21.9h-84.6c-12.1,0-21.9,9.8-21.9,21.9v84.6c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9 V202.8z M490.2,202.8c0-12.1-9.8-21.9-21.9-21.9h-84.6c-12.1,0-21.9,9.8-21.9,21.9v84.6c0,12.1,9.8,21.9,21.9,21.9h84.6 c12.1,0,21.9-9.8,21.9-21.9V202.8z M128.4,202.8c0-12.1-9.8-21.9-21.9-21.9H21.9C9.8,180.9,0,190.7,0,202.8v84.6 c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9L128.4,202.8L128.4,202.8z M287.4,361.8h-84.6 c-12.1,0-21.9,9.8-21.9,21.9v84.6c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9v-84.6 C309.3,371.6,299.5,361.8,287.4,361.8z M383.7,490.2h84.6c12.1,0,21.9-9.8,21.9-21.9v-84.6c0-12.1-9.8-21.9-21.9-21.9h-84.6 c-12.1,0-21.9,9.8-21.9,21.9v84.6C361.8,480.4,371.6,490.2,383.7,490.2z M106.5,361.8H21.9C9.8,361.8,0,371.6,0,383.7v84.6 c0,12.1,9.8,21.9,21.9,21.9h84.6c12.1,0,21.9-9.8,21.9-21.9v-84.6C128.4,371.6,118.6,361.8,106.5,361.8z"></path>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function MenuBarIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16" {...props}>
			<path
				fill="currentColor"
				d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
			/>
		</svg>
	);
}

export function AdminHomeIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon-1qHBsr"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="m2.4 8.4 8.38-6.46a2 2 0 0 1 2.44 0l8.39 6.45a2 2 0 0 1-.79 3.54l-.32.07-.82 8.2a2 2 0 0 1-1.99 1.8H16a1 1 0 0 1-1-1v-5a3 3 0 0 0-6 0v5a1 1 0 0 1-1 1H6.31a2 2 0 0 1-1.99-1.8L3.5 12l-.32-.07a2 2 0 0 1-.79-3.54Z"
				className=""
			></path>
		</svg>
	);
}

export function AdminSettingIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon-1qHBsr"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function LeftArrowIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="arrow-1BANee"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M3.3 11.3a1 1 0 0 0 0 1.4l8 8a1 1 0 1 0 1.4-1.4L6.42 13H20a1 1 0 1 0 0-2H6.41l6.3-6.3a1 1 0 0 0-1.42-1.4l-8 8Z"
				className=""
			></path>
		</svg>
	);
}

export function RotateRightIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M20.4898 14.9907C19.8414 16.831 18.6124 18.4108 16.9879 19.492C15.3635 20.5732 13.4316 21.0972 11.4835 20.9851C9.5353 20.873 7.67634 20.1308 6.18668 18.8704C4.69703 17.61 3.65738 15.8996 3.22438 13.997C2.79138 12.0944 2.98849 10.1026 3.78602 8.32177C4.58354 6.54091 5.93827 5.06746 7.64608 4.12343C9.35389 3.17941 11.3223 2.81593 13.2546 3.08779C16.5171 3.54676 18.6725 5.91142 21 8M21 8V2M21 8H15"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
			</g>
		</svg>
	);
}

export function RotateLeftIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M3.51018 14.9907C4.15862 16.831 5.38765 18.4108 7.01208 19.492C8.63652 20.5732 10.5684 21.0972 12.5165 20.9851C14.4647 20.873 16.3237 20.1308 17.8133 18.8704C19.303 17.61 20.3426 15.8996 20.7756 13.997C21.2086 12.0944 21.0115 10.1026 20.214 8.32177C19.4165 6.54091 18.0617 5.06746 16.3539 4.12343C14.6461 3.17941 12.6777 2.81593 10.7454 3.08779C7.48292 3.54676 5.32746 5.91142 3 8M3 8V2M3 8H9"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
			</g>
		</svg>
	);
}

export function ZoomIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"
					fill="currentColor"
				></path>{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M10 14C10 14.5523 10.4477 15 11 15C11.5523 15 12 14.5523 12 14V12H14C14.5523 12 15 11.5523 15 11C15 10.4477 14.5523 10 14 10H12V8C12 7.44772 11.5523 7 11 7C10.4477 7 10 7.44772 10 8V10H8C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H10V14Z"
					fill="currentColor"
				></path>{' '}
			</g>
		</svg>
	);
}

export function AspectRatioIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"
					fill="currentColor"
				></path>

				<text fontSize="6" x="11" y="11" textAnchor="middle" fontWeight="700" dominantBaseline="middle" fill="currentColor">
					1 : 1
				</text>
			</g>
		</svg>
	);
}

export function StraightLineIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<g id="Interface / Line_Xl">
					{' '}
					<path id="Vector" d="M12 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function SideMenuIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<g id="System / Bar_Right">
					{' '}
					<path
						id="Vector"
						d="M15 4L15 20M15 4H7.2002C6.08009 4 5.51962 4 5.0918 4.21799C4.71547 4.40973 4.40973 4.71547 4.21799 5.0918C4 5.51962 4 6.08009 4 7.2002V16.8002C4 17.9203 4 18.4796 4.21799 18.9074C4.40973 19.2837 4.71547 19.5905 5.0918 19.7822C5.51921 20 6.07901 20 7.19694 20L15 20M15 4H16.8002C17.9203 4 18.4796 4 18.9074 4.21799C19.2837 4.40973 19.5905 4.71547 19.7822 5.0918C20 5.5192 20 6.079 20 7.19691L20 16.8031C20 17.921 20 18.48 19.7822 18.9074C19.5905 19.2837 19.2837 19.5905 18.9074 19.7822C18.48 20 17.921 20 16.8031 20H15"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					></path>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}
export function ThreadEmpty(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg x="0" y="0" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
			<path
				d="M12 2.81a1 1 0 0 1 0-1.41l.36-.36a1 1 0 0 1 1.41 0l9.2 9.2a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.3.13l-9.54-6.72a1 1 0 0 1-.08-1.58l1-1L12 2.8ZM12 21.2a1 1 0 0 1 0 1.41l-.35.35a1 1 0 0 1-1.41 0l-9.2-9.19a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.3-.12l9.54 6.72a1 1 0 0 1 .07 1.58l-1 1 .35.36ZM15.66 16.8a1 1 0 0 1-1.38.28l-8.49-5.66A1 1 0 1 1 6.9 9.76l8.49 5.65a1 1 0 0 1 .27 1.39ZM17.1 14.25a1 1 0 1 0 1.11-1.66L9.73 6.93a1 1 0 0 0-1.11 1.66l8.49 5.66Z"
				fill="currentColor"
			></path>
		</svg>
	);
}

export const DollarIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5', defaultFill }) => {
	return (
		<svg
			height="800px"
			width="800px"
			version="1.1"
			id="Layer_1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 64 64"
			enableBackground="new 0 0 64 64"
			xmlSpace="preserve"
			className={` ${defaultSize} ${defaultFill ? defaultFill : ''}`}
		>
			<g id="US-coin">
				<path
					fill="currentColor"
					d="M33.0004005,27.4897995v-11.846199c2.209198,0.1276999,3.8346977,0.6910992,4.7324066,1.6488991
		c0.8134918,0.8691006,0.7743912,1.7933998,0.771492,1.8554001c-0.0458984,0.5445004,0.3555107,1.0263996,0.9004021,1.078701
		c0.5517998,0.0438995,1.0381088-0.3501015,1.0907974-0.9004002c0.017601-0.1822014,0.1309013-1.8233013-1.25-3.3428001
		c-1.2817993-1.4107008-3.3841972-2.1916008-6.2450981-2.3376007V10c0-0.5522003-0.4473-1-1-1s-1,0.4477997-1,1v3.6475
		c-7.8845921,0.3302002-9,4.5334997-9,8.6601c0,4.5676003,2.9512005,6.9036999,9,7.1313v13.3871002
		c-2.9852009-0.1097984-7-0.7792015-7-3.5955009c0-0.5527992-0.4473-1-1-1s-1,0.4472008-1,1
		c0,2.0119019,1.2152996,5.3241005,9,5.5893021V50c0,0.5527,0.4473,1,1,1s1-0.4473,1-1v-5.1848984
		c5.8116989-0.3094025,9-3.3544998,9-8.6618004C42.0004005,30.6847,38.9703979,27.7770004,33.0004005,27.4897995z
		 M31.0004005,27.4375c-6.1312008-0.2409992-7-2.7087994-7-5.1299c0-3.3582001,0.5688992-6.3823996,7-6.6645002V27.4375z
		 M33.0004005,42.8162003V29.4857006c3.4489975,0.1543999,7,1.2619991,7,6.6676006
		C40.0004005,40.3054008,37.6459999,42.5429993,33.0004005,42.8162003z"
				/>
				<path
					fill="currentColor"
					d="M51.581501,45.0996017c-0.4961014-0.3203011-1.1592026-0.1777-1.4815025,0.3192978
		c-4.3554993,6.75-9.1483994,7.5059013-9.2372971,7.5186005c-0.5840034,0.0751991-0.9980011,0.6083984-0.9258003,1.1934013
		c0.0663986,0.5429001,0.5282974,0.9403992,1.0625,0.9403992c0.0429993,0,0.0878983-0.0019989,0.131897-0.0078011
		c0.235302-0.0283012,5.8095093-0.7958984,10.7695122-8.482399C52.2220993,46.0839996,52.0784988,45.4208984,51.581501,45.0996017z"
				/>
				<path
					fill="currentColor"
					d="M32,0c-17.6730995,0-32,14.3268995-32,32s14.3268995,32,32,32c17.6731987,0,32-14.3269005,32-32S49.6731987,0,32,0z M32,62
		c-16.5419998,0-30-13.457901-30-30S15.4580002,2,32,2c16.542099,0,30,13.4579,30,30S48.542099,62,32,62z"
				/>
			</g>
		</svg>
	);
};

export function Stream({ defaultFill, defaultSize = 'w-5 h-5' }: IconProps) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={`${defaultSize} ${defaultFill ? defaultFill : ''}`}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22 5C22 3.89543 21.1046 3 20 3H4C2.89543 3 2 3.89543 2 5V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V5ZM10.5145 7.14251C10.2056 6.95715 9.82081 6.9523 9.5073 7.1298C9.19379 7.30731 9 7.63973 9 8V14C9 14.3603 9.19379 14.6927 9.5073 14.8702C9.82081 15.0477 10.2056 15.0429 10.5145 14.8575L15.5145 11.8575C15.8157 11.6768 16 11.3513 16 11C16 10.6487 15.8157 10.3232 15.5145 10.1425L10.5145 7.14251Z"
				fill="currentColor"
			/>
			<path
				d="M8 20C7.44772 20 7 20.4477 7 21C7 21.5523 7.44772 22 8 22H16C16.5523 22 17 21.5523 17 21C17 20.4477 16.5523 20 16 20H8Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function EndCall(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" preserveAspectRatio="xMidYMid meet" {...props}>
			<defs>
				<clipPath id="__lottie_element_258">
					<rect width="24" height="24" x="0" y="0"></rect>
				</clipPath>
				<clipPath id="__lottie_element_260">
					<path d="M0,0 L600,0 L600,600 L0,600z"></path>
				</clipPath>
			</defs>
			<g clipPath="url(#__lottie_element_258)">
				<g clipPath="url(#__lottie_element_260)" transform="matrix(0.03999999910593033,0,0,0.03999999910593033,0,0)" opacity="1">
					<g transform="matrix(25,0,0,25,300,315)" opacity="1">
						<g opacity="1" transform="matrix(1,0,0,1,0,-0.6100000143051147)">
							<path
								fill="currentColor"
								fillOpacity="1"
								d=" M9.335000038146973,-1.8179999589920044 C4.184999942779541,-6.9670000076293945 -4.164000034332275,-6.9670000076293945 -9.312999725341797,-1.8179999589920044 C-11.690999984741211,0.5609999895095825 -11.35099983215332,3.6040000915527344 -9.555999755859375,5.39900016784668 C-9.300999641418457,5.6539998054504395 -8.909000396728516,5.7129998207092285 -8.59000015258789,5.544000148773193 C-8.59000015258789,5.544000148773193 -4.269999980926514,3.256999969482422 -4.269999980926514,3.256999969482422 C-3.871000051498413,3.0460000038146973 -3.683000087738037,2.5769999027252197 -3.8259999752044678,2.1489999294281006 C-3.8259999752044678,2.1489999294281006 -4.558000087738037,-0.04600000008940697 -4.558000087738037,-0.04600000008940697 C-1.8250000476837158,-1.9980000257492065 1.8459999561309814,-1.9980000257492065 4.578999996185303,-0.04600000008940697 C4.578999996185303,-0.04600000008940697 3.815000057220459,2.757999897003174 3.815000057220459,2.757999897003174 C3.693000078201294,3.2070000171661377 3.9240000247955322,3.677000045776367 4.354000091552734,3.8540000915527344 C4.354000091552734,3.8540000915527344 8.63599967956543,5.617000102996826 8.63599967956543,5.617000102996826 C8.946000099182129,5.744999885559082 9.303000450134277,5.672999858856201 9.539999961853027,5.435999870300293 C11.331999778747559,3.6440000534057617 11.708999633789062,0.5559999942779541 9.335000038146973,-1.8179999589920044z"
							></path>
						</g>
					</g>
				</g>
			</g>
		</svg>
	);
}

export function NetworkStatus({ defaultFill, defaultSize = 'w-5 h-5' }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			className={`${defaultSize} ${defaultFill ? defaultFill : 'dark:text-channelTextLabel text-colorTextLightMode'}`}
		>
			<path fill="green" d="M2 3a1 1 0 0 1 1-1 19 19 0 0 1 19 19 1 1 0 1 1-2 0A17 17 0 0 0 3 4a1 1 0 0 1-1-1Z"></path>
			<path fill="green" d="M2 8a1 1 0 0 1 1-1 14 14 0 0 1 14 14 1 1 0 1 1-2 0A12 12 0 0 0 3 9a1 1 0 0 1-1-1Z"></path>
			<path
				fill="green"
				d="M3 12a1 1 0 1 0 0 2 7 7 0 0 1 7 7 1 1 0 1 0 2 0 9 9 0 0 0-9-9ZM2 17.83c0-.46.37-.83.83-.83C5.13 17 7 18.87 7 21.17c0 .46-.37.83-.83.83H3a1 1 0 0 1-1-1v-3.17Z"
			></path>
		</svg>
	);
}

export function HatIcon({ defaultFill = 'fill-current text-theme-primary', defaultSize = 'w-5 h-5' }: IconProps) {
	return (
		<svg
			version="1.1"
			id="_x32_"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			className={`${defaultSize} ${defaultFill}`}
			viewBox="0 0 512 512"
			xmlSpace="preserve"
			fill="currentColor"
		>
			<path
				d="M511.883,298.395c-2.781-27.281-54.391-46.141-129.406-51.844c-7.172-42.047-15.469-90.563-17.891-103.75
				c-5.563-30.203-45.344-47.094-74.891-25.313c-15.5,11.422-29.359,12.234-36.703,12.234s-15.5,1.625-36.703-12.234
				c-30.719-20.094-69.328-4.891-74.875,25.313c-2.969,16.109-14.688,84.844-22.391,130.203
				C45.211,293.817-2.711,323.114,0.117,350.723c4.25,41.625,122.266,63.671,263.578,49.218
				C405.039,385.488,516.148,340.036,511.883,298.395z M132.289,308.348l8.156-42.406c0,0,145.188,22.828,226.75-19.578l8.156,35.891
				C375.352,282.254,287.258,337.708,132.289,308.348z"
			/>
		</svg>
	);
}

export function FullScreen(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M4 6c0-1.1.9-2 2-2h3a1 1 0 0 0 0-2H6a4 4 0 0 0-4 4v3a1 1 0 0 0 2 0V6ZM4 18c0 1.1.9 2 2 2h3a1 1 0 1 1 0 2H6a4 4 0 0 1-4-4v-3a1 1 0 1 1 2 0v3ZM18 4a2 2 0 0 1 2 2v3a1 1 0 1 0 2 0V6a4 4 0 0 0-4-4h-3a1 1 0 1 0 0 2h3ZM20 18a2 2 0 0 1-2 2h-3a1 1 0 1 0 0 2h3a4 4 0 0 0 4-4v-3a1 1 0 1 0-2 0v3Z"
			></path>
		</svg>
	);
}

export function ExitFullScreen(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M8 6a2 2 0 0 1-2 2H3a1 1 0 0 0 0 2h3a4 4 0 0 0 4-4V3a1 1 0 0 0-2 0v3ZM8 18a2 2 0 0 0-2-2H3a1 1 0 1 1 0-2h3a4 4 0 0 1 4 4v3a1 1 0 1 1-2 0v-3ZM18 8a2 2 0 0 1-2-2V3a1 1 0 1 0-2 0v3a4 4 0 0 0 4 4h3a1 1 0 1 0 0-2h-3ZM16 18c0-1.1.9-2 2-2h3a1 1 0 1 0 0-2h-3a4 4 0 0 0-4 4v3a1 1 0 1 0 2 0v-3Z"
			></path>
		</svg>
	);
}

export function MutedVolume(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM22.7 8.3a1 1 0 0 0-1.4 0L19 10.58l-2.3-2.3a1 1 0 1 0-1.4 1.42L17.58 12l-2.3 2.3a1 1 0 0 0 1.42 1.4L19 13.42l2.3 2.3a1 1 0 0 0 1.4-1.42L20.42 12l2.3-2.3a1 1 0 0 0 0-1.4Z"
			></path>
		</svg>
	);
}

export function LoudVolume(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"
			></path>
			<path
				fill="currentColor"
				d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"
			></path>
		</svg>
	);
}

export function LowVolume(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.18 15.36c-.55.35-1.18-.12-1.18-.78v-.27c0-.36.2-.67.45-.93a2 2 0 0 0 0-2.76c-.24-.26-.45-.57-.45-.93v-.27c0-.66.63-1.13 1.18-.78a4 4 0 0 1 0 6.72Z"
			></path>
		</svg>
	);
}

export function AppChannelIcon({ fill, ...props }: ClassIconProps) {
	return (
		<svg
			className="icon icon-tabler icon-tabler-apps"
			fill="currentColor"
			height="24"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M0 0h24v24H0z" fill="none" stroke="none" />
			<rect height="6" rx="1" width="6" x="4" y="4" />
			<rect height="6" rx="1" width="6" x="4" y="14" />
			<rect height="6" rx="1" width="6" x="14" y="14" />
			<line x1="14" x2="20" y1="7" y2="7" fill={fill} />
			<line x1="17" x2="17" y1="4" y2="10" fill={fill} />
		</svg>
	);
}

export function PrivateAppChannelIcon({ fill, ...props }: ClassIconProps) {
	return (
		<svg
			className="icon icon-tabler icon-tabler-apps"
			fill="currentColor"
			height="24"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M0 0h24v24H0z" fill="none" stroke="none" />
			<rect height="6" rx="1" width="6" x="4" y="4" />
			<rect height="6" rx="1" width="6" x="4" y="14" />
			<rect height="6" rx="1" width="6" x="14" y="14" />
			<line x1="14" x2="20" y1="7" y2="7" fill={fill} />
			<line x1="17" x2="17" y1="4" y2="10" fill={fill} />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.2117 3.45524V3.13004C13.2117 2.31703 13.8621 1.66663 14.6751 1.66663C15.4881 1.66663 16.1385 2.31703 16.1385 3.13004V3.45524H16.4637C16.7889 3.45524 17.0328 3.69915 17.0328 4.02435V6.95118C17.0328 7.27638 16.7889 7.52028 16.4637 7.52028H12.8865C12.5613 7.52028 12.3174 7.27638 12.3174 6.95118V4.02435C12.3174 3.69915 12.5613 3.45524 12.8865 3.45524H13.2117ZM13.7808 3.13004C13.7808 2.64224 14.1873 2.23573 14.6751 2.23573C15.1629 2.23573 15.5694 2.64224 15.5694 3.13004V3.45524H13.7808V3.13004ZM14.6751 4.83736C14.919 4.83736 15.0816 4.99996 15.0816 5.24386V5.81297C15.0816 6.05687 14.919 6.21947 14.6751 6.21947C14.4312 6.21947 14.2686 6.05687 14.2686 5.81297V5.24386C14.3499 4.99996 14.5125 4.83736 14.6751 4.83736Z"
				fill="currentColor"
			></path>
		</svg>
	);
}

export function Joystick(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M16 4C16 5.86658 14.7215 7.43455 12.9924 7.87594C12.9974 7.91659 13 7.95799 13 8V9.7973C13.0054 9.79921 13.0108 9.80113 13.0162 9.80307L20.1604 12.375C21.4569 12.8418 22.0701 14.0289 22 15.177V18.5585C22 19.8498 21.1737 20.9962 19.9487 21.4045L12.9487 23.7379C12.3329 23.9431 11.6671 23.9431 11.0513 23.7379L4.05132 21.4045C2.82629 20.9962 2 19.8498 2 18.5585V15.1769C1.92995 14.0287 2.54315 12.8417 3.83959 12.375L10.9838 9.80307C10.9892 9.80113 10.9946 9.79921 11 9.79731V8C11 7.95799 11.0026 7.91659 11.0076 7.87594C9.27853 7.43455 8 5.86658 8 4C8 1.79086 9.79086 0 12 0C14.2091 0 16 1.79086 16 4ZM11 11.9229L4.51703 14.2568C4.16878 14.3821 3.99464 14.6911 3.99461 15H4C4 15.3341 4.19728 15.6283 4.51702 15.7434L11.6613 18.3153C11.8802 18.3941 12.1198 18.3941 12.3387 18.3153L19.483 15.7434C19.8027 15.6283 20 15.3341 20 15H20.0054C20.0054 14.6911 19.8312 14.3821 19.483 14.2568L13 11.9229V15C13 15.5523 12.5523 16 12 16C11.4477 16 11 15.5523 11 15V11.9229ZM9.98005 4C9.98005 5.11559 10.8844 6.01995 12 6.01995C13.1156 6.01995 14.0199 5.11559 14.0199 4C14.0199 2.88441 13.1156 1.98005 12 1.98005C10.8844 1.98005 9.98005 2.88441 9.98005 4ZM4 18.5585V17.6829L10.9838 20.1971C11.6407 20.4335 12.3594 20.4335 13.0162 20.1971L20 17.6829V18.5585C20 18.9889 19.7246 19.3711 19.3162 19.5072L12.3162 21.8405C12.111 21.9089 11.889 21.9089 11.6838 21.8405L4.68377 19.5072C4.27543 19.3711 4 18.9889 4 18.5585Z"
					fill="currentColor"
				></path>{' '}
			</g>
		</svg>
	);
}

export function AppHelpIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M12 10.4V20M12 10.4C12 8.15979 12 7.03969 11.564 6.18404C11.1805 5.43139 10.5686 4.81947 9.81596 4.43597C8.96031 4 7.84021 4 5.6 4H4.6C4.03995 4 3.75992 4 3.54601 4.10899C3.35785 4.20487 3.20487 4.35785 3.10899 4.54601C3 4.75992 3 5.03995 3 5.6V16.4C3 16.9601 3 17.2401 3.10899 17.454C3.20487 17.6422 3.35785 17.7951 3.54601 17.891C3.75992 18 4.03995 18 4.6 18H7.54668C8.08687 18 8.35696 18 8.61814 18.0466C8.84995 18.0879 9.0761 18.1563 9.29191 18.2506C9.53504 18.3567 9.75977 18.5065 10.2092 18.8062L12 20M12 10.4C12 8.15979 12 7.03969 12.436 6.18404C12.8195 5.43139 13.4314 4.81947 14.184 4.43597C15.0397 4 16.1598 4 18.4 4H19.4C19.9601 4 20.2401 4 20.454 4.10899C20.6422 4.20487 20.7951 4.35785 20.891 4.54601C21 4.75992 21 5.03995 21 5.6V16.4C21 16.9601 21 17.2401 20.891 17.454C20.7951 17.6422 20.6422 17.7951 20.454 17.891C20.2401 18 19.9601 18 19.4 18H16.4533C15.9131 18 15.643 18 15.3819 18.0466C15.15 18.0879 14.9239 18.1563 14.7081 18.2506C14.465 18.3567 14.2402 18.5065 13.7908 18.8062L12 20"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				></path>{' '}
			</g>
		</svg>
	);
}

export function VideoIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M31.2768 8.14779C31.7209 8.37633 32 8.83389 32 9.33334V22.6667C32 23.1661 31.7209 23.6237 31.2768 23.8522C30.8327 24.0808 30.2981 24.042 29.8917 23.7517L20.5584 17.085C20.208 16.8347 20 16.4306 20 16C20 15.5694 20.208 15.1653 20.5584 14.915L29.8917 8.24837C30.2981 7.95807 30.8327 7.91925 31.2768 8.14779ZM23.6273 16L29.3333 20.0758V11.9243L23.6273 16Z"
				fill="#92B8FF"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M4 8.00001C3.26362 8.00001 2.66667 8.59696 2.66667 9.33334V22.6667C2.66667 23.4031 3.26362 24 4 24H18.6667C19.403 24 20 23.4031 20 22.6667V9.33334C20 8.59696 19.403 8.00001 18.6667 8.00001H4ZM0 9.33334C0 7.1242 1.79086 5.33334 4 5.33334H18.6667C20.8758 5.33334 22.6667 7.1242 22.6667 9.33334V22.6667C22.6667 24.8758 20.8758 26.6667 18.6667 26.6667H4C1.79086 26.6667 0 24.8758 0 22.6667V9.33334Z"
				fill="#92B8FF"
			/>
		</svg>
	);
}

export function VideoDisable(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className=""
			{...props}
		>
			<path d="M4 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2.12a1 1 0 0 0 .55.9l3 1.5a1 1 0 0 0 1.45-.9V7.62a1 1 0 0 0-1.45-.9l-3 1.5a1 1 0 0 0-.55.9V7a3 3 0 0 0-3-3H4Z" />
			<line x1="2" y1="2" x2="22" y2="22" />
		</svg>
	);
}

export function PrivateChatIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
			<path
				d="M16 13.3333V10.6667C15.9977 9.84142 15.7402 9.03708 15.2627 8.36392C14.7853 7.69077 14.1114 7.18176 13.3333 6.90668V5.33334C13.3333 4.27248 12.9119 3.25506 12.1618 2.50492C11.4116 1.75477 10.3942 1.33334 9.33333 1.33334C8.27246 1.33334 7.25505 1.75477 6.5049 2.50492C5.75476 3.25506 5.33333 4.27248 5.33333 5.33334V6.90668C4.55526 7.18176 3.88133 7.69077 3.40392 8.36392C2.9265 9.03708 2.66898 9.84142 2.66666 10.6667V13.3333C2.66666 14.3942 3.08809 15.4116 3.83824 16.1618C4.58838 16.9119 5.6058 17.3333 6.66666 17.3333H12C13.0609 17.3333 14.0783 16.9119 14.8284 16.1618C15.5786 15.4116 16 14.3942 16 13.3333ZM8 5.33334C8 4.97972 8.14047 4.64058 8.39052 4.39053C8.64057 4.14049 8.97971 4.00001 9.33333 4.00001C9.68695 4.00001 10.0261 4.14049 10.2761 4.39053C10.5262 4.64058 10.6667 4.97972 10.6667 5.33334V6.66668H8V5.33334ZM5.33333 13.3333V10.6667C5.33333 10.3131 5.47381 9.97392 5.72386 9.72387C5.9739 9.47382 6.31304 9.33334 6.66666 9.33334H12C12.3536 9.33334 12.6928 9.47382 12.9428 9.72387C13.1929 9.97392 13.3333 10.3131 13.3333 10.6667V13.3333C13.3333 13.687 13.1929 14.0261 12.9428 14.2762C12.6928 14.5262 12.3536 14.6667 12 14.6667H6.66666C6.31304 14.6667 5.9739 14.5262 5.72386 14.2762C5.47381 14.0261 5.33333 13.687 5.33333 13.3333ZM25.3333 9.33334H20C19.6464 9.33334 19.3072 9.47382 19.0572 9.72387C18.8071 9.97392 18.6667 10.3131 18.6667 10.6667C18.6667 11.0203 18.8071 11.3594 19.0572 11.6095C19.3072 11.8595 19.6464 12 20 12H25.3333C25.687 12 26.0261 12.1405 26.2761 12.3905C26.5262 12.6406 26.6667 12.9797 26.6667 13.3333V26.2933L24.5733 24.36C24.3274 24.1298 24.0035 24.0012 23.6667 24H12C11.6464 24 11.3072 23.8595 11.0572 23.6095C10.8071 23.3594 10.6667 23.0203 10.6667 22.6667V21.3333C10.6667 20.9797 10.5262 20.6406 10.2761 20.3905C10.0261 20.1405 9.68695 20 9.33333 20C8.97971 20 8.64057 20.1405 8.39052 20.3905C8.14047 20.6406 8 20.9797 8 21.3333V22.6667C8 23.7275 8.42143 24.745 9.17157 25.4951C9.92172 26.2453 10.9391 26.6667 12 26.6667H23.1467L27.1467 30.3067C27.379 30.5248 27.6817 30.6525 28 30.6667C28.1829 30.6647 28.3638 30.6285 28.5333 30.56C28.7718 30.4559 28.9747 30.2843 29.1168 30.0663C29.259 29.8484 29.3342 29.5936 29.3333 29.3333V13.3333C29.3333 12.2725 28.9119 11.2551 28.1618 10.5049C27.4116 9.75477 26.3942 9.33334 25.3333 9.33334Z"
				fill="#92B8FF"
			/>
		</svg>
	);
}

export function UserIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.95262 20.6193C7.20286 19.369 8.89856 18.6667 10.6667 18.6667H21.3333C23.1014 18.6667 24.7971 19.369 26.0474 20.6193C27.2976 21.8695 28 23.5652 28 25.3333V28C28 28.7364 27.403 29.3333 26.6667 29.3333C25.9303 29.3333 25.3333 28.7364 25.3333 28V25.3333C25.3333 24.2725 24.9119 23.255 24.1618 22.5049C23.4116 21.7548 22.3942 21.3333 21.3333 21.3333H10.6667C9.6058 21.3333 8.58839 21.7548 7.83824 22.5049C7.08809 23.255 6.66667 24.2725 6.66667 25.3333V28C6.66667 28.7364 6.06971 29.3333 5.33333 29.3333C4.59695 29.3333 4 28.7364 4 28V25.3333C4 23.5652 4.70238 21.8695 5.95262 20.6193Z"
				fill="#92B8FF"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M16 5.33332C13.7909 5.33332 12 7.12418 12 9.33332C12 11.5425 13.7909 13.3333 16 13.3333C18.2091 13.3333 20 11.5425 20 9.33332C20 7.12418 18.2091 5.33332 16 5.33332ZM9.33333 9.33332C9.33333 5.65142 12.3181 2.66666 16 2.66666C19.6819 2.66666 22.6667 5.65142 22.6667 9.33332C22.6667 13.0152 19.6819 16 16 16C12.3181 16 9.33333 13.0152 9.33333 9.33332Z"
				fill="#92B8FF"
			/>
		</svg>
	);
}

export function UploadImageIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="64" height="61" viewBox="0 0 64 61" fill="none" {...props}>
			<circle cx="30.1432" cy="30.9417" r="29.709" stroke="#ACAFB5" strokeWidth="0.618938" strokeDasharray="3.09 3.09" />
			<path
				d="M15.5013 33.7389H16.5915V38.4758C16.5915 38.9799 16.4731 39.4265 16.2363 39.8157C15.9995 40.2025 15.6666 40.5073 15.2376 40.73C14.8086 40.9504 14.3057 41.0606 13.7289 41.0606C13.1545 41.0606 12.6528 40.9504 12.2238 40.73C11.7948 40.5073 11.4618 40.2025 11.2251 39.8157C10.9883 39.4265 10.8699 38.9799 10.8699 38.4758V33.7389H11.9565V38.3879C11.9565 38.7138 12.028 39.0033 12.171 39.2565C12.3164 39.5097 12.5215 39.709 12.7865 39.8544C13.0514 39.9974 13.3655 40.0689 13.7289 40.0689C14.0947 40.0689 14.41 39.9974 14.6749 39.8544C14.9422 39.709 15.1462 39.5097 15.2868 39.2565C15.4298 39.0033 15.5013 38.7138 15.5013 38.3879V33.7389ZM18.1714 40.941V33.7389H20.7386C21.2989 33.7389 21.7631 33.8408 22.1312 34.0448C22.4993 34.2488 22.7747 34.5278 22.9576 34.8818C23.1405 35.2335 23.2319 35.6297 23.2319 36.0704C23.2319 36.5135 23.1393 36.9121 22.9541 37.2661C22.7712 37.6178 22.4946 37.8968 22.1242 38.1031C21.7561 38.307 21.293 38.409 20.7351 38.409H18.9697V37.4876H20.6366C20.9906 37.4876 21.2778 37.4267 21.4982 37.3048C21.7186 37.1805 21.8803 37.0117 21.9835 36.7984C22.0866 36.585 22.1382 36.3424 22.1382 36.0704C22.1382 35.7985 22.0866 35.557 21.9835 35.346C21.8803 35.135 21.7174 34.9697 21.4947 34.8501C21.2743 34.7306 20.9836 34.6708 20.6225 34.6708H19.2581V40.941H18.1714ZM24.5058 40.941V33.7389H25.5925V40.0056H28.856V40.941H24.5058ZM36.0714 37.3399C36.0714 38.1089 35.9307 38.7701 35.6494 39.3234C35.368 39.8743 34.9824 40.2987 34.4924 40.5964C34.0047 40.8918 33.4502 41.0395 32.829 41.0395C32.2053 41.0395 31.6485 40.8918 31.1585 40.5964C30.6709 40.2987 30.2864 39.8731 30.0051 39.3198C29.7237 38.7666 29.5831 38.1066 29.5831 37.3399C29.5831 36.571 29.7237 35.911 30.0051 35.3601C30.2864 34.8068 30.6709 34.3824 31.1585 34.087C31.6485 33.7893 32.2053 33.6404 32.829 33.6404C33.4502 33.6404 34.0047 33.7893 34.4924 34.087C34.9824 34.3824 35.368 34.8068 35.6494 35.3601C35.9307 35.911 36.0714 36.571 36.0714 37.3399ZM34.9952 37.3399C34.9952 36.7538 34.9003 36.2603 34.7104 35.8594C34.5228 35.4562 34.2649 35.1514 33.9367 34.9451C33.6108 34.7364 33.2416 34.6321 32.829 34.6321C32.414 34.6321 32.0436 34.7364 31.7177 34.9451C31.3918 35.1514 31.1339 35.4562 30.944 35.8594C30.7565 36.2603 30.6627 36.7538 30.6627 37.3399C30.6627 37.9261 30.7565 38.4207 30.944 38.824C31.1339 39.2249 31.3918 39.5297 31.7177 39.7383C32.0436 39.9446 32.414 40.0478 32.829 40.0478C33.2416 40.0478 33.6108 39.9446 33.9367 39.7383C34.2649 39.5297 34.5228 39.2249 34.7104 38.824C34.9003 38.4207 34.9952 37.9261 34.9952 37.3399ZM37.6767 40.941H36.5232L39.1151 33.7389H40.3705L42.9623 40.941H41.8088L39.7727 35.0471H39.7164L37.6767 40.941ZM37.8701 38.1207H41.6119V39.035H37.8701V38.1207ZM46.3339 40.941H44.0024V33.7389H46.4078C47.1135 33.7389 47.7195 33.883 48.2259 34.1714C48.7323 34.4574 49.1203 34.8689 49.3899 35.4058C49.6619 35.9403 49.7979 36.5815 49.7979 37.3294C49.7979 38.0796 49.6607 38.7244 49.3864 39.2636C49.1145 39.8028 48.7206 40.2178 48.2048 40.5085C47.689 40.7969 47.0654 40.941 46.3339 40.941ZM45.089 39.9915H46.2742C46.8228 39.9915 47.2788 39.8884 47.6421 39.6821C48.0055 39.4734 48.2775 39.1721 48.458 38.7783C48.6385 38.3821 48.7288 37.8991 48.7288 37.3294C48.7288 36.7644 48.6385 36.2849 48.458 35.8911C48.2798 35.4972 48.0137 35.1983 47.6597 34.9943C47.3057 34.7903 46.8661 34.6884 46.341 34.6884H45.089V39.9915Z"
				fill="#676B74"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M27.6675 17.325C27.6675 16.9832 27.9446 16.7061 28.2864 16.7061H32.0001C32.3419 16.7061 32.619 16.9832 32.619 17.325V17.9435H35.0947C35.7784 17.9435 36.3326 18.4977 36.3326 19.1813V25.9896C36.3326 26.6733 35.7784 27.2275 35.0947 27.2275H25.1917C24.508 27.2275 23.9538 26.6733 23.9538 25.9896V19.1813C23.9538 18.4977 24.508 17.9435 25.1917 17.9435H27.6675V17.325ZM30.1432 24.7523C31.5106 24.7523 32.619 23.6439 32.619 22.2766C32.619 20.9092 31.5106 19.8008 30.1432 19.8008C28.7759 19.8008 27.6675 20.9092 27.6675 22.2766C27.6675 23.6439 28.7759 24.7523 30.1432 24.7523Z"
				fill="#676B74"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M55.2101 22.2766C59.8248 22.2766 63.5658 18.5357 63.5658 13.921C63.5658 9.30626 59.8248 5.56531 55.2101 5.56531C50.5954 5.56531 46.8545 9.30626 46.8545 13.921C46.8545 18.5357 50.5954 22.2766 55.2101 22.2766ZM55.829 13.3023V10.517C55.829 10.1882 55.5389 9.8981 55.2101 9.8981C54.8619 9.8981 54.5912 10.1882 54.5912 10.517V13.3023H51.8059C51.4578 13.3023 51.187 13.5924 51.187 13.9212C51.187 14.2694 51.4578 14.5401 51.8059 14.5401H54.5912V17.3254C54.5912 17.6735 54.8619 17.9443 55.2101 17.9443C55.5389 17.9443 55.829 17.6735 55.829 17.3254V14.5401H58.6143C58.9431 14.5401 59.2332 14.2694 59.2332 13.9212C59.2332 13.5924 58.9431 13.3023 58.6143 13.3023H55.829Z"
				fill="#5865F2"
			/>
		</svg>
	);
}

export function AppStoreBadge(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="133" height="44" viewBox="0 0 133 44" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect x="1.21692" y="0.5" width="131" height="43" rx="6.5" fill="black" />
			<rect x="1.21692" y="0.5" width="131" height="43" rx="6.5" stroke="white" />
			<path
				d="M90.3954 21.121V23.6411H88.8157V25.2938H90.3954V30.9093C90.3954 32.8268 91.2628 33.5938 93.4451 33.5938C93.8286 33.5938 94.1938 33.5481 94.5134 33.4933V31.8589C94.2395 31.8863 94.066 31.9046 93.7646 31.9046C92.7876 31.9046 92.3585 31.448 92.3585 30.4071V25.2938H94.5134V23.6411H92.3585V21.121H90.3954Z"
				fill="white"
			/>
			<path
				d="M100.073 33.7307C102.976 33.7307 104.757 31.7859 104.757 28.5627C104.757 25.3577 102.967 23.4037 100.073 23.4037C97.169 23.4037 95.3794 25.3577 95.3794 28.5627C95.3794 31.7859 97.1599 33.7307 100.073 33.7307ZM100.073 31.9867C98.3651 31.9867 97.4064 30.7358 97.4064 28.5627C97.4064 26.4078 98.3651 25.1477 100.073 25.1477C101.771 25.1477 102.739 26.4078 102.739 28.5627C102.739 30.7267 101.771 31.9867 100.073 31.9867Z"
				fill="white"
			/>
			<path
				d="M106.28 33.539H108.243V27.6678C108.243 26.2708 109.293 25.3303 110.782 25.3303C111.129 25.3303 111.713 25.3943 111.877 25.449V23.5133C111.667 23.4585 111.293 23.4311 111.001 23.4311C109.704 23.4311 108.599 24.1433 108.316 25.1203H108.17V23.5955H106.28V33.539Z"
				fill="white"
			/>
			<path
				d="M116.752 25.0747C118.204 25.0747 119.153 26.0882 119.199 27.6496H114.177C114.286 26.0973 115.3 25.0747 116.752 25.0747ZM119.19 30.8545C118.824 31.6306 118.012 32.0598 116.825 32.0598C115.254 32.0598 114.241 30.955 114.177 29.211V29.1014H121.198V28.4166C121.198 25.2938 119.528 23.4037 116.761 23.4037C113.958 23.4037 112.177 25.4217 112.177 28.5992C112.177 31.7767 113.921 33.7307 116.77 33.7307C119.044 33.7307 120.632 32.635 121.08 30.8545H119.19Z"
				fill="white"
			/>
			<path
				d="M77.5214 29.867C77.6728 32.3087 79.7076 33.8702 82.736 33.8702C85.9727 33.8702 87.9979 32.233 87.9979 29.6209C87.9979 27.5673 86.8433 26.4316 84.042 25.7786L82.5373 25.4095C80.7581 24.9931 80.0388 24.4347 80.0388 23.46C80.0388 22.2297 81.1555 21.4252 82.8307 21.4252C84.4206 21.4252 85.5184 22.2107 85.7171 23.4694H87.7803C87.6572 21.1697 85.632 19.5514 82.859 19.5514C79.8779 19.5514 77.8905 21.1697 77.8905 23.6019C77.8905 25.6083 79.0167 26.8007 81.4868 27.378L83.2471 27.8039C85.0547 28.2298 85.8496 28.8544 85.8496 29.8954C85.8496 31.1068 84.6004 31.9869 82.8969 31.9869C81.0704 31.9869 79.8022 31.1636 79.6224 29.867H77.5214Z"
				fill="white"
			/>
			<path
				d="M57.1854 23.4311C55.834 23.4311 54.6652 24.1068 54.0626 25.239H53.9165V23.5955H52.0264V36.8444H53.9895V32.0324H54.1448C54.6652 33.0824 55.7883 33.7033 57.2036 33.7033C59.7146 33.7033 61.3125 31.7219 61.3125 28.5627C61.3125 25.4034 59.7146 23.4311 57.1854 23.4311ZM56.6284 31.9411C54.9848 31.9411 53.953 30.6445 53.953 28.5718C53.953 26.49 54.9848 25.1934 56.6375 25.1934C58.2993 25.1934 59.2946 26.4626 59.2946 28.5627C59.2946 30.6719 58.2993 31.9411 56.6284 31.9411Z"
				fill="white"
			/>
			<path
				d="M68.1818 23.4311C66.8305 23.4311 65.6617 24.1068 65.0591 25.239H64.913V23.5955H63.0229V36.8444H64.986V32.0324H65.1413C65.6617 33.0824 66.7848 33.7033 68.2001 33.7033C70.7111 33.7033 72.309 31.7219 72.309 28.5627C72.309 25.4034 70.7111 23.4311 68.1818 23.4311ZM67.6248 31.9411C65.9813 31.9411 64.9495 30.6445 64.9495 28.5718C64.9495 26.49 65.9813 25.1934 67.634 25.1934C69.2958 25.1934 70.2911 26.4626 70.2911 28.5627C70.2911 30.6719 69.2958 31.9411 67.6248 31.9411Z"
				fill="white"
			/>
			<path
				d="M48.5042 33.539H50.7566L45.8259 19.8826H43.5451L38.6145 33.539H40.7912L42.0499 29.9143H47.255L48.5042 33.539ZM44.5767 22.3622H44.7376L46.7155 28.1351H42.5893L44.5767 22.3622Z"
				fill="white"
			/>
			<path
				d="M39.9332 9.58208V16.17H42.3118C44.2749 16.17 45.4117 14.9602 45.4117 12.8555C45.4117 10.7828 44.2658 9.58208 42.3118 9.58208H39.9332ZM40.9558 10.5134H42.1976C43.5627 10.5134 44.3708 11.3809 44.3708 12.8692C44.3708 14.3803 43.5764 15.2386 42.1976 15.2386H40.9558V10.5134Z"
				fill="white"
			/>
			<path
				d="M48.8933 16.2659C50.3451 16.2659 51.2354 15.2934 51.2354 13.6818C51.2354 12.0794 50.3405 11.1024 48.8933 11.1024C47.4415 11.1024 46.5467 12.0794 46.5467 13.6818C46.5467 15.2934 47.4369 16.2659 48.8933 16.2659ZM48.8933 15.3939C48.0396 15.3939 47.5602 14.7684 47.5602 13.6818C47.5602 12.6044 48.0396 11.9744 48.8933 11.9744C49.7425 11.9744 50.2264 12.6044 50.2264 13.6818C50.2264 14.7638 49.7425 15.3939 48.8933 15.3939Z"
				fill="white"
			/>
			<path
				d="M58.8167 11.1982H57.8351L56.9495 14.9921H56.8718L55.8492 11.1982H54.9087L53.886 14.9921H53.813L52.9227 11.1982H51.9275L53.2971 16.17H54.3061L55.3287 12.5085H55.4063L56.4336 16.17H57.4517L58.8167 11.1982Z"
				fill="white"
			/>
			<path
				d="M59.9471 16.17H60.9287V13.2618C60.9287 12.4857 61.3898 12.0018 62.1157 12.0018C62.8416 12.0018 63.1886 12.3989 63.1886 13.1979V16.17H64.1701V12.9514C64.1701 11.7689 63.5584 11.1024 62.449 11.1024C61.7002 11.1024 61.2072 11.4356 60.9652 11.9881H60.8922V11.1982H59.9471V16.17Z"
				fill="white"
			/>
			<path d="M65.716 16.17H66.6976V9.25793H65.716V16.17Z" fill="white" />
			<path
				d="M70.3892 16.2659C71.841 16.2659 72.7312 15.2934 72.7312 13.6818C72.7312 12.0794 71.8364 11.1024 70.3892 11.1024C68.9374 11.1024 68.0425 12.0794 68.0425 13.6818C68.0425 15.2934 68.9328 16.2659 70.3892 16.2659ZM70.3892 15.3939C69.5354 15.3939 69.0561 14.7684 69.0561 13.6818C69.0561 12.6044 69.5354 11.9744 70.3892 11.9744C71.2383 11.9744 71.7223 12.6044 71.7223 13.6818C71.7223 14.7638 71.2383 15.3939 70.3892 15.3939Z"
				fill="white"
			/>
			<path
				d="M75.6558 15.4258C75.1217 15.4258 74.7336 15.1656 74.7336 14.7182C74.7336 14.2799 75.0441 14.0471 75.7289 14.0014L76.9433 13.9238V14.3393C76.9433 14.9556 76.3954 15.4258 75.6558 15.4258ZM75.4047 16.2522C76.0576 16.2522 76.6009 15.9691 76.8976 15.4715H76.9753V16.17H77.9203V12.7733C77.9203 11.7233 77.2172 11.1024 75.9709 11.1024C74.8432 11.1024 74.0397 11.6502 73.9392 12.504H74.8889C74.9984 12.1524 75.3774 11.9515 75.9252 11.9515C76.5963 11.9515 76.9433 12.2483 76.9433 12.7733V13.2025L75.5965 13.2801C74.414 13.3531 73.7475 13.869 73.7475 14.7638C73.7475 15.6724 74.446 16.2522 75.4047 16.2522Z"
				fill="white"
			/>
			<path
				d="M81.2512 16.2522C81.9361 16.2522 82.5159 15.928 82.8126 15.3847H82.8902V16.17H83.8307V9.25793H82.8491V11.9881H82.7761C82.5067 11.4402 81.9315 11.1161 81.2512 11.1161C79.9957 11.1161 79.1877 12.1113 79.1877 13.6818C79.1877 15.2569 79.9866 16.2522 81.2512 16.2522ZM81.5297 11.9972C82.3515 11.9972 82.8674 12.65 82.8674 13.6864C82.8674 14.7273 82.3561 15.371 81.5297 15.371C80.6988 15.371 80.2012 14.7364 80.2012 13.6818C80.2012 12.6364 80.7034 11.9972 81.5297 11.9972Z"
				fill="white"
			/>
			<path
				d="M90.1958 16.2659C91.6476 16.2659 92.5379 15.2934 92.5379 13.6818C92.5379 12.0794 91.6431 11.1024 90.1958 11.1024C88.744 11.1024 87.8492 12.0794 87.8492 13.6818C87.8492 15.2934 88.7395 16.2659 90.1958 16.2659ZM90.1958 15.3939C89.3421 15.3939 88.8627 14.7684 88.8627 13.6818C88.8627 12.6044 89.3421 11.9744 90.1958 11.9744C91.045 11.9744 91.5289 12.6044 91.5289 13.6818C91.5289 14.7638 91.045 15.3939 90.1958 15.3939Z"
				fill="white"
			/>
			<path
				d="M93.8372 16.17H94.8188V13.2618C94.8188 12.4857 95.2799 12.0018 96.0058 12.0018C96.7317 12.0018 97.0787 12.3989 97.0787 13.1979V16.17H98.0602V12.9514C98.0602 11.7689 97.4485 11.1024 96.3391 11.1024C95.5903 11.1024 95.0973 11.4356 94.8553 11.9881H94.7823V11.1982H93.8372V16.17Z"
				fill="white"
			/>
			<path
				d="M102.581 9.96101V11.2211H101.791V12.0474H102.581V14.8552C102.581 15.8139 103.015 16.1974 104.106 16.1974C104.298 16.1974 104.48 16.1746 104.64 16.1472V15.33C104.503 15.3437 104.416 15.3528 104.266 15.3528C103.777 15.3528 103.562 15.1245 103.562 14.6041V12.0474H104.64V11.2211H103.562V9.96101H102.581Z"
				fill="white"
			/>
			<path
				d="M105.958 16.17H106.939V13.2664C106.939 12.5131 107.386 12.0063 108.19 12.0063C108.884 12.0063 109.254 12.4081 109.254 13.2025V16.17H110.235V12.9605C110.235 11.7781 109.582 11.1069 108.523 11.1069C107.775 11.1069 107.25 11.4402 107.008 11.9972H106.93V9.25793H105.958V16.17Z"
				fill="white"
			/>
			<path
				d="M113.776 11.9378C114.502 11.9378 114.977 12.4446 115 13.2253H112.489C112.544 12.4492 113.05 11.9378 113.776 11.9378ZM114.995 14.8278C114.813 15.2158 114.406 15.4304 113.813 15.4304C113.028 15.4304 112.521 14.878 112.489 14.006V13.9512H116V13.6088C116 12.0474 115.164 11.1024 113.781 11.1024C112.379 11.1024 111.489 12.1113 111.489 13.7001C111.489 15.2889 112.361 16.2659 113.785 16.2659C114.922 16.2659 115.717 15.718 115.94 14.8278H114.995Z"
				fill="white"
			/>
			<path
				d="M27.9628 22.3309C27.9866 20.4818 28.9797 18.7322 30.555 17.7637C29.5612 16.3443 27.8966 15.4444 26.1647 15.3902C24.3176 15.1963 22.5268 16.4955 21.5856 16.4955C20.6261 16.4955 19.1768 15.4095 17.6162 15.4416C15.582 15.5073 13.6857 16.6638 12.696 18.4422C10.5686 22.1255 12.1554 27.5386 14.1933 30.5159C15.2129 31.9738 16.4045 33.6023 17.9637 33.5445C19.4895 33.4813 20.0593 32.5716 21.901 32.5716C23.7257 32.5716 24.2603 33.5445 25.8511 33.5078C27.4884 33.4813 28.5199 32.0435 29.5037 30.5718C30.2363 29.533 30.8 28.3849 31.174 27.17C29.2499 26.3562 27.9651 24.42 27.9628 22.3309Z"
				fill="white"
			/>
			<path
				d="M24.958 13.4322C25.8507 12.3606 26.2904 10.9832 26.1839 9.59253C24.8201 9.73577 23.5603 10.3876 22.6556 11.4181C21.7709 12.425 21.3105 13.7781 21.3975 15.1156C22.7618 15.1297 24.1031 14.4955 24.958 13.4322Z"
				fill="white"
			/>
		</svg>
	);
}

export function GooglePlayBadge(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="150" height="44" viewBox="0 0 150 44" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect x="1.21692" y="0.5" width="147.5" height="43" rx="4.5" fill="black" />
			<rect x="1.21692" y="0.5" width="147.5" height="43" rx="4.5" stroke="white" />
			<path
				d="M75.6665 23.9262C73.0793 23.9262 70.9706 25.8941 70.9706 28.6045C70.9706 31.2984 73.0793 33.2828 75.6665 33.2828C78.2548 33.2828 80.3635 31.2984 80.3635 28.6045C80.3624 25.8941 78.2537 23.9262 75.6665 23.9262ZM75.6665 31.4414C74.2486 31.4414 73.0265 30.2721 73.0265 28.6056C73.0265 26.9215 74.2497 25.7698 75.6665 25.7698C77.0844 25.7698 78.3065 26.9215 78.3065 28.6056C78.3065 30.271 77.0844 31.4414 75.6665 31.4414ZM65.4211 23.9262C62.8339 23.9262 60.7252 25.8941 60.7252 28.6045C60.7252 31.2984 62.8339 33.2828 65.4211 33.2828C68.0094 33.2828 70.1181 31.2984 70.1181 28.6045C70.1181 25.8941 68.0094 23.9262 65.4211 23.9262ZM65.4211 31.4414C64.0032 31.4414 62.7811 30.2721 62.7811 28.6056C62.7811 26.9215 64.0043 25.7698 65.4211 25.7698C66.839 25.7698 68.0611 26.9215 68.0611 28.6056C68.0622 30.271 66.839 31.4414 65.4211 31.4414ZM53.2353 25.3628V27.3472H57.9851C57.8432 28.4637 57.4714 29.2788 56.9038 29.8453C56.213 30.5361 55.1317 31.2984 53.2353 31.2984C50.3115 31.2984 48.0257 28.9411 48.0257 26.0173C48.0257 23.0935 50.3115 20.7362 53.2353 20.7362C54.8127 20.7362 55.9644 21.3566 56.8147 22.1541L58.215 20.7538C57.027 19.6197 55.4507 18.7518 53.2353 18.7518C49.2302 18.7518 45.8631 22.0122 45.8631 26.0173C45.8631 30.0224 49.2302 33.2828 53.2353 33.2828C55.3968 33.2828 57.0281 32.5733 58.303 31.2445C59.6142 29.9333 60.0223 28.0897 60.0223 26.6014C60.0223 26.1416 59.9871 25.7159 59.9156 25.3617H53.2353V25.3628ZM103.074 26.9039C102.685 25.8589 101.497 23.9262 99.069 23.9262C96.6589 23.9262 94.6558 25.8226 94.6558 28.6045C94.6558 31.2269 96.6413 33.2828 99.2989 33.2828C101.443 33.2828 102.684 31.9716 103.198 31.2093L101.603 30.1456C101.072 30.9255 100.345 31.4392 99.2989 31.4392C98.2539 31.4392 97.5092 30.9607 97.0307 30.0213L103.286 27.4341L103.074 26.9039ZM96.6941 28.4637C96.6413 26.6553 98.0944 25.7346 99.1405 25.7346C99.9556 25.7346 100.646 26.1427 100.877 26.7268L96.6941 28.4637ZM91.6088 33.0001H93.6636V19.249H91.6088V33.0001ZM88.2406 24.9723H88.1702C87.7093 24.4223 86.8227 23.9262 85.7073 23.9262C83.3676 23.9262 81.2237 25.9821 81.2237 28.6232C81.2237 31.2456 83.3676 33.2839 85.7073 33.2839C86.8238 33.2839 87.7093 32.7878 88.1702 32.2213H88.2406V32.8945C88.2406 34.6842 87.2836 35.6412 85.7425 35.6412C84.4841 35.6412 83.7042 34.7381 83.3852 33.9758L81.5955 34.7205C82.1092 35.9602 83.4732 37.4848 85.7425 37.4848C88.1526 37.4848 90.1909 36.0669 90.1909 32.6107V24.2111H88.2417V24.9723H88.2406ZM85.8844 31.4414C84.4665 31.4414 83.2796 30.2534 83.2796 28.6232C83.2796 26.9743 84.4665 25.7698 85.8844 25.7698C87.2836 25.7698 88.3825 26.9743 88.3825 28.6232C88.3825 30.2534 87.2836 31.4414 85.8844 31.4414ZM112.704 19.249H107.785V33.0001H109.837V27.7905H112.702C114.977 27.7905 117.215 26.1438 117.215 23.5203C117.215 20.8968 114.978 19.249 112.704 19.249ZM112.756 25.8765H109.837V21.163H112.756C114.291 21.163 115.162 22.4335 115.162 23.5203C115.162 24.5851 114.291 25.8765 112.756 25.8765ZM125.442 23.902C123.955 23.902 122.417 24.5565 121.78 26.0074L123.601 26.7675C123.991 26.0074 124.717 25.7588 125.477 25.7588C126.538 25.7588 127.617 26.3957 127.635 27.5276V27.6695C127.263 27.4572 126.467 27.1393 125.494 27.1393C123.531 27.1393 121.531 28.2184 121.531 30.2347C121.531 32.075 123.141 33.2597 124.945 33.2597C126.325 33.2597 127.086 32.6404 127.563 31.9144H127.634V32.9759H129.616V27.7036C129.617 25.2638 127.793 23.902 125.442 23.902ZM125.193 31.4381C124.522 31.4381 123.584 31.1015 123.584 30.2699C123.584 29.2084 124.752 28.8014 125.761 28.8014C126.661 28.8014 127.087 28.9961 127.635 29.2612C127.475 30.5361 126.379 31.4381 125.193 31.4381ZM136.834 24.2023L134.481 30.1643H134.411L131.969 24.2023H129.758L133.42 32.5348L131.332 37.1702H133.473L139.117 24.2023H136.834ZM118.348 33.0001H120.399V19.249H118.348V33.0001Z"
				fill="white"
			/>
			<path
				d="M52.8768 11.2673C52.8768 12.1891 52.604 12.9228 52.0573 13.4706C51.4369 14.1218 50.6273 14.4474 49.6329 14.4474C48.6803 14.4474 47.8696 14.1174 47.2041 13.4574C46.5375 12.7963 46.2042 11.9779 46.2042 11.0011C46.2042 10.0232 46.5375 9.20476 47.2041 8.54476C47.8696 7.88366 48.6803 7.55366 49.6329 7.55366C50.1059 7.55366 50.558 7.64606 50.987 7.82976C51.4171 8.01456 51.7614 8.25986 52.0188 8.56676L51.4391 9.14756C51.0024 8.62506 50.4007 8.36436 49.6318 8.36436C48.9366 8.36436 48.336 8.60856 47.8289 9.09696C47.3218 9.58536 47.0688 10.2201 47.0688 11C47.0688 11.7799 47.3218 12.4146 47.8289 12.903C48.336 13.3914 48.9366 13.6356 49.6318 13.6356C50.3688 13.6356 50.9837 13.3903 51.4754 12.8986C51.7944 12.5785 51.9792 12.133 52.0287 11.5621H49.6318V10.769H52.8295C52.8625 10.9417 52.8768 11.1078 52.8768 11.2673Z"
				fill="white"
			/>
			<path d="M57.9479 8.51072H54.9427V10.6029H57.6531V11.396H54.9427V13.4882H57.9479V14.3H54.0946V7.70002H57.9479V8.51072Z" fill="white" />
			<path d="M61.5239 14.3H60.6758V8.51072H58.8322V7.70002H63.3675V8.51072H61.5239V14.3Z" fill="white" />
			<path d="M66.6487 14.3V7.70002H67.4968V14.3H66.6487Z" fill="white" />
			<path d="M71.2579 14.3H70.4098V8.51072H68.5662V7.70002H73.1015V8.51072H71.2579V14.3Z" fill="white" />
			<path
				d="M81.6867 13.4475C81.0377 14.1141 80.2314 14.4474 79.2667 14.4474C78.302 14.4474 77.4957 14.1141 76.8478 13.4475C76.1988 12.7809 75.8754 11.9647 75.8754 11C75.8754 10.0353 76.1988 9.21911 76.8478 8.55251C77.4957 7.88591 78.302 7.55151 79.2667 7.55151C80.2259 7.55151 81.0311 7.88701 81.6823 8.55691C82.3335 9.22681 82.6591 10.0408 82.6591 11C82.6591 11.9647 82.3346 12.7809 81.6867 13.4475ZM77.4737 12.8942C77.9621 13.3892 78.5594 13.6356 79.2667 13.6356C79.974 13.6356 80.5724 13.3881 81.0597 12.8942C81.5481 12.3992 81.7934 11.7678 81.7934 11C81.7934 10.2322 81.5481 9.60081 81.0597 9.10581C80.5724 8.61081 79.974 8.36441 79.2667 8.36441C78.5594 8.36441 77.9621 8.61191 77.4737 9.10581C76.9864 9.60081 76.7411 10.2322 76.7411 11C76.7411 11.7678 76.9864 12.3992 77.4737 12.8942Z"
				fill="white"
			/>
			<path
				d="M83.8494 14.3V7.70002H84.8812L88.0888 12.8337H88.1251L88.0888 11.5621V7.70002H88.9369V14.3H88.0514L84.6953 8.91663H84.659L84.6953 10.1882V14.3H83.8494Z"
				fill="white"
			/>
			<path
				d="M52.8768 11.2673C52.8768 12.1891 52.604 12.9228 52.0573 13.4706C51.4369 14.1218 50.6273 14.4474 49.6329 14.4474C48.6803 14.4474 47.8696 14.1174 47.2041 13.4574C46.5375 12.7963 46.2042 11.9779 46.2042 11.0011C46.2042 10.0232 46.5375 9.20476 47.2041 8.54476C47.8696 7.88366 48.6803 7.55366 49.6329 7.55366C50.1059 7.55366 50.558 7.64606 50.987 7.82976C51.4171 8.01456 51.7614 8.25986 52.0188 8.56676L51.4391 9.14756C51.0024 8.62506 50.4007 8.36436 49.6318 8.36436C48.9366 8.36436 48.336 8.60856 47.8289 9.09696C47.3218 9.58536 47.0688 10.2201 47.0688 11C47.0688 11.7799 47.3218 12.4146 47.8289 12.903C48.336 13.3914 48.9366 13.6356 49.6318 13.6356C50.3688 13.6356 50.9837 13.3903 51.4754 12.8986C51.7944 12.5785 51.9792 12.133 52.0287 11.5621H49.6318V10.769H52.8295C52.8625 10.9417 52.8768 11.1078 52.8768 11.2673Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<path
				d="M57.9479 8.51072H54.9427V10.6029H57.6531V11.396H54.9427V13.4882H57.9479V14.3H54.0946V7.70002H57.9479V8.51072Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<path
				d="M61.5239 14.3H60.6758V8.51072H58.8322V7.70002H63.3675V8.51072H61.5239V14.3Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<path d="M66.6487 14.3V7.70002H67.4968V14.3H66.6487Z" stroke="white" strokeWidth="0.2" strokeMiterlimit="10" />
			<path
				d="M71.2579 14.3H70.4098V8.51072H68.5662V7.70002H73.1015V8.51072H71.2579V14.3Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<path
				d="M81.6867 13.4475C81.0377 14.1141 80.2314 14.4474 79.2667 14.4474C78.302 14.4474 77.4957 14.1141 76.8478 13.4475C76.1988 12.7809 75.8754 11.9647 75.8754 11C75.8754 10.0353 76.1988 9.21911 76.8478 8.55251C77.4957 7.88591 78.302 7.55151 79.2667 7.55151C80.2259 7.55151 81.0311 7.88701 81.6823 8.55691C82.3335 9.22681 82.6591 10.0408 82.6591 11C82.6591 11.9647 82.3346 12.7809 81.6867 13.4475ZM77.4737 12.8942C77.9621 13.3892 78.5594 13.6356 79.2667 13.6356C79.974 13.6356 80.5724 13.3881 81.0597 12.8942C81.5481 12.3992 81.7934 11.7678 81.7934 11C81.7934 10.2322 81.5481 9.60081 81.0597 9.10581C80.5724 8.61081 79.974 8.36441 79.2667 8.36441C78.5594 8.36441 77.9621 8.61191 77.4737 9.10581C76.9864 9.60081 76.7411 10.2322 76.7411 11C76.7411 11.7678 76.9864 12.3992 77.4737 12.8942Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<path
				d="M83.8494 14.3V7.70002H84.8812L88.0888 12.8337H88.1251L88.0888 11.5621V7.70002H88.9369V14.3H88.0514L84.6953 8.91663H84.659L84.6953 10.1882V14.3H83.8494Z"
				stroke="white"
				strokeWidth="0.2"
				strokeMiterlimit="10"
			/>
			<g filter="url(#filter0_ii_74_2311)">
				<path
					d="M12.1965 8.29173C11.8764 8.63053 11.6872 9.15633 11.6872 9.83723V34.1648C11.6872 34.8468 11.8764 35.3715 12.1965 35.7103L12.2779 35.7895L25.9058 22.1616V22.001V21.8404L12.2779 8.21143L12.1965 8.29173Z"
					fill="url(#paint0_linear_74_2311)"
				/>
				<path
					d="M30.4477 26.7058L25.9058 22.1617V22.0011V21.8405L30.4488 17.2975L30.5511 17.3558L35.9334 20.4138C37.4701 21.2872 37.4701 22.7161 35.9334 23.5906L30.5511 26.6486L30.4477 26.7058Z"
					fill="url(#paint1_linear_74_2311)"
				/>
				<g filter="url(#filter1_i_74_2311)">
					<path
						d="M30.5511 26.6475L25.9047 22.0011L12.1965 35.7104C12.7025 36.2472 13.5396 36.3132 14.4823 35.7786L30.5511 26.6475Z"
						fill="url(#paint2_linear_74_2311)"
					/>
				</g>
				<path
					d="M30.5511 17.3547L14.4823 8.22466C13.5396 7.68896 12.7025 7.75606 12.1965 8.29286L25.9058 22.0022L30.5511 17.3547Z"
					fill="url(#paint3_linear_74_2311)"
				/>
			</g>
			<defs>
				<filter
					id="filter0_ii_74_2311"
					x="11.6872"
					y="7.85498"
					width="25.3987"
					height="28.2928"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="-0.15" />
					<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
					<feBlend mode="normal" in2="shape" result="effect1_innerShadow_74_2311" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="0.15" />
					<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
					<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0" />
					<feBlend mode="normal" in2="effect1_innerShadow_74_2311" result="effect2_innerShadow_74_2311" />
				</filter>
				<filter
					id="filter1_i_74_2311"
					x="12.1965"
					y="22.0011"
					width="18.3546"
					height="14.1467"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="-0.15" />
					<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
					<feBlend mode="normal" in2="shape" result="effect1_innerShadow_74_2311" />
				</filter>
				<linearGradient id="paint0_linear_74_2311" x1="24.6978" y1="9.57983" x2="6.23762" y2="28.04" gradientUnits="userSpaceOnUse">
					<stop stopColor="#00A0FF" />
					<stop offset="0.0066" stopColor="#00A1FF" />
					<stop offset="0.2601" stopColor="#00BEFF" />
					<stop offset="0.5122" stopColor="#00D2FF" />
					<stop offset="0.7604" stopColor="#00DFFF" />
					<stop offset="1" stopColor="#00E3FF" />
				</linearGradient>
				<linearGradient id="paint1_linear_74_2311" x1="37.9338" y1="22.0011" x2="11.3183" y2="22.0011" gradientUnits="userSpaceOnUse">
					<stop stopColor="#FFE000" />
					<stop offset="0.4087" stopColor="#FFBD00" />
					<stop offset="0.7754" stopColor="#FFA500" />
					<stop offset="1" stopColor="#FF9C00" />
				</linearGradient>
				<linearGradient id="paint2_linear_74_2311" x1="28.0278" y1="24.5244" x2="2.9935" y2="49.5587" gradientUnits="userSpaceOnUse">
					<stop stopColor="#FF3A44" />
					<stop offset="1" stopColor="#C31162" />
				</linearGradient>
				<linearGradient id="paint3_linear_74_2311" x1="8.74407" y1="0.194443" x2="19.9226" y2="11.373" gradientUnits="userSpaceOnUse">
					<stop stopColor="#32A071" />
					<stop offset="0.0685" stopColor="#2DA771" />
					<stop offset="0.4762" stopColor="#15CF74" />
					<stop offset="0.8009" stopColor="#06E775" />
					<stop offset="1" stopColor="#00F076" />
				</linearGradient>
			</defs>
		</svg>
	);
}

export function MessageSquareIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M6.66666 5.33332C6.31303 5.33332 5.9739 5.4738 5.72385 5.72385C5.4738 5.9739 5.33332 6.31303 5.33332 6.66666V24.781L8.39051 21.7238C8.64056 21.4738 8.9797 21.3333 9.33332 21.3333H25.3333C25.6869 21.3333 26.0261 21.1928 26.2761 20.9428C26.5262 20.6927 26.6667 20.3536 26.6667 20V6.66666C26.6667 6.31304 26.5262 5.9739 26.2761 5.72385C26.0261 5.4738 25.6869 5.33332 25.3333 5.33332H6.66666ZM3.83823 3.83823C4.58837 3.08808 5.60579 2.66666 6.66666 2.66666H25.3333C26.3942 2.66666 27.4116 3.08808 28.1618 3.83823C28.9119 4.58837 29.3333 5.60579 29.3333 6.66666V20C29.3333 21.0609 28.9119 22.0783 28.1618 22.8284C27.4116 23.5786 26.3942 24 25.3333 24H9.88561L4.9428 28.9428C4.56147 29.3241 3.98798 29.4382 3.48975 29.2318C2.99151 29.0255 2.66666 28.5393 2.66666 28V6.66666C2.66666 5.60579 3.08808 4.58837 3.83823 3.83823Z"
				fill="#92B8FF"
			/>
		</svg>
	);
}

export function VoiceIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12.2288 1.5621C13.229 0.561903 14.5855 0 16 0C17.4145 0 18.7711 0.561903 19.7712 1.5621C20.7714 2.56229 21.3333 3.91885 21.3333 5.33333V16C21.3333 17.4145 20.7714 18.771 19.7712 19.7712C18.7711 20.7714 17.4145 21.3333 16 21.3333C14.5855 21.3333 13.229 20.7714 12.2288 19.7712C11.2286 18.771 10.6667 17.4145 10.6667 16V5.33333C10.6667 3.91885 11.2286 2.56229 12.2288 1.5621ZM16 2.66667C15.2928 2.66667 14.6145 2.94762 14.1144 3.44772C13.6143 3.94781 13.3333 4.62609 13.3333 5.33333V16C13.3333 16.7072 13.6143 17.3855 14.1144 17.8856C14.6145 18.3857 15.2928 18.6667 16 18.6667C16.7073 18.6667 17.3855 18.3857 17.8856 17.8856C18.3857 17.3855 18.6667 16.7072 18.6667 16V5.33333C18.6667 4.62609 18.3857 3.94781 17.8856 3.44772C17.3855 2.94762 16.7073 2.66667 16 2.66667Z"
				fill="#92B8FF"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M6.66668 12C7.40306 12 8.00001 12.597 8.00001 13.3333V16C8.00001 18.1217 8.84286 20.1566 10.3432 21.6569C11.8434 23.1571 13.8783 24 16 24C18.1217 24 20.1566 23.1571 21.6569 21.6569C23.1572 20.1566 24 18.1217 24 16V13.3333C24 12.597 24.597 12 25.3333 12C26.0697 12 26.6667 12.597 26.6667 13.3333V16C26.6667 18.829 25.5429 21.5421 23.5425 23.5425C21.5421 25.5429 18.829 26.6667 16 26.6667C13.171 26.6667 10.4579 25.5429 8.45754 23.5425C6.45715 21.5421 5.33334 18.829 5.33334 16V13.3333C5.33334 12.597 5.9303 12 6.66668 12Z"
				fill="#92B8FF"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M16 24C16.7364 24 17.3333 24.597 17.3333 25.3333V30.6667C17.3333 31.403 16.7364 32 16 32C15.2636 32 14.6667 31.403 14.6667 30.6667V25.3333C14.6667 24.597 15.2636 24 16 24Z"
				fill="#92B8FF"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.33334 30.6667C9.33334 29.9303 9.9303 29.3333 10.6667 29.3333H21.3333C22.0697 29.3333 22.6667 29.9303 22.6667 30.6667C22.6667 31.403 22.0697 32 21.3333 32H10.6667C9.9303 32 9.33334 31.403 9.33334 30.6667Z"
				fill="#92B8FF"
			/>
		</svg>
	);
}

export const ReloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			width="30"
			height="30"
			viewBox="0 0 24 24"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="none"
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					<g id="Reload">
						<rect id="Rectangle" fillRule="nonzero" x="0" y="0" width="24" height="24"></rect>
						<path
							d="M4,13 C4,17.4183 7.58172,21 12,21 C16.4183,21 20,17.4183 20,13 C20,8.58172 16.4183,5 12,5 C10.4407,5 8.98566,5.44609 7.75543,6.21762"
							id="Path"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						></path>
						<path
							d="M9.2384,1.89795 L7.49856,5.83917 C7.27552,6.34441 7.50429,6.9348 8.00954,7.15784 L11.9508,8.89768"
							id="Path"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						></path>
					</g>
				</g>
			</g>
		</svg>
	);
};

export function MacAppStoreDesktop(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="222" height="44" viewBox="0 0 222 44" fill="none" {...props}>
			<rect x="0.458333" y="0.458333" width="220.433" height="43.0833" rx="4.125" fill="black" />
			<rect x="0.458333" y="0.458333" width="220.433" height="43.0833" rx="4.125" stroke="white" strokeWidth="0.916667" />
			<path
				d="M30.9327 22.9328C30.9472 21.8084 31.2459 20.706 31.8009 19.7281C32.3559 18.7502 33.1493 17.9286 34.1071 17.3397C33.4986 16.4707 32.6959 15.7555 31.7626 15.2509C30.8293 14.7464 29.7912 14.4664 28.7308 14.4332C26.4688 14.1958 24.2759 15.7868 23.1232 15.7868C21.9482 15.7868 20.1735 14.4568 18.2624 14.4961C17.0262 14.536 15.8215 14.8955 14.7656 15.5395C13.7096 16.1834 12.8385 17.09 12.2371 18.1707C9.63193 22.6812 11.5752 29.3101 14.0707 32.956C15.3193 34.7413 16.7785 36.7356 18.6879 36.6649C20.5564 36.5874 21.2542 35.4734 23.5096 35.4734C25.744 35.4734 26.3987 36.6649 28.3468 36.6199C30.3517 36.5874 31.6149 34.8266 32.8197 33.0244C33.7168 31.7523 34.4071 30.3464 34.8651 28.8587C33.7003 28.366 32.7063 27.5414 32.007 26.4876C31.3077 25.4338 30.9341 24.1975 30.9327 22.9328Z"
				fill="white"
			/>
			<path
				d="M27.2532 12.0354C28.3463 10.7231 28.8849 9.03636 28.7545 7.33337C27.0844 7.50879 25.5416 8.30699 24.4337 9.56895C23.892 10.1855 23.4771 10.9027 23.2128 11.6796C22.9484 12.4565 22.8398 13.278 22.8931 14.0969C23.7284 14.1055 24.5548 13.9245 25.3101 13.5674C26.0653 13.2103 26.7297 12.6865 27.2532 12.0354Z"
				fill="white"
			/>
			<path
				d="M58.5106 33.16V22.4594H58.4397L54.0573 33.0491H52.3845L47.9906 22.4594H47.9208V33.16H45.8651V18.6211H48.4754L53.1803 30.0969H53.2603L57.9561 18.6211H60.5755V33.16L58.5106 33.16Z"
				fill="white"
			/>
			<path
				d="M62.3123 30.1474C62.3123 28.294 63.7323 27.1747 66.2522 27.0237L69.1541 26.8625V26.0564C69.1541 24.8776 68.3777 24.2122 67.0572 24.2122C66.5681 24.1471 66.072 24.2628 65.6622 24.5375C65.2523 24.8123 64.9568 25.2271 64.8311 25.7042H62.7959C62.8565 23.7891 64.6401 22.4297 67.1178 22.4297C69.6469 22.4297 71.3196 23.8097 71.3196 25.8952V33.1601H69.2341V31.4165H69.1838C68.8498 32.0077 68.3631 32.4983 67.7746 32.8371C67.1861 33.1758 66.5173 33.3501 65.8384 33.3419C65.3924 33.3855 64.9423 33.3354 64.5169 33.1948C64.0915 33.0541 63.7002 32.8261 63.3681 32.5253C63.036 32.2244 62.7706 31.8575 62.5887 31.448C62.4069 31.0385 62.3127 30.5954 62.3123 30.1474ZM69.1541 29.1904V28.374L66.5438 28.5353C65.2438 28.6164 64.5086 29.1801 64.5086 30.0868C64.5086 31.0141 65.2747 31.6189 66.4432 31.6189C66.7816 31.6418 67.1212 31.5968 67.442 31.4865C67.7627 31.3761 68.0581 31.2026 68.3108 30.9763C68.5634 30.75 68.7682 30.4754 68.913 30.1686C69.0579 29.8619 69.1398 29.5293 69.1541 29.1904H69.1541Z"
				fill="white"
			/>
			<path
				d="M80.4562 26.2073C80.361 25.6275 80.0513 25.1047 79.5885 24.7427C79.1256 24.3807 78.5436 24.206 77.9579 24.2533C76.2852 24.2533 75.1773 25.6539 75.1773 27.8606C75.1773 30.1176 76.2955 31.477 77.9774 31.477C78.5552 31.5349 79.1334 31.3702 79.594 31.0164C80.0546 30.6627 80.363 30.1466 80.4562 29.5733H82.5519C82.4215 30.6694 81.8684 31.6714 81.0104 32.3658C80.1524 33.0603 79.0572 33.3924 77.9579 33.2915C74.9349 33.2915 72.9603 31.2255 72.9603 27.8606C72.9603 24.5655 74.9349 22.4297 77.9374 22.4297C79.0447 22.3358 80.1448 22.6782 81.0033 23.3839C81.8617 24.0896 82.4104 25.1028 82.5325 26.2073H80.4562Z"
				fill="white"
			/>
			<path
				d="M96.6906 29.2303H91.1488L89.8179 33.16H87.4706L92.7198 18.6211H95.1585L100.408 33.16H98.0203L96.6906 29.2303ZM91.7228 27.4169H96.1156L93.9501 21.0393H93.8895L91.7228 27.4169Z"
				fill="white"
			/>
			<path
				d="M111.744 27.8606C111.744 31.1546 109.981 33.271 107.32 33.271C106.646 33.3062 105.976 33.151 105.386 32.823C104.796 32.495 104.311 32.0075 103.985 31.4164H103.935V36.6667H101.759V22.56H103.865V24.3231H103.905C104.246 23.7348 104.74 23.2498 105.334 22.9199C105.928 22.5899 106.601 22.4272 107.28 22.4491C109.971 22.4491 111.744 24.5757 111.744 27.8606ZM109.508 27.8606C109.508 25.7145 108.399 24.3036 106.706 24.3036C105.044 24.3036 103.926 25.7443 103.926 27.8606C103.926 29.9964 105.044 31.4267 106.706 31.4267C108.399 31.4267 109.508 30.0261 109.508 27.8606Z"
				fill="white"
			/>
			<path
				d="M123.411 27.8606C123.411 31.1546 121.648 33.271 118.987 33.271C118.313 33.3062 117.643 33.151 117.053 32.823C116.463 32.495 115.978 32.0075 115.652 31.4164H115.602V36.6667H113.426V22.56H115.532V24.3231H115.572C115.913 23.7348 116.406 23.2498 117.001 22.9199C117.595 22.5899 118.268 22.4272 118.947 22.4491C121.637 22.4491 123.411 24.5757 123.411 27.8606ZM121.174 27.8606C121.174 25.7145 120.065 24.3036 118.373 24.3036C116.711 24.3036 115.593 25.7443 115.593 27.8606C115.593 29.9964 116.711 31.4267 118.373 31.4267C120.065 31.4267 121.174 30.0261 121.174 27.8606H121.174Z"
				fill="white"
			/>
			<path
				d="M131.122 29.1092C131.283 30.551 132.683 31.4976 134.597 31.4976C136.431 31.4976 137.751 30.551 137.751 29.2509C137.751 28.1225 136.955 27.4468 135.071 26.9837L133.186 26.5298C130.517 25.8849 129.277 24.6364 129.277 22.6103C129.277 20.1018 131.463 18.3788 134.568 18.3788C137.64 18.3788 139.746 20.1018 139.817 22.6103H137.62C137.489 21.1594 136.29 20.2836 134.537 20.2836C132.784 20.2836 131.585 21.1697 131.585 22.4594C131.585 23.4873 132.351 24.0921 134.225 24.5551L135.826 24.9485C138.809 25.6539 140.049 26.8522 140.049 28.9788C140.049 31.6988 137.882 33.4024 134.436 33.4024C131.212 33.4024 129.035 31.7388 128.894 29.1091L131.122 29.1092Z"
				fill="white"
			/>
			<path
				d="M144.745 20.0515V22.56H146.76V24.2831H144.745V30.1268C144.745 31.0346 145.148 31.4576 146.034 31.4576C146.274 31.4534 146.513 31.4366 146.75 31.4073V33.12C146.352 33.1945 145.947 33.2282 145.542 33.2206C143.396 33.2206 142.559 32.4146 142.559 30.3588V24.2831H141.017V22.56H142.559V20.0515H144.745Z"
				fill="white"
			/>
			<path
				d="M147.927 27.8606C147.927 24.5255 149.891 22.4297 152.954 22.4297C156.027 22.4297 157.982 24.5254 157.982 27.8606C157.982 31.2049 156.038 33.2915 152.954 33.2915C149.871 33.2915 147.927 31.2049 147.927 27.8606ZM155.765 27.8606C155.765 25.5728 154.717 24.2225 152.954 24.2225C151.191 24.2225 150.142 25.5831 150.142 27.8606C150.142 30.1576 151.191 31.4976 152.954 31.4976C154.717 31.4976 155.765 30.1576 155.765 27.8606H155.765Z"
				fill="white"
			/>
			<path
				d="M159.777 22.56H161.853V24.3642H161.903C162.043 23.8007 162.373 23.3028 162.838 22.954C163.302 22.6052 163.872 22.427 164.453 22.4491C164.703 22.4482 164.953 22.4755 165.198 22.5303V24.5655C164.882 24.4687 164.551 24.4243 164.221 24.434C163.904 24.4212 163.589 24.4769 163.297 24.5973C163.004 24.7178 162.741 24.9001 162.526 25.1318C162.311 25.3635 162.148 25.6391 162.049 25.9396C161.95 26.2401 161.917 26.5584 161.953 26.8727V33.1601H159.777V22.56Z"
				fill="white"
			/>
			<path
				d="M175.229 30.0467C174.936 31.971 173.062 33.2915 170.664 33.2915C167.581 33.2915 165.667 31.2255 165.667 27.9109C165.667 24.5861 167.591 22.4297 170.573 22.4297C173.506 22.4297 175.35 24.4443 175.35 27.6582V28.4037H167.863V28.5352C167.829 28.9253 167.878 29.3183 168.007 29.6881C168.136 30.0579 168.342 30.396 168.611 30.6799C168.881 30.9639 169.208 31.1873 169.571 31.3351C169.933 31.483 170.323 31.552 170.715 31.5376C171.229 31.5858 171.745 31.4667 172.186 31.1981C172.627 30.9295 172.97 30.5257 173.163 30.0467L175.229 30.0467ZM167.874 26.883H173.173C173.193 26.5323 173.139 26.1813 173.017 25.852C172.894 25.5228 172.705 25.2224 172.461 24.9698C172.217 24.7172 171.923 24.5178 171.598 24.3841C171.273 24.2503 170.924 24.1852 170.573 24.1927C170.219 24.1906 169.867 24.2587 169.54 24.393C169.212 24.5274 168.914 24.7253 168.663 24.9754C168.412 25.2256 168.213 25.5229 168.077 25.8503C167.942 26.1777 167.873 26.5287 167.874 26.8831L167.874 26.883Z"
				fill="white"
			/>
			<path
				d="M48.7663 7.67773C49.2225 7.64499 49.6802 7.71391 50.1065 7.87949C50.5328 8.04508 50.917 8.30322 51.2315 8.63529C51.5459 8.96735 51.7828 9.36507 51.9249 9.79975C52.0671 10.2344 52.111 10.6952 52.0534 11.1489C52.0534 13.3808 50.8472 14.6637 48.7663 14.6637H46.2429V7.67773H48.7663ZM47.328 13.6757H48.6451C48.9711 13.6952 49.2973 13.6417 49.5999 13.5193C49.9026 13.3968 50.1742 13.2083 50.3949 12.9677C50.6156 12.727 50.7798 12.4401 50.8757 12.128C50.9715 11.8158 50.9966 11.4862 50.949 11.1632C50.9931 10.8414 50.9655 10.5139 50.8682 10.204C50.7709 9.89412 50.6063 9.60961 50.3861 9.37085C50.1659 9.13209 49.8956 8.94499 49.5946 8.82295C49.2936 8.70091 48.9694 8.64696 48.6451 8.66495H47.328V13.6757Z"
				fill="white"
			/>
			<path
				d="M53.2792 12.0253C53.246 11.6789 53.2856 11.3293 53.3955 10.9991C53.5054 10.6688 53.6831 10.3652 53.9171 10.1076C54.1512 9.85008 54.4366 9.64429 54.7549 9.50348C55.0731 9.36266 55.4173 9.28992 55.7654 9.28992C56.1134 9.28992 56.4576 9.36266 56.7759 9.50348C57.0942 9.64429 57.3795 9.85008 57.6136 10.1076C57.8477 10.3652 58.0254 10.6688 58.1352 10.9991C58.2451 11.3293 58.2847 11.6789 58.2516 12.0253C58.2854 12.3722 58.2462 12.7222 58.1366 13.053C58.0271 13.3838 57.8495 13.6879 57.6153 13.946C57.3812 14.2041 57.0956 14.4103 56.777 14.5514C56.4584 14.6925 56.1138 14.7654 55.7654 14.7654C55.4169 14.7654 55.0723 14.6925 54.7537 14.5514C54.4351 14.4103 54.1496 14.2041 53.9154 13.946C53.6813 13.6879 53.5037 13.3838 53.3941 13.053C53.2845 12.7222 53.2454 12.3722 53.2792 12.0253ZM57.1814 12.0253C57.1814 10.8826 56.668 10.2143 55.7671 10.2143C54.8627 10.2143 54.3539 10.8826 54.3539 12.0253C54.3539 13.1773 54.8627 13.8404 55.7671 13.8404C56.6681 13.8404 57.1814 13.1727 57.1814 12.0253H57.1814Z"
				fill="white"
			/>
			<path
				d="M64.8613 14.6636H63.782L62.6924 10.7808H62.61L61.525 14.6636H60.4559L59.0027 9.3916H60.0581L61.0025 13.4145H61.0802L62.1641 9.3916H63.1623L64.2462 13.4145H64.3285L65.2683 9.3916H66.3088L64.8613 14.6636Z"
				fill="white"
			/>
			<path
				d="M67.5311 9.39162H68.5326V10.2291H68.6104C68.7423 9.92833 68.9647 9.67617 69.2468 9.5078C69.5288 9.33944 69.8563 9.26325 70.1837 9.28986C70.4402 9.27057 70.6977 9.30925 70.9373 9.40303C71.1768 9.4968 71.3922 9.64327 71.5675 9.83159C71.7427 10.0199 71.8733 10.2452 71.9497 10.4909C72.026 10.7365 72.0461 10.9962 72.0084 11.2507V14.6636H70.968V11.512C70.968 10.6648 70.5998 10.2434 69.8304 10.2434C69.6562 10.2353 69.4823 10.265 69.3207 10.3303C69.1591 10.3957 69.0135 10.4952 68.8939 10.6221C68.7743 10.749 68.6836 10.9003 68.628 11.0655C68.5723 11.2307 68.5531 11.4061 68.5715 11.5794V14.6636H67.5311L67.5311 9.39162Z"
				fill="white"
			/>
			<path d="M73.6663 7.33362H74.7067V14.6637H73.6663V7.33362Z" fill="white" />
			<path
				d="M76.1531 12.0253C76.12 11.6789 76.1596 11.3293 76.2695 10.9991C76.3793 10.6688 76.557 10.3652 76.7911 10.1076C77.0252 9.85008 77.3105 9.64429 77.6288 9.50348C77.9471 9.36266 78.2913 9.28992 78.6393 9.28992C78.9874 9.28992 79.3316 9.36266 79.6499 9.50348C79.9681 9.64429 80.2535 9.85008 80.4876 10.1076C80.7217 10.3652 80.8993 10.6688 81.0092 10.9991C81.1191 11.3293 81.1587 11.6789 81.1256 12.0253C81.1593 12.3722 81.1202 12.7222 81.0106 13.053C80.901 13.3838 80.7235 13.6879 80.4893 13.946C80.2552 14.2041 79.9696 14.4103 79.651 14.5514C79.3324 14.6925 78.9878 14.7654 78.6393 14.7654C78.2909 14.7654 77.9463 14.6925 77.6277 14.5514C77.3091 14.4103 77.0235 14.2041 76.7894 13.946C76.5552 13.6879 76.3777 13.3838 76.2681 13.053C76.1585 12.7222 76.1193 12.3722 76.1531 12.0253ZM80.0554 12.0253C80.0554 10.8826 79.542 10.2143 78.6411 10.2143C77.7367 10.2143 77.2279 10.8826 77.2279 12.0253C77.2279 13.1773 77.7367 13.8404 78.6411 13.8404C79.542 13.8404 80.0554 13.1727 80.0554 12.0253H80.0554Z"
				fill="white"
			/>
			<path
				d="M82.2209 13.1727C82.2209 12.2238 82.9275 11.6767 84.1817 11.5989L85.6098 11.5166V11.0615C85.6098 10.5047 85.2416 10.1903 84.5305 10.1903C83.9496 10.1903 83.5472 10.4035 83.4317 10.7763H82.4244C82.5307 9.87074 83.3825 9.28992 84.5785 9.28992C85.9002 9.28992 86.6457 9.9479 86.6457 11.0615V14.6637H85.6441V13.9228H85.5618C85.3947 14.1885 85.16 14.4052 84.8818 14.5506C84.6036 14.6961 84.2918 14.765 83.9782 14.7505C83.7569 14.7736 83.5332 14.7499 83.3216 14.6812C83.1099 14.6125 82.9151 14.5002 82.7495 14.3515C82.5839 14.2029 82.4513 14.0212 82.3603 13.8181C82.2692 13.6151 82.2218 13.3953 82.2209 13.1727ZM85.6098 12.7223V12.2815L84.3224 12.3638C83.5963 12.4124 83.267 12.6594 83.267 13.1241C83.267 13.5986 83.6786 13.8747 84.2447 13.8747C84.4105 13.8915 84.578 13.8748 84.7372 13.8255C84.8965 13.7762 85.0442 13.6954 85.1715 13.5879C85.2989 13.4804 85.4033 13.3483 85.4786 13.1996C85.5539 13.0509 85.5985 12.8886 85.6098 12.7223Z"
				fill="white"
			/>
			<path
				d="M88.0131 12.0254C88.0131 10.3595 88.8694 9.30421 90.2014 9.30421C90.5309 9.28902 90.8579 9.36794 91.1442 9.53173C91.4305 9.69552 91.6642 9.93741 91.8181 10.2291H91.8959V7.33362H92.9363V14.6637H91.9393V13.8307H91.857C91.6912 14.1205 91.4493 14.3594 91.1575 14.5215C90.8657 14.6836 90.5351 14.7628 90.2015 14.7505C88.8603 14.7506 88.0131 13.6953 88.0131 12.0254ZM89.0879 12.0254C89.0879 13.1436 89.6149 13.8165 90.4965 13.8165C91.3734 13.8165 91.9154 13.1339 91.9154 12.03C91.9154 10.9312 91.3677 10.2389 90.4965 10.2389C89.6206 10.2389 89.0878 10.9163 89.0878 12.0254H89.0879Z"
				fill="white"
			/>
			<path
				d="M97.2411 12.0254C97.208 11.679 97.2476 11.3294 97.3575 10.9991C97.4674 10.6689 97.6451 10.3652 97.8793 10.1076C98.1134 9.85009 98.3987 9.6443 98.717 9.50348C99.0353 9.36266 99.3795 9.28992 99.7276 9.28992C100.076 9.28992 100.42 9.36266 100.738 9.50348C101.057 9.6443 101.342 9.85009 101.576 10.1076C101.81 10.3652 101.988 10.6689 102.098 10.9991C102.208 11.3294 102.247 11.679 102.214 12.0254C102.248 12.3723 102.209 12.7223 102.099 13.0531C101.989 13.3839 101.812 13.6881 101.578 13.9461C101.343 14.2042 101.058 14.4104 100.739 14.5515C100.421 14.6926 100.076 14.7655 99.7276 14.7655C99.3791 14.7655 99.0345 14.6926 98.7159 14.5515C98.3973 14.4104 98.1117 14.2042 97.8776 13.9461C97.6434 13.6881 97.4658 13.3839 97.3562 13.0531C97.2466 12.7223 97.2074 12.3723 97.2411 12.0254ZM101.143 12.0254C101.143 10.8827 100.63 10.2144 99.729 10.2144C98.8246 10.2144 98.3159 10.8827 98.3159 12.0254C98.3159 13.1774 98.8247 13.8405 99.729 13.8405C100.63 13.8405 101.143 13.1728 101.143 12.0254H101.143Z"
				fill="white"
			/>
			<path
				d="M103.61 9.39162H104.612V10.2291H104.689C104.821 9.92833 105.044 9.67617 105.326 9.5078C105.608 9.33944 105.935 9.26325 106.263 9.28986C106.519 9.27057 106.777 9.30925 107.016 9.40303C107.256 9.4968 107.471 9.64327 107.646 9.83159C107.822 10.0199 107.952 10.2452 108.029 10.4909C108.105 10.7365 108.125 10.9962 108.087 11.2507V14.6636H107.047V11.512C107.047 10.6648 106.679 10.2434 105.909 10.2434C105.735 10.2353 105.561 10.265 105.4 10.3303C105.238 10.3957 105.093 10.4952 104.973 10.6221C104.853 10.749 104.763 10.9003 104.707 11.0655C104.651 11.2307 104.632 11.4061 104.651 11.5794V14.6636H103.61V9.39162Z"
				fill="white"
			/>
			<path
				d="M113.967 8.0791V9.41568H115.109V10.2921H113.967V13.003C113.967 13.5552 114.194 13.797 114.712 13.797C114.845 13.7966 114.977 13.7886 115.109 13.773V14.6397C114.922 14.6731 114.733 14.6909 114.543 14.6928C113.386 14.6928 112.925 14.2858 112.925 13.2694V10.292H112.088V9.41563H112.925V8.0791H113.967Z"
				fill="white"
			/>
			<path
				d="M116.53 7.33362H117.561V10.2389H117.644C117.782 9.93528 118.011 9.68169 118.298 9.51269C118.586 9.34369 118.919 9.26749 119.251 9.29448C119.506 9.28059 119.762 9.32319 119.998 9.41925C120.235 9.5153 120.448 9.66244 120.621 9.85016C120.795 10.0379 120.925 10.2616 121.002 10.5053C121.079 10.7489 121.101 11.0066 121.067 11.2599V14.6637H120.025V11.5166C120.025 10.6745 119.633 10.248 118.898 10.248C118.719 10.2334 118.539 10.2579 118.371 10.3201C118.203 10.3822 118.05 10.4803 117.923 10.6076C117.797 10.7349 117.7 10.8883 117.639 11.0571C117.578 11.2258 117.555 11.4059 117.571 11.5846V14.6636H116.53L116.53 7.33362Z"
				fill="white"
			/>
			<path
				d="M127.134 13.2402C126.992 13.722 126.686 14.1388 126.268 14.4176C125.851 14.6964 125.348 14.8195 124.849 14.7654C124.502 14.7746 124.157 14.708 123.838 14.5704C123.519 14.4328 123.233 14.2275 123.002 13.9685C122.77 13.7096 122.597 13.4034 122.496 13.0711C122.394 12.7388 122.366 12.3884 122.414 12.0442C122.368 11.699 122.396 11.3478 122.497 11.0145C122.599 10.6812 122.77 10.3736 123.001 10.1124C123.231 9.85124 123.515 9.64263 123.833 9.50073C124.151 9.35882 124.496 9.28691 124.845 9.28988C126.311 9.28988 127.196 10.2921 127.196 11.9476V12.3106H123.474V12.3689C123.457 12.5624 123.482 12.7572 123.545 12.9407C123.608 13.1242 123.709 13.2924 123.842 13.4346C123.974 13.5768 124.134 13.6899 124.313 13.7664C124.491 13.843 124.684 13.8814 124.878 13.8793C125.127 13.9091 125.379 13.8643 125.602 13.7505C125.825 13.6367 126.01 13.4591 126.132 13.2401L127.134 13.2402ZM123.474 11.5411H126.137C126.15 11.3642 126.126 11.1865 126.066 11.0194C126.006 10.8523 125.912 10.6995 125.79 10.5709C125.668 10.4423 125.52 10.3407 125.356 10.2725C125.192 10.2044 125.016 10.1713 124.839 10.1754C124.659 10.1732 124.48 10.2069 124.314 10.2748C124.147 10.3426 123.995 10.4431 123.868 10.5704C123.741 10.6977 123.641 10.8492 123.573 11.0159C123.505 11.1826 123.471 11.3612 123.474 11.5411H123.474Z"
				fill="white"
			/>
			<path d="M192.35 19L198.35 25L204.35 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function MacAppleSilicon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="222" height="44" viewBox="0 0 222 44" fill="none" {...props}>
			<rect x="1.00033" y="0.458333" width="220.433" height="43.0833" rx="4.125" fill="black" />
			<rect x="1.00033" y="0.458333" width="220.433" height="43.0833" rx="4.125" stroke="white" strokeWidth="0.916667" />
			<path
				d="M49.0654 9.09203C49.5215 9.0593 49.9793 9.12821 50.4056 9.2938C50.8319 9.45939 51.2161 9.71753 51.5306 10.0496C51.845 10.3817 52.0819 10.7794 52.224 11.2141C52.3661 11.6487 52.41 12.1096 52.3525 12.5633C52.3525 14.7951 51.1463 16.078 49.0654 16.078H46.542V9.09203H49.0654ZM47.627 15.09H48.9442C49.2701 15.1095 49.5963 15.0561 49.899 14.9336C50.2017 14.8111 50.4733 14.6227 50.694 14.382C50.9147 14.1413 51.0789 13.8544 51.1748 13.5423C51.2706 13.2301 51.2956 12.9005 51.248 12.5775C51.2922 12.2557 51.2646 11.9282 51.1673 11.6183C51.07 11.3084 50.9053 11.0239 50.6851 10.7852C50.465 10.5464 50.1947 10.3593 49.8937 10.2373C49.5927 10.1152 49.2685 10.0613 48.9442 10.0793H47.627V15.09Z"
				fill="white"
			/>
			<path
				d="M53.5782 13.4396C53.545 13.0932 53.5847 12.7436 53.6945 12.4134C53.8044 12.0831 53.9821 11.7795 54.2162 11.5219C54.4502 11.2644 54.7356 11.0586 55.0539 10.9178C55.3722 10.777 55.7163 10.7042 56.0644 10.7042C56.4124 10.7042 56.7566 10.777 57.0749 10.9178C57.3932 11.0586 57.6785 11.2644 57.9126 11.5219C58.1467 11.7795 58.3244 12.0831 58.4343 12.4134C58.5441 12.7436 58.5838 13.0932 58.5506 13.4396C58.5844 13.7865 58.5452 14.1365 58.4356 14.4673C58.3261 14.7981 58.1485 15.1023 57.9144 15.3603C57.6802 15.6184 57.3946 15.8246 57.076 15.9657C56.7574 16.1068 56.4128 16.1797 56.0644 16.1797C55.7159 16.1797 55.3713 16.1068 55.0527 15.9657C54.7341 15.8246 54.4486 15.6184 54.2144 15.3603C53.9803 15.1023 53.8027 14.7981 53.6931 14.4673C53.5836 14.1365 53.5444 13.7865 53.5782 13.4396ZM57.4804 13.4396C57.4804 12.2969 56.9671 11.6286 56.0661 11.6286C55.1617 11.6286 54.653 12.2969 54.653 13.4397C54.653 14.5916 55.1617 15.2547 56.0661 15.2547C56.9671 15.2547 57.4804 14.587 57.4804 13.4396H57.4804Z"
				fill="white"
			/>
			<path
				d="M65.1603 16.0779H64.081L62.9914 12.1951H62.909L61.824 16.0779H60.755L59.3018 10.8059H60.3571L61.3015 14.8288H61.3792L62.4631 10.8059H63.4613L64.5452 14.8288H64.6275L65.5673 10.8059H66.6078L65.1603 16.0779Z"
				fill="white"
			/>
			<path
				d="M67.8301 10.8059H68.8317V11.6434H68.9094C69.0413 11.3426 69.2638 11.0905 69.5458 10.9221C69.8278 10.7537 70.1553 10.6776 70.4827 10.7042C70.7392 10.6849 70.9968 10.7236 71.2363 10.8173C71.4758 10.9111 71.6912 11.0576 71.8665 11.2459C72.0417 11.4342 72.1723 11.6595 72.2487 11.9052C72.325 12.1509 72.3451 12.4105 72.3075 12.665V16.0779H71.267V12.9263C71.267 12.0791 70.8988 11.6577 70.1294 11.6577C69.9552 11.6496 69.7813 11.6793 69.6197 11.7446C69.4581 11.81 69.3125 11.9095 69.1929 12.0364C69.0733 12.1633 68.9826 12.3146 68.927 12.4798C68.8713 12.645 68.8521 12.8204 68.8705 12.9937V16.0779H67.8301L67.8301 10.8059Z"
				fill="white"
			/>
			<path d="M73.9653 8.74792H75.0058V16.078H73.9653V8.74792Z" fill="white" />
			<path
				d="M76.4521 13.4396C76.4189 13.0932 76.4586 12.7436 76.5684 12.4134C76.6783 12.0831 76.856 11.7795 77.0901 11.5219C77.3242 11.2644 77.6095 11.0586 77.9278 10.9178C78.2461 10.777 78.5903 10.7042 78.9383 10.7042C79.2863 10.7042 79.6305 10.777 79.9488 10.9178C80.2671 11.0586 80.5524 11.2644 80.7865 11.5219C81.0206 11.7795 81.1983 12.0831 81.3082 12.4134C81.418 12.7436 81.4577 13.0932 81.4245 13.4396C81.4583 13.7865 81.4191 14.1365 81.3096 14.4673C81.2 14.7981 81.0224 15.1023 80.7883 15.3603C80.5541 15.6184 80.2686 15.8246 79.95 15.9657C79.6314 16.1068 79.2867 16.1797 78.9383 16.1797C78.5898 16.1797 78.2452 16.1068 77.9266 15.9657C77.608 15.8246 77.3225 15.6184 77.0883 15.3603C76.8542 15.1023 76.6766 14.7981 76.567 14.4673C76.4575 14.1365 76.4183 13.7865 76.4521 13.4396ZM80.3543 13.4396C80.3543 12.2969 79.841 11.6286 78.94 11.6286C78.0356 11.6286 77.5269 12.2969 77.5269 13.4397C77.5269 14.5916 78.0357 15.2547 78.94 15.2547C79.841 15.2547 80.3543 14.587 80.3543 13.4396H80.3543Z"
				fill="white"
			/>
			<path
				d="M82.5199 14.587C82.5199 13.6381 83.2265 13.091 84.4807 13.0132L85.9088 12.9309V12.4758C85.9088 11.919 85.5406 11.6046 84.8295 11.6046C84.2487 11.6046 83.8462 11.8178 83.7307 12.1906H82.7234C82.8297 11.285 83.6815 10.7042 84.8775 10.7042C86.1992 10.7042 86.9447 11.3622 86.9447 12.4758V16.078H85.9431V15.3371H85.8608C85.6937 15.6029 85.4591 15.8195 85.1808 15.9649C84.9026 16.1104 84.5908 16.1793 84.2772 16.1648C84.0559 16.1879 83.8322 16.1643 83.6206 16.0955C83.409 16.0268 83.2141 15.9145 83.0485 15.7658C82.8829 15.6172 82.7504 15.4355 82.6593 15.2325C82.5683 15.0294 82.5208 14.8096 82.5199 14.587ZM85.9088 14.1366V13.6958L84.6214 13.7781C83.8953 13.8267 83.5661 14.0737 83.5661 14.5384C83.5661 15.0129 83.9777 15.2891 84.5437 15.2891C84.7095 15.3058 84.877 15.2891 85.0363 15.2398C85.1955 15.1905 85.3432 15.1097 85.4706 15.0022C85.5979 14.8947 85.7023 14.7626 85.7776 14.6139C85.8529 14.4652 85.8975 14.3029 85.9088 14.1366Z"
				fill="white"
			/>
			<path
				d="M88.3121 13.4397C88.3121 11.7738 89.1685 10.7185 90.5005 10.7185C90.83 10.7033 91.157 10.7822 91.4433 10.946C91.7296 11.1098 91.9633 11.3517 92.1172 11.6434H92.195V8.74792H93.2354V16.078H92.2384V15.245H92.1561C91.9903 15.5348 91.7484 15.7737 91.4566 15.9358C91.1648 16.0979 90.8341 16.1771 90.5005 16.1648C89.1594 16.1649 88.3121 15.1096 88.3121 13.4397ZM89.3869 13.4397C89.3869 14.5579 89.914 15.2308 90.7955 15.2308C91.6725 15.2308 92.2144 14.5482 92.2144 13.4443C92.2144 12.3455 91.6668 11.6532 90.7955 11.6532C89.9197 11.6532 89.3869 12.3306 89.3869 13.4397H89.3869Z"
				fill="white"
			/>
			<path
				d="M97.5402 13.4397C97.5071 13.0933 97.5467 12.7437 97.6566 12.4134C97.7665 12.0832 97.9442 11.7795 98.1783 11.522C98.4124 11.2644 98.6978 11.0586 99.0161 10.9178C99.3344 10.777 99.6786 10.7042 100.027 10.7042C100.375 10.7042 100.719 10.777 101.037 10.9178C101.356 11.0586 101.641 11.2644 101.875 11.522C102.109 11.7795 102.287 12.0832 102.397 12.4134C102.507 12.7437 102.546 13.0933 102.513 13.4397C102.547 13.7866 102.508 14.1366 102.398 14.4674C102.289 14.7982 102.111 15.1024 101.877 15.3604C101.643 15.6185 101.357 15.8247 101.038 15.9658C100.72 16.1069 100.375 16.1798 100.027 16.1798C99.6782 16.1798 99.3336 16.1069 99.015 15.9658C98.6964 15.8247 98.4108 15.6185 98.1766 15.3604C97.9425 15.1024 97.7649 14.7982 97.6553 14.4674C97.5456 14.1366 97.5064 13.7866 97.5402 13.4397ZM101.442 13.4397C101.442 12.297 100.929 11.6287 100.028 11.6287C99.1237 11.6287 98.615 12.297 98.615 13.4398C98.615 14.5917 99.1238 15.2548 100.028 15.2548C100.929 15.2548 101.442 14.5871 101.442 13.4397H101.442Z"
				fill="white"
			/>
			<path
				d="M103.909 10.8059H104.911V11.6434H104.989C105.12 11.3426 105.343 11.0905 105.625 10.9221C105.907 10.7537 106.234 10.6776 106.562 10.7042C106.818 10.6849 107.076 10.7236 107.315 10.8173C107.555 10.9111 107.77 11.0576 107.946 11.2459C108.121 11.4342 108.251 11.6595 108.328 11.9052C108.404 12.1509 108.424 12.4105 108.387 12.665V16.0779H107.346V12.9263C107.346 12.0791 106.978 11.6577 106.208 11.6577C106.034 11.6496 105.86 11.6793 105.699 11.7446C105.537 11.81 105.392 11.9095 105.272 12.0364C105.152 12.1633 105.062 12.3146 105.006 12.4798C104.95 12.645 104.931 12.8204 104.95 12.9937V16.0779H103.909V10.8059Z"
				fill="white"
			/>
			<path
				d="M114.266 9.49341V10.83H115.408V11.7064H114.266V14.4173C114.266 14.9695 114.493 15.2113 115.011 15.2113C115.144 15.2109 115.276 15.2029 115.408 15.1873V16.054C115.221 16.0874 115.032 16.1052 114.842 16.1071C113.685 16.1071 113.224 15.7001 113.224 14.6837V11.7063H112.387V10.8299H113.224V9.49341H114.266Z"
				fill="white"
			/>
			<path
				d="M116.829 8.74792H117.86V11.6532H117.943C118.081 11.3496 118.31 11.096 118.597 10.927C118.885 10.758 119.218 10.6818 119.55 10.7088C119.805 10.6949 120.061 10.7375 120.297 10.8336C120.534 10.9296 120.747 11.0767 120.92 11.2645C121.094 11.4522 121.224 11.6759 121.301 11.9196C121.378 12.1632 121.4 12.4209 121.366 12.6742V16.078H120.324V12.9309C120.324 12.0888 119.932 11.6623 119.197 11.6623C119.018 11.6477 118.838 11.6722 118.67 11.7344C118.502 11.7965 118.349 11.8946 118.223 12.0219C118.096 12.1492 117.999 12.3026 117.938 12.4714C117.877 12.6401 117.854 12.8202 117.87 12.9989V16.078H116.829L116.829 8.74792Z"
				fill="white"
			/>
			<path
				d="M127.433 14.6545C127.291 15.1363 126.985 15.5531 126.567 15.8319C126.15 16.1107 125.647 16.2338 125.148 16.1797C124.801 16.1889 124.456 16.1223 124.137 15.9847C123.818 15.8471 123.532 15.6418 123.301 15.3829C123.069 15.1239 122.896 14.8177 122.795 14.4854C122.693 14.1531 122.665 13.8027 122.713 13.4585C122.667 13.1133 122.695 12.7621 122.796 12.4288C122.898 12.0955 123.069 11.7879 123.3 11.5267C123.53 11.2655 123.814 11.0569 124.132 10.915C124.45 10.7731 124.795 10.7012 125.144 10.7042C126.61 10.7042 127.495 11.7064 127.495 13.3619V13.7249H123.773V13.7833C123.756 13.9767 123.781 14.1715 123.844 14.355C123.907 14.5385 124.008 14.7068 124.141 14.849C124.273 14.9912 124.433 15.1042 124.612 15.1807C124.79 15.2573 124.983 15.2957 125.177 15.2936C125.426 15.3235 125.678 15.2786 125.901 15.1648C126.124 15.051 126.309 14.8734 126.431 14.6544L127.433 14.6545ZM123.773 12.9555H126.436C126.449 12.7785 126.425 12.6008 126.365 12.4337C126.305 12.2666 126.211 12.1138 126.089 11.9852C125.967 11.8566 125.819 11.755 125.655 11.6869C125.491 11.6187 125.315 11.5857 125.138 11.5897C124.958 11.5875 124.779 11.6212 124.613 11.6891C124.446 11.7569 124.294 11.8575 124.167 11.9847C124.04 12.112 123.94 12.2635 123.872 12.4302C123.804 12.5969 123.77 12.7755 123.773 12.9555H123.773Z"
				fill="white"
			/>
			<path
				d="M57.602 31.0721C57.602 33.7121 55.222 35.2521 52.162 35.2521C48.682 35.2521 46.542 33.5521 46.542 31.0121H48.862C48.862 32.3721 49.982 33.3121 52.182 33.3121C53.902 33.3121 55.242 32.4921 55.242 31.1121C55.242 29.8721 54.482 29.3321 52.982 29.0521L50.682 28.6121C48.162 28.1521 46.842 26.7721 46.842 24.7121C46.842 22.3121 48.882 20.6121 52.082 20.6121C54.962 20.6121 57.362 21.9321 57.362 24.8121H55.102C55.102 23.2721 53.882 22.4921 52.022 22.4921C50.382 22.4921 49.182 23.2521 49.182 24.5521C49.182 25.7121 49.902 26.2921 51.482 26.5921L53.782 27.0121C56.382 27.4921 57.602 28.9121 57.602 31.0721Z"
				fill="white"
			/>
			<path d="M59.5434 22.8921V20.6121H61.9634V22.8921H59.5434ZM59.6634 35.0521V24.8121H61.8434V35.0521H59.6634Z" fill="white" />
			<path d="M66.6481 20.1921V35.0521H64.4681V20.1921H66.6481Z" fill="white" />
			<path d="M69.1528 22.8921V20.6121H71.5728V22.8921H69.1528ZM69.2728 35.0521V24.8121H71.4528V35.0521H69.2728Z" fill="white" />
			<path
				d="M81.3575 28.4921C80.9975 27.2121 80.0175 26.4921 78.8175 26.4921C77.1175 26.4921 75.9575 27.7321 75.9575 29.9121C75.9575 32.2121 77.1575 33.3321 78.7575 33.3321C80.0375 33.3321 80.9775 32.6121 81.3975 31.2521H83.7175C83.1975 33.7321 81.3175 35.2521 78.7975 35.2521C75.7575 35.2521 73.7175 33.1321 73.7175 29.9121C73.7175 26.7121 75.7575 24.5921 78.8175 24.5921C81.3175 24.5921 83.1775 26.0121 83.7175 28.4921H81.3575Z"
				fill="white"
			/>
			<path
				d="M85.2214 29.9321C85.2214 26.7721 87.3814 24.5921 90.4814 24.5921C93.6014 24.5921 95.7614 26.7721 95.7614 29.9321C95.7614 33.0921 93.6014 35.2521 90.4814 35.2521C87.3814 35.2521 85.2214 33.0921 85.2214 29.9321ZM87.4614 29.9121C87.4614 32.0121 88.6614 33.3721 90.4814 33.3721C92.3214 33.3721 93.5214 32.0121 93.5214 29.9121C93.5214 27.7921 92.3214 26.4521 90.4814 26.4521C88.6614 26.4521 87.4614 27.7921 87.4614 29.9121Z"
				fill="white"
			/>
			<path
				d="M103.383 24.6121C105.963 24.6121 107.483 26.3121 107.483 28.9321V35.0521H105.283V29.3921C105.283 27.4721 104.303 26.5321 102.803 26.5321C101.103 26.5321 100.183 27.7321 100.183 29.5521V35.0521H98.0032V24.8121H99.9832L100.143 26.1921C100.723 25.2121 101.823 24.6121 103.383 24.6121Z"
				fill="white"
			/>
			<path d="M119.504 32.3521L123.864 20.8121H126.264L120.664 35.0521H118.244L112.664 20.8121H115.124L119.504 32.3521Z" fill="white" />
			<path
				d="M136.123 29.7121V30.5321H128.283C128.323 32.4521 129.583 33.4521 131.183 33.4521C132.383 33.4521 133.383 32.8921 133.803 31.7721H136.023C135.483 33.8521 133.643 35.2521 131.143 35.2521C128.083 35.2521 126.063 33.1321 126.063 29.9121C126.063 26.7121 128.083 24.5921 131.123 24.5921C134.103 24.5921 136.123 26.6321 136.123 29.7121ZM131.123 26.3321C129.663 26.3321 128.463 27.2321 128.303 29.0121H133.903C133.783 27.2321 132.603 26.3321 131.123 26.3321Z"
				fill="white"
			/>
			<path
				d="M143.055 24.8121H144.395V26.7721H142.935C141.235 26.7721 140.575 27.8521 140.575 29.5921V35.0521H138.375V24.8121H140.375L140.635 26.1321C141.015 25.4121 141.875 24.8121 143.055 24.8121Z"
				fill="white"
			/>
			<path
				d="M145.332 31.9521H147.512C147.532 33.0121 148.512 33.6321 149.852 33.6321C151.192 33.6321 151.992 33.1321 151.992 32.2321C151.992 31.4521 151.592 31.0321 150.432 30.8521L148.372 30.4921C146.372 30.1521 145.592 29.1121 145.592 27.6521C145.592 25.8121 147.412 24.6121 149.732 24.6121C152.232 24.6121 154.052 25.8121 154.072 27.8521H151.912C151.892 26.8121 150.992 26.2321 149.732 26.2321C148.532 26.2321 147.772 26.7321 147.772 27.5721C147.772 28.3121 148.292 28.6521 149.432 28.8521L151.452 29.2121C153.352 29.5521 154.232 30.4921 154.232 32.0321C154.232 34.1521 152.272 35.2521 149.892 35.2521C147.192 35.2521 145.372 33.9521 145.332 31.9521Z"
				fill="white"
			/>
			<path d="M156.184 22.8921V20.6121H158.604V22.8921H156.184ZM156.304 35.0521V24.8121H158.484V35.0521H156.304Z" fill="white" />
			<path
				d="M160.749 29.9321C160.749 26.7721 162.909 24.5921 166.009 24.5921C169.129 24.5921 171.289 26.7721 171.289 29.9321C171.289 33.0921 169.129 35.2521 166.009 35.2521C162.909 35.2521 160.749 33.0921 160.749 29.9321ZM162.989 29.9121C162.989 32.0121 164.189 33.3721 166.009 33.3721C167.849 33.3721 169.049 32.0121 169.049 29.9121C169.049 27.7921 167.849 26.4521 166.009 26.4521C164.189 26.4521 162.989 27.7921 162.989 29.9121Z"
				fill="white"
			/>
			<path
				d="M178.911 24.6121C181.491 24.6121 183.011 26.3121 183.011 28.9321V35.0521H180.811V29.3921C180.811 27.4721 179.831 26.5321 178.331 26.5321C176.631 26.5321 175.711 27.7321 175.711 29.5521V35.0521H173.531V24.8121H175.511L175.671 26.1921C176.251 25.2121 177.351 24.6121 178.911 24.6121Z"
				fill="white"
			/>
		</svg>
	);
}

export function MacAppleIntel(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="222" height="44" viewBox="0 0 222 44" fill="none" {...props}>
			<rect x="1.00033" y="0.458333" width="220.433" height="43.0833" rx="4.125" fill="black" />
			<rect x="1.00033" y="0.458333" width="220.433" height="43.0833" rx="4.125" stroke="white" strokeWidth="0.916667" />
			<path
				d="M49.0654 9.09203C49.5215 9.0593 49.9793 9.12821 50.4056 9.2938C50.8319 9.45939 51.2161 9.71753 51.5306 10.0496C51.845 10.3817 52.0819 10.7794 52.224 11.2141C52.3661 11.6487 52.41 12.1096 52.3525 12.5633C52.3525 14.7951 51.1463 16.078 49.0654 16.078H46.542V9.09203H49.0654ZM47.627 15.09H48.9442C49.2701 15.1095 49.5963 15.0561 49.899 14.9336C50.2017 14.8111 50.4733 14.6227 50.694 14.382C50.9147 14.1413 51.0789 13.8544 51.1748 13.5423C51.2706 13.2301 51.2956 12.9005 51.248 12.5775C51.2922 12.2557 51.2646 11.9282 51.1673 11.6183C51.07 11.3084 50.9053 11.0239 50.6851 10.7852C50.465 10.5464 50.1947 10.3593 49.8937 10.2373C49.5927 10.1152 49.2685 10.0613 48.9442 10.0793H47.627V15.09Z"
				fill="white"
			/>
			<path
				d="M53.5782 13.4396C53.545 13.0932 53.5847 12.7436 53.6945 12.4134C53.8044 12.0831 53.9821 11.7795 54.2162 11.5219C54.4502 11.2644 54.7356 11.0586 55.0539 10.9178C55.3722 10.777 55.7163 10.7042 56.0644 10.7042C56.4124 10.7042 56.7566 10.777 57.0749 10.9178C57.3932 11.0586 57.6785 11.2644 57.9126 11.5219C58.1467 11.7795 58.3244 12.0831 58.4343 12.4134C58.5441 12.7436 58.5838 13.0932 58.5506 13.4396C58.5844 13.7865 58.5452 14.1365 58.4356 14.4673C58.3261 14.7981 58.1485 15.1023 57.9144 15.3603C57.6802 15.6184 57.3946 15.8246 57.076 15.9657C56.7574 16.1068 56.4128 16.1797 56.0644 16.1797C55.7159 16.1797 55.3713 16.1068 55.0527 15.9657C54.7341 15.8246 54.4486 15.6184 54.2144 15.3603C53.9803 15.1023 53.8027 14.7981 53.6931 14.4673C53.5836 14.1365 53.5444 13.7865 53.5782 13.4396ZM57.4804 13.4396C57.4804 12.2969 56.9671 11.6286 56.0661 11.6286C55.1617 11.6286 54.653 12.2969 54.653 13.4397C54.653 14.5916 55.1617 15.2547 56.0661 15.2547C56.9671 15.2547 57.4804 14.587 57.4804 13.4396H57.4804Z"
				fill="white"
			/>
			<path
				d="M65.1603 16.0779H64.081L62.9914 12.1951H62.909L61.824 16.0779H60.755L59.3018 10.8059H60.3571L61.3015 14.8288H61.3792L62.4631 10.8059H63.4613L64.5452 14.8288H64.6275L65.5673 10.8059H66.6078L65.1603 16.0779Z"
				fill="white"
			/>
			<path
				d="M67.8301 10.8059H68.8317V11.6434H68.9094C69.0413 11.3426 69.2638 11.0905 69.5458 10.9221C69.8278 10.7537 70.1553 10.6776 70.4827 10.7042C70.7392 10.6849 70.9968 10.7236 71.2363 10.8173C71.4758 10.9111 71.6912 11.0576 71.8665 11.2459C72.0417 11.4342 72.1723 11.6595 72.2487 11.9052C72.325 12.1509 72.3451 12.4105 72.3075 12.665V16.0779H71.267V12.9263C71.267 12.0791 70.8988 11.6577 70.1294 11.6577C69.9552 11.6496 69.7813 11.6793 69.6197 11.7446C69.4581 11.81 69.3125 11.9095 69.1929 12.0364C69.0733 12.1633 68.9826 12.3146 68.927 12.4798C68.8713 12.645 68.8521 12.8204 68.8705 12.9937V16.0779H67.8301L67.8301 10.8059Z"
				fill="white"
			/>
			<path d="M73.9653 8.74792H75.0058V16.078H73.9653V8.74792Z" fill="white" />
			<path
				d="M76.4521 13.4396C76.4189 13.0932 76.4586 12.7436 76.5684 12.4134C76.6783 12.0831 76.856 11.7795 77.0901 11.5219C77.3242 11.2644 77.6095 11.0586 77.9278 10.9178C78.2461 10.777 78.5903 10.7042 78.9383 10.7042C79.2863 10.7042 79.6305 10.777 79.9488 10.9178C80.2671 11.0586 80.5524 11.2644 80.7865 11.5219C81.0206 11.7795 81.1983 12.0831 81.3082 12.4134C81.418 12.7436 81.4577 13.0932 81.4245 13.4396C81.4583 13.7865 81.4191 14.1365 81.3096 14.4673C81.2 14.7981 81.0224 15.1023 80.7883 15.3603C80.5541 15.6184 80.2686 15.8246 79.95 15.9657C79.6314 16.1068 79.2867 16.1797 78.9383 16.1797C78.5898 16.1797 78.2452 16.1068 77.9266 15.9657C77.608 15.8246 77.3225 15.6184 77.0883 15.3603C76.8542 15.1023 76.6766 14.7981 76.567 14.4673C76.4575 14.1365 76.4183 13.7865 76.4521 13.4396ZM80.3543 13.4396C80.3543 12.2969 79.841 11.6286 78.94 11.6286C78.0356 11.6286 77.5269 12.2969 77.5269 13.4397C77.5269 14.5916 78.0357 15.2547 78.94 15.2547C79.841 15.2547 80.3543 14.587 80.3543 13.4396H80.3543Z"
				fill="white"
			/>
			<path
				d="M82.5199 14.587C82.5199 13.6381 83.2265 13.091 84.4807 13.0132L85.9088 12.9309V12.4758C85.9088 11.919 85.5406 11.6046 84.8295 11.6046C84.2487 11.6046 83.8462 11.8178 83.7307 12.1906H82.7234C82.8297 11.285 83.6815 10.7042 84.8775 10.7042C86.1992 10.7042 86.9447 11.3622 86.9447 12.4758V16.078H85.9431V15.3371H85.8608C85.6937 15.6029 85.4591 15.8195 85.1808 15.9649C84.9026 16.1104 84.5908 16.1793 84.2772 16.1648C84.0559 16.1879 83.8322 16.1643 83.6206 16.0955C83.409 16.0268 83.2141 15.9145 83.0485 15.7658C82.8829 15.6172 82.7504 15.4355 82.6593 15.2325C82.5683 15.0294 82.5208 14.8096 82.5199 14.587ZM85.9088 14.1366V13.6958L84.6214 13.7781C83.8953 13.8267 83.5661 14.0737 83.5661 14.5384C83.5661 15.0129 83.9777 15.2891 84.5437 15.2891C84.7095 15.3058 84.877 15.2891 85.0363 15.2398C85.1955 15.1905 85.3432 15.1097 85.4706 15.0022C85.5979 14.8947 85.7023 14.7626 85.7776 14.6139C85.8529 14.4652 85.8975 14.3029 85.9088 14.1366Z"
				fill="white"
			/>
			<path
				d="M88.3121 13.4397C88.3121 11.7738 89.1685 10.7185 90.5005 10.7185C90.83 10.7033 91.157 10.7822 91.4433 10.946C91.7296 11.1098 91.9633 11.3517 92.1172 11.6434H92.195V8.74792H93.2354V16.078H92.2384V15.245H92.1561C91.9903 15.5348 91.7484 15.7737 91.4566 15.9358C91.1648 16.0979 90.8341 16.1771 90.5005 16.1648C89.1594 16.1649 88.3121 15.1096 88.3121 13.4397ZM89.3869 13.4397C89.3869 14.5579 89.914 15.2308 90.7955 15.2308C91.6725 15.2308 92.2144 14.5482 92.2144 13.4443C92.2144 12.3455 91.6668 11.6532 90.7955 11.6532C89.9197 11.6532 89.3869 12.3306 89.3869 13.4397H89.3869Z"
				fill="white"
			/>
			<path
				d="M97.5402 13.4397C97.5071 13.0933 97.5467 12.7437 97.6566 12.4134C97.7665 12.0832 97.9442 11.7795 98.1783 11.522C98.4124 11.2644 98.6978 11.0586 99.0161 10.9178C99.3344 10.777 99.6786 10.7042 100.027 10.7042C100.375 10.7042 100.719 10.777 101.037 10.9178C101.356 11.0586 101.641 11.2644 101.875 11.522C102.109 11.7795 102.287 12.0832 102.397 12.4134C102.507 12.7437 102.546 13.0933 102.513 13.4397C102.547 13.7866 102.508 14.1366 102.398 14.4674C102.289 14.7982 102.111 15.1024 101.877 15.3604C101.643 15.6185 101.357 15.8247 101.038 15.9658C100.72 16.1069 100.375 16.1798 100.027 16.1798C99.6782 16.1798 99.3336 16.1069 99.015 15.9658C98.6964 15.8247 98.4108 15.6185 98.1766 15.3604C97.9425 15.1024 97.7649 14.7982 97.6553 14.4674C97.5456 14.1366 97.5064 13.7866 97.5402 13.4397ZM101.442 13.4397C101.442 12.297 100.929 11.6287 100.028 11.6287C99.1237 11.6287 98.615 12.297 98.615 13.4398C98.615 14.5917 99.1238 15.2548 100.028 15.2548C100.929 15.2548 101.442 14.5871 101.442 13.4397H101.442Z"
				fill="white"
			/>
			<path
				d="M103.909 10.8059H104.911V11.6434H104.989C105.12 11.3426 105.343 11.0905 105.625 10.9221C105.907 10.7537 106.234 10.6776 106.562 10.7042C106.818 10.6849 107.076 10.7236 107.315 10.8173C107.555 10.9111 107.77 11.0576 107.946 11.2459C108.121 11.4342 108.251 11.6595 108.328 11.9052C108.404 12.1509 108.424 12.4105 108.387 12.665V16.0779H107.346V12.9263C107.346 12.0791 106.978 11.6577 106.208 11.6577C106.034 11.6496 105.86 11.6793 105.699 11.7446C105.537 11.81 105.392 11.9095 105.272 12.0364C105.152 12.1633 105.062 12.3146 105.006 12.4798C104.95 12.645 104.931 12.8204 104.95 12.9937V16.0779H103.909V10.8059Z"
				fill="white"
			/>
			<path
				d="M114.266 9.49341V10.83H115.408V11.7064H114.266V14.4173C114.266 14.9695 114.493 15.2113 115.011 15.2113C115.144 15.2109 115.276 15.2029 115.408 15.1873V16.054C115.221 16.0874 115.032 16.1052 114.842 16.1071C113.685 16.1071 113.224 15.7001 113.224 14.6837V11.7063H112.387V10.8299H113.224V9.49341H114.266Z"
				fill="white"
			/>
			<path
				d="M116.829 8.74792H117.86V11.6532H117.943C118.081 11.3496 118.31 11.096 118.597 10.927C118.885 10.758 119.218 10.6818 119.55 10.7088C119.805 10.6949 120.061 10.7375 120.297 10.8336C120.534 10.9296 120.747 11.0767 120.92 11.2645C121.094 11.4522 121.224 11.6759 121.301 11.9196C121.378 12.1632 121.4 12.4209 121.366 12.6742V16.078H120.324V12.9309C120.324 12.0888 119.932 11.6623 119.197 11.6623C119.018 11.6477 118.838 11.6722 118.67 11.7344C118.502 11.7965 118.349 11.8946 118.223 12.0219C118.096 12.1492 117.999 12.3026 117.938 12.4714C117.877 12.6401 117.854 12.8202 117.87 12.9989V16.078H116.829L116.829 8.74792Z"
				fill="white"
			/>
			<path
				d="M127.433 14.6545C127.291 15.1363 126.985 15.5531 126.567 15.8319C126.15 16.1107 125.647 16.2338 125.148 16.1797C124.801 16.1889 124.456 16.1223 124.137 15.9847C123.818 15.8471 123.532 15.6418 123.301 15.3829C123.069 15.1239 122.896 14.8177 122.795 14.4854C122.693 14.1531 122.665 13.8027 122.713 13.4585C122.667 13.1133 122.695 12.7621 122.796 12.4288C122.898 12.0955 123.069 11.7879 123.3 11.5267C123.53 11.2655 123.814 11.0569 124.132 10.915C124.45 10.7731 124.795 10.7012 125.144 10.7042C126.61 10.7042 127.495 11.7064 127.495 13.3619V13.7249H123.773V13.7833C123.756 13.9767 123.781 14.1715 123.844 14.355C123.907 14.5385 124.008 14.7068 124.141 14.849C124.273 14.9912 124.433 15.1042 124.612 15.1807C124.79 15.2573 124.983 15.2957 125.177 15.2936C125.426 15.3235 125.678 15.2786 125.901 15.1648C126.124 15.051 126.309 14.8734 126.431 14.6544L127.433 14.6545ZM123.773 12.9555H126.436C126.449 12.7785 126.425 12.6008 126.365 12.4337C126.305 12.2666 126.211 12.1138 126.089 11.9852C125.967 11.8566 125.819 11.755 125.655 11.6869C125.491 11.6187 125.315 11.5857 125.138 11.5897C124.958 11.5875 124.779 11.6212 124.613 11.6891C124.446 11.7569 124.294 11.8575 124.167 11.9847C124.04 12.112 123.94 12.2635 123.872 12.4302C123.804 12.5969 123.77 12.7755 123.773 12.9555H123.773Z"
				fill="white"
			/>
			<path
				d="M48.802 20.8121V29.7121C48.802 32.0121 50.142 33.2521 52.262 33.2521C54.402 33.2521 55.742 32.0121 55.742 29.7121V20.8121H58.022V29.5921C58.022 33.0521 55.802 35.2521 52.262 35.2521C48.722 35.2521 46.542 33.0521 46.542 29.5921V20.8121H48.802Z"
				fill="white"
			/>
			<path
				d="M66.0036 24.6121C68.5836 24.6121 70.1036 26.3121 70.1036 28.9321V35.0521H67.9036V29.3921C67.9036 27.4721 66.9236 26.5321 65.4236 26.5321C63.7236 26.5321 62.8036 27.7321 62.8036 29.5521V35.0521H60.6236V24.8121H62.6036L62.7636 26.1921C63.3436 25.2121 64.4436 24.6121 66.0036 24.6121Z"
				fill="white"
			/>
			<path d="M72.4567 22.8921V20.6121H74.8767V22.8921H72.4567ZM72.5767 35.0521V24.8121H74.7567V35.0521H72.5767Z" fill="white" />
			<path d="M78.5614 24.7921L81.6214 32.7321L84.6414 24.7921H87.0014L82.8014 35.0521H80.3614L76.2614 24.7921H78.5614Z" fill="white" />
			<path
				d="M97.6882 29.7121V30.5321H89.8482C89.8882 32.4521 91.1482 33.4521 92.7482 33.4521C93.9482 33.4521 94.9482 32.8921 95.3682 31.7721H97.5882C97.0482 33.8521 95.2082 35.2521 92.7082 35.2521C89.6482 35.2521 87.6282 33.1321 87.6282 29.9121C87.6282 26.7121 89.6482 24.5921 92.6882 24.5921C95.6682 24.5921 97.6882 26.6321 97.6882 29.7121ZM92.6882 26.3321C91.2282 26.3321 90.0282 27.2321 89.8682 29.0121H95.4682C95.3482 27.2321 94.1682 26.3321 92.6882 26.3321Z"
				fill="white"
			/>
			<path
				d="M104.62 24.8121H105.96V26.7721H104.5C102.8 26.7721 102.14 27.8521 102.14 29.5921V35.0521H99.9404V24.8121H101.94L102.2 26.1321C102.58 25.4121 103.44 24.8121 104.62 24.8121Z"
				fill="white"
			/>
			<path
				d="M106.898 31.9521H109.078C109.098 33.0121 110.078 33.6321 111.418 33.6321C112.758 33.6321 113.558 33.1321 113.558 32.2321C113.558 31.4521 113.158 31.0321 111.998 30.8521L109.938 30.4921C107.938 30.1521 107.158 29.1121 107.158 27.6521C107.158 25.8121 108.978 24.6121 111.298 24.6121C113.798 24.6121 115.618 25.8121 115.638 27.8521H113.478C113.458 26.8121 112.558 26.2321 111.298 26.2321C110.098 26.2321 109.338 26.7321 109.338 27.5721C109.338 28.3121 109.858 28.6521 110.998 28.8521L113.018 29.2121C114.918 29.5521 115.798 30.4921 115.798 32.0321C115.798 34.1521 113.838 35.2521 111.458 35.2521C108.758 35.2521 106.938 33.9521 106.898 31.9521Z"
				fill="white"
			/>
			<path
				d="M127.13 33.4121H127.51V35.0521H126.27C125.43 35.0521 124.67 34.7321 124.51 33.7521C123.93 34.6521 122.67 35.2521 121.07 35.2521C118.81 35.2521 117.37 34.0721 117.37 32.1121C117.37 30.3721 118.47 29.0921 121.27 29.0921H124.25V28.5721C124.25 27.0721 123.35 26.3721 122.01 26.3721C120.65 26.3721 119.77 27.0521 119.71 28.1121H117.69C117.75 25.8921 119.57 24.6121 122.09 24.6121C124.49 24.6121 126.45 25.8121 126.45 28.5921V32.7321C126.45 33.2921 126.67 33.4121 127.13 33.4121ZM124.25 31.0121V30.5921H121.57C120.09 30.5921 119.63 31.2521 119.63 32.0121C119.63 33.0521 120.45 33.5121 121.57 33.5121C123.09 33.5121 124.25 32.6921 124.25 31.0121Z"
				fill="white"
			/>
			<path d="M131.534 20.1921V35.0521H129.354V20.1921H131.534Z" fill="white" />
			<path d="M143.707 32.3521L148.067 20.8121H150.467L144.867 35.0521H142.447L136.867 20.8121H139.327L143.707 32.3521Z" fill="white" />
			<path
				d="M160.325 29.7121V30.5321H152.485C152.525 32.4521 153.785 33.4521 155.385 33.4521C156.585 33.4521 157.585 32.8921 158.005 31.7721H160.225C159.685 33.8521 157.845 35.2521 155.345 35.2521C152.285 35.2521 150.265 33.1321 150.265 29.9121C150.265 26.7121 152.285 24.5921 155.325 24.5921C158.305 24.5921 160.325 26.6321 160.325 29.7121ZM155.325 26.3321C153.865 26.3321 152.665 27.2321 152.505 29.0121H158.105C157.985 27.2321 156.805 26.3321 155.325 26.3321Z"
				fill="white"
			/>
			<path
				d="M167.257 24.8121H168.597V26.7721H167.137C165.437 26.7721 164.777 27.8521 164.777 29.5921V35.0521H162.577V24.8121H164.577L164.837 26.1321C165.217 25.4121 166.077 24.8121 167.257 24.8121Z"
				fill="white"
			/>
			<path
				d="M169.534 31.9521H171.714C171.734 33.0121 172.714 33.6321 174.054 33.6321C175.394 33.6321 176.194 33.1321 176.194 32.2321C176.194 31.4521 175.794 31.0321 174.634 30.8521L172.574 30.4921C170.574 30.1521 169.794 29.1121 169.794 27.6521C169.794 25.8121 171.614 24.6121 173.934 24.6121C176.434 24.6121 178.254 25.8121 178.274 27.8521H176.114C176.094 26.8121 175.194 26.2321 173.934 26.2321C172.734 26.2321 171.974 26.7321 171.974 27.5721C171.974 28.3121 172.494 28.6521 173.634 28.8521L175.654 29.2121C177.554 29.5521 178.434 30.4921 178.434 32.0321C178.434 34.1521 176.474 35.2521 174.094 35.2521C171.394 35.2521 169.574 33.9521 169.534 31.9521Z"
				fill="white"
			/>
			<path d="M180.386 22.8921V20.6121H182.806V22.8921H180.386ZM180.506 35.0521V24.8121H182.686V35.0521H180.506Z" fill="white" />
			<path
				d="M184.951 29.9321C184.951 26.7721 187.111 24.5921 190.211 24.5921C193.331 24.5921 195.491 26.7721 195.491 29.9321C195.491 33.0921 193.331 35.2521 190.211 35.2521C187.111 35.2521 184.951 33.0921 184.951 29.9321ZM187.191 29.9121C187.191 32.0121 188.391 33.3721 190.211 33.3721C192.051 33.3721 193.251 32.0121 193.251 29.9121C193.251 27.7921 192.051 26.4521 190.211 26.4521C188.391 26.4521 187.191 27.7921 187.191 29.9121Z"
				fill="white"
			/>
			<path
				d="M203.113 24.6121C205.693 24.6121 207.213 26.3121 207.213 28.9321V35.0521H205.013V29.3921C205.013 27.4721 204.033 26.5321 202.533 26.5321C200.833 26.5321 199.913 27.7321 199.913 29.5521V35.0521H197.733V24.8121H199.713L199.873 26.1921C200.453 25.2121 201.553 24.6121 203.113 24.6121Z"
				fill="white"
			/>
		</svg>
	);
}

export function Chat({ defaultFill, defaultSize = 'w-5 h-5' }: IconProps) {
	return (
		<svg
			x="0"
			y="0"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="currentColor"
			viewBox="0 0 24 24"
			className={` ${defaultSize} ${defaultFill ? defaultFill : 'dark:hover:text-white hover:text-black dark:text-channelTextLabel text-colorTextLightMode'}`}
		>
			<path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"></path>
		</svg>
	);
}

export function ParagraphIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg data-315="true" data-qa="paragraph" aria-hidden="true" viewBox="0 0 20 20" className="is-inline" width="1em" height="1em" {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M7.25 3.007C5.42 3.109 4 4.335 4 6.25s1.42 3.14 3.25 3.243zm0 7.988C4.75 10.886 2.5 9.152 2.5 6.25c0-2.999 2.402-4.75 5-4.75h9.25a.75.75 0 0 1 0 1.5h-3v14.75a.75.75 0 0 1-1.5 0V3h-3.5v14.75a.75.75 0 0 1-1.5 0z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function CheckedIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="menu_item_checkmark"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em', fontSize: '10px' }}
			{...props}
		>
			<path
				fill={props.color}
				fillRule="evenodd"
				d="M17.234 3.677a.75.75 0 0 1 .089 1.057l-9.72 11.5a.75.75 0 0 1-1.19-.058L2.633 10.7a.75.75 0 0 1 1.234-.852l3.223 4.669 9.087-10.751a.75.75 0 0 1 1.057-.089"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function H1Icon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="heading-1"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M3 3.25a.75.75 0 0 0-1.5 0v13.5a.75.75 0 0 0 1.5 0v-6h6.2v6a.75.75 0 0 0 1.5 0V3.25a.75.75 0 0 0-1.5 0v6H3zM17.45 8.5a.75.75 0 0 0-1.191-.607l-2.75 2a.75.75 0 1 0 .882 1.214l1.559-1.134v6.777a.75.75 0 0 0 1.5 0z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}
export function H2Icon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="heading-2"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2.25 2.5a.75.75 0 0 1 .75.75v6h6.2v-6a.75.75 0 0 1 1.5 0v13.5a.75.75 0 0 1-1.5 0v-6H3v6a.75.75 0 0 1-1.5 0V3.25a.75.75 0 0 1 .75-.75M14.952 16a59 59 0 0 1 1.49-1.526c.33-.33.613-.613.84-.86.345-.373.629-.73.815-1.15.192-.431.255-.87.255-1.372 0-.954-.347-1.726-.913-2.264a3.1 3.1 0 0 0-1.976-.824c-.696-.035-1.425.154-1.995.6-.59.462-.968 1.17-.968 2.053a.75.75 0 0 0 1.5 0c0-.421.165-.693.393-.871.245-.193.604-.303.996-.284.388.02.755.165 1.016.414.25.237.447.607.447 1.176 0 .37-.046.583-.126.763-.085.193-.237.407-.546.742-.207.224-.456.473-.77.787l-.545.547a59 59 0 0 0-2.176 2.32.748.748 0 0 0 .204 1.159c.106.057.228.09.357.09h4.352a.75.75 0 0 0 0-1.5z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}
export function H3Icon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="heading-3"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M2.25 2.5a.75.75 0 0 1 .75.75v6h6.2v-6a.75.75 0 0 1 1.5 0v13.5a.75.75 0 0 1-1.5 0v-6H3v6a.75.75 0 0 1-1.5 0V3.25a.75.75 0 0 1 .75-.75m13.166 13.435c.848-.084 1.484-.636 1.484-1.526 0-.714-.259-1.143-.59-1.374-.342-.24-.895-.36-1.649-.174a.75.75 0 0 1-.73-1.249L15.929 9.5H12.95a.75.75 0 0 1 0-1.5h4.719a.75.75 0 0 1 .545 1.265l-1.994 2.11c.342.086.663.23.951.43.806.565 1.229 1.5 1.229 2.604 0 1.837-1.41 2.876-2.834 3.019-1.424.142-3.044-.576-3.628-2.327a.75.75 0 1 1 1.423-.475c.326.976 1.207 1.394 2.055 1.31"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function CheckListIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="checkbox"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5zm1.5-3a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-11a3 3 0 0 0-3-3zm9.33 6.225a.75.75 0 0 0-1.16-.95l-3.885 4.748-1.428-1.964a.75.75 0 0 0-1.214.882l2 2.75a.75.75 0 0 0 1.187.034z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function OrderedListIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="numbered-list"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M3.792 2.094A.5.5 0 0 1 4 2.5V6h1a.5.5 0 1 1 0 1H2a.5.5 0 1 1 0-1h1V3.194l-.842.28a.5.5 0 0 1-.316-.948l1.5-.5a.5.5 0 0 1 .45.068M7.75 3.5a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zM7 10.75a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1-.75-.75m0 6.5a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1-.75-.75m-4.293-3.36a1 1 0 0 1 .793-.39c.49 0 .75.38.75.75 0 .064-.033.194-.173.409a5 5 0 0 1-.594.711c-.256.267-.552.548-.87.848l-.088.084a42 42 0 0 0-.879.845A.5.5 0 0 0 2 18h3a.5.5 0 0 0 0-1H3.242l.058-.055c.316-.298.629-.595.904-.882a6 6 0 0 0 .711-.859c.18-.277.335-.604.335-.954 0-.787-.582-1.75-1.75-1.75a2 2 0 0 0-1.81 1.147.5.5 0 1 0 .905.427 1 1 0 0 1 .112-.184"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function BulletListIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="bulleted-list"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M4 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5h-10A.75.75 0 0 1 7 3m.75 6.25a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zm0 7a.75.75 0 0 0 0 1.5h10a.75.75 0 0 0 0-1.5zM3 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function BlockquoteIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			data-315="true"
			data-qa="quote"
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="is-inline"
			style={{ width: '1em', height: '1em' }}
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0zM6.75 3a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zM6 10.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75m.75 5.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5z"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function ChevronDownIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg data-315="true" data-qa="caret-down" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }} {...props}>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M5.72 7.47a.75.75 0 0 1 1.06 0L10 10.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0L5.72 8.53a.75.75 0 0 1 0-1.06"
				clipRule="evenodd"
			></path>
		</svg>
	);
}

export function MicrosoftDropdown(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="182" height="44" viewBox="0 0 182 44" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect x="1.38696" y="0.5" width="180.066" height="43" rx="4.5" fill="black" />
			<rect x="1.38696" y="0.5" width="180.066" height="43" rx="4.5" stroke="white" />
			<path d="M25.8298 7.33337H11.887V21.2842H25.8298V7.33337Z" fill="#F25022" />
			<path d="M41.2202 7.33337H27.2773V21.2842H41.2202V7.33337Z" fill="#7FBA00" />
			<path d="M25.8298 22.7161H11.887V36.6667H25.8298V22.7161Z" fill="#00A4EF" />
			<path d="M41.2204 22.7161H27.2776V36.6667H41.2204V22.7161Z" fill="#FFB900" />
			<path
				d="M59.6282 16.4168C59.1746 16.6728 58.6939 16.866 58.1857 16.9963C57.6776 17.1265 57.1421 17.1916 56.5795 17.1916C55.2439 17.1916 54.1837 16.7947 53.3983 16.001C52.613 15.2073 52.2203 14.0882 52.2203 12.6435C52.2203 11.1863 52.6551 10.0252 53.5243 9.16012C54.3978 8.29084 55.5232 7.8562 56.9007 7.8562C57.413 7.8562 57.8834 7.90869 58.3117 8.01367C58.7442 8.11446 59.1809 8.27614 59.6219 8.4987L59.162 9.42468C58.7926 9.23151 58.4293 9.09292 58.0722 9.00894C57.7154 8.92496 57.3227 8.88297 56.8944 8.88297C55.8823 8.88297 55.0507 9.20421 54.3999 9.84672C53.7533 10.4892 53.4298 11.3963 53.4298 12.568C53.4298 13.7563 53.7154 14.655 54.2865 15.2639C54.8619 15.8686 55.6682 16.171 56.7054 16.171C57.0455 16.171 57.3625 16.1375 57.6565 16.0702C57.9547 16.0031 58.2277 15.9023 58.4754 15.7679V13.3113H56.5101V12.2908H59.6282V16.4168ZM67.0359 13.9916H62.3872C62.4081 14.7223 62.6034 15.285 62.973 15.6796C63.3426 16.0702 63.8612 16.2655 64.5288 16.2655C64.8186 16.2655 65.1147 16.2215 65.417 16.1333C65.7236 16.0409 66.0301 15.8919 66.3367 15.6861L66.8471 16.4671C66.4649 16.7191 66.0806 16.9039 65.6942 17.0215C65.3079 17.139 64.8838 17.1979 64.4218 17.1979C63.4224 17.1979 62.6434 16.9018 62.0848 16.3097C61.5264 15.7133 61.245 14.8819 61.2408 13.8152C61.2366 12.7527 61.518 11.8981 62.0848 11.2514C62.656 10.6005 63.395 10.2751 64.3021 10.2751C65.1672 10.2751 65.8392 10.5564 66.3178 11.1191C66.7966 11.6777 67.0359 12.4567 67.0359 13.4561V13.9916ZM65.9084 13.1097C65.9042 12.5008 65.7573 12.0283 65.4675 11.6924C65.1819 11.3564 64.7872 11.1884 64.2832 11.1884C63.7877 11.1884 63.3678 11.3627 63.0235 11.7113C62.6832 12.0556 62.4754 12.5217 62.3997 13.1097H65.9084ZM71.9304 16.9584C71.7498 17.034 71.5692 17.0886 71.3887 17.1223C71.2123 17.16 71.0128 17.1789 70.7903 17.1789C70.2485 17.1789 69.8244 17.0236 69.5178 16.7128C69.2155 16.4021 69.0644 15.9422 69.0644 15.3333V11.3648H67.9367V10.4325H69.0644V8.92075L70.1919 8.56171V10.4325H71.8422V11.3648H70.1919V15.2136C70.1919 15.5874 70.259 15.8561 70.3935 16.0199C70.5278 16.1837 70.7294 16.2655 70.9982 16.2655C71.1241 16.2655 71.2459 16.2508 71.3634 16.2215C71.481 16.1921 71.5818 16.1563 71.6658 16.1144L71.9304 16.9584ZM77.4548 9.03414C77.2322 9.03414 77.0474 8.96064 76.9004 8.81367C76.7535 8.66669 76.6799 8.48821 76.6799 8.27825C76.6799 8.05987 76.7535 7.8793 76.9004 7.73652C77.0474 7.58953 77.2322 7.51605 77.4548 7.51605C77.6773 7.51605 77.8621 7.58953 78.009 7.73652C78.1603 7.8793 78.2358 8.05987 78.2358 8.27825C78.2358 8.48821 78.1603 8.66669 78.009 8.81367C77.8621 8.96064 77.6773 9.03414 77.4548 9.03414ZM78.0027 17.0403H76.8815V10.4325H78.0027V17.0403ZM83.4957 16.9584C83.3151 17.034 83.1344 17.0886 82.9538 17.1223C82.7776 17.16 82.5781 17.1789 82.3554 17.1789C81.8137 17.1789 81.3896 17.0236 81.0831 16.7128C80.7807 16.4021 80.6295 15.9422 80.6295 15.3333V11.3648H79.5019V10.4325H80.6295V8.92075L81.757 8.56171V10.4325H83.4075V11.3648H81.757V15.2136C81.757 15.5874 81.8242 15.8561 81.9586 16.0199C82.093 16.1837 82.2946 16.2655 82.5633 16.2655C82.6894 16.2655 82.8111 16.2508 82.9287 16.2215C83.0462 16.1921 83.147 16.1563 83.231 16.1144L83.4957 16.9584ZM91.6277 8.38532C91.5102 8.34333 91.4031 8.31393 91.3065 8.29713C91.2099 8.28034 91.1091 8.27194 91.0041 8.27194C90.6557 8.27194 90.3952 8.36433 90.223 8.54911C90.0552 8.73388 89.9711 9.00475 89.9711 9.36169V10.4325H91.4892V11.3648H89.9711V17.0403H88.8562V11.3648H87.7475V10.4325H88.8562V9.30499C88.8562 8.68768 89.0473 8.20475 89.4295 7.8562C89.8157 7.50764 90.3407 7.33337 91.0041 7.33337C91.1722 7.33337 91.3254 7.34597 91.4641 7.37117C91.6026 7.39636 91.7455 7.43206 91.8924 7.47825L91.6277 8.38532ZM96.0623 11.39C95.9785 11.3648 95.9007 11.3459 95.8293 11.3333C95.7579 11.3207 95.6719 11.3144 95.571 11.3144C95.0377 11.3144 94.6178 11.5412 94.3112 11.9947C94.0047 12.444 93.8513 13.0131 93.8513 13.7018V17.0403H92.7301V10.4325H93.8513V11.7428H93.8766C94.0277 11.2766 94.2566 10.9239 94.5631 10.6845C94.874 10.4409 95.233 10.3192 95.6403 10.3192C95.7704 10.3192 95.8819 10.3255 95.9741 10.3381C96.0707 10.3507 96.1589 10.3696 96.2387 10.3948L96.0623 11.39ZM100.283 17.1979C99.2959 17.1979 98.5086 16.8891 97.9207 16.2718C97.3369 15.6503 97.045 14.8272 97.045 13.8026C97.045 12.6981 97.3474 11.8352 97.9521 11.2136C98.5568 10.5921 99.382 10.2793 100.428 10.2751C101.419 10.2709 102.194 10.5753 102.752 11.1884C103.315 11.7974 103.596 12.6351 103.596 13.7018C103.596 14.7642 103.296 15.6126 102.695 16.2466C102.095 16.8807 101.291 17.1979 100.283 17.1979ZM100.358 16.2655C101.03 16.2655 101.545 16.0472 101.902 15.6105C102.263 15.1694 102.443 14.5458 102.443 13.7396C102.443 12.9249 102.263 12.2992 101.902 11.8624C101.541 11.4257 101.026 11.2073 100.358 11.2073C99.6906 11.2073 99.1615 11.4362 98.771 11.8939C98.3846 12.3474 98.1914 12.9733 98.1914 13.7712C98.1914 14.5479 98.3867 15.1589 98.7773 15.6042C99.1678 16.0451 99.6948 16.2655 100.358 16.2655ZM114.802 17.0403H113.675V13.2419C113.675 12.5238 113.563 12.0052 113.341 11.6861C113.118 11.3669 112.747 11.2073 112.226 11.2073C111.781 11.2073 111.403 11.4089 111.092 11.8121C110.785 12.2152 110.632 12.7023 110.632 13.2735V17.0403H109.511V13.1223C109.511 12.484 109.387 12.0052 109.139 11.6861C108.896 11.3669 108.528 11.2073 108.037 11.2073C107.579 11.2073 107.201 11.3984 106.903 11.7806C106.609 12.1627 106.462 12.6625 106.462 13.2798V17.0403H105.341V10.4325H106.462V11.4782H106.487C106.723 11.0793 107.012 10.779 107.357 10.5774C107.701 10.3759 108.098 10.2751 108.547 10.2751C109.001 10.2751 109.394 10.399 109.725 10.6467C110.061 10.8945 110.294 11.2241 110.424 11.6357C110.668 11.1821 110.972 10.842 111.338 10.6152C111.707 10.3885 112.134 10.2751 112.617 10.2751C113.343 10.2751 113.889 10.4997 114.254 10.9491C114.62 11.3942 114.802 12.0661 114.802 12.9649V17.0403Z"
				fill="white"
			/>
			<path
				d="M71.1689 22.8655C71.1689 22.4521 71.3178 22.1213 71.6156 21.8401C71.9133 21.559 72.2605 21.4266 72.6741 21.4266C73.104 21.4266 73.468 21.5755 73.7491 21.8567C74.0303 22.1378 74.1791 22.4851 74.1791 22.8655C74.1791 23.2626 74.0303 23.6097 73.7326 23.8745C73.4349 24.1556 73.0876 24.288 72.6575 24.288C72.2274 24.288 71.8803 24.1556 71.5824 23.8745C71.3178 23.5933 71.1689 23.2626 71.1689 22.8655ZM73.8979 36.3948H71.4336V25.8922H73.8979V36.3948Z"
				fill="white"
			/>
			<path
				d="M81.4065 34.5992C81.7703 34.5992 82.1838 34.5165 82.6305 34.3512C83.077 34.1857 83.4738 33.9542 83.8542 33.6731V35.972C83.4574 36.2036 83.0109 36.369 82.5147 36.4846C82.0185 36.6004 81.456 36.6667 80.8606 36.6667C79.3226 36.6667 78.0656 36.1705 77.0896 35.1946C76.1139 34.2188 75.6343 32.9618 75.6343 31.4568C75.6343 29.7697 76.1305 28.3805 77.1228 27.2889C78.1151 26.1973 79.5045 25.6515 81.3238 25.6515C81.7869 25.6515 82.25 25.7176 82.7296 25.8334C83.2092 25.9492 83.5732 26.098 83.8542 26.2469V28.612C83.4738 28.3308 83.077 28.1158 82.68 27.967C82.2831 27.8181 81.8696 27.7354 81.456 27.7354C80.4802 27.7354 79.703 28.0497 79.091 28.6781C78.4955 29.3067 78.1978 30.1667 78.1978 31.2418C78.1978 32.3003 78.479 33.1272 79.0579 33.7226C79.6367 34.3181 80.4141 34.5992 81.4065 34.5992Z"
				fill="white"
			/>
			<path
				d="M90.8826 25.7322C91.0811 25.7322 91.263 25.7488 91.4119 25.7652C91.5607 25.7983 91.7096 25.8315 91.8089 25.8646V28.362C91.6765 28.2626 91.4946 28.1801 91.2466 28.0973C90.9984 28.0146 90.7007 27.965 90.3369 27.965C89.725 27.965 89.2122 28.2131 88.7987 28.7258C88.3852 29.2386 88.1703 30.0158 88.1703 31.0909V36.4H85.7059V25.8976H88.1703V27.5515H88.2033C88.4349 26.9726 88.7656 26.5261 89.2288 26.2118C89.6919 25.8976 90.2376 25.7322 90.8826 25.7322Z"
				fill="white"
			/>
			<path
				d="M91.942 31.3079C91.942 29.5713 92.4382 28.1986 93.414 27.1731C94.3897 26.1641 95.7625 25.6515 97.4991 25.6515C99.1365 25.6515 100.427 26.1477 101.353 27.1235C102.279 28.0992 102.742 29.4225 102.742 31.0764C102.742 32.7799 102.246 34.1361 101.27 35.1451C100.294 36.1539 98.9546 36.6501 97.2676 36.6501C95.6468 36.6501 94.3401 36.1705 93.3974 35.2112C92.4216 34.2685 91.942 32.9618 91.942 31.3079ZM94.5221 31.2252C94.5221 32.3168 94.7702 33.1603 95.2663 33.7392C95.7625 34.3181 96.4737 34.5992 97.4 34.5992C98.293 34.5992 98.9877 34.3181 99.4508 33.7392C99.9138 33.1603 100.162 32.3003 100.162 31.1591C100.162 30.0343 99.9138 29.1743 99.4342 28.5954C98.9546 28.0167 98.2599 27.7354 97.3833 27.7354C96.4737 27.7354 95.779 28.0331 95.2663 28.6451C94.7702 29.2571 94.5221 30.1006 94.5221 31.2252Z"
				fill="white"
			/>
			<path
				d="M106.414 28.6621C106.414 29.0095 106.53 29.2907 106.745 29.4892C106.976 29.6876 107.473 29.9358 108.233 30.2501C109.226 30.6469 109.92 31.0934 110.317 31.5896C110.714 32.0858 110.913 32.6813 110.913 33.3759C110.913 34.3683 110.532 35.1621 109.772 35.7577C109.011 36.353 107.985 36.6507 106.695 36.6507C106.265 36.6507 105.786 36.601 105.256 36.4853C104.727 36.3861 104.281 36.2372 103.917 36.0884V33.6571C104.363 33.9714 104.843 34.2194 105.372 34.4013C105.885 34.5832 106.365 34.6825 106.778 34.6825C107.34 34.6825 107.754 34.5998 108.018 34.451C108.283 34.3021 108.415 34.0375 108.415 33.6571C108.415 33.3098 108.283 33.0285 108.002 32.7971C107.721 32.5656 107.208 32.2843 106.431 31.9866C105.521 31.6062 104.876 31.1762 104.496 30.6966C104.115 30.2168 103.917 29.605 103.917 28.8773C103.917 27.9346 104.297 27.1571 105.041 26.5452C105.786 25.9332 106.761 25.6355 107.969 25.6355C108.333 25.6355 108.746 25.6686 109.209 25.7513C109.672 25.834 110.053 25.9332 110.35 26.0656V28.4141C110.02 28.1992 109.639 28.0171 109.209 27.8518C108.779 27.703 108.333 27.6203 107.919 27.6203C107.456 27.6203 107.076 27.7194 106.828 27.9013C106.546 28.0834 106.414 28.348 106.414 28.6621Z"
				fill="white"
			/>
			<path
				d="M112.004 31.3079C112.004 29.5713 112.5 28.1986 113.476 27.1731C114.452 26.1641 115.825 25.6515 117.561 25.6515C119.199 25.6515 120.489 26.1477 121.415 27.1235C122.341 28.0992 122.804 29.4225 122.804 31.0764C122.804 32.7799 122.308 34.1361 121.332 35.1451C120.356 36.1539 119.017 36.6501 117.33 36.6501C115.709 36.6501 114.402 36.1705 113.459 35.2112C112.484 34.2685 112.004 32.9618 112.004 31.3079ZM114.568 31.2252C114.568 32.3168 114.816 33.1603 115.312 33.7392C115.808 34.3181 116.519 34.5992 117.445 34.5992C118.339 34.5992 119.033 34.3181 119.496 33.7392C119.959 33.1603 120.208 32.3003 120.208 31.1591C120.208 30.0343 119.959 29.1743 119.48 28.5954C119 28.0167 118.305 27.7354 117.429 27.7354C116.519 27.7354 115.825 28.0331 115.312 28.6451C114.816 29.2571 114.568 30.1006 114.568 31.2252Z"
				fill="white"
			/>
			<path
				d="M130.958 27.929V33.3208C130.958 34.4454 131.223 35.2725 131.736 35.8348C132.248 36.3971 133.042 36.6618 134.084 36.6618C134.432 36.6618 134.795 36.6287 135.159 36.546C135.523 36.4633 135.788 36.3971 135.937 36.298V34.2471C135.788 34.3463 135.606 34.429 135.407 34.4951C135.209 34.5612 135.027 34.5944 134.895 34.5944C134.398 34.5944 134.018 34.462 133.787 34.1974C133.555 33.9328 133.439 33.4697 133.439 32.8246V27.9126H135.953V25.8947H133.456V22.7854L130.975 23.5462V25.9112H127.287V24.6377C127.287 24.0091 127.419 23.5296 127.7 23.1988C127.981 22.8681 128.378 22.7191 128.891 22.7191C129.156 22.7191 129.387 22.7523 129.602 22.8184C129.801 22.8845 129.949 22.9506 130.032 23.0003V20.8667C129.85 20.8006 129.652 20.7675 129.42 20.7345C129.189 20.7014 128.924 20.6848 128.626 20.6848C127.502 20.6848 126.575 21.0322 125.864 21.7433C125.153 22.4545 124.789 23.3477 124.789 24.4558V25.9112H123.036V27.929H124.789V36.4137H127.287V27.929H130.958Z"
				fill="white"
			/>
			<path
				d="M69.0516 21.7491V36.403H66.5045V24.9246H66.4715L61.9232 36.403H60.2361L55.572 24.9246H55.539V36.403H53.1904V21.7491H56.8291L61.0466 32.6155H61.1127L65.5618 21.7491H69.0516Z"
				fill="white"
			/>
			<path d="M164.953 25L158.953 19L152.953 25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function CDNIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			viewBox="0 0 16 16"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			className="si-glyph si-glyph-network"
			fill="currentColor"
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<title>91</title> <defs> </defs>{' '}
				<g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					{' '}
					<g fill="currentColor">
						{' '}
						<path
							d="M11.783,10.094 C10.084,11.092 8.017,11.778 6.105,12.044 C5.993,12.432 5.751,12.762 5.421,12.978 C5.933,14.071 6.67,15.065 7.56,15.965 C10.072,16.085 12.601,15.027 14.262,12.891 C14.291,12.853 14.317,12.811 14.345,12.772 C14.101,11.858 13.697,10.988 13.2,10.128 C13.11,10.154 13.024,10.174 12.939,10.19 C12.796,10.23 12.648,10.258 12.493,10.258 C12.238,10.258 12,10.196 11.783,10.094 L11.783,10.094 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M9.051,5.492 C8.409,5.025 7.735,4.607 7.047,4.236 C6.795,4.84 6.199,5.263 5.502,5.263 C5.377,5.263 5.257,5.247 5.14,5.221 C4.733,6.756 4.516,8.383 4.629,9.915 C5.393,9.973 6.011,10.532 6.149,11.269 C7.844,10.99 9.619,10.39 11.116,9.531 C10.93,9.26 10.819,8.934 10.819,8.582 C10.819,8.169 10.975,7.796 11.222,7.504 C10.568,6.768 9.833,6.061 9.051,5.492 L9.051,5.492 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M4,9.989 C3.863,8.355 4.104,6.597 4.541,4.957 C4.111,4.653 3.828,4.155 3.828,3.588 C3.828,3.391 3.867,3.202 3.932,3.026 C3.276,2.904 2.618,2.828 1.958,2.779 C1.869,2.883 1.773,2.983 1.689,3.093 C-0.04,5.317 -0.405,8.165 0.459,10.64 C1.23,10.969 2.025,11.187 2.856,11.306 C2.959,10.681 3.408,10.178 4,9.989 L4,9.989 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M13.928,9.689 C13.899,9.726 13.864,9.756 13.832,9.789 C14.265,10.525 14.631,11.271 14.885,12.057 C16.002,10.167 16.256,7.958 15.717,5.935 C15.627,6.068 15.541,6.202 15.446,6.331 C15.01,6.932 14.571,7.548 14.092,8.103 C14.137,8.255 14.168,8.414 14.168,8.582 L14.168,8.586 C14.252,8.96 14.181,9.365 13.928,9.689 L13.928,9.689 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M7.164,3.447 C7.963,3.861 8.748,4.345 9.494,4.887 C10.334,5.498 11.121,6.26 11.818,7.051 C12.025,6.959 12.252,6.906 12.494,6.906 C12.994,6.906 13.439,7.131 13.746,7.478 C14.15,6.986 14.529,6.456 14.907,5.938 C15.101,5.67 15.279,5.395 15.451,5.118 C14.945,3.807 14.097,2.612 12.909,1.687 C11.364,0.485 9.515,-0.057 7.701,0.012 C7.586,0.158 7.472,0.302 7.362,0.451 C6.961,1.003 6.623,1.531 6.322,2.088 C6.361,2.117 6.386,2.154 6.422,2.188 C6.839,2.464 7.119,2.922 7.164,3.447 L7.164,3.447 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M2.879,11.965 C2.168,11.867 1.477,11.719 0.809,11.478 C1.328,12.553 2.087,13.531 3.094,14.314 C4.16,15.143 5.371,15.657 6.615,15.875 C5.893,15.058 5.303,14.169 4.862,13.215 C4.747,13.239 4.628,13.255 4.505,13.255 C3.713,13.254 3.054,12.703 2.879,11.965 L2.879,11.965 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
						<path
							d="M4.514,2.242 C4.825,1.9 5.277,1.753 5.713,1.826 C6.025,1.24 6.377,0.683 6.794,0.104 C5.236,0.342 3.752,1.04 2.547,2.166 C3.137,2.232 3.723,2.306 4.308,2.418 C4.371,2.354 4.441,2.297 4.514,2.242 L4.514,2.242 Z"
							className="si-glyph-fill"
						>
							{' '}
						</path>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function MicrosoftWinPortable(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="182" height="47" viewBox="0 0 182 47" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect x="1.38696" y="0.5" width="180.066" height="45.5312" rx="4.5" fill="black" />
			<rect x="1.38696" y="0.5" width="180.066" height="45.5312" rx="4.5" stroke="white" />
			<path d="M25.8298 8.59888H11.887V22.5497H25.8298V8.59888Z" fill="#F25022" />
			<path d="M41.2202 8.59888H27.2773V22.5497H41.2202V8.59888Z" fill="#7FBA00" />
			<path d="M25.8298 23.9816H11.887V37.9322H25.8298V23.9816Z" fill="#00A4EF" />
			<path d="M41.2204 23.9816H27.2776V37.9322H41.2204V23.9816Z" fill="#FFB900" />
			<path
				d="M59.6282 16.4168C59.1746 16.6728 58.6939 16.866 58.1857 16.9963C57.6776 17.1265 57.1421 17.1916 56.5795 17.1916C55.2439 17.1916 54.1837 16.7947 53.3983 16.001C52.613 15.2073 52.2203 14.0882 52.2203 12.6435C52.2203 11.1863 52.6551 10.0252 53.5243 9.16012C54.3978 8.29084 55.5232 7.8562 56.9007 7.8562C57.413 7.8562 57.8834 7.90869 58.3117 8.01367C58.7442 8.11446 59.1809 8.27614 59.6219 8.4987L59.162 9.42468C58.7926 9.23151 58.4293 9.09292 58.0722 9.00894C57.7154 8.92496 57.3227 8.88297 56.8944 8.88297C55.8823 8.88297 55.0507 9.20421 54.3999 9.84672C53.7533 10.4892 53.4298 11.3963 53.4298 12.568C53.4298 13.7563 53.7154 14.655 54.2865 15.2639C54.8619 15.8686 55.6682 16.171 56.7054 16.171C57.0455 16.171 57.3625 16.1375 57.6565 16.0702C57.9547 16.0031 58.2277 15.9023 58.4754 15.7679V13.3113H56.5101V12.2908H59.6282V16.4168ZM67.0359 13.9916H62.3872C62.4081 14.7223 62.6034 15.285 62.973 15.6796C63.3426 16.0702 63.8612 16.2655 64.5288 16.2655C64.8186 16.2655 65.1147 16.2215 65.417 16.1333C65.7236 16.0409 66.0301 15.8919 66.3367 15.6861L66.8471 16.4671C66.4649 16.7191 66.0806 16.9039 65.6942 17.0215C65.3079 17.139 64.8838 17.1979 64.4218 17.1979C63.4224 17.1979 62.6434 16.9018 62.0848 16.3097C61.5264 15.7133 61.245 14.8819 61.2408 13.8152C61.2366 12.7527 61.518 11.8981 62.0848 11.2514C62.656 10.6005 63.395 10.2751 64.3021 10.2751C65.1672 10.2751 65.8392 10.5564 66.3178 11.1191C66.7966 11.6777 67.0359 12.4567 67.0359 13.4561V13.9916ZM65.9084 13.1097C65.9042 12.5008 65.7573 12.0283 65.4675 11.6924C65.1819 11.3564 64.7872 11.1884 64.2832 11.1884C63.7877 11.1884 63.3678 11.3627 63.0235 11.7113C62.6832 12.0556 62.4754 12.5217 62.3997 13.1097H65.9084ZM71.9304 16.9584C71.7498 17.034 71.5692 17.0886 71.3887 17.1223C71.2123 17.16 71.0128 17.1789 70.7903 17.1789C70.2485 17.1789 69.8244 17.0236 69.5178 16.7128C69.2155 16.4021 69.0644 15.9422 69.0644 15.3333V11.3648H67.9367V10.4325H69.0644V8.92075L70.1919 8.56171V10.4325H71.8422V11.3648H70.1919V15.2136C70.1919 15.5874 70.259 15.8561 70.3935 16.0199C70.5278 16.1837 70.7294 16.2655 70.9982 16.2655C71.1241 16.2655 71.2459 16.2508 71.3634 16.2215C71.481 16.1921 71.5818 16.1563 71.6658 16.1144L71.9304 16.9584ZM77.4548 9.03414C77.2322 9.03414 77.0474 8.96064 76.9004 8.81367C76.7535 8.66669 76.6799 8.48821 76.6799 8.27825C76.6799 8.05987 76.7535 7.8793 76.9004 7.73652C77.0474 7.58953 77.2322 7.51605 77.4548 7.51605C77.6773 7.51605 77.8621 7.58953 78.009 7.73652C78.1603 7.8793 78.2358 8.05987 78.2358 8.27825C78.2358 8.48821 78.1603 8.66669 78.009 8.81367C77.8621 8.96064 77.6773 9.03414 77.4548 9.03414ZM78.0027 17.0403H76.8815V10.4325H78.0027V17.0403ZM83.4957 16.9584C83.3151 17.034 83.1344 17.0886 82.9538 17.1223C82.7776 17.16 82.5781 17.1789 82.3554 17.1789C81.8137 17.1789 81.3896 17.0236 81.0831 16.7128C80.7807 16.4021 80.6295 15.9422 80.6295 15.3333V11.3648H79.5019V10.4325H80.6295V8.92075L81.757 8.56171V10.4325H83.4075V11.3648H81.757V15.2136C81.757 15.5874 81.8242 15.8561 81.9586 16.0199C82.093 16.1837 82.2946 16.2655 82.5633 16.2655C82.6894 16.2655 82.8111 16.2508 82.9287 16.2215C83.0462 16.1921 83.147 16.1563 83.231 16.1144L83.4957 16.9584ZM91.6277 8.38532C91.5102 8.34333 91.4031 8.31393 91.3065 8.29713C91.2099 8.28034 91.1091 8.27194 91.0042 8.27194C90.6557 8.27194 90.3952 8.36433 90.223 8.54911C90.0551 8.73388 89.9711 9.00475 89.9711 9.36169V10.4325H91.4892V11.3648H89.9711V17.0403H88.8562V11.3648H87.7475V10.4325H88.8562V9.30499C88.8562 8.68768 89.0473 8.20475 89.4295 7.8562C89.8157 7.50764 90.3407 7.33337 91.0042 7.33337C91.1722 7.33337 91.3254 7.34597 91.4641 7.37117C91.6026 7.39636 91.7455 7.43206 91.8924 7.47825L91.6277 8.38532ZM96.0623 11.39C95.9785 11.3648 95.9007 11.3459 95.8293 11.3333C95.7579 11.3207 95.6719 11.3144 95.571 11.3144C95.0377 11.3144 94.6178 11.5412 94.3112 11.9947C94.0047 12.444 93.8513 13.0131 93.8513 13.7018V17.0403H92.7301V10.4325H93.8513V11.7428H93.8766C94.0277 11.2766 94.2566 10.9239 94.5631 10.6845C94.874 10.4409 95.233 10.3192 95.6403 10.3192C95.7704 10.3192 95.8819 10.3255 95.9741 10.3381C96.0707 10.3507 96.1589 10.3696 96.2387 10.3948L96.0623 11.39ZM100.283 17.1979C99.2959 17.1979 98.5086 16.8891 97.9207 16.2718C97.3369 15.6503 97.045 14.8272 97.045 13.8026C97.045 12.6981 97.3474 11.8352 97.9521 11.2136C98.5568 10.5921 99.382 10.2793 100.428 10.2751C101.419 10.2709 102.194 10.5753 102.752 11.1884C103.315 11.7974 103.596 12.6351 103.596 13.7018C103.596 14.7642 103.296 15.6126 102.695 16.2466C102.095 16.8807 101.291 17.1979 100.283 17.1979ZM100.358 16.2655C101.03 16.2655 101.545 16.0472 101.902 15.6105C102.263 15.1694 102.443 14.5458 102.443 13.7396C102.443 12.9249 102.263 12.2992 101.902 11.8624C101.541 11.4257 101.026 11.2073 100.358 11.2073C99.6906 11.2073 99.1615 11.4362 98.771 11.8939C98.3846 12.3474 98.1914 12.9733 98.1914 13.7712C98.1914 14.5479 98.3867 15.1589 98.7773 15.6042C99.1678 16.0451 99.6948 16.2655 100.358 16.2655ZM114.802 17.0403H113.675V13.2419C113.675 12.5238 113.563 12.0052 113.341 11.6861C113.118 11.3669 112.747 11.2073 112.226 11.2073C111.781 11.2073 111.403 11.4089 111.092 11.8121C110.785 12.2152 110.632 12.7023 110.632 13.2735V17.0403H109.511V13.1223C109.511 12.484 109.387 12.0052 109.139 11.6861C108.896 11.3669 108.528 11.2073 108.037 11.2073C107.579 11.2073 107.201 11.3984 106.903 11.7806C106.609 12.1627 106.462 12.6625 106.462 13.2798V17.0403H105.341V10.4325H106.462V11.4782H106.487C106.723 11.0793 107.012 10.779 107.357 10.5774C107.701 10.3759 108.098 10.2751 108.547 10.2751C109.001 10.2751 109.394 10.399 109.725 10.6467C110.061 10.8945 110.294 11.2241 110.424 11.6357C110.668 11.1821 110.972 10.842 111.338 10.6152C111.707 10.3885 112.134 10.2751 112.617 10.2751C113.343 10.2751 113.889 10.4997 114.254 10.9491C114.62 11.3942 114.802 12.0661 114.802 12.9649V17.0403Z"
				fill="white"
			/>
			<path
				d="M68.0517 22.7739L65.1397 34.1979H62.3877L60.8357 28.1979C60.8037 28.0805 60.761 27.9045 60.7077 27.6699C60.665 27.4352 60.6117 27.1792 60.5477 26.9019C60.4944 26.6245 60.4464 26.3632 60.4037 26.1179C60.361 25.8619 60.329 25.6645 60.3077 25.5259C60.297 25.6645 60.265 25.8619 60.2117 26.1179C60.169 26.3632 60.121 26.6245 60.0677 26.9019C60.0144 27.1685 59.961 27.4245 59.9077 27.6699C59.8544 27.9045 59.8117 28.0859 59.7797 28.2139L58.2437 34.1979H55.4917L52.5797 22.7739H54.9637L56.4197 29.0139C56.4624 29.1952 56.5104 29.4192 56.5637 29.6859C56.617 29.9419 56.6704 30.2139 56.7237 30.5019C56.777 30.7792 56.825 31.0512 56.8677 31.3179C56.921 31.5845 56.9584 31.8139 56.9797 32.0059C57.001 31.8032 57.033 31.5739 57.0757 31.3179C57.1184 31.0512 57.1664 30.7845 57.2197 30.5179C57.273 30.2405 57.321 29.9845 57.3637 29.7499C57.417 29.5045 57.465 29.3125 57.5077 29.1739L59.1717 22.7739H61.4597L63.1237 29.1739C63.1557 29.3125 63.1984 29.5045 63.2517 29.7499C63.305 29.9845 63.3584 30.2405 63.4117 30.5179C63.465 30.7952 63.513 31.0672 63.5557 31.3339C63.5984 31.5899 63.6304 31.8139 63.6517 32.0059C63.6837 31.7392 63.7317 31.4245 63.7957 31.0619C63.8597 30.6885 63.929 30.3152 64.0037 29.9419C64.089 29.5685 64.1584 29.2592 64.2117 29.0139L65.6677 22.7739H68.0517ZM71.6805 25.4619V34.1979H69.2965V25.4619H71.6805ZM70.4965 22.0379C70.8485 22.0379 71.1525 22.1232 71.4085 22.2939C71.6645 22.4539 71.7925 22.7579 71.7925 23.2059C71.7925 23.6432 71.6645 23.9472 71.4085 24.1179C71.1525 24.2885 70.8485 24.3739 70.4965 24.3739C70.1338 24.3739 69.8245 24.2885 69.5685 24.1179C69.3231 23.9472 69.2005 23.6432 69.2005 23.2059C69.2005 22.7579 69.3231 22.4539 69.5685 22.2939C69.8245 22.1232 70.1338 22.0379 70.4965 22.0379ZM79.1315 25.3019C80.0701 25.3019 80.8221 25.5579 81.3875 26.0699C81.9528 26.5712 82.2355 27.3819 82.2355 28.5019V34.1979H79.8515V29.0939C79.8515 28.4645 79.7395 27.9952 79.5155 27.6859C79.2915 27.3659 78.9341 27.2059 78.4435 27.2059C77.7181 27.2059 77.2221 27.4565 76.9555 27.9579C76.6888 28.4485 76.5555 29.1579 76.5555 30.0859V34.1979H74.1715V25.4619H75.9955L76.3155 26.5819H76.4435C76.6355 26.2832 76.8701 26.0432 77.1475 25.8619C77.4248 25.6699 77.7341 25.5312 78.0755 25.4459C78.4168 25.3499 78.7688 25.3019 79.1315 25.3019ZM83.9191 30.8859V28.9339H88.1111V30.8859H83.9191ZM93.6833 22.7739C95.1553 22.7739 96.2273 23.0939 96.8993 23.7339C97.582 24.3632 97.9233 25.2325 97.9233 26.3419C97.9233 26.8432 97.8487 27.3232 97.6993 27.7819C97.55 28.2299 97.2993 28.6352 96.9473 28.9979C96.606 29.3499 96.1527 29.6272 95.5873 29.8299C95.022 30.0325 94.3233 30.1339 93.4913 30.1339H92.4513V34.1979H90.0353V22.7739H93.6833ZM93.5553 24.7579H92.4513V28.1499H93.2513C93.71 28.1499 94.1047 28.0912 94.4353 27.9739C94.766 27.8565 95.022 27.6699 95.2033 27.4139C95.3847 27.1579 95.4753 26.8272 95.4753 26.4219C95.4753 25.8565 95.3207 25.4405 95.0113 25.1739C94.702 24.8965 94.2167 24.7579 93.5553 24.7579ZM107.826 29.8139C107.826 30.5392 107.725 31.1845 107.522 31.7499C107.33 32.3152 107.048 32.7952 106.674 33.1899C106.312 33.5739 105.869 33.8672 105.346 34.0699C104.824 34.2619 104.232 34.3579 103.57 34.3579C102.962 34.3579 102.397 34.2619 101.874 34.0699C101.362 33.8672 100.92 33.5739 100.546 33.1899C100.173 32.7952 99.8795 32.3152 99.6662 31.7499C99.4635 31.1845 99.3622 30.5392 99.3622 29.8139C99.3622 28.8432 99.5329 28.0272 99.8742 27.3659C100.216 26.6939 100.706 26.1819 101.346 25.8299C101.986 25.4779 102.744 25.3019 103.618 25.3019C104.44 25.3019 105.165 25.4779 105.794 25.8299C106.424 26.1819 106.92 26.6939 107.282 27.3659C107.645 28.0272 107.826 28.8432 107.826 29.8139ZM101.794 29.8139C101.794 30.3899 101.853 30.8752 101.97 31.2699C102.098 31.6539 102.296 31.9472 102.562 32.1499C102.829 32.3419 103.176 32.4379 103.602 32.4379C104.029 32.4379 104.37 32.3419 104.626 32.1499C104.893 31.9472 105.085 31.6539 105.202 31.2699C105.33 30.8752 105.394 30.3899 105.394 29.8139C105.394 29.2379 105.33 28.7579 105.202 28.3739C105.085 27.9899 104.893 27.7019 104.626 27.5099C104.36 27.3179 104.013 27.2219 103.586 27.2219C102.957 27.2219 102.498 27.4405 102.21 27.8779C101.933 28.3045 101.794 28.9499 101.794 29.8139ZM114.676 25.3019C114.794 25.3019 114.932 25.3072 115.092 25.3179C115.252 25.3285 115.38 25.3445 115.476 25.3659L115.3 27.6059C115.226 27.5845 115.114 27.5685 114.964 27.5579C114.826 27.5365 114.703 27.5259 114.596 27.5259C114.287 27.5259 113.988 27.5685 113.7 27.6539C113.412 27.7285 113.151 27.8512 112.916 28.0219C112.692 28.1925 112.511 28.4219 112.372 28.7099C112.244 28.9872 112.18 29.3339 112.18 29.7499V34.1979H109.796V25.4619H111.604L111.956 26.9339H112.068C112.239 26.6352 112.452 26.3632 112.708 26.1179C112.964 25.8725 113.258 25.6752 113.588 25.5259C113.93 25.3765 114.292 25.3019 114.676 25.3019ZM120.742 32.4539C121.009 32.4539 121.265 32.4272 121.51 32.3739C121.755 32.3205 122.001 32.2565 122.246 32.1819V33.9579C121.99 34.0645 121.67 34.1552 121.286 34.2299C120.913 34.3152 120.502 34.3579 120.054 34.3579C119.531 34.3579 119.062 34.2725 118.646 34.1019C118.241 33.9312 117.915 33.6379 117.67 33.2219C117.435 32.7952 117.318 32.2085 117.318 31.4619V27.2539H116.182V26.2459L117.494 25.4459L118.182 23.6059H119.702V25.4619H122.15V27.2539H119.702V31.4619C119.702 31.7925 119.798 32.0432 119.99 32.2139C120.182 32.3739 120.433 32.4539 120.742 32.4539ZM127.584 25.2859C128.757 25.2859 129.653 25.5419 130.272 26.0539C130.901 26.5552 131.216 27.3285 131.216 28.3739V34.1979H129.552L129.088 33.0139H129.024C128.778 33.3232 128.522 33.5792 128.256 33.7819C128 33.9845 127.701 34.1285 127.36 34.2139C127.029 34.3099 126.618 34.3579 126.128 34.3579C125.616 34.3579 125.152 34.2619 124.736 34.0699C124.33 33.8672 124.01 33.5632 123.776 33.1579C123.541 32.7419 123.424 32.2192 123.424 31.5899C123.424 30.6619 123.749 29.9792 124.4 29.5419C125.05 29.0939 126.026 28.8485 127.328 28.8059L128.848 28.7579V28.3739C128.848 27.9152 128.725 27.5792 128.48 27.3659C128.245 27.1525 127.914 27.0459 127.488 27.0459C127.061 27.0459 126.645 27.1099 126.24 27.2379C125.834 27.3552 125.429 27.5045 125.024 27.6859L124.24 26.0699C124.709 25.8245 125.226 25.6325 125.792 25.4939C126.368 25.3552 126.965 25.2859 127.584 25.2859ZM127.92 30.1819C127.152 30.2032 126.618 30.3419 126.32 30.5979C126.021 30.8539 125.872 31.1899 125.872 31.6059C125.872 31.9685 125.978 32.2299 126.192 32.3899C126.405 32.5392 126.682 32.6139 127.024 32.6139C127.536 32.6139 127.968 32.4645 128.32 32.1659C128.672 31.8565 128.848 31.4245 128.848 30.8699V30.1499L127.92 30.1819ZM136.04 24.8699C136.04 25.2005 136.029 25.5259 136.008 25.8459C135.987 26.1659 135.965 26.4165 135.944 26.5979H136.04C136.275 26.2352 136.589 25.9312 136.984 25.6859C137.379 25.4299 137.891 25.3019 138.52 25.3019C139.501 25.3019 140.296 25.6859 140.904 26.4539C141.512 27.2112 141.816 28.3312 141.816 29.8139C141.816 30.8059 141.672 31.6432 141.384 32.3259C141.107 32.9979 140.717 33.5045 140.216 33.8459C139.715 34.1872 139.128 34.3579 138.456 34.3579C137.816 34.3579 137.309 34.2459 136.936 34.0219C136.573 33.7872 136.275 33.5259 136.04 33.2379H135.88L135.48 34.1979H133.656V22.0379H136.04V24.8699ZM137.752 27.2059C137.336 27.2059 137.005 27.2912 136.76 27.4619C136.515 27.6325 136.333 27.8939 136.216 28.2459C136.109 28.5872 136.051 29.0192 136.04 29.5419V29.7979C136.04 30.6405 136.163 31.2912 136.408 31.7499C136.664 32.1979 137.123 32.4219 137.784 32.4219C138.275 32.4219 138.664 32.1979 138.952 31.7499C139.24 31.2912 139.384 30.6352 139.384 29.7819C139.384 28.9285 139.235 28.2885 138.936 27.8619C138.648 27.4245 138.253 27.2059 137.752 27.2059ZM146.165 34.1979H143.781V22.0379H146.165V34.1979ZM152.256 25.3019C153.067 25.3019 153.76 25.4565 154.336 25.7659C154.923 26.0752 155.376 26.5232 155.696 27.1099C156.016 27.6965 156.176 28.4165 156.176 29.2699V30.4219H150.544C150.565 31.0939 150.763 31.6219 151.136 32.0059C151.52 32.3899 152.048 32.5819 152.72 32.5819C153.285 32.5819 153.797 32.5285 154.256 32.4219C154.715 32.3045 155.189 32.1285 155.68 31.8939V33.7339C155.253 33.9472 154.8 34.1019 154.32 34.1979C153.851 34.3045 153.28 34.3579 152.608 34.3579C151.733 34.3579 150.96 34.1979 150.288 33.8779C149.616 33.5472 149.088 33.0512 148.704 32.3899C148.32 31.7285 148.128 30.8965 148.128 29.8939C148.128 28.8699 148.299 28.0219 148.64 27.3499C148.992 26.6672 149.477 26.1552 150.096 25.8139C150.715 25.4725 151.435 25.3019 152.256 25.3019ZM152.272 26.9979C151.813 26.9979 151.429 27.1472 151.12 27.4459C150.821 27.7445 150.645 28.2085 150.592 28.8379H153.936C153.936 28.4859 153.872 28.1712 153.744 27.8939C153.627 27.6165 153.445 27.3979 153.2 27.2379C152.955 27.0779 152.645 26.9979 152.272 26.9979Z"
				fill="white"
			/>
		</svg>
	);
}

export function Microsoft(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path fill="#F25022" d="M1 1h6.5v6.5H1V1z"></path>
				<path fill="#7FBA00" d="M8.5 1H15v6.5H8.5V1z"></path>
				<path fill="#00A4EF" d="M1 8.5h6.5V15H1V8.5z"></path>
				<path fill="#FFB900" d="M8.5 8.5H15V15H8.5V8.5z"></path>
			</g>
		</svg>
	);
}

export const LoLGame: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="30" height="32" viewBox="0 0 30 32" fill="none" className={` block  ${defaultSize}`}>
			<g>
				<path
					d="M1.80644 9.75049C0.655032 11.8373 0 14.2271 0 16.7683C0 19.3095 0.655032 21.7015 1.80644 23.7883V9.75049Z"
					fill="#C28F2C"
				></path>{' '}
				<path
					d="M15 2.02222C13.7829 2.02222 12.602 2.16921 11.4688 2.43647V4.75718C12.5907 4.44093 13.7738 4.26721 15 4.26721C22.0218 4.26721 27.7153 9.84627 27.7153 16.7305C27.7153 19.8307 26.5571 22.6659 24.6464 24.8463L24.2838 26.118L23.4814 28.9331C27.4184 26.2761 30.0023 21.8195 30.0023 16.7705C30 8.62355 23.2843 2.02222 15 2.02222Z"
					fill="#C28F2C"
				></path>{' '}
				<path
					d="M11.4688 24.4209H22.9737H23.2253C25.1723 22.4209 26.3713 19.7126 26.3713 16.7305C26.3713 10.5746 21.2806 5.58569 15 5.58569C13.767 5.58569 12.5816 5.78168 11.4688 6.1358V24.4209Z"
					fill="#C28F2C"
				></path>{' '}
				<path d="M10.1088 0H1.55029L3.16634 3.29844V28.7038L1.55029 32H21.1922L22.9737 25.7572H10.1088V0Z" fill="#C28F2C"></path>
			</g>
		</svg>
	);
};

export const Spotify: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			enableBackground="new 0 0 40 40"
			viewBox="0 0 40 40"
			id="spotify"
			className={` block  ${defaultSize}`}
		>
			<switch>
				<g>
					<g>
						<circle cx="20" cy="20" r="16" fill="#1ed35a"></circle>
						<path d="M31 18.5c-.2 0-.4 0-.7-.1-3.3-1.6-6.8-2.5-10.5-2.8-3.2-.2-6.4.1-9.5.9-.8.2-1.6-.3-1.8-1.1-.2-.8.3-1.6 1.1-1.8 3.4-.9 7-1.3 10.5-1 4 .3 7.9 1.3 11.5 3.1.7.4 1.1 1.3.7 2C32.1 18.2 31.6 18.5 31 18.5zM28.9 23c-.2 0-.4 0-.5-.1-2.6-1.4-5.5-2.3-8.5-2.6-2.8-.3-5.8 0-8.5.9-.6.2-1.2-.2-1.4-.7-.2-.6.2-1.2.7-1.4 3-.9 6.2-1.2 9.3-.9 3.3.3 6.5 1.3 9.3 2.8.5.3.7 1 .4 1.5C29.7 22.8 29.3 23 28.9 23zM26.7 27.5c-.2 0-.3 0-.4-.1-1.1-.8-2.4-1.4-3.7-1.9-4.3-1.5-8.4-.8-11 0-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 2.9-.9 7.3-1.7 12.1 0 1.4.5 2.8 1.2 4 2 .4.2.5.7.2 1.1C27.2 27.4 27 27.5 26.7 27.5z"></path>
					</g>
				</g>
			</switch>
		</svg>
	);
};

export const VisualStudioCode: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="visual-studio-code" className={` block  ${defaultSize}`}>
			<path
				fill="#1677C7"
				d="m2.419 13.939 3.434-2.589L12 17l3-1.456V4.456L12 3 5.853 8.65 2.418 6.062 1 6.889 4.385 10 1 13.111l1.419.828zM12 6.717v6.566L7.644 10 12 6.717z"
			></path>
			<path fill="#1677C7" d="M18 19.484 0 17.939v.561L18 24l6-2.5v-19L18 0z"></path>
		</svg>
	);
};

export function ShadowBotIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			version="1.1"
			id="_x32_"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 512 512"
			xmlSpace="preserve"
			fill="currentColor"
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<g>
					{' '}
					<path
						className="st0"
						d="M406.591,354.932c-16.943-6.336-36.233-16.2-36.233-28.963c0-8.45,0-19.007,0-33.489 c6.194-17.19,15.514-18.42,20.181-44.803c10.861-3.882,17.07-10.09,24.819-37.251c5.827-20.443-2.757-25.93-8.315-27.394 c0.113-1.089,0.226-2.185,0.325-3.472c2.093-30.618,19.87-121.503-41.678-132.365c-16.292-12.671-26.63-18.413-61.547-16.292 c-22.104-0.008-38.905,4.872-62.31-1.818C227.578,41.045,221.653,65.503,219.8,92.48c-4.101-2.871-8.414-5.459-13.492-7.425 c-7.707-2.984-16.504-4.32-27.761-4.306c-3.507,0-7.297,0.128-11.398,0.375c-11.766,0.07-21.186,1.463-29.939,1.428 c-6.138-0.006-12.036-0.58-18.965-2.552l-5.544-1.584l-4.426,3.706c-5.176,4.356-9.079,9.836-12.092,15.818 c-4.497,9.002-7.099,19.248-8.725,30.102c-1.612,10.847-2.192,22.316-2.192,33.666c0,18.936,1.612,37.548,3.069,51.874 c-0.778,0.616-1.556,1.231-2.292,2.016c-1.895,2.022-3.535,4.617-4.582,7.552c-1.061,2.935-1.57,6.166-1.57,9.588 c0,4.038,0.679,8.358,2.05,13.174c3.436,11.922,6.548,19.933,11.06,26.333c2.248,3.168,4.95,5.848,7.863,7.863 c1.004,0.708,2.037,1.238,3.055,1.789c2.503,9.708,6.364,17.062,9.687,22.224c1.966,3.069,3.662,5.459,4.597,7.05 c0.466,0.792,0.749,1.372,0.876,1.683l0.029,0.078c0,11.576,0,20.167,0,27.047l-0.198,0.438c-0.325,0.601-1.216,1.747-2.659,3.012 c-4.313,3.939-13.237,8.316-20.365,10.763c-12.204,4.334-35.568,12.805-56.456,29.514c-10.437,8.365-20.308,18.894-27.591,32.11 C4.554,429.003-0.014,444.885,0,463.192c0,3.182,0.142,6.435,0.411,9.765l0.834,9.956h116.886h1.768h391.657 C518.781,396.291,436.021,365.942,406.591,354.932z M259.328,325.969c0,12.763-20.832,23.533-36.233,28.963 c-27.012,9.518-97.964,36.063-104.851,106.258H21.85c0.325-13.802,3.692-25.173,9.023-34.896 c8.373-15.267,21.85-26.701,35.695-35.045c13.845-8.351,27.775-13.484,36.544-16.567c7.155-2.546,15.429-6.174,22.684-11.201 c3.62-2.539,7.042-5.424,9.885-9.143c2.8-3.663,5.134-8.528,5.148-14.256c0-7.106,0-15.981,0-28.157v-0.559l-0.057-0.558 c-0.495-4.54-2.277-7.962-3.889-10.72c-2.503-4.158-5.048-7.438-7.326-11.603c-2.263-4.144-4.342-9.051-5.6-16.123l-1.104-6.215 l-5.94-2.122c-1.739-0.629-2.814-1.167-3.649-1.754c-1.202-0.877-2.39-1.972-4.228-5.352c-1.782-3.338-3.875-8.803-6.208-16.978 c-0.948-3.302-1.23-5.693-1.216-7.206c0-1.294,0.184-1.944,0.268-2.199l0.029-0.07l0.353-0.106l9.433-2.122l-1.004-9.617 c-1.57-14.771-3.719-36.006-3.705-56.915c-0.014-14.128,1.004-28.094,3.62-39.415c1.301-5.664,2.998-10.634,4.993-14.616 c1.004-1.994,2.064-3.72,3.182-5.198c6.576,1.343,12.714,1.803,18.428,1.796c11.059-0.036,20.407-1.471,30.462-1.442h0.325 l0.325-0.021c3.819-0.233,7.199-0.34,10.225-0.34c9.674,0.007,15.387,1.103,19.927,2.85c4.539,1.747,8.528,4.448,14.27,8.931 l1.697,1.315l4.695,2.093c0.227,24.416,2.644,48.452,4.413,65.217c-5.502,1.23-14.977,6.336-8.91,27.549 c7.75,27.16,13.958,33.369,24.82,37.251c4.653,26.383,18.838,34.854,19.87,44.803C259.328,306.962,259.328,317.519,259.328,325.969 z"
					></path>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function WindowMinimize(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
export function WindowZoom(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<path
				d="M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"
				fill="currentColor"
			/>
		</svg>
	);
}
export const GuideIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5', className }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fillRule="evenodd"
			strokeLinejoin="round"
			strokeMiterlimit="2"
			clipRule="evenodd"
			viewBox="0 0 32 32"
			fill="currentColor"
			className={`${defaultSize} ${className ?? ''}`}
		>
			<g transform="translate(-52 -156)">
				<path
					fill="currentColor"
					d="M72.125,117.091C72.125,116.657 71.769,116.241 71.136,115.934C70.504,115.627 69.645,115.455 68.75,115.455C68.26,115.455 67.74,115.455 67.25,115.455C66.355,115.455 65.496,115.627 64.864,115.934C64.231,116.241 63.875,116.657 63.875,117.091C63.875,120.012 63.875,127.988 63.875,130.909C63.875,131.343 64.231,131.759 64.864,132.066C65.496,132.373 66.355,132.545 67.25,132.545C67.74,132.545 68.26,132.545 68.75,132.545C69.645,132.545 70.504,132.373 71.136,132.066C71.769,131.759 72.125,131.343 72.125,130.909C72.125,127.988 72.125,120.012 72.125,117.091Z"
					transform="matrix(0 .66667 -1.375 0 238.5 139.667)"
				/>
				<path
					fill="currentColor"
					d="M67.25,157L67.25,183C67.25,183.414 67.586,183.75 68,183.75C68.414,183.75 68.75,183.414 68.75,183L68.75,157C68.75,156.586 68.414,156.25 68,156.25C67.586,156.25 67.25,156.586 67.25,157Z"
				/>
				<path
					fill="currentColor"
					d="M81.386,162.036C81.612,161.923 81.75,161.72 81.75,161.5C81.75,161.28 81.612,161.077 81.386,160.964L76.386,158.464C76.269,158.406 76.136,158.375 76,158.375L68,158.375C67.586,158.375 67.25,158.655 67.25,159L67.25,164C67.25,164.345 67.586,164.625 68,164.625L76,164.625C76.136,164.625 76.269,164.594 76.386,164.536L81.386,162.036Z"
					transform="matrix(1 0 0 1.2 0 -30.8)"
				/>
				<path
					fill="currentColor"
					d="M81.386,160.964C81.612,161.077 81.75,161.28 81.75,161.5C81.75,161.72 81.612,161.923 81.386,162.036L76.386,164.536C76.269,164.594 76.136,164.625 76,164.625L68,164.625C67.586,164.625 67.25,164.345 67.25,164L67.25,159C67.25,158.655 67.586,158.375 68,158.375L76,158.375C76.136,158.375 76.269,158.406 76.386,158.464L81.386,160.964Z"
					transform="matrix(-1 0 0 1.2 136 -20.8)"
				/>
			</g>
		</svg>
	);
};

export const RuleIcon: React.FC<IconProps> = ({ defaultSize = 'w-5 h-5', className }) => {
	return (
		<svg
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			className={`${defaultSize} ${className ?? ''}`}
			width="22"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M15 2a3 3 0 0 1 3 3v12H5.5a1.5 1.5 0 0 0 0 3h14a.5.5 0 0 0 .5-.5V5h1a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h10Zm-.3 5.7a1 1 0 0 0-1.4-1.4L9 10.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l5-5Z"
				clipRule="evenodd"
			/>
		</svg>
	);
};

export const CheckMarkFilter: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5', isWhite = false }) => {
	return (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
			className={`${defaultFill ? defaultFill : `dark:hover:text-white hover:text-black ${isWhite ? 'dark:text-white text-black' : 'text-theme-primary'}`} ${defaultSize}`}
		>
			<circle cx="12" cy="12" r="10" fill="transparent"></circle>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm5.7-13.3a1 1 0 0 0-1.4-1.4L10 14.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l7-7Z"
				clipRule="evenodd"
			></path>
		</svg>
	);
};

export function SendMoney(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0" />

			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.17999 10.16 8.48999 10.96 8.48999H12.84C13.76 8.48999 14.51 9.26999 14.51 10.24"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>{' '}
				<path d="M12 7.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />{' '}
				<path
					d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>{' '}
				<path d="M22 6V2H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />{' '}
				<path d="M17 7L22 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />{' '}
			</g>
		</svg>
	);
}

export function HashIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="channelIcon_a85c10"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M10.99 3.16A1 1 0 1 0 9 2.84L8.15 8H4a1 1 0 0 0 0 2h3.82l-.67 4H3a1 1 0 1 0 0 2h3.82l-.8 4.84a1 1 0 0 0 1.97.32L8.85 16h4.97l-.8 4.84a1 1 0 0 0 1.97.32l.86-5.16H20a1 1 0 1 0 0-2h-3.82l.67-4H21a1 1 0 1 0 0-2h-3.82l.8-4.84a1 1 0 1 0-1.97-.32L15.15 8h-4.97l.8-4.84ZM14.15 14l.67-4H9.85l-.67 4h4.97Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function TargetIcon({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) {
	return (
		<svg
			fill={defaultFill}
			className={`${defaultSize}`}
			height="20px"
			width="20px"
			version="1.1"
			id="Icons"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 32 32"
			xmlSpace="preserve"
		>
			<path
				d="M30.9,5.6C30.8,5.2,30.4,5,30,5h-3V2c0-0.4-0.2-0.8-0.6-0.9C26,0.9,25.6,1,25.3,1.3l-4,4C21.1,5.5,21,5.7,21,6v3.6l-5.7,5.7
	c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l5.7-5.7H26c0.3,0,0.5-0.1,0.7-0.3l4-4C31,6.4,31.1,6,30.9,5.6z"
			/>
			<path
				d="M18.1,18.1C17.6,18.7,16.8,19,16,19s-1.6-0.3-2.1-0.9c-1.2-1.2-1.2-3.1,0-4.2l2.8-2.8C16.5,11,16.2,11,16,11
	c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5c0-0.2,0-0.5-0.1-0.7L18.1,18.1z"
			/>
			<path
				d="M28.1,12.1C27.6,12.7,26.8,13,26,13h-2.8l-0.7,0.7c0.3,0.7,0.4,1.5,0.4,2.3c0,3.9-3.1,7-7,7s-7-3.1-7-7s3.1-7,7-7
	c0.8,0,1.6,0.2,2.3,0.4L19,8.8V6c0-0.8,0.3-1.6,0.9-2.1l1-1C19.3,2.3,17.7,2,16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14
	c0-1.7-0.3-3.3-0.9-4.9L28.1,12.1z"
			/>
		</svg>
	);
}

export function LongArrowRight(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="" {...props}>
			<path
				fill="currentColor"
				d="M20.7 12.7a1 1 0 0 0 0-1.4l-5-5a1 1 0 1 0-1.4 1.4l3.29 3.3H4a1 1 0 1 0 0 2h13.59l-3.3 3.3a1 1 0 0 0 1.42 1.4l5-5Z"
				className=""
			></path>
		</svg>
	);
}

export function CirclePlusFill(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg className="plusIcon_df2e1e" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
			<circle cx="12" cy="12" r="10" fill="transparent" className=""></circle>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm0-17a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H7a1 1 0 1 1 0-2h4V7a1 1 0 0 1 1-1Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function LoadingSpinner({ className }: { className?: string }) {
	return (
		<svg
			className={`inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 ${className}`}
			viewBox="0 0 100 101"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
				fill="currentColor"
			/>
			<path
				d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
				fill="currentFill"
			/>
		</svg>
	);
}

export function StopCall(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="28px" height="28px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0" />

			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

			<g id="SVGRepo_iconCarrier">
				{' '}
				<path
					d="m 14.234375 11.714844 c -0.382813 0.382812 -1 0.382812 -1.386719 0 l -1.039062 -1.039063 l -1.039063 -1.042969 c -0.386719 -0.382812 -0.386719 -1 0 -1.386718 l 0.492188 -0.492188 c -2.035157 -1.109375 -4.5 -1.109375 -6.535157 0 l 0.492188 0.492188 c 0.386719 0.386718 0.386719 1.003906 0 1.386718 l -1.039062 1.042969 l -1.039063 1.039063 c -0.386719 0.382812 -1.003906 0.382812 -1.386719 0 l -1.042968 -1.039063 c -0.957032 -0.957031 -0.957032 -2.511719 0 -3.46875 l 0.347656 -0.347656 c 3.816406 -3.816406 10.054687 -3.816406 13.871094 0 l 0.347656 0.347656 c 0.957031 0.957031 0.957031 2.511719 0 3.46875 z m 0 0"
					fill="currentColor"
				/>{' '}
			</g>
		</svg>
	);
}

export function StartCall(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="24px" height="24px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0" />

			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

			<g id="SVGRepo_iconCarrier">
				{' '}
				<g fill="#ffffff">
					{' '}
					<path d="m 5.003906 2 c 0.554688 0 1 0.445312 1 1 v 3 c 0 0.554688 -0.445312 1 -1 1 h -0.710937 c 0.671875 2.265625 2.445312 4.042969 4.710937 4.710938 v -0.710938 c 0 -0.554688 0.449219 -1 1 -1 h 3 c 0.554688 0 1 0.445312 1 1 v 1.5 c 0 1.378906 -1.117187 2.5 -2.5 2.5 h -0.5 c -5.503906 0 -10 -4.496094 -10 -10 v -0.5 c 0 -1.378906 1.121094 -2.5 2.5 -2.5 z m 0 0" />{' '}
					<path d="m 9 1 c -0.550781 0 -1 0.449219 -1 1 v 6 h 6 c 0.550781 0 1 -0.449219 1 -1 s -0.449219 -1 -1 -1 h -2.585938 l 4.292969 -4.292969 c 0.390625 -0.390625 0.390625 -1.023437 0 -1.414062 c -0.1875 -0.1875 -0.441406 -0.292969 -0.707031 -0.292969 s -0.519531 0.105469 -0.707031 0.292969 l -4.292969 4.292969 v -2.585938 c 0 -0.550781 -0.449219 -1 -1 -1 z m 0 0" />{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function Microphone({ isMuteMicrophone = false, isShowLine = false, ...props }) {
	return (
		<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<path
				d="M19 10V12C19 15.866 15.866 19 12 19M5 10V12C5 15.866 8.13401 19 12 19M12 19V22M8 22H16M12 15C10.3431 15 9 13.6569 9 12V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V12C15 13.6569 13.6569 15 12 15Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{isShowLine && (
				<>
					<line
						x1="4"
						y1="20"
						x2="20"
						y2="4"
						stroke="white"
						strokeLinecap="round"
						strokeWidth="3.5"
						className={`line-animation ${!isMuteMicrophone ? 'line-retract' : ''}`}
					/>
					<line
						x1="4"
						y1="20"
						x2="20"
						y2="4"
						stroke="black"
						strokeLinecap="round"
						strokeWidth="1.5"
						className={`line-animation ${!isMuteMicrophone ? 'line-retract' : ''}`}
					/>
				</>
			)}
		</svg>
	);
}

export function MicEnable(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg fill="currentColor" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path d="M 35.1016 28.0000 L 35.1016 11.2656 C 35.1016 6.9297 32.1719 3.7187 28 3.7187 C 23.8281 3.7187 20.8984 6.9297 20.8984 11.2656 L 20.8984 28.0000 C 20.8984 32.3125 23.8281 35.5469 28 35.5469 C 32.1719 35.5469 35.1016 32.3125 35.1016 28.0000 Z M 17.0547 48.7422 C 16.1172 48.7422 15.2969 49.5859 15.2969 50.5234 C 15.2969 51.4609 16.1172 52.2813 17.0547 52.2813 L 38.9453 52.2813 C 39.8828 52.2813 40.7031 51.4609 40.7031 50.5234 C 40.7031 49.5859 39.8828 48.7422 38.9453 48.7422 L 29.7578 48.7422 L 29.7578 43.6094 C 38.2890 42.8594 43.9375 36.5547 43.9375 27.9766 L 43.9375 22.4687 C 43.9375 21.5547 43.1172 20.7578 42.2031 20.7578 C 41.2890 20.7578 40.4922 21.5547 40.4922 22.4687 L 40.4922 27.9766 C 40.4922 35.125 35.3359 40.375 28 40.375 C 20.6641 40.375 15.5078 35.125 15.5078 27.9766 L 15.5078 22.4687 C 15.5078 21.5547 14.7110 20.7578 13.7969 20.7578 C 12.8828 20.7578 12.0625 21.5547 12.0625 22.4687 L 12.0625 27.9766 C 12.0625 36.5547 17.7110 42.8594 26.2188 43.6094 L 26.2188 48.7422 Z"></path>
			</g>
		</svg>
	);
}

export function MicDisable(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg fill="currentColor" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path d="M 33.7891 25.5859 L 33.7891 11.2656 C 33.7891 6.9297 30.8828 3.7187 26.7110 3.7187 C 22.6094 3.7187 19.6094 6.8125 19.6094 11.0078 L 19.6094 11.3828 Z M 46.3281 47.1484 C 47.0313 47.8516 48.1797 47.8516 48.8594 47.1484 C 49.5859 46.4687 49.5859 45.2969 48.8594 44.5937 L 9.6719 5.4062 C 8.9688 4.7031 7.7735 4.7031 7.0938 5.4062 C 6.4141 6.1094 6.4141 7.2813 7.0938 7.9609 Z M 15.7657 48.7422 C 14.8281 48.7422 13.9844 49.5859 13.9844 50.5234 C 13.9844 51.4609 14.8281 52.2813 15.7657 52.2813 L 37.6328 52.2813 C 38.5703 52.2813 39.4141 51.4609 39.4141 50.5234 C 39.4141 49.5859 38.5703 48.7422 37.6328 48.7422 L 28.4688 48.7422 L 28.4688 43.6094 C 31.4453 43.3516 34.0469 42.3906 36.1797 40.8906 L 33.6719 38.3828 C 31.7735 39.6484 29.4062 40.375 26.7110 40.375 C 19.3516 40.375 14.2188 35.125 14.2188 27.9766 L 14.2188 22.5391 C 14.2188 21.4375 13.5157 20.7578 12.4844 20.7578 C 11.4531 20.7578 10.7735 21.4375 10.7735 22.5391 L 10.7735 27.9766 C 10.7735 36.5547 16.3984 42.8594 24.9297 43.6094 L 24.9297 48.7422 Z M 42.6250 22.5391 C 42.6250 21.4375 41.9453 20.7578 40.9141 20.7578 C 39.8828 20.7578 39.1797 21.4375 39.1797 22.5391 L 39.1797 27.9766 C 39.1797 28.9140 39.0859 29.8047 38.8984 30.6953 L 41.7578 33.5313 C 42.3203 31.8203 42.6250 29.9687 42.6250 27.9766 Z M 29.9453 34.6562 L 19.6094 24.3203 L 19.6094 28.0000 C 19.6094 32.3125 22.5157 35.5469 26.7110 35.5469 C 27.9531 35.5469 29.0313 35.2187 29.9453 34.6562 Z"></path>
			</g>
		</svg>
	);
}

export const WelcomeIcon: React.FC<IconProps> = ({ defaultSize = 'w-12 h-12 min-w-8' }) => {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area">
				<line x1="2" y1="9" x2="10" y2="9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M10.0893 3.41075C10.4148 3.08531 10.9424 3.08531 11.2679 3.41075L16.2679 8.41075C16.5933 8.73619 16.5933 9.26382 16.2679 9.58926L11.2679 14.5893C10.9424 14.9147 10.4148 14.9147 10.0893 14.5893C9.7639 14.2638 9.7639 13.7362 10.0893 13.4107L14.5 9L10.0893 4.58926C9.7639 4.26382 9.7639 3.73619 10.0893 3.41075Z"
					fill="#16A34A"
				/>
			</g>
		</svg>
	);
};

export const UpcomingEventIcon: React.FC<IconProps> = ({ defaultSize = 'w-12 h-12 min-w-8' }) => {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area">
				<line x1="2" y1="9" x2="10" y2="9" stroke="rgba(163, 22, 22, 1)" strokeWidth="2" strokeLinecap="round" />
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M10.0893 3.41075C10.4148 3.08531 10.9424 3.08531 11.2679 3.41075L16.2679 8.41075C16.5933 8.73619 16.5933 9.26382 16.2679 9.58926L11.2679 14.5893C10.9424 14.9147 10.4148 14.9147 10.0893 14.5893C9.7639 14.2638 9.7639 13.7362 10.0893 13.4107L14.5 9L10.0893 4.58926C9.7639 4.26382 9.7639 3.73619 10.0893 3.41075Z"
					fill="rgba(163, 22, 22, 1)"
				/>
			</g>
		</svg>
	);
};

export const AuditLogIcon: React.FC<IconProps> = ({ defaultSize = 'w-12 h-12 min-w-8' }) => {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={defaultSize}>
			<g id="Live area">
				<line x1="2" y1="9" x2="10" y2="9" stroke="#186CF2" strokeWidth="2" strokeLinecap="round" />
				<path
					id="Vector"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M10.0893 3.41075C10.4148 3.08531 10.9424 3.08531 11.2679 3.41075L16.2679 8.41075C16.5933 8.73619 16.5933 9.26382 16.2679 9.58926L11.2679 14.5893C10.9424 14.9147 10.4148 14.9147 10.0893 14.5893C9.7639 14.2638 9.7639 13.7362 10.0893 13.4107L14.5 9L10.0893 4.58926C9.7639 4.26382 9.7639 3.73619 10.0893 3.41075Z"
					fill="#186CF2"
				/>
			</g>
		</svg>
	);
};

export function InfoIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			/>
		</svg>
	);
}

export const OutGoingCall: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="call" fill="none" className={` block  ${defaultSize}`}>
			<path
				d="M19.44,13c-.22,0-.45-.07-.67-.12a9.44,9.44,0,0,1-1.31-.39,2,2,0,0,0-2.48,1l-.22.45a12.18,12.18,0,0,1-2.66-2,12.18,12.18,0,0,1-2-2.66L10.52,9a2,2,0,0,0,1-2.48,10.33,10.33,0,0,1-.39-1.31c-.05-.22-.09-.45-.12-.68a3,3,0,0,0-3-2.49h-3a3,3,0,0,0-3,3.41A19,19,0,0,0,18.53,21.91l.38,0a3,3,0,0,0,2-.76,3,3,0,0,0,1-2.25v-3A3,3,0,0,0,19.44,13Zm.5,6a1,1,0,0,1-.34.75,1.06,1.06,0,0,1-.82.25A17,17,0,0,1,4.07,5.22a1.09,1.09,0,0,1,.25-.82,1,1,0,0,1,.75-.34h3a1,1,0,0,1,1,.79q.06.41.15.81a11.12,11.12,0,0,0,.46,1.55l-1.4.65a1,1,0,0,0-.49,1.33,14.49,14.49,0,0,0,7,7,1,1,0,0,0,.76,0,1,1,0,0,0,.57-.52l.62-1.4a13.69,13.69,0,0,0,1.58.46q.4.09.81.15a1,1,0,0,1,.79,1ZM21.86,2.68a1,1,0,0,0-.54-.54,1,1,0,0,0-.38-.08h-4a1,1,0,1,0,0,2h1.58l-3.29,3.3a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l3.3-3.29V7.06a1,1,0,0,0,2,0v-4A1,1,0,0,0,21.86,2.68Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export const IncomingCall: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="call" fill="none" className={` block  ${defaultSize}`}>
			<path
				d="M15.55,9a1.07,1.07,0,0,0,.39.07h4a1,1,0,0,0,0-2H18.35l3.29-3.29a1,1,0,1,0-1.41-1.41L16.94,5.65V4.06a1,1,0,1,0-2,0v4a1.07,1.07,0,0,0,.07.39A1,1,0,0,0,15.55,9Zm3.89,4c-.22,0-.45-.07-.67-.12a9.44,9.44,0,0,1-1.31-.39,2,2,0,0,0-2.48,1l-.22.45a12.18,12.18,0,0,1-2.66-2,12.18,12.18,0,0,1-2-2.66L10.52,9a2,2,0,0,0,1-2.48,10.33,10.33,0,0,1-.39-1.31c-.05-.22-.09-.45-.12-.68a3,3,0,0,0-3-2.49h-3a3,3,0,0,0-3,3.41A19,19,0,0,0,18.53,21.91l.38,0a3,3,0,0,0,2-.76,3,3,0,0,0,1-2.25v-3A3,3,0,0,0,19.44,13Zm.5,6a1,1,0,0,1-.34.75,1.06,1.06,0,0,1-.82.25A17,17,0,0,1,4.07,5.22a1.09,1.09,0,0,1,.25-.82,1,1,0,0,1,.75-.34h3a1,1,0,0,1,1,.79q.06.41.15.81a11.12,11.12,0,0,0,.46,1.55l-1.4.65a1,1,0,0,0-.49,1.33,14.49,14.49,0,0,0,7,7,1,1,0,0,0,.76,0,1,1,0,0,0,.57-.52l.62-1.4a13.69,13.69,0,0,0,1.58.46q.4.09.81.15a1,1,0,0,1,.79,1Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export const MissedCall: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="call" className={` block  ${defaultSize}`}>
			<path
				d="M6,7.49a1,1,0,0,0,1-1V5.9L9.88,8.78a3,3,0,0,0,4.24,0l4.59-4.59a1,1,0,0,0,0-1.41,1,1,0,0,0-1.42,0L12.71,7.36a1,1,0,0,1-1.42,0L8.41,4.49H9a1,1,0,0,0,0-2H6a1,1,0,0,0-.92.61A1.09,1.09,0,0,0,5,3.49v3A1,1,0,0,0,6,7.49Zm15.94,7.36a16.27,16.27,0,0,0-19.88,0,2.69,2.69,0,0,0-1,2,2.66,2.66,0,0,0,.78,2.07L3.6,20.72A2.68,2.68,0,0,0,7.06,21l.47-.32a8.13,8.13,0,0,1,1-.55,1.85,1.85,0,0,0,1-2.3l-.09-.24a10.49,10.49,0,0,1,5.22,0l-.09.24a1.85,1.85,0,0,0,1,2.3,8.13,8.13,0,0,1,1,.55l.47.32a2.58,2.58,0,0,0,1.54.5,2.72,2.72,0,0,0,1.92-.79l1.81-1.82A2.66,2.66,0,0,0,23,16.83,2.69,2.69,0,0,0,21.94,14.85ZM20.8,17.49,19,19.3a.68.68,0,0,1-.86.1c-.19-.14-.38-.27-.59-.4a11.65,11.65,0,0,0-1.09-.61l.4-1.09a1,1,0,0,0-.6-1.28,12.42,12.42,0,0,0-8.5,0,1,1,0,0,0-.6,1.28l.4,1.1a9.8,9.8,0,0,0-1.1.6l-.58.4A.66.66,0,0,1,5,19.3L3.2,17.49A.67.67,0,0,1,3,17a.76.76,0,0,1,.28-.53,14.29,14.29,0,0,1,17.44,0A.76.76,0,0,1,21,17,.67.67,0,0,1,20.8,17.49Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export const CancelCall: React.FC<IconProps> = ({ defaultFill = '#AEAEAE', defaultSize = 'w-5 h-5' }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="call-cancel" fill="none" className={` block  ${defaultSize}`}>
			<path
				d="M19.85,5.56l1.79-1.79a1,1,0,1,0-1.41-1.41L18.44,4.15l-1.8-1.79a1,1,0,0,0-1.41,1.41L17,5.56l-1.79,1.8a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L18.44,7l1.79,1.79a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM19.44,13c-.22,0-.45-.07-.67-.12a9.44,9.44,0,0,1-1.31-.39,2,2,0,0,0-2.48,1l-.22.45a12.18,12.18,0,0,1-2.66-2,12.18,12.18,0,0,1-2-2.66L10.52,9a2,2,0,0,0,1-2.48,10.33,10.33,0,0,1-.39-1.31c-.05-.22-.09-.45-.12-.68a3,3,0,0,0-3-2.49h-3a3,3,0,0,0-3,3.41A19,19,0,0,0,18.53,21.91l.38,0a3,3,0,0,0,2-.76,3,3,0,0,0,1-2.25v-3A3,3,0,0,0,19.44,13Zm.5,6a1,1,0,0,1-.34.75,1.06,1.06,0,0,1-.82.25A17,17,0,0,1,4.07,5.22a1.09,1.09,0,0,1,.25-.82,1,1,0,0,1,.75-.34h3a1,1,0,0,1,1,.79q.06.41.15.81a11.12,11.12,0,0,0,.46,1.55l-1.4.65a1,1,0,0,0-.49,1.33,14.49,14.49,0,0,0,7,7,1,1,0,0,0,.76,0,1,1,0,0,0,.57-.52l.62-1.4a13.69,13.69,0,0,0,1.58.46q.4.09.81.15a1,1,0,0,1,.79,1Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export function InPttCall(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="currentColor"
			className=""
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<title>ic_fluent_person_voice_24_filled</title> <desc>Created with Sketch.</desc>{' '}
				<g id="🔍-Product-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					{' '}
					<g id="ic_fluent_person_voice_24_filled" fill="currentColor" fillRule="nonzero">
						{' '}
						<path
							d="M14.7541747,14.999921 C15.9961948,14.999921 17.0030511,16.0067773 17.0030511,17.2487975 L17.0030511,18.1672553 C17.0030511,18.7406209 16.8238304,19.2996465 16.4904678,19.7661395 C14.9445793,21.9293884 12.4202806,23.0010712 9,23.0010712 C5.57903185,23.0010712 3.05606966,21.9289147 1.51390935,19.7645697 C1.18194679,19.2986691 1.00354153,18.7408416 1.00354153,18.1687745 L1.00354153,17.2487975 C1.00354153,16.0067773 2.0103978,14.999921 3.25241795,14.999921 L14.7541747,14.999921 Z M19.0539673,1.40356572 C19.4136007,1.19804993 19.8717446,1.32298689 20.0772604,1.68262022 C21.1678751,3.59109352 21.75,5.75404419 21.75,8 C21.75,10.253531 21.1639339,12.4234401 20.0663341,14.3364615 C19.8601976,14.6957394 19.4018387,14.8198852 19.0425608,14.6137487 C18.6832828,14.4076123 18.5591371,13.9492534 18.7652735,13.5899754 C19.733372,11.9026637 20.25,9.98984903 20.25,8 C20.25,6.0168344 19.7368452,4.11014998 18.7749128,2.42685873 C18.5693971,2.0672254 18.694334,1.60908151 19.0539673,1.40356572 Z M9,3.0046246 C11.7614237,3.0046246 14,5.24320085 14,8.0046246 C14,10.7660483 11.7614237,13.0046246 9,13.0046246 C6.23857625,13.0046246 4,10.7660483 4,8.0046246 C4,5.24320085 6.23857625,3.0046246 9,3.0046246 Z M15.5885024,3.39942904 C15.9485763,3.19468615 16.4064508,3.32060681 16.6111937,3.68068072 C17.3537737,4.98662919 17.75,6.46536363 17.75,8 C17.75,9.53814598 17.351956,11.020107 16.6061524,12.3281732 C16.4009899,12.6880082 15.9429689,12.813395 15.5831339,12.6082324 C15.2232989,12.4030699 15.0979122,11.9450489 15.3030747,11.5852139 C15.9206607,10.5020287 16.25,9.27586289 16.25,8 C16.25,6.72704469 15.922164,5.50354601 15.3072507,4.42212034 C15.1025078,4.06204643 15.2284285,3.60417194 15.5885024,3.39942904 Z"
							id="🎨-Color"
						>
							{' '}
						</path>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}
export function RightFilledTriangle(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z"></path>
			</g>
		</svg>
	);
}

export function PauseIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="-1 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					<g id="Dribbble-Light-Preview" transform="translate(-227.000000, -3765.000000)" fill="currentColor">
						<g id="icons" transform="translate(56.000000, 160.000000)">
							<path
								d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606"
								id="pause-[#1006]"
							>
								{' '}
							</path>{' '}
						</g>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function History(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="" {...props}>
			<path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path
				d="M3.05 11C3.27159 8.3288 4.51826 5.84755 6.53384 4.08373C8.54943 2.31991 11.1753 1.39728 13.8506 1.5215C16.5259 1.64571 19.0463 2.81031 20.8675 4.77142C22.6886 6.73253 23.6754 9.33897 23.6754 12.03C23.6754 14.721 22.6886 17.3275 20.8675 19.2886C19.0463 21.2497 16.5259 22.4143 13.8506 22.5385C11.1753 22.6627 8.54943 21.7401 6.53384 19.9763C4.51826 18.2124 3.27159 15.7312 3.05 13.06"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
export function HistoryTransaction(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} {...props}>
			<g>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M5.07868 5.06891C8.87402 1.27893 15.0437 1.31923 18.8622 5.13778C22.6824 8.95797 22.7211 15.1313 18.9262 18.9262C15.1312 22.7211 8.95793 22.6824 5.13774 18.8622C2.87389 16.5984 1.93904 13.5099 2.34047 10.5812C2.39672 10.1708 2.775 9.88377 3.18537 9.94002C3.59575 9.99627 3.88282 10.3745 3.82658 10.7849C3.4866 13.2652 4.27782 15.881 6.1984 17.8016C9.44288 21.0461 14.6664 21.0646 17.8655 17.8655C21.0646 14.6664 21.046 9.44292 17.8015 6.19844C14.5587 2.95561 9.33889 2.93539 6.13935 6.12957L6.88705 6.13333C7.30126 6.13541 7.63535 6.47288 7.63327 6.88709C7.63119 7.3013 7.29372 7.63539 6.87951 7.63331L4.33396 7.62052C3.92269 7.61845 3.58981 7.28556 3.58774 6.8743L3.57495 4.32874C3.57286 3.91454 3.90696 3.57707 4.32117 3.57498C4.73538 3.5729 5.07285 3.907 5.07493 4.32121L5.07868 5.06891Z"
					fill="currentColor"
				/>
				<path
					opacity="0.8"
					d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.5429 12.6036C11.3554 12.416 11.25 12.1617 11.25 11.8964V8C11.25 7.58579 11.5858 7.25 12 7.25Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
}

export function CalendarIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" id="calendar" {...props}>
			<path
				fill="currentColor"
				d="M14.262,4.441h-.771V3.653a.5.5,0,1,0-1,0v.788H7.509V3.653a.5.5,0,0,0-1,0v.788H5.738a2.5,2.5,0,0,0-2.5,2.5v7.406a2.5,2.5,0,0,0,2.5,2.5h8.524a2.5,2.5,0,0,0,2.5-2.5V6.941A2.5,2.5,0,0,0,14.262,4.441Zm-8.524,1h8.524a1.5,1.5,0,0,1,1.5,1.5v.376H4.238V6.941A1.5,1.5,0,0,1,5.738,5.441Zm8.524,10.406H5.738a1.5,1.5,0,0,1-1.5-1.5V8.317H15.762v6.03A1.5,1.5,0,0,1,14.262,15.847ZM6.821,10.49a.5.5,0,1,1-.707,0A.5.5,0,0,1,6.821,10.49Zm2.355,0a.5.5,0,1,1-.707,0A.5.5,0,0,1,9.176,10.49Zm2.355,0a.5.5,0,1,1-.707,0A.5.5,0,0,1,11.531,10.49Zm2.355,0a.5.5,0,1,1-.707,0A.5.5,0,0,1,13.886,10.49ZM6.821,12.968a.5.5,0,1,1-.707,0A.5.5,0,0,1,6.821,12.968Zm2.355,0a.5.5,0,1,1-.707,0A.5.5,0,0,1,9.176,12.968Zm2.355,0a.5.5,0,1,1-.707,0A.5.5,0,0,1,11.531,12.968Z"
			></path>
		</svg>
	);
}

export const FileIcon: React.FC<IconProps> = ({ isWhite, defaultSize = 'w-5 h-5' }) => {
	return (
		<svg
			className={defaultSize}
			data-testid="geist-icon"
			height="16"
			strokeLinejoin="round"
			style={{ color: 'currentColor' }}
			viewBox="0 0 16 16"
			width="16"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M10.8591 1.70735C10.3257 1.70735 9.81417 1.91925 9.437 2.29643L3.19455 8.53886C2.56246 9.17095 2.20735 10.0282 2.20735 10.9222C2.20735 11.8161 2.56246 12.6734 3.19455 13.3055C3.82665 13.9376 4.68395 14.2927 5.57786 14.2927C6.47178 14.2927 7.32908 13.9376 7.96117 13.3055L14.2036 7.06304L14.7038 6.56287L15.7041 7.56321L15.204 8.06337L8.96151 14.3058C8.06411 15.2032 6.84698 15.7074 5.57786 15.7074C4.30875 15.7074 3.09162 15.2032 2.19422 14.3058C1.29682 13.4084 0.792664 12.1913 0.792664 10.9222C0.792664 9.65305 1.29682 8.43592 2.19422 7.53852L8.43666 1.29609C9.07914 0.653606 9.95054 0.292664 10.8591 0.292664C11.7678 0.292664 12.6392 0.653606 13.2816 1.29609C13.9241 1.93857 14.2851 2.80997 14.2851 3.71857C14.2851 4.62718 13.9241 5.49858 13.2816 6.14106L13.2814 6.14133L7.0324 12.3835C7.03231 12.3836 7.03222 12.3837 7.03213 12.3838C6.64459 12.7712 6.11905 12.9888 5.57107 12.9888C5.02297 12.9888 4.49731 12.7711 4.10974 12.3835C3.72217 11.9959 3.50444 11.4703 3.50444 10.9222C3.50444 10.3741 3.72217 9.8484 4.10974 9.46084L4.11004 9.46054L9.877 3.70039L10.3775 3.20051L11.3772 4.20144L10.8767 4.70131L5.11008 10.4612C5.11005 10.4612 5.11003 10.4612 5.11 10.4613C4.98779 10.5835 4.91913 10.7493 4.91913 10.9222C4.91913 11.0951 4.98782 11.2609 5.11008 11.3832C5.23234 11.5054 5.39817 11.5741 5.57107 11.5741C5.74398 11.5741 5.9098 11.5054 6.03206 11.3832L6.03233 11.3829L12.2813 5.14072C12.2814 5.14063 12.2815 5.14054 12.2816 5.14045C12.6586 4.7633 12.8704 4.25185 12.8704 3.71857C12.8704 3.18516 12.6585 2.6736 12.2813 2.29643C11.9041 1.91925 11.3926 1.70735 10.8591 1.70735Z"
				fill="currentColor"
			></path>
		</svg>
	);
};

export function LockedPrivate(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-4 h-4"
			{...props}
		>
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}

export function PlayButton(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			viewBox="-0.5 0 8 8"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="currentColor"
			className=""
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				{' '}
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					{' '}
					<g id="Dribbble-Light-Preview" transform="translate(-427.000000, -3765.000000)" fill="currentColor">
						{' '}
						<g id="icons" transform="translate(56.000000, 160.000000)">
							{' '}
							<polygon id="play-[#1001]" points="371 3605 371 3613 378 3609">
								{' '}
							</polygon>{' '}
						</g>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function Transaction(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" className="" {...props}>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<path d="M20,2H10A3,3,0,0,0,7,5v7a3,3,0,0,0,3,3H20a3,3,0,0,0,3-3V5A3,3,0,0,0,20,2Zm1,10a1,1,0,0,1-1,1H10a1,1,0,0,1-1-1V5a1,1,0,0,1,1-1H20a1,1,0,0,1,1,1ZM17.5,8a1.49,1.49,0,0,0-1,.39,1.5,1.5,0,1,0,0,2.22A1.5,1.5,0,1,0,17.5,8ZM16,17a1,1,0,0,0-1,1v1a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V15H4a1,1,0,0,0,0-2H3V12a1,1,0,0,1,1-1A1,1,0,0,0,4,9a3,3,0,0,0-3,3v7a3,3,0,0,0,3,3H14a3,3,0,0,0,3-3V18A1,1,0,0,0,16,17ZM6,18H7a1,1,0,0,0,0-2H6a1,1,0,0,0,0,2Z"></path>
			</g>
		</svg>
	);
}

export function PauseButton(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			viewBox="-1 0 8 8"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="currentColor"
			className=""
			{...props}
		>
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
			<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
			<g id="SVGRepo_iconCarrier">
				<g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
					{' '}
					<g id="Dribbble-Light-Preview" transform="translate(-67.000000, -3765.000000)" fill="currentColor">
						{' '}
						<g id="icons" transform="translate(56.000000, 160.000000)">
							{' '}
							<path
								d="M11,3613 L13,3613 L13,3605 L11,3605 L11,3613 Z M15,3613 L17,3613 L17,3605 L15,3605 L15,3613 Z"
								id="pause-[#1010]"
							>
								{' '}
							</path>{' '}
						</g>{' '}
					</g>{' '}
				</g>{' '}
			</g>
		</svg>
	);
}

export function OAuth2Setting(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="icon-1qHBsr"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M7.8 15.77c.7.43 1.2 1.14 1.2 1.96V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.27c0-.82.5-1.53 1.2-1.96a8.06 8.06 0 0 0 .12-13.63c-.6-.39-1.32.09-1.32.8v5.98a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V2.94c0-.71-.72-1.19-1.32-.8a8.06 8.06 0 0 0 .12 13.63Z"
				className=""
			></path>
		</svg>
	);
}

export function VoicePopOutIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="controlIcon_f1ceac"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"
				className=""
			></path>
			<path
				fill="currentColor"
				d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"
				className=""
			></path>
		</svg>
	);
}

export function VoiceEmojiControlIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="controlIcon_f1ceac iconHover__26d03"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22ZM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-9.8 1.17a1 1 0 0 1 1.39.27 3.5 3.5 0 0 0 5.82 0 1 1 0 0 1 1.66 1.12 5.5 5.5 0 0 1-9.14 0 1 1 0 0 1 .27-1.4Z"
				clipRule="evenodd"
				className=""
			></path>
		</svg>
	);
}

export function VoiceSoundControlIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg
			className="controlIcon_f1ceac iconHover__26d03"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				fill="currentColor"
				d="M14.24 1.03a1 1 0 0 1 .73 1.21l-1 4a1 1 0 0 1-1.94-.48l1-4a1 1 0 0 1 1.21-.73ZM20.7 4.7a1 1 0 0 0-1.4-1.4l-4 4a1 1 0 0 0 1.4 1.4l4-4Z"
				className=""
			></path>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="M15.14 20.14c1.78-1.78.7-5.75-2.42-8.86-3.11-3.12-7.08-4.2-8.86-2.42A3.13 3.13 0 0 0 3 11V11l-1.16 8.92a2 2 0 0 0 2.24 2.24L13 21c.86-.04 1.6-.32 2.14-.86Zm-1.3-3.4a9.61 9.61 0 0 0-2.53-4.05 9.61 9.61 0 0 0-4.05-2.53c-1.27-.35-1.82-.05-1.99.11-.16.17-.46.72-.11 2a9.61 9.61 0 0 0 2.53 4.04 9.61 9.61 0 0 0 4.05 2.53c1.27.35 1.82.05 1.99-.11.16-.17.46-.72.11-2Z"
				clipRule="evenodd"
				className=""
			></path>
			<path
				fill="currentColor"
				d="M7.05 3.32a1 1 0 0 1 1.9-.64l1 3a1 1 0 1 1-1.9.64l-1-3ZM22.97 9.76a1 1 0 0 0-1.21-.73l-4 1a1 1 0 1 0 .48 1.94l4-1a1 1 0 0 0 .73-1.21ZM20.68 16.95a1 1 0 0 0 .64-1.9l-3-1a1 1 0 0 0-.64 1.9l3 1Z"
				className=""
			></path>
		</svg>
	);
}

export function VoiceMicIcon({ scale = 1, ...props }: { scale?: number } & React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" {...props}>
			<g transform={`scale(${scale})`}>
				<path
					fillRule="evenodd"
					d="M2.975 8.002a.5.5 0 0 1 .547.449 4.5 4.5 0 0 0 8.956 0 .5.5 0 1 1 .995.098A5.502 5.502 0 0 1 8.5 13.478V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522a5.502 5.502 0 0 1-4.973-4.929.5.5 0 0 1 .448-.547z"
					clipRule="evenodd"
				/>
				<path d="M5 3a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0z" />
			</g>
		</svg>
	);
}

export function VoiceMicDisabledIcon({ scale = 1, ...props }: { scale?: number } & React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" {...props}>
			<g transform={`scale(${scale})`}>
				<path d="M12.227 11.52a5.477 5.477 0 0 0 1.246-2.97.5.5 0 0 0-.995-.1 4.478 4.478 0 0 1-.962 2.359l-1.07-1.07C10.794 9.247 11 8.647 11 8V3a3 3 0 0 0-6 0v1.293L1.354.646a.5.5 0 1 0-.708.708l14 14a.5.5 0 0 0 .708-.708zM8 12.5c.683 0 1.33-.152 1.911-.425l.743.743c-.649.359-1.378.59-2.154.66V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522a5.502 5.502 0 0 1-4.973-4.929.5.5 0 0 1 .995-.098A4.5 4.5 0 0 0 8 12.5z" />
				<path d="M8.743 10.907 5 7.164V8a3 3 0 0 0 3.743 2.907z" />
			</g>
		</svg>
	);
}

export function VoiceCameraIcon({ scale = 1, ...props }: { scale?: number } & React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" {...props}>
			<g transform={`scale(${scale})`}>
				<path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h8A1.5 1.5 0 0 1 11 4.5v7A1.5 1.5 0 0 1 9.5 13h-8A1.5 1.5 0 0 1 0 11.5zM15.2 3.6l-2.8 2.1a1 1 0 0 0-.4.8v3a1 1 0 0 0 .4.8l2.8 2.1a.5.5 0 0 0 .8-.4V4a.5.5 0 0 0-.8-.4z" />
			</g>
		</svg>
	);
}

export function VoiceCameraDisabledIcon({ scale = 1, ...props }: { scale?: number } & React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" {...props}>
			<g transform={`scale(${scale})`}>
				<path d="M1.354.646a.5.5 0 1 0-.708.708l14 14a.5.5 0 0 0 .708-.708L11 10.293V4.5A1.5 1.5 0 0 0 9.5 3H3.707zM0 4.5a1.5 1.5 0 0 1 .943-1.393l9.532 9.533c-.262.224-.603.36-.975.36h-8A1.5 1.5 0 0 1 0 11.5z" />
				<path d="m15.2 3.6-2.8 2.1a1 1 0 0 0-.4.8v3a1 1 0 0 0 .4.8l2.8 2.1a.5.5 0 0 0 .8-.4V4a.5.5 0 0 0-.8-.4z" />
			</g>
		</svg>
	);
}

export function VoiceScreenShareStopIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="20" fill="none" viewBox="0 0 24 20" {...props}>
			<g fill="currentColor" transform="scale(1.2)">
				<path d="M7.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 6.94z" />
				<path
					fillRule="evenodd"
					d="M2.75 0A2.75 2.75 0 0 0 0 2.75v10.5A2.75 2.75 0 0 0 2.75 16h14.5A2.75 2.75 0 0 0 20 13.25V2.75A2.75 2.75 0 0 0 17.25 0zM1.5 2.75c0-.69.56-1.25 1.25-1.25h14.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H2.75c-.69 0-1.25-.56-1.25-1.25z"
					clipRule="evenodd"
				/>
			</g>
		</svg>
	);
}

export function VoiceScreenShareIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="20" fill="none" viewBox="0 0 24 20" {...props}>
			<g transform="scale(1.2)">
				<path
					fill="currentColor"
					fillRule="evenodd"
					d="M0 2.75A2.75 2.75 0 0 1 2.75 0h14.5A2.75 2.75 0 0 1 20 2.75v10.5A2.75 2.75 0 0 1 17.25 16H2.75A2.75 2.75 0 0 1 0 13.25V2.75ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h14.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25H2.75Z"
					clipRule="evenodd"
				/>
				<path
					fill="currentColor"
					fillRule="evenodd"
					d="M9.47 4.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1-1.06 1.06l-.97-.97v4.69a.75.75 0 0 1-1.5 0V6.56l-.97.97a.75.75 0 0 1-1.06-1.06l2.25-2.25Z"
					clipRule="evenodd"
				/>
			</g>
		</svg>
	);
}

export function VoiceArowUpIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M18.7 14.7a1 1 0 0 1-1.4 0L12 9.41l-5.3 5.3a1 1 0 1 1-1.4-1.42l6-6a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.42Z"
			></path>
		</svg>
	);
}
export function VoiceArowDownIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"
			></path>
		</svg>
	);
}

export function VoiceGridIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M15 11a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5ZM2 20c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5ZM13 20c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v5ZM2 9c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5Z"
			></path>
		</svg>
	);
}

export function VoiceFocusIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M2 4c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4ZM2 15c0-1.1.9-2 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5ZM15 13a2 2 0 0 0-2 2v5c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-5Z"
			></path>
		</svg>
	);
}
export function RotateIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
			<title>Rotate Image</title>
			<path
				fill="currentColor"
				d="M8.3 1.3a1 1 0 0 0 0 1.4l.29.3H6a4 4 0 0 0-4 4v3a1 1 0 1 0 2 0V7c0-1.1.9-2 2-2h2.59l-.3.3a1 1 0 0 0 1.42 1.4l2-2a1 1 0 0 0 0-1.4l-2-2a1 1 0 0 0-1.42 0ZM22 11a3 3 0 0 0-3-3h-8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-8Z"
			></path>
		</svg>
	);
}

export function SvgQualityExcellentIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor">
			<path d="M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
		</svg>
	);
}

export function SvgQualityGoodIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor">
			<path d="M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
			<g opacity={0.25}>
				<path d="M12 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
			</g>
		</svg>
	);
}

export function SvgQualityPoorIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor">
			<path d="M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
			<g opacity={0.25}>
				<path d="M6 6.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
				<path d="M12 .5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5z" />
			</g>
		</svg>
	);
}

export function SvgQualityUnknownIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor">
			<g opacity={0.25}>
				<path d="M0 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4Zm6-5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-9Zm6-6a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V.5Z" />
			</g>
		</svg>
	);
}

export function UserAvatarIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg aria-hidden="true" role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" {...props}>
			<circle cx="12" cy="8" r="5" />
			<path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" />
		</svg>
	);
}
interface AudioLevelCircleProps {
	audioLevel: number;
	children: React.ReactNode;
	isActive: boolean;
}

export function AudioLevelCircle({ audioLevel, children, isActive }: AudioLevelCircleProps) {
	return (
		<div className="relative flex items-center justify-center">
			<svg aria-hidden="true" role="img" viewBox="0 0 100 100" className="absolute w-[56px] h-[56px]">
				<circle
					cx="50"
					cy="50"
					r="46"
					fill="none"
					stroke={isActive ? 'rgba(99, 102, 241, 0.6)' : 'transparent'}
					strokeWidth="8"
					strokeDasharray={`${audioLevel * 290} 290`}
					strokeDashoffset="0"
					transform="rotate(-90 50 50)"
				/>
			</svg>

			<div className="z-10">{children}</div>
		</div>
	);
}

export function MarketIcons(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="28px" height="28px" {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M22.3596 8.27L22.0696 5.5C21.6496 2.48 20.2796 1.25 17.3497 1.25H14.9896H13.5097H10.4697H8.98965H6.58965C3.64965 1.25 2.28965 2.48 1.85965 5.53L1.58965 8.28C1.48965 9.35 1.77965 10.39 2.40965 11.2C3.16965 12.19 4.33965 12.75 5.63965 12.75C6.89965 12.75 8.10965 12.12 8.86965 11.11C9.54965 12.12 10.7097 12.75 11.9997 12.75C13.2896 12.75 14.4197 12.15 15.1096 11.15C15.8797 12.14 17.0696 12.75 18.3096 12.75C19.6396 12.75 20.8396 12.16 21.5896 11.12C22.1896 10.32 22.4597 9.31 22.3596 8.27Z"
				fill="currentColor"
			/>
			<path
				d="M11.3491 16.6602C10.0791 16.7902 9.11914 17.8702 9.11914 19.1502V21.8902C9.11914 22.1602 9.33914 22.3802 9.60914 22.3802H14.3791C14.6491 22.3802 14.8691 22.1602 14.8691 21.8902V19.5002C14.8791 17.4102 13.6491 16.4202 11.3491 16.6602Z"
				fill="currentColor"
			/>
			<path
				d="M21.3709 14.3981V17.3781C21.3709 20.1381 19.1309 22.3781 16.3709 22.3781C16.1009 22.3781 15.8809 22.1581 15.8809 21.8881V19.4981C15.8809 18.2181 15.4909 17.2181 14.7309 16.5381C14.0609 15.9281 13.1509 15.6281 12.0209 15.6281C11.7709 15.6281 11.5209 15.6381 11.2509 15.6681C9.47086 15.8481 8.12086 17.3481 8.12086 19.1481V21.8881C8.12086 22.1581 7.90086 22.3781 7.63086 22.3781C4.87086 22.3781 2.63086 20.1381 2.63086 17.3781V14.4181C2.63086 13.7181 3.32086 13.2481 3.97086 13.4781C4.24086 13.5681 4.51086 13.6381 4.79086 13.6781C4.91086 13.6981 5.04086 13.7181 5.16086 13.7181C5.32086 13.7381 5.48086 13.7481 5.64086 13.7481C6.80086 13.7481 7.94086 13.3181 8.84086 12.5781C9.70086 13.3181 10.8209 13.7481 12.0009 13.7481C13.1909 13.7481 14.2909 13.3381 15.1509 12.5981C16.0509 13.3281 17.1709 13.7481 18.3109 13.7481C18.4909 13.7481 18.6709 13.7381 18.8409 13.7181C18.9609 13.7081 19.0709 13.6981 19.1809 13.6781C19.4909 13.6381 19.7709 13.5481 20.0509 13.4581C20.7009 13.2381 21.3709 13.7181 21.3709 14.3981Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function MacOSCloseIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="6" height="6" viewBox="0 0 6 6" className="fill-black opacity-60" {...props}>
			<path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="currentColor" strokeWidth="1" />
		</svg>
	);
}

export function MacOSMinimizeIcon(props: React.HTMLAttributes<SVGElement>) {
	return (
		<svg width="6" height="1" viewBox="0 0 6 1" className="fill-black opacity-60" {...props}>
			<rect width="6" height="1" />
		</svg>
	);
}

export function MacOSMaximizeIcon({ isMaximized = false, ...props }: React.HTMLAttributes<SVGElement> & { isMaximized?: boolean }) {
	return (
		<svg width="6" height="6" viewBox="0 0 6 6" className="fill-black opacity-60" {...props}>
			{isMaximized ? (
				// Restore icon (two overlapping squares)
				<>
					<rect x="1" y="0" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
					<rect x="0" y="1" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
				</>
			) : (
				// Maximize icon (expand arrows)
				<>
					<path d="M1 1L5 5M5 1L1 5" stroke="currentColor" strokeWidth="0.8" fill="none" />
					<circle cx="1" cy="1" r="0.5" fill="currentColor" />
					<circle cx="5" cy="1" r="0.5" fill="currentColor" />
					<circle cx="1" cy="5" r="0.5" fill="currentColor" />
					<circle cx="5" cy="5" r="0.5" fill="currentColor" />
				</>
			)}
		</svg>
	);
}
