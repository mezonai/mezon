import { Icons } from '@mezon/ui';
import { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const ModalControlRule = ({
	children,
	onClose,
	onSave,
	bottomLeftBtn,
	bottomLeftBtnFunction
}: {
	children: ReactNode;
	onClose?: () => void;
	onSave?: () => void;
	bottomLeftBtn?: string;
	bottomLeftBtnFunction?: () => void;
}) => {
	const { t } = useTranslation('modalControls');
	return (
		<div className="fixed h-screen w-screen z-50 bg-gray-800/80 dark:bg-bgSurface dark:bg-opacity-80 top-0 left-0 flex items-center justify-center">
			<div className="w-[440px] p-5 pt-12 pb-[72px] max-h-[90vh] bg-theme-setting-primary rounded-md relative text-theme-primary flex shadow-lg">
				<div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
				<div className="absolute top-2 right-2 w-6 h-6 cursor-pointer text-theme-primary-active text-theme-primary-hover" onClick={onClose}>
					<Icons.CloseButton />
				</div>

				<div className="absolute w-full p-4 flex bottom-0 left-0 justify-between bg-theme-setting-nav border-t border-gray-200 dark:border-transparent">
					<div className="flex-1 flex">
						<div className="h-10 items-center text-red-500 cursor-pointer hover:underline flex" onClick={bottomLeftBtnFunction}>
							{bottomLeftBtn || t('buttons.reset')}
						</div>
					</div>
					<div className="flex text-theme-primary">
						<div className="hover:underline px-4 h-10 items-center flex cursor-pointer" onClick={onClose}>
							{t('buttons.cancel')}
						</div>
						<div
							className="hover:underline px-4 w-24 h-10 btn-primary btn-primary-hover flex items-center justify-center rounded-md cursor-pointer  transition-colors"
							onClick={onSave}
						>
							{t('buttons.save')}
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
			<h1 className="text-base font-semibold text-theme-primary-active">
				{title} {required && <span className="text-red-500">*</span>}
			</h1>
			<div className="flex flex-col">
				<input
					placeholder={placeholder}
					type={type}
					onChange={handleOnChange}
					value={value}
					className="w-full p-[10px] outline-none rounded bg-theme-input text-theme-primary border border-theme-border-input focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 z-10"
				/>
				{note && <span className="text-xs mt-1 font-light text-gray-500 dark:text-gray-400 animate-move_down">{note}</span>}
				{required && message && <span className="text-red-500 text-xs mt-1 font-light animate-move_down ">{message}</span>}
			</div>
		</div>
	);
};

export default ModalControlRule;
