import React, { useEffect, useState } from 'react';
import { MezonIcon } from '../mezon-icons';
import * as MzIcons16 from '../mezon-icons/16';
import * as MzIcons20 from '../mezon-icons/20';

interface AlertProps {
	description: string | undefined;
	onClick?: () => void;
}

const AlertTitleTextWarning: React.FC<AlertProps> = ({ description, onClick }) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	useEffect(() => {
		if (description) {
			setIsOpen(true);
		}
	}, [description]);

	const handleClose = () => {
		onClick?.();
		setIsOpen(false);
	};

	return (
		<>
			{isOpen && (
				<div
					id="toast-danger flex"
					className="flex items-center justify-between z-50 w-full md:w-[684px] p-2 mb-4 text-gray-200 bg-gray-900
          rounded-lg shadow dark:text-white dark:bg-gray-800 absolute bottom-0 xl:bottom-8 transform"
					role="alert"
				>
					<div className="flex items-center justify-center">
						<div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-white bg-red-800 rounded-lg dark:bg-red-800 dark:text-red-200">
							<MezonIcon icon={MzIcons20.mzError} />
							<span className="sr-only">Error icon</span>
						</div>
						<div className="ms-3 ml-2 text-sm font-normal flex-nowrap">{description}</div>
					</div>
					<button
						onClick={handleClose}
						type="button"
						className="ms-auto -mx-1.5 -my-1.5  text-gray-400 hover:text-gray-100 rounded-lg
             p-1.5 hover:bg-gray-800 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500
              dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
						data-dismiss-target="#toast-danger"
						aria-label="Close"
					>
						<span className="sr-only">Close</span>
						<MezonIcon icon={MzIcons16.mzClose} />
					</button>
				</div>
			)}
		</>
	);
};

export default AlertTitleTextWarning;
