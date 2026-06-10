import React, { useEffect, useState } from 'react';
import { COLORS } from '../../constants/constants';
import { useDiscover } from '../../context/DiscoverContext';

interface CategoriesProps {
	selectedCategory: string;
	onCategorySelect: (categoryId: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ selectedCategory, onCategorySelect }) => {
	const [isOpen, setIsOpen] = useState(false);
	const { categories, categoriesLoading } = useDiscover();

	const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory) || categories[0];

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isOpen && !(event.target as Element).closest('.categories-dropdown')) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add('overflow-hidden');
		} else {
			document.body.classList.remove('overflow-hidden');
		}
		return () => document.body.classList.remove('overflow-hidden');
	}, [isOpen]);

	if (categoriesLoading || categories.length === 0) {
		return null;
	}

	return (
		<>
			<div className="lg:hidden mb-4 categories-dropdown">
				<button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${selectedCategoryData.gradient}`}>
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedCategoryData.icon} />
							</svg>
						</div>
						<span className="font-medium text-sm">{selectedCategoryData.name}</span>
					</div>
					<svg
						className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{isOpen && (
					<div className="fixed inset-0 z-[9999] lg:hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
						<div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg max-h-[80vh] overflow-y-auto z-[10000]">
							<div className="p-4">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-semibold text-gray-800">Categories</h3>
									<button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
										<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
								<div className="space-y-2">
									{categories.map((category) => (
										<button
											key={category.id}
											onClick={() => {
												onCategorySelect(category.id);
												setIsOpen(false);
											}}
											className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg
                                                ${
													selectedCategory === category.id
														? `bg-[${COLORS.PRIMARY}] text-white`
														: 'text-gray-700 hover:bg-gray-100'
												}`}
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${category.gradient}`}
												>
													<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
													</svg>
												</div>
												<span>{category.name}</span>
											</div>
											<span
												className={`text-xs ${selectedCategory === category.id ? 'text-white opacity-75' : 'text-gray-500'}`}
											>
												{category.count.toLocaleString()}
											</span>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="hidden lg:block w-full lg:w-64 bg-white rounded-lg shadow-sm p-4 sticky top-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
				<div className="space-y-2">
					{categories.map((category) => (
						<button
							key={category.id}
							onClick={() => onCategorySelect(category.id)}
							className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-300
                                ${
									selectedCategory === category.id
										? `bg-[${COLORS.PRIMARY}] text-white transform scale-[1.02]`
										: 'text-gray-700 hover:bg-gray-100'
								}`}
						>
							<div className="flex items-center gap-3 min-w-0">
								<div
									className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-gradient-to-br ${category.gradient}`}
								>
									<svg
										className="w-5 h-5 text-white transition-transform duration-300 hover:rotate-12"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
									</svg>
								</div>
								<span className="truncate">{category.name}</span>
							</div>
							<span
								className={`text-xs flex-shrink-0 ml-2 ${selectedCategory === category.id ? 'text-white opacity-75' : 'text-gray-500'}`}
							>
								{category.count.toLocaleString()}
							</span>
						</button>
					))}
				</div>
			</div>
		</>
	);
};

export default Categories;
