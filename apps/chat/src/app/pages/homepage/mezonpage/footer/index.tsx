import { Icons, Image } from '@mezon/ui';
import { getPlatform } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { DropdownButton } from '..';
interface FooterProps {
	downloadUrl: string;
	universalUrl: string;
	portableUrl: string;
}
const Footer = ({ downloadUrl, universalUrl, portableUrl }: FooterProps) => {
	const platform = getPlatform();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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
		<div>
			<div
				className="bg-[#0A052C] relative flex flex-col items-center bg-no-repeat"
				style={{ backgroundImage: 'url(../../../assets/ellipse.svg)' }}
			>
				<div className="pt-[64px] pb-[48px] max-md:py-[48px] flex flex-col w-10/12 max-lg:w-full">
					<div className="w-full px-[32px] max-md:px-[16px] flex justify-between gap-[48px] max-lg:flex-col">
						<div className="flex justify-between gap-[48px] max-lg:flex-col">
							<div className="flex flex-col gap-[24px] max-w-[320px]">
								<div className="flex items-center gap-[5px]">
									<Image src={`assets/images/mezon-logo-black.svg`} width={32} height={32} className="aspect-square object-cover" />
									<div className="text-[22.15px] leading-[26.58px] font-semibold text-[#FFFFFF]">mezon</div>
								</div>
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									Mezon is great for playing games and chilling with friends, or even building a worldwide community.{' '}
								</div>
							</div>
							<div className="flex gap-[32px] max-lg:flex-col">
								<div className="flex flex-col gap-[12px]">
									<a
										href="#"
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Executive Summary
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Problem Statement
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Solution
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Blockhain & Token Economy
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Developer API Intergration
									</a>
								</div>
								<div className="flex flex-col gap-[12px]">
									<a
										href=""
										target="_blank"
										rel="noreferrer"
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
									>
										Technical Architecture
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Product roadmap
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										{' '}
										Tokenomics
									</a>
									<a
										href=""
										className="pr-[2px] pl-[2px] text-[16px] leading-[24px] font-semibold text-[#7C92AF]"
										target="_blank"
										rel="noreferrer"
									>
										Team
									</a>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-[16px]">
							<div className="text-[14px] leading-[20px] font-semibold text-[#F5F5F6]">Get the app</div>
							<div className="flex flex-col gap-[16px]">
								<a href="https://apps.apple.com/vn/app/mezon/id6502750046" target="_blank" rel="noreferrer">
									<Image src={`assets/app-store.svg`} className="max-w-[135px]" />
								</a>
								<a href="https://play.google.com/store/apps/details?id=com.mezon.mobile" target="_blank" rel="noreferrer">
									<Image src={`assets/google-play.svg`} className="max-w-[135px]" />
								</a>
								{platform === 'MacOS' ? (
									<div className="relative inline-block leading-[0px]" ref={dropdownRef}>
										<button onClick={toggleDropdown}>
											<Icons.MacAppStoreDesktop className="max-w-full h-[40px] w-fit" />
										</button>

										{isOpen && (
											<div className="absolute mt-[8px]">
												<a className="cursor-pointer leading-[0px] block" href={downloadUrl} target="_blank" rel="noreferrer">
													<Icons.MacAppleSilicon className="max-w-full h-[40px] w-fit" />
												</a>
												<a
													className="cursor-pointer leading-[0px] block mt-[4px]"
													href={universalUrl}
													target="_blank"
													rel="noreferrer"
												>
													<Icons.MacAppleIntel className="max-w-full h-[40px] w-fit" />
												</a>
											</div>
										)}
									</div>
								) : platform === 'Linux' ? (
									<a className="cursor-pointer" href={downloadUrl} target="_blank" rel="noreferrer">
										<Image src={`assets/linux.svg`} className="max-w-[135px]" />
									</a>
								) : (
									<DropdownButton
										icon={
											<a className="cursor-pointer" href={downloadUrl} target="_blank" rel="noreferrer">
												<Icons.MicrosoftDropdown className="max-w-full h-[40px] w-fit" />
											</a>
										}
										downloadLinks={[
											{
												url: portableUrl,
												icon: <Icons.MicrosoftWinPortable className="max-w-full h-[40px] max-md:w-fit" />
											}
										]}
										dropdownRef={dropdownRef}
										downloadUrl={downloadUrl}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="bg-[#0B0E2D] py-[48px] max-md:py-[24px] flex flex-col items-center">
				<div className="w-10/12 px-[32px] max-md:px-[16px] flex items-center gap-[32px] justify-between max-lg:gap-[24px] max-lg:w-full max-lg:flex-col-reverse max-lg:items-start">
					<div className="text-[16px] leading-[24px] font-normal text-[#7C92AF]">© 2024 Mezon. All rights reserved.</div>
					<div className="flex items-center gap-[24px]">
						<a href="https://www.linkedin.com/company/nccplus-vietnam" target="_blank" rel="noreferrer">
							<Image src={`assets/instagram.svg`} />
						</a>
						<a href="https://www.facebook.com/profile.php?id=61558081847939" target="_blank" rel="noreferrer">
							<Image src={`assets/facebook.svg`} />
						</a>
						<a href="https://github.com/nccasia/mezon-fe" target="_blank" rel="noreferrer">
							<Image src={`assets/twitter.svg`} />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Footer;
