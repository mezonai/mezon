'use client';

import { Platform, generateE2eId, getPlatform } from '@mezon/utils';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';

const AppStoreIcon = () => (
	<svg viewBox="0 0 135 40" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
		<path
			fill="currentColor"
			d="M22.5,18c0-3,2.4-4.5,2.5-4.6c-1.4-2.1-3.6-2.4-4.4-2.4c-1.9-0.2-3.8,1.1-4.8,1.1c-1,0-2.5-1.1-4.1-1.1 c-2.1,0-4,1.2-5,3c-2.1,3.6-0.5,8.9,1.5,11.8c1,1.4,2.2,3,3.7,2.9c1.5-0.1,2-1,3.8-1c1.8,0,2.3,1,3.8,1c1.6,0,2.6-1.4,3.6-2.9 c1.2-1.7,1.7-3.4,1.7-3.5C24.8,22.3,22.5,21.5,22.5,18z M18.9,10.2c0.8-1,1.4-2.4,1.2-3.8c-1.2,0.1-2.6,0.8-3.5,1.9 c-0.8,0.9-1.4,2.3-1.2,3.7C16.6,12.1,18,11.3,18.9,10.2z"
		/>
		<text x="35" y="15" fill="currentColor" style={{ fontSize: '9px', fontWeight: '400', opacity: 0.8 }}>
			Download on the
		</text>
		<text x="35" y="32" fill="currentColor" style={{ fontSize: '18px', fontWeight: '700' }}>
			App Store
		</text>
	</svg>
);

const GooglePlayIcon = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 48 48"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M25.0274 24.0519L8.765 39.8852C9.2841 41.6502 10.9453 43 12.918 43C13.7486 43 14.4754 42.7923 15.0983 42.3771L33.2677 32.0984L25.0274 24.0519Z" />
		<path d="M40.9508 20.2623L33.1639 15.7978L25.0274 24.0519L33.2677 32.0984L41.0546 27.7377C42.4043 27.0109 43.3388 25.5574 43.3388 24C43.235 22.4426 42.3005 20.9891 40.9508 20.2623Z" />
		<path d="M8.765 8.1148C8.6612 8.4263 8.6612 8.8416 8.6612 9.2569V38.8471C8.6612 39.2624 8.6612 39.5739 8.765 39.9892L25.0274 24.0519L8.765 8.1148Z" />
		<path d="M25.0274 24.0519L33.1639 15.7978L15.2022 5.623C14.5793 5.2077 13.7486 5 12.918 5C10.9453 5 9.1803 6.3497 8.765 8.1148L25.0274 24.0519Z" />
	</svg>
);

const DesktopIcons = {
	Apple: ({ className }: { className?: string }) => (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M17.05 20.28c-.96.95-2.04 1.72-3.23 1.72-1.16 0-1.57-.7-3-.7-1.45 0-1.89.7-2.98.7-1.16 0-2.36-.88-3.32-1.84-1.98-1.95-3.32-5.46-3.32-8.66 0-2.58 1.15-4.5 2.87-4.5 1.13 0 1.9.7 2.86.7.96 0 2.04-.7 3.23-.7 1.34 0 2.4.63 3.08 1.62-2.77 1.63-2.32 5.37.45 6.55-.42 1.54-1.43 3.16-2.66 5.11zM12 4c.05-2.23 1.86-4 4-4 .05 2.23-1.86 4-4 4z" />
		</svg>
	),
	Windows: ({ className }: { className?: string }) => (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M0 3.449L9.75 2.1v9.451H0V3.449zM0 12.451h9.75V21.9L0 20.551v-8.1zM10.712.914L24 0v11.551H10.712V.914zM10.712 12.451H24V24l-13.288-.914v-10.635z" />
		</svg>
	),
	Linux: ({ className }: { className?: string }) => (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M12 0c-3.31 0-6 2.69-6 6 0 1.25.38 2.4 1.03 3.37l-2.03 2.03c-.39.39-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0l2.03-2.03c.97.65 2.12 1.03 3.37 1.03 3.31 0 6-2.69 6-6s-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
			<path d="M12 14c-4.42 0-8 3.58-8 8v2h16v-2c0-4.42-3.58-8-8-8z" />
		</svg>
	),
	MicrosoftStore: ({ className }: { className?: string }) => (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
		</svg>
	)
};

interface FooterProps {
	downloadUrl: string;
	universalUrl: string;
	portableUrl: string;
}

/**
 * --- UI COMPONENTS ---
 */

const OrbitBeamWrapper = ({
	children,
	className = '',
	innerClassName = '',
	glowColor = 'cyan',
	activeOnHover = false
}: {
	children: ReactNode;
	className?: string;
	innerClassName?: string;
	glowColor?: 'cyan' | 'purple' | 'pink';
	activeOnHover?: boolean;
}) => {
	const glowStyles = {
		cyan: 'from-cyan-500/0 via-cyan-500/30 to-blue-600/0',
		purple: 'from-purple-500/0 via-purple-500/30 to-pink-600/0',
		pink: 'from-pink-500/0 via-pink-500/30 to-rose-600/0'
	};

	const glowInitial = activeOnHover ? 'opacity-0' : 'opacity-40';
	const beamInitial = activeOnHover ? 'opacity-0' : 'opacity-100';

	return (
		<div className={`relative group ${className}`}>
			<div
				className={`absolute -inset-2 bg-gradient-to-r ${glowStyles[glowColor]} rounded-3xl blur-2xl pointer-events-none transition-opacity duration-500 ${glowInitial} group-hover:opacity-60`}
				style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}
			/>

			<div className="relative overflow-hidden rounded-2xl p-[1.2px] bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
				<div
					className={`absolute inset-[-300%] transition-opacity duration-500 ${beamInitial} group-hover:opacity-100`}
					style={{
						background: 'conic-gradient(from 0deg, transparent 0 340deg, #fff 355deg, transparent 360deg)',
						animation: 'orbit 2s linear infinite'
					}}
				/>
				<div
					className={`absolute inset-[-300%] transition-opacity duration-500 ${beamInitial} group-hover:opacity-100`}
					style={{
						background: 'conic-gradient(from 120deg, transparent 0 300deg, #22d3ee 330deg, #a855f7 350deg, transparent 360deg)',
						animation: 'orbit 4s linear infinite'
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
				<div
					className={`relative bg-[#0d0d12]/95 backdrop-blur-md rounded-[15px] flex items-center justify-center transition-all duration-300  ${innerClassName}`}
				>
					{children}
				</div>
			</div>
		</div>
	);
};

const Footer = ({ downloadUrl, universalUrl, portableUrl }: FooterProps) => {
	const { t } = useTranslation('homepage');
	const platform = getPlatform();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const scanQRmobile = typeof window !== 'undefined' ? `${window.location.origin}/mobile-download` : 'https://mezon.ai';

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

	const toggleDropdown = () => setIsOpen(!isOpen);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<footer className="bg-[#0a0a0f] text-white relative border-t border-white/5 pt-12">
			<style>{`
                @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.3; filter: blur(25px); transform: scale(1); } 50% { opacity: 0.6; filter: blur(35px); transform: scale(1.1); } }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) translateX(-50%); } to { opacity: 1; transform: translateY(0) translateX(-50%); } }
                @keyframes laser-scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
            `}</style>

			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
					<div>
						<h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-white/30">Platform</h3>
						<ul className="space-y-4">
							<li>
								<a href="/about" className="text-sm text-white/60 hover:text-cyan-400 transition-colors">
									About
								</a>
							</li>
							<li>
								<a
									href="https://mezon.ai/blogs/"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Blog
								</a>
							</li>
							<li>
								<a
									href="https://mezon.ai/developers"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									{t('footer.links.developerApi')}
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-white/30">Resources</h3>
						<ul className="space-y-4">
							<li>
								<a
									href="https://github.com/mezonai/mezon"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									GitHub
								</a>
							</li>
							<li>
								<a
									href="https://mezon.ai/docs/user/account-and-personalization"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									User Docs
								</a>
							</li>
							<li>
								<a
									href="https://mezon.ai/docs/user/bots-and-apps"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Developer Docs
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-white/30">Company</h3>
						<ul className="space-y-4">
							<li>
								<a
									href="brand-center"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Brand Center
								</a>
							</li>
							<li>
								<a
									href="/contact-us"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Contact
								</a>
							</li>
							<li>
								<a
									href="https://mezon.ai/clans/"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Mezon Clan
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-white/30">Legal</h3>
						<ul className="space-y-4">
							<li>
								<a
									href="/privacy-policy"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Privacy Policy
								</a>
							</li>
							<li>
								<a
									href="/terms-of-service"
									target="_blank"
									rel="noreferrer"
									className="text-sm text-white/60 hover:text-cyan-400 transition-colors"
								>
									Terms of Service
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mb-12 py-8 relative">
					<div
						className="absolute inset-0 -z-10 opacity-5"
						style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
					/>

					<div className="flex flex-col xl:flex-row items-center justify-center gap-10 xl:gap-14">
						<div className="flex-shrink-0 group relative">
							<OrbitBeamWrapper className="w-[140px] h-[140px]" innerClassName="p-3 bg-white" glowColor="cyan" activeOnHover={true}>
								<div className="relative z-10">
									<QRCode value={scanQRmobile} size={110} level="H" bgColor="#FFFFFF" fgColor="#000000" />
								</div>
								<div className="absolute inset-0 z-20 overflow-hidden rounded-[15px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<div
										className="absolute left-0 right-0 h-1 bg-cyan-500/80 shadow-[0_0_15px_rgba(221, 34, 238, 0.8)] blur-[0.5px]"
										style={{ animation: 'laser-scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
									/>
								</div>
								<div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-black/80 z-20 pointer-events-none" />
								<div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-black/80 z-20 pointer-events-none" />
								<div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-black/80 z-20 pointer-events-none" />
								<div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-black/80 z-20 pointer-events-none" />
							</OrbitBeamWrapper>
							<div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
								<span className="text-[10px] font-black tracking-widest uppercase text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
									Mobile Scan
								</span>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-row items-center gap-6 w-full max-w-[500px] xl:w-auto xl:max-w-none justify-items-center">
							<a
								href="https://apps.apple.com/vn/app/mezon/id6502750046"
								target="_blank"
								rel="noreferrer"
								onClick={() => trackFooterDownloadEvent('iOS', 'App Store')}
								className="transition-transform duration-300 active:scale-95 text-white/90 hover:text-white w-full sm:w-auto flex justify-center"
							>
								<OrbitBeamWrapper className="w-44 md:w-52" innerClassName="h-14 px-6" glowColor="purple">
									<AppStoreIcon />
								</OrbitBeamWrapper>
							</a>

							<a
								href="https://play.google.com/store/apps/details?id=com.mezon.mobile"
								target="_blank"
								rel="noreferrer"
								onClick={() => trackFooterDownloadEvent('Android', 'Google Play')}
								className="transition-transform duration-300 active:scale-95 text-white/90 hover:text-white w-full sm:w-auto flex justify-center"
							>
								<OrbitBeamWrapper
									className="w-44 md:w-52"
									innerClassName="h-14 px-6 flex items-center justify-center gap-3"
									glowColor="cyan"
								>
									<GooglePlayIcon className="w-8 h-8 flex-shrink-0" />
									<div className="flex flex-col items-start leading-none">
										<span className="text-[10px] uppercase font-medium opacity-80">Get it on</span>
										<span className="text-sm font-bold tracking-tight">Google Play</span>
									</div>
								</OrbitBeamWrapper>
							</a>

							<div className="relative sm:col-span-2 xl:col-auto w-full sm:w-auto flex justify-center" ref={dropdownRef}>
								<button onClick={toggleDropdown} className="transition-transform duration-300 active:scale-95">
									<OrbitBeamWrapper
										className="w-44 md:w-52"
										innerClassName={`h-14 px-6 flex items-center justify-center gap-3 transition-colors ${isOpen ? 'bg-white/10' : ''}`}
										glowColor="pink"
									>
										{platform === Platform.MACOS ? (
											<DesktopIcons.Apple className="w-6 h-6" />
										) : platform === Platform.LINUX ? (
											<DesktopIcons.Linux className="w-6 h-6" />
										) : (
											<DesktopIcons.Windows className="w-6 h-6" />
										)}
										<span className="text-sm font-black tracking-wider uppercase">Desktop</span>
										<svg
											className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
										</svg>
									</OrbitBeamWrapper>
								</button>

								{isOpen && (
									<div
										className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 min-w-[240px] bg-[#12121a]/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 p-2 z-[9999]"
										style={{ animation: 'fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards' }}
									>
										{platform === Platform.MACOS ? (
											<div className="space-y-1">
												<a
													className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
													href={downloadUrl}
													target="_blank"
													rel="noreferrer"
													onClick={() => trackFooterDownloadEvent('macOS', 'Apple Silicon')}
												>
													<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
														<DesktopIcons.Apple className="w-6 h-6" />
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-bold">Apple Silicon</span>
														<span className="text-[10px] text-white/40 uppercase tracking-widest">M1 / M2 / M3</span>
													</div>
												</a>
												<div className="h-px bg-white/5 mx-2" />
												<a
													className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
													href={universalUrl}
													target="_blank"
													rel="noreferrer"
													onClick={() => trackFooterDownloadEvent('macOS', 'Intel')}
												>
													<div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
														<DesktopIcons.Apple className="w-6 h-6" />
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-bold">Intel CPU</span>
														<span className="text-[10px] text-white/40 uppercase tracking-widest">Universal build</span>
													</div>
												</a>
											</div>
										) : platform === Platform.LINUX ? (
											<a
												className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
												href={downloadUrl}
												target="_blank"
												rel="noreferrer"
												onClick={() => trackFooterDownloadEvent('Linux', 'DEB Package')}
											>
												<div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
													<DesktopIcons.Linux className="w-6 h-6" />
												</div>
												<div className="flex flex-col">
													<span className="text-sm font-bold">Linux Build</span>
													<span className="text-[10px] text-white/40 uppercase tracking-widest">DEB Package</span>
												</div>
											</a>
										) : (
											<div className="space-y-1">
												<a
													className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
													href="https://apps.microsoft.com/detail/9pf25lf1fj17"
													target="_blank"
													rel="noreferrer"
													onClick={() => trackFooterDownloadEvent('Windows', 'Microsoft Store')}
												>
													<div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
														<DesktopIcons.MicrosoftStore className="w-6 h-6" />
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-bold">Microsoft Store</span>
														<span className="text-[10px] text-white/40 uppercase tracking-widest">Recommended</span>
													</div>
												</a>
												<div className="h-px bg-white/5 mx-2" />
												<a
													className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all group"
													href={portableUrl}
													target="_blank"
													rel="noreferrer"
													onClick={() => trackFooterDownloadEvent('Windows', 'Portable')}
												>
													<div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:scale-110 transition-transform">
														<DesktopIcons.Windows className="w-6 h-6" />
													</div>
													<div className="flex flex-col">
														<span className="text-sm font-bold">Windows Portable</span>
														<span className="text-[10px] text-white/40 uppercase tracking-widest">EXE (No setup)</span>
													</div>
												</a>
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="border-t border-white/20 py-8">
					<div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
						<div
							className="text-white/80 text-xs font-medium text-center md:text-left"
							data-e2e={generateE2eId('homepage.footer.text.copyright')}
						>
							© 2025 Mezon. All rights reserved.
						</div>
						<div className="flex gap-4 md:gap-6 items-center">
							<a
								href="https://www.facebook.com/mezonworld"
								target="_blank"
								rel="noreferrer"
								className="text-white/80 hover:text-white transition-colors"
								aria-label="Facebook"
							>
								<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor">
									<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
								</svg>
							</a>
							<a
								href="https://github.com/mezonai/mezon"
								target="_blank"
								rel="noreferrer"
								className="text-white/80 hover:text-white transition-colors"
								aria-label="Github"
							>
								<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
									<path
										d="M10 0c5.523 0 10 4.59 10 10.253 0 4.529-2.862 8.371-6.833 9.728-.507.101-.687-.219-.687-.492 0-.338.012-1.442.012-2.814 0-.956-.32-1.58-.679-1.898 2.227-.254 4.567-1.121 4.567-5.059 0-1.12-.388-2.034-1.03-2.752.104-.259.447-1.302-.098-2.714 0 0-.838-.275-2.747 1.051A9.4 9.4 0 0 0 10 4.958a9.4 9.4 0 0 0-2.503.345C5.586 3.977 4.746 4.252 4.746 4.252c-.543 1.412-.2 2.455-.097 2.714-.639.718-1.03 1.632-1.03 2.752 0 3.928 2.335 4.808 4.556 5.067-.286.256-.545.708-.635 1.371-.57.262-2.018.715-2.91-.852 0 0-.529-.985-1.533-1.057 0 0-.975-.013-.068.623 0 0 .655.315 1.11 1.5 0 0 .587 1.83 3.369 1.21.005.857.014 1.665.014 1.909 0 .271-.184.588-.683.493C2.865 18.627 0 14.783 0 10.253 0 4.59 4.478 0 10 0"
										fill="currentColor"
									/>
								</svg>
							</a>
							<a
								href="https://www.linkedin.com/company/mezon-ai"
								target="_blank"
								rel="noreferrer"
								className="text-white/80 hover:text-white transition-colors"
								aria-label="Linkedin"
							>
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
									<path
										d="M22 3.47v17.06A1.47 1.47 0 0 1 20.53 22H3.47A1.47 1.47 0 0 1 2 20.53V3.47A1.47 1.47 0 0 1 3.47 2h17.06A1.47 1.47 0 0 1 22 3.47M7.882 9.648h-2.94v9.412h2.94zm.265-3.235a1.694 1.694 0 0 0-1.682-1.706h-.053a1.706 1.706 0 0 0 0 3.412 1.694 1.694 0 0 0 1.735-1.653zm10.912 6.93c0-2.83-1.8-3.93-3.588-3.93a3.35 3.35 0 0 0-2.977 1.517h-.082V9.647H9.647v9.412h2.941v-5.006a1.953 1.953 0 0 1 1.765-2.106h.112c.935 0 1.63.588 1.63 2.07v5.042h2.94z"
										fill="currentColor"
									/>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
