import React from 'react';

interface Category {
	id: string;
	name: string;
	count: number;
}

/**
 * @param categories
 * @param selectedCategory
 * @param onChange
 */
interface CategoryTabsProps {
	categories: Category[];
	selectedCategory: string;
	onChange: (categoryId: string) => void;
}

const CategoryIcon: React.FC<{ categoryId: string }> = ({ categoryId }) => {
	switch (categoryId) {
		case 'all':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z" />
				</svg>
			);
		case 'gaming':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M11,13H8v3H6v-3H3v-2h3V8h2v3h3V13z M15.5,15L15.5,15c-0.83,0-1.5-0.67-1.5-1.5v0c0-0.83,0.67-1.5,1.5-1.5h0c0.83,0,1.5,0.67,1.5,1.5v0C17,14.33,16.33,15,15.5,15z M19.5,12L19.5,12c-0.83,0-1.5-0.67-1.5-1.5v0c0-0.83,0.67-1.5,1.5-1.5h0c0.83,0,1.5,0.67,1.5,1.5v0 C21,11.33,20.33,12,19.5,12z" />
				</svg>
			);
		case 'entertainment':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M4,6H2v16h16v-2H4V6z M6,2v16h16V2H6z M14,10.5V8c0-0.55-0.45-1-1-1H9.5c-0.55,0-1,0.45-1,1v8c0,0.55,0.45,1,1,1H13 c0.55,0,1-0.45,1-1v-2.5l3.29,3.29c0.39,0.39,1.03,0.39,1.42,0c0.39-0.39,0.39-1.02,0-1.41L15.42,12l3.29-3.29 c0.39-0.39,0.39-1.02,0-1.41s-1.03-0.39-1.42,0L14,10.5z" />
				</svg>
			);
		case 'education':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5c-1.95,0-4.05,0.4-5.5,1.5v14.65 c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5 c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5 c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z" />
				</svg>
			);
		case 'science':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M13,11.33L18,18H6l5-6.67V6h2V11.33z M15.96,4H8.04C7.62,4,7.39,4.48,7.65,4.81L9,6.5v4.17L3.2,18.4C2.71,19.06,3.18,20,4,20h16 c0.82,0,1.29-0.94,0.8-1.6L15,10.67V6.5l1.35-1.69C16.61,4.48,16.38,4,15.96,4z" />
				</svg>
			);
		case 'music':
			return (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12,3c-4.97,0-9,4.03-9,9v7c0,1.1,0.9,2,2,2h4v-8H5v-1c0-3.87,3.13-7,7-7s7,3.13,7,7v1h-4v8h4c1.1,0,2-0.9,2-2v-7 C21,7.03,16.97,3,12,3z M7,15v4H5v-4H7z M19,19h-2v-4h2V19z" />
				</svg>
			);
		default:
			return <div className="w-5 h-5" />;
	}
};

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selectedCategory, onChange }) => {
	const formatNumber = (num: number) => {
		return num.toLocaleString('en-US');
	};

	return (
		<div className="mb-8">
			<div className="grid grid-cols-1 gap-2 bg-white rounded-lg shadow-sm p-2">
				{categories.map((category) => (
					<button
						key={category.id}
						className={`p-4 font-medium text-left flex items-center rounded-md transition-colors ${
							selectedCategory === category.id ? 'bg-[#5865f2] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
						}`}
						onClick={() => onChange(category.id)}
					>
						<div className={`${selectedCategory === category.id ? 'text-white' : 'text-[#5865f2]'} mr-3`}>
							<CategoryIcon categoryId={category.id} />
						</div>

						<span className="flex-1">{category.name}</span>

						<span
							className={`${selectedCategory === category.id ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-600'} 
                            ml-2 px-3 py-1 text-xs rounded-full`}
						>
							{formatNumber(category.count)}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default CategoryTabs;
