import React from 'react';

const Footer: React.FC = () => {
	return (
		<footer className="bg-[#131221]">
			<div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
				<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 pb-8 md:pb-12 border-b border-white/20">
					<div>
						<h3 className="font-bold text-xl md:text-md tracking-wider mb-4 md:mb-5 text-[#5865f2]">Platform</h3>
						<div className="space-y-2 md:space-y-3">
							<a href="/about" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block">
								About
							</a>
							<a
								href="https://mezon.ai/blogs/"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Blog
							</a>
							<a
								href="https://mezon.ai/developers"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Developer API Integration
							</a>
						</div>
					</div>

					<div>
						<h3 className="font-bold text-xl md:text-md tracking-wider mb-4 md:mb-5 text-[#5865f2]">Resources</h3>
						<div className="space-y-2 md:space-y-3">
							<a
								href="https://github.com/mezonai/mezon"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Github
							</a>
							<a
								href="https://mezon.ai/docs/user/account-and-personalization"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								User Docs
							</a>
							<a
								href="https://mezon.ai/docs/user/bots-and-apps"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Developer Docs
							</a>
						</div>
					</div>

					<div>
						<h3 className="font-bold text-xl md:text-md tracking-wider mb-4 md:mb-5 text-[#5865f2]">Company</h3>
						<div className="space-y-2 md:space-y-3">
							<a
								href="brand-center"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Brand Center
							</a>
							<a
								href="/contact-us"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Contact
							</a>
							<a
								href="https://mezon.ai/clans/"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Mezon Clan
							</a>
						</div>
					</div>

					<div>
						<h3 className="font-bold text-xl md:text-md tracking-wider mb-4 md:mb-5 text-[#5865f2]">Legal</h3>
						<div className="space-y-2 md:space-y-3">
							<a
								href="/privacy-policy"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Privacy Policy
							</a>
							<a
								href="/terms-of-service"
								target="_blank"
								rel="noreferrer"
								className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm leading-relaxed block"
							>
								Terms of Service
							</a>
						</div>
					</div>
				</div>

				<div className="">
					<div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
						<div className="text-white/80 text-xs font-medium text-center md:text-left">© 2025 Mezon. All rights reserved.</div>
						<div className="flex gap-4 md:gap-6 items-center">
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
