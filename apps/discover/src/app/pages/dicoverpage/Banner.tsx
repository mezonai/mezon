import React, { useRef } from 'react';

/**
 * @param onSearch
 * @param searchTerm
 */
interface BannerProps {
	onSearch: (term: string) => void;
	searchTerm: string;
}

const Banner: React.FC<BannerProps> = ({ onSearch, searchTerm }) => {
	const searchInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		searchInputRef.current?.focus();
	};

	return (
		<div className="relative bg-[#404eed] text-white">
			<div className="absolute inset-0 bg-gradient-to-b from-[#8960e0] to-[#404eed]"></div>
			<div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-center bg-cover"></div>

			<div className="relative container mx-auto px-4 py-16 text-center">
				<h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Community On Mezon</h1>
				<p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 mb-8">
					Discover clans where you can hang out with people who share your interests and passions.
				</p>

				<form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
					<div className="relative z-20">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 text-gray-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>

						<input
							ref={searchInputRef}
							type="text"
							placeholder="Explore communities"
							className="block w-full pl-10 pr-4 py-3 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-gray-900 placeholder-gray-500"
							value={searchTerm}
							onChange={(e) => onSearch(e.target.value)}
						/>

						{searchTerm && (
							<button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => onSearch('')}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 text-gray-500 hover:text-gray-700"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						)}
					</div>
				</form>
			</div>

			<div className="absolute bottom-0 left-0 right-0">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#f6f6f7" className="w-full">
					<path d="M0,56L60,65.3C120,75,240,93,360,93.3C480,93,600,75,720,65.3C840,56,960,56,1080,60.7C1200,65,1320,75,1380,79.3L1440,84L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"></path>
				</svg>
			</div>
		</div>
	);
};

export default Banner;
