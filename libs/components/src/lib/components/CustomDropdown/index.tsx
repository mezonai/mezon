import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { useState } from 'react';

interface ICustomDropdownProps {
	dropdownItems: string[];
	dropDownTitle: string;
}

const CustomDropdown = ({ dropdownItems, dropDownTitle }: ICustomDropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div className="relative">
			<button
				id="dropdownDefaultButton"
				onClick={toggleDropdown}
				className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				type="button"
			>
				<div>{dropDownTitle}</div>
				<MezonIcon icon={MzIcons16.mzChevronDown} className="ms-3" />
			</button>

			{isOpen && (
				<div id="dropdown" className="absolute w-full top-[40px] left-0 z-10 bg-theme-input">
					<ul className="py-2 text-sm " aria-labelledby="dropdownDefaultButton">
						<li>
							{dropdownItems.map((value, index) => (
								<div key={index} className="block px-4 py-2 bg-item-hover">
									{value}
								</div>
							))}
						</li>
					</ul>
				</div>
			)}
		</div>
	);
};

export default CustomDropdown;
