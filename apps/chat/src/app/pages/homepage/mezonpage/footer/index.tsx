import { Icons, Image } from '@mezon/ui';
import { Platform, generateE2eId, getPlatform } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownButton } from '../components';
interface FooterProps {
	downloadUrl: string;
	universalUrl: string;
	portableUrl: string;
}
const Footer = ({ downloadUrl, universalUrl, portableUrl }: FooterProps) => {
	const { t } = useTranslation('homepage');
	const platform = getPlatform();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const trackFooterDownloadEvent = (platform: string, downloadType: string) => {
		if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
			(window as any).gtag('event', 'download_click', {
				event_category: 'Footer Downloads',
				event_label: platform,
				download_type: downloadType,
				custom_parameter_1: 'mezon_footer'
			});
		}
	};

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
			setIsOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className="bg-white">
			{/* Gradient Banner with Omezon Branding */}
			<div className="bg-gradient-to-r from-[#7E00FF] via-[#9C3FE9] to-[#4B0082] py-[10px] flex justify-center">
				<div className="flex items-center gap-[4.92px] min-w-[120px]">
					<Image src={`assets/logo.png`} width={120} height={35} className="object-cover" />
				</div>
			</div>

			{/* Navigation Links Section */}
			<div className="bg-white py-[48px] px-[32px] max-md:px-[16px]">
				<div className="max-w-[1200px] mx-auto flex justify-center gap-[320px] max-xl:gap-[200px] max-lg:gap-[160px] max-md:flex-col max-md:gap-[32px]">
					{/* Left Column */}
					<div className="flex flex-col gap-[16px]">
						<a href="/about" className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors">
							About
						</a>
						<a
							href="https://mezon.ai/blogs/"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Blog
						</a>
						<a
							href="https://github.com/mezonai/mezon"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Github
						</a>
						<a
							href="https://mezon.ai/docs/user/account-and-personalization"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							User Documentation
						</a>
						<a
							href="https://mezon.ai/docs/user/bots-and-apps"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Developer Documentation
						</a>
						<a
							href="https://mezon.ai/developers"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							{t('footer.links.developerApi')}
						</a>
					</div>

					{/* Right Column */}
					<div className="flex flex-col gap-[16px]">
						<a
							href="https://mezon.ai/blogs/mediakit"
							target="_blank"
							rel="noreferrer"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
						>
							Media Kit
						</a>
						<a
							href="https://mezon.ai/blogs/contact"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Contact
						</a>
						<a
							href="https://mezon.ai/blogs/privacy-policy"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Privacy Policy
						</a>
						<a
							href="https://mezon.ai/blogs/terms-of-service"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Term of Service
						</a>
						<a
							href="https://mezon.ai/blogs/mezon-clan"
							className="text-[16px] leading-[24px] font-medium text-[#333333] hover:text-[#666666] transition-colors"
							target="_blank"
							rel="noreferrer"
						>
							Mezon Clan
						</a>
					</div>
				</div>
			</div>

			{/* Download Apps Section */}
			<div className="bg-white p-[30px]  max-md:px-[16px] max-md:py-[32px]">
				<div className="max-w-[1200px] mx-auto flex flex-col items-center gap-[24px] max-md:gap-[16px]">
					<div className="text-[14px] leading-[20px] font-semibold text-[#333333]">{t('footer.getTheApp')}</div>
					<div className="w-full max-w-[760px] flex items-center justify-center gap-[32px] max-md:flex-col max-md:gap-[16px]">
						<a
							href="https://apps.apple.com/vn/app/mezon/id6502750046"
							target="_blank"
							rel="noreferrer"
							onClick={() => trackFooterDownloadEvent('iOS', 'App Store')}
						>
							<Image src={`assets/app-store.svg`} className="w-[200px] max-md:w-[180px]" />
						</a>
						<a
							href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
							target="_blank"
							rel="noreferrer"
							onClick={() => trackFooterDownloadEvent('Android', 'Google Play')}
						>
							<Image src={`assets/google-play.svg`} className="w-[200px] max-md:w-[180px]" />
						</a>
						{platform === Platform.MACOS ? (
							<div className="relative inline-block leading-[0px]" ref={dropdownRef}>
								<button onClick={toggleDropdown}>
									<Icons.MacAppStoreDesktop className="max-w-full h-[56px] max-md:h-[48px] w-fit" />
								</button>

								{isOpen && (
									<div className="absolute mt-[8px]">
										<a
											className="cursor-pointer leading-[0px] block"
											href={downloadUrl}
											target="_blank"
											rel="noreferrer"
											onClick={() => trackFooterDownloadEvent('macOS', 'Apple Silicon')}
										>
											<Icons.MacAppleSilicon className="max-w-full h-[40px] w-fit" />
										</a>
										<a
											className="cursor-pointer leading-[0px] block mt-[4px]"
											href={universalUrl}
											target="_blank"
											rel="noreferrer"
											onClick={() => trackFooterDownloadEvent('macOS', 'Intel')}
										>
											<Icons.MacAppleIntel className="max-w-full h-[40px] w-fit" />
										</a>
									</div>
								)}
							</div>
						) : platform === 'Linux' ? (
							<a
								className="cursor-pointer"
								href={downloadUrl}
								target="_blank"
								rel="noreferrer"
								onClick={() => trackFooterDownloadEvent('Linux', 'DEB Package')}
							>
								<Image src={`assets/linux.svg`} className="w-[200px] max-md:w-[180px]" />
							</a>
						) : (
							<DropdownButton
								icon={
									<a
										className="cursor-pointer"
										href={downloadUrl}
										target="_blank"
										rel="noreferrer"
										onClick={() => trackFooterDownloadEvent('Windows', 'EXE Installer')}
									>
										<Icons.MicrosoftDropdown className="max-w-full h-[56px] max-md:h-[48px] w-fit" />
									</a>
								}
								downloadLinks={[
									{
										url: portableUrl,
										icon: <Icons.MicrosoftWinPortable className="max-w-full h-[40px] max-md:w-fit" />,
										trackingData: { platform: 'Windows', type: 'Portable' }
									}
								]}
								dropdownRef={dropdownRef}
								downloadUrl={downloadUrl}
								onDownloadClick={trackFooterDownloadEvent}
								t={t}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Tagline Section */}
			<div className="bg-white py-[26px] px-[32px] max-md:px-[16px] max-md:py-[24px]">
				<div className="max-w-[1200px] mx-auto text-center">
					<div className="text-[18px] leading-[24px] font-medium text-[#333333]" data-e2e={generateE2eId('homepage.footer.text.copyright')}>
						Mezon - Connect Freely. Share Limitlessly
					</div>
				</div>
			</div>
		</div>
	);
};

export default Footer;
