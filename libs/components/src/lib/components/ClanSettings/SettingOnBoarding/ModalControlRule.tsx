import { Icons } from '@mezon/ui';
import { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from 'react';

const ModalControlRule = ({
	children,
	onClose,
	onSave,
	bottomLeftBtn = 'Reset',
	bottomLeftBtnFunction
}: {
	children: ReactNode;
	onClose?: () => void;
	onSave?: () => void;
	bottomLeftBtn?: string;
	bottomLeftBtnFunction?: () => void;
}) => {
	return (
		<div className="fixed h-screen w-screen z-50 bg-gray-800/80 dark:bg-bgSurface dark:bg-opacity-80 top-0 left-0 flex items-center justify-center">
			<div className="w-[440px] p-5 pt-12 pb-[72px] max-h-[90vh] bg-white dark:bg-bgSecondary rounded-md relative text-gray-700 dark:text-channelTextLabel flex shadow-lg">
				<div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
				<div
					className="absolute top-2 right-2 w-6 h-6 cursor-pointer text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
					onClick={onClose}
				>
					<Icons.CloseButton />
				</div>

				<div className="absolute w-full p-4 flex bottom-0 left-0 justify-between bg-gray-100 dark:bg-bgSecondary600 border-t border-gray-200 dark:border-transparent">
					<div className="flex-1 flex">
						<div className="h-10 items-center text-red-500 cursor-pointer hover:underline flex" onClick={bottomLeftBtnFunction}>
							{bottomLeftBtn}
						</div>
					</div>
					<div className="flex text-gray-700 dark:text-white">
						<div className="hover:underline px-4 h-10 items-center flex cursor-pointer" onClick={onClose}>
							Cancel
						</div>
						<div
							className="hover:underline px-4 w-24 h-10 bg-indigo-500 hover:bg-indigo-600 dark:bg-bgSelectItem dark:hover:bg-blue-600 flex items-center justify-center rounded-md cursor-pointer text-white transition-colors"
							onClick={onSave}
						>
							Save
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const ControlInput = ({
	title,
	placeholder,
	type = 'text',
	value,
	onChange,
	required = false,
	message,
	note
}: {
	title: ReactNode;
	placeholder?: string;
	type?: HTMLInputTypeAttribute;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	value: string;
	required?: boolean;
	message?: string;
	note?: string;
}) => {
	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e);
	};
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-base font-semibold text-gray-800 dark:text-white">
				{title} {required && <span className="text-red-500">*</span>}
			</h1>
			<div className="flex flex-col">
				<input
					placeholder={placeholder}
					type={type}
					onChange={handleOnChange}
					value={value}
					className="w-full p-[10px] outline-none rounded bg-gray-100 dark:bg-borderDefault text-gray-800 dark:text-white border border-gray-200 dark:border-transparent focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-500 focus:border-indigo-300 dark:focus:border-blue-500 z-10"
				/>
				{note && <span className="text-xs mt-1 font-light text-gray-500 dark:text-gray-400 animate-move_down">{note}</span>}
				{required && message && <span className="text-red-500 text-xs mt-1 font-light animate-move_down ">{message}</span>}
			</div>
		</div>
	);
};

export default ModalControlRule;
