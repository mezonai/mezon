import { Icons } from '@mezon/ui';
import { Platform } from '@mezon/utils';
import { useEffect, useState } from 'react';

interface DownloadLink {
	url: string;
	icon: JSX.Element;
	trackingData?: { platform: string; type: string };
}

interface DropdownButtonProps {
	icon: JSX.Element;
	downloadLinks: DownloadLink[];
	dropdownRef: React.RefObject<HTMLDivElement>;
	downloadUrl?: string;
	platform?: Platform;
	isWindow?: boolean;
	onDownloadClick?: (platform: string, downloadType: string) => void;
	t?: (key: string) => string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
	platform,
	icon,
	downloadLinks,
	dropdownRef,
	downloadUrl,
	isWindow,
	onDownloadClick,
	t = (key: string) => key
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		if (platform === Platform.MACOS) {
			setIsOpen((prev) => !prev);
		}
	};

	const toggleDropdownWindow = () => {
		setIsOpen((prev) => !prev);
	};

	const handleOpenCdnUrl = () => {
		onDownloadClick?.('Windows', 'CDN Direct');
		window.open(downloadUrl, '_blank', 'noreferrer');
	};

	const handleDownloadClick = (trackingData?: { platform: string; type: string }) => {
		if (onDownloadClick && trackingData) {
			onDownloadClick(trackingData.platform, trackingData.type);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [dropdownRef]);

	return (
		<div className="relative inline-block leading-[0px]" ref={dropdownRef}>
			<button className="relative" onClick={toggleDropdown}>
				{isWindow ? (
					<div className="cursor-pointer" onClick={handleOpenCdnUrl}>
						<div className="bg-black py-1 max-md:py-[2px] px-[10px] max-md:px-2 w-[180px] max-md:w-[125px] flex items-center gap-[10px] rounded-md border-[1.5px] border-white">
							<Icons.Microsoft className="w-[34px] h-[34px] max-md:w-[22px] max-md:h-[22px]" />
							<div>
								<div className="text-xs max-md:text-[9px]">{t('download.getItFrom')}</div>
								<div className="max-md:text-[12px] leading-[20px] max-md:leading-[13px]">{t('download.cdnUrl')}</div>
							</div>
						</div>
					</div>
				) : (
					icon
				)}
				<div className="absolute top-2.5 right-2.5 max-md:top-0 max-md:right-0">
					<Icons.ChevronDownIcon
						className={isWindow ? 'text-textDarkTheme' : 'text-transparent'}
						onClick={toggleDropdownWindow}
						style={{ width: 26, height: 26 }}
					/>
				</div>
			</button>
			{isOpen && (
				<div className="absolute z-50 flex flex-col gap-1 mt-1 left-[2px]">
					<div className="cursor-pointer hidden" onClick={handleOpenCdnUrl}>
						<div className="bg-black py-1 max-md:py-[2px] px-[10px] max-md:px-2 w-[180px] max-md:w-[125px] flex items-center gap-[10px] rounded-md border-[1.5px] border-white">
							<Icons.CDNIcon className="w-[29px] h-[29px] max-md:w-[20px] max-md:h-[20px]" />
							<div>
								<div className="text-xs max-md:text-[9px]">{t('download.getItFrom')}</div>
								<div className="max-md:text-[12px] leading-[20px] max-md:leading-[13px]">{t('download.cdnUrl')}</div>
							</div>
						</div>
					</div>
					{downloadLinks.map((link, index) => (
						<a
							key={index}
							className="cursor-pointer block"
							href={link.url}
							target="_blank"
							rel="noreferrer"
							onClick={() => handleDownloadClick(link.trackingData)}
						>
							{link.icon}
						</a>
					))}
				</div>
			)}
		</div>
	);
};
