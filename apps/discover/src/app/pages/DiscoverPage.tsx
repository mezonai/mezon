import Banner from '../components/Banner';
import Categories from '../components/Categories';
import ClanList from '../components/ClanList';
import Footer from '../components/Footer';
import { COLORS, PAGINATION } from '../constants/constants';
import { useDiscover } from '../context/DiscoverContext';
import { usePagination } from '../hooks/usePagination';

export default function DiscoverPage() {
	const { clans, categories, loading, error, currentPage, totalPages, searchTerm, selectedCategory, handleSearch, handleCategorySelect, handlePageChange } =
		useDiscover();

	const { pageNumbers, isFirstPage, isLastPage } = usePagination({
		currentPage,
		totalPages,
		maxPageNumbers: PAGINATION.MAX_PAGE_NUMBERS
	});

	const filteredClans = clans.filter((clan) => {
		if (!clan) return false;
		const clanName = clan.clan_name || '';
		return clanName.toLowerCase().includes(searchTerm.toLowerCase());
	});

	const formatNumber = (num: number) => {
		return num.toLocaleString('en-US');
	};

	return (
		<>
			<div className="bg-[#f6f6f7] min-h-screen pb-12">
				<Banner onSearch={handleSearch} searchTerm={searchTerm} />

				<div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8">
					<div className={`flex flex-col gap-4 ${categories.length > 0 ? 'lg:flex-row lg:gap-8' : ''}`}>
						{categories.length > 0 && (
							<div className="w-full lg:w-64 flex-shrink-0">
								<Categories selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
							</div>
						)}

						<div className="flex-1 min-w-0">
							<div className="flex justify-between items-center mb-4 sm:mb-6">
								<h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
									{formatNumber(filteredClans.length)} Results found
								</h2>
							</div>

							{loading ? (
								<>
									<div className="text-center mb-6">
										<p className="text-gray-600">Loading clan list...</p>
									</div>
									<ClanList loading={true} clans={[]} />
								</>
							) : error ? (
								<div className="text-center py-12">
									<div className="mb-4 text-gray-400">
										<svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
									<h3 className="text-xl font-semibold mb-2">Error loading clan list</h3>
									<p className="text-gray-600">{error}</p>
									<button
										className={`mt-4 bg-[${COLORS.PRIMARY}] text-white px-4 py-2 rounded-md`}
										onClick={() => handlePageChange(1)}
									>
										Refresh
									</button>
								</div>
							) : filteredClans.length > 0 ? (
								<ClanList clans={filteredClans} />
							) : (
								<div className="text-center py-12">
									<div className="mb-4 text-gray-400">
										<svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
									<h3 className="text-xl font-semibold mb-2">No matching results</h3>
									<p className="text-gray-600">Please try searching with different keywords</p>
								</div>
							)}

							{filteredClans.length > 0 && (
								<div className="flex justify-center mt-8 sm:mt-12">
									<div className="flex flex-wrap items-center justify-center gap-2">
										<button
											className={`px-2 sm:px-3 py-1 rounded text-sm ${
												isFirstPage
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
											}`}
											onClick={() => handlePageChange(1)}
											disabled={isFirstPage}
										>
											First
										</button>
										<button
											className={`px-2 sm:px-3 py-1 rounded text-sm ${
												isFirstPage
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
											}`}
											onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
											disabled={isFirstPage}
										>
											Prev
										</button>

										{pageNumbers.map((pageNumber, index) =>
											pageNumber === 'ellipsis' ? (
												<span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1 text-sm">
													...
												</span>
											) : (
												<button
													key={`page-${pageNumber}`}
													className={`px-2 sm:px-3 py-1 rounded text-sm ${
														currentPage === pageNumber
															? `bg-[${COLORS.PRIMARY}] text-white`
															: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
													}`}
													onClick={() => handlePageChange(pageNumber as number)}
												>
													{pageNumber}
												</button>
											)
										)}

										<button
											className={`px-2 sm:px-3 py-1 rounded text-sm ${
												isLastPage
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
											}`}
											onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
											disabled={isLastPage}
										>
											Next
										</button>
										<button
											className={`px-2 sm:px-3 py-1 rounded text-sm ${
												isLastPage
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
											}`}
											onClick={() => handlePageChange(totalPages)}
											disabled={isLastPage}
										>
											Last
										</button>
									</div>
								</div>
							)}

							<div className="text-center py-6 sm:py-8 bg-white rounded-lg shadow-sm my-6 sm:my-8 px-4">
								<h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Have a clan you want to add to Discovery?</h3>
								<p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
									Add your clan to Mezon Discovery to reach millions of users and grow your community.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</>
	);
}
