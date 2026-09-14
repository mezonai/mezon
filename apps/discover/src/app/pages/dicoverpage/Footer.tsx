import React from 'react';
import { Link } from 'react-router-dom';
import { MEZON_LOGO } from '../../constants/constants';

const Footer: React.FC = () => {
	return (
		<footer className="relative overflow-hidden bg-[#131221] text-white">
			<p className="pointer-events-none absolute -left-6 -bottom-10 select-none text-[28vw] leading-none font-extrabold tracking-[-0.08em] text-[#5865f2]/15">
				MEZON
			</p>
			<div className="relative px-4 md:px-8 lg:px-12 py-16 md:py-24">
				<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 pb-12 border-b border-white/15">
					<div className="flex items-center gap-3">
						<img src={MEZON_LOGO.DARK} alt="" className="w-12 h-12 object-contain" />
						<img src={MEZON_LOGO.WORDMARK} alt="Mezon" className="h-8 md:h-10 w-auto object-contain" />
					</div>
					<nav className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-3 text-sm">
						<Link to="/about" className="text-white/70 hover:text-[#de82e6]">
							About
						</Link>
						<a href="https://mezon.ai/blogs/" target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#de82e6]">
							Blog
						</a>
						<a href="https://mezon.ai/developers" target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#de82e6]">
							Developers
						</a>
						<a href="https://top.mezon.ai" target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#de82e6]">
							Bots/Apps
						</a>
						<a href="https://github.com/mezonai/mezon" target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#de82e6]">
							Github
						</a>
						<a href="https://mezon.ai/docs" target="_blank" rel="noreferrer" className="text-white/70 hover:text-[#de82e6]">
							Docs
						</a>
						<Link to="/brand-center" className="text-white/70 hover:text-[#de82e6]">
							Brand
						</Link>
						<Link to="/contact-us" className="text-white/70 hover:text-[#de82e6]">
							Contact
						</Link>
						<Link to="/privacy-policy" className="text-white/70 hover:text-[#de82e6]">
							Privacy
						</Link>
						<Link to="/terms-of-service" className="text-white/70 hover:text-[#de82e6]">
							Terms
						</Link>
					</nav>
				</div>
				<div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-8">
					<p className="text-white/50 text-xs tracking-[0.18em] uppercase">© 2026 Mezon</p>
					<div className="flex gap-5">
						<a
							href="https://github.com/mezonai/mezon"
							target="_blank"
							rel="noreferrer"
							className="text-white/70 hover:text-white"
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
							className="text-white/70 hover:text-white"
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
		</footer>
	);
};

export default Footer;
