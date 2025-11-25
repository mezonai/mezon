import { ModalLayout } from '@mezon/components';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<{ [key: string]: string }, HTMLDivElement> & {
	label?: string;
};

function CustomParamsField({ onChange, value, label, errorMessage, showInlineError, fieldType, changed, ...props }: CustomFormFieldProps) {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<Array<{ key: string; value: string }>>([]);
	const handleChangeOptions = (value: { [key: string]: string }) => {
		if (value) {
			let data: { [key: string]: string } = {};
			try {
				data = value;
			} catch (e) {
				data = {};
			}
			const newOptions = Object.keys(data)?.map((key) => {
				return {
					key,
					value: data[key]
				};
			});
			setOptions(newOptions);
		}
	};
	const handleConfirmSave = () => {
		const check = options.every((option) => option.key && option.value);
		if (!check) {
			toast.error('Key and Value are required');
			return;
		}
		const value: { [key: string]: string } = {};
		options.forEach((option) => {
			value[option.key] = option.value;
		});
		onChange(value);
		setOpen(false);
	};
	const handleClose = () => {
		if (value) {
			handleChangeOptions(value);
		}
		setOpen(false);
	};
	const handleOpenModal = () => {
		setOpen(true);
	};
	const handleAddOptions = () => {
		const newOptions = [...options, { key: '', value: '' }];
		setOptions(newOptions);
	};
	useEffect(() => {
		if (value) {
			handleChangeOptions(value);
		}
	}, [value]);
	const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>, attribute: string, index: number) => {
		const value = e.target.value;
		const newOptions = options.map((option, i) => {
			if (i === index) {
				return {
					...option,
					[attribute]: value
				};
			}
			return option;
		});
		setOptions(newOptions);
	};
	const handleDeleteOption = (index: number) => {
		const newOptions = options.filter((_, i) => i !== index);
		setOptions(newOptions);
	};
	return (
		<div className="ImageField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			<div className="p-2 border-[1px] border-gray-300 rounded-md">
				<button
					onClick={handleOpenModal}
					className="flex rounded-full items-center justify-center border-[1px] border-gray-300 hover:bg-gray-100 dark:bg-gray-500 dark:hover:bg-gray-400 w-full h-[40px] shadow-md active:bg-gray-200 transition-all"
				>
					<span className="w-[30px] h-[30px] flex items-center justify-center border-[1px] border-gray-300 rounded-full text-[20px] mr-2">
						+
					</span>
					<span>{props.placeholder}</span>
				</button>
				<div className="mt-2 pt-1 border-t-[1px] border-gray-300">
					<div>
						<span>&#123;</span>
					</div>
					<div className="pl-1 overflow-hidden">
						{options?.length > 0 ? (
							options.map((option, index) => (
								<div key={index}>
									<span>"{option.key}"</span>
									<span>: "{option.value}"</span>,
								</div>
							))
						) : (
							<div className="">/ / No {label}</div>
						)}
					</div>
					<div>
						<span>&#125;</span>
					</div>
				</div>
			</div>
			{open && (
				<ModalLayout onClose={handleClose} className={'backdrop-blur-sm'}>
					<div className="p-4 z-[9999] bg-white dark:bg-gray-800 rounded-3xl shadow-lg w-[500px] max-w-[90vw] mx-auto">
						<div className="header text-center">
							<span className="dark:text-white font-medium text-[20px]">{props.placeholder}</span>
						</div>
						<div className="body my-4">
							<div className="form">
								{options?.length > 0 ? (
									options.map((option, index) => (
										<div key={index} className="form-item flex items-center gap-[40px]">
											<div className="flex-1 grid grid-cols-2 gap-4">
												<div className="flex items-center gap-2">
													<label className="dark:text-white block w-70px text-sm">Key</label>
													<input
														value={option.key}
														onChange={(e) => handleChangeInput(e, 'key', index)}
														type="text"
														className="dark:text-white flex-1 my-1 block w-full px-3 py-1 rounded-md border-[1px] focus:border-[1px] bg-transparent focus-visible:outline-none focus-visible:border-[1px] focus-visible:border-gray-400"
													/>
												</div>
												<div className="flex items-center gap-2">
													<label className="dark:text-white block w-70px text-sm">Value</label>
													<input
														value={option.value}
														onChange={(e) => handleChangeInput(e, 'value', index)}
														type="text"
														className="dark:text-white flex-1 my-1 block w-full px-3 py-1 rounded-md border-[1px] focus:border-[1px] bg-transparent focus-visible:outline-none focus-visible:border-[1px] focus-visible:border-gray-400"
													/>
												</div>
											</div>
											<button
												onClick={() => handleDeleteOption(index)}
												className="text-white font-semibold text-sm shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 bg-red-600 text-[16px] leading-6 rounded-full w-[30px] h-[30px] flex justify-center items-center"
											>
												x
											</button>
										</div>
									))
								) : (
									<div className="text-center dark:text-white">No {label}</div>
								)}
							</div>
						</div>
						<div className="flex justify-between items-center">
							<div>
								<button
									onClick={handleAddOptions}
									className="text-primary dark:text-white font-semibold text-sm px-4 py-1 shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 border-[1px] border-primary text-[16px] leading-6 rounded"
								>
									Add Option
								</button>
							</div>
							<div className="actions flex justify-end items-center">
								<button
									onClick={handleClose}
									className="text-white font-semibold text-sm px-4 py-1 shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 bg-red-600 text-[16px] leading-6 rounded"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmSave}
									className="text-white font-semibold text-sm px-4 py-1 shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 bg-primary text-[16px] leading-6 rounded ml-3"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				</ModalLayout>
			)}
		</div>
	);
}
export default connectField<CustomFormFieldProps>(CustomParamsField);
