import { Icons } from '@mezon/ui';
import { ChangeEvent, HTMLInputTypeAttribute, ReactNode, useState } from 'react';

const ModalControlRule = ({ children, onClose, onSave }: { children: ReactNode; onClose?: () => void; onSave?: () => void }) => {
	return (
		<div className="fixed h-screen w-screen z-50 bg-bgSurface bg-opacity-80 top-0 left-0 flex items-center justify-center">
			<div className="w-[440px] p-5 pt-12 pb-[72px] h-[90%] bg-bgSecondary rounded-md relative text-channelTextLabel ">
				<div className="max-h-full overflow-y-auto hide-scrollbar">{children}</div>
				<div className="absolute top-2 right-2 w-6 h-6 cursor-pointer" onClick={onClose}>
					<Icons.CloseButton />
				</div>

				<div className="absolute w-full p-4 flex bottom-0 left-0 justify-between bg-bgSecondary600">
					<div className="flex-1 flex">
						<div className="h-10 items-center text-red-500 cursor-pointer hover:underline flex">Reset</div>
					</div>
					<div className="flex text-white">
						<div className="hover:underline px-4 h-10 items-center flex cursor-pointer" onClick={onClose}>
							Cancel
						</div>
						<div
							className="hover:underline px-4 w-24 h-10 bg-bgSelectItem flex items-center justify-center rounded-md cursor-pointer"
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
	const [firstTyping, setFirstTyping] = useState(false);
	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e);
		if (!firstTyping) {
			setFirstTyping(true);
		}
	};
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-base font-semibold text-white">
				{title} {required && <span className="text-red-500">*</span>}
			</h1>
			<div className="flex flex-col">
				<input
					placeholder={placeholder}
					type={type}
					onChange={handleOnChange}
					className="w-full p-[10px] outline-none rounded bg-borderDefault z-10"
				/>
				{note && <span className="text-red-500 text-xs mt-1 font-light animate-move_down">{message}</span>}
				{firstTyping && required && message && value.length < 7 && (
					<span className="text-red-500 text-xs mt-1 font-light animate-move_down ">{message}</span>
				)}
			</div>
		</div>
	);
};

export default ModalControlRule;
