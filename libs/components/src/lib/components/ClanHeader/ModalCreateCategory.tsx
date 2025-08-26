import { checkDuplicateCategoryInClan, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Icons, InputField } from '@mezon/ui';
import { ValidateSpecialCharacters, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { ModalLayout } from '../../components';

type ModalCreateCategoryProps = {
	onClose: () => void;
	onCreateCategory: (nameCate: string) => void;
};

const ModalCreateCategory = ({ onClose, onCreateCategory }: ModalCreateCategoryProps) => {
	const [nameCate, setNameCate] = useState('');
	const [checkCategoryName, setCheckCategoryName] = useState(true);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const messages = {
		INVALID_NAME: `Please enter a valid category name (max 64 characters, only words, numbers, _ or -).`,
		DUPLICATE_NAME: `The category  name already exists in the clan . Please enter another name.`
	};
	const [checkValidate, setCheckValidate] = useState(messages.INVALID_NAME);

	const debouncedSetCategoryName = useDebouncedCallback(async (value: string) => {
		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			await dispatch(
				checkDuplicateCategoryInClan({
					categoryName: value.trim(),
					clanId: currentClanId ?? ''
				})
			)
				.then(unwrapResult)
				.then((result) => {
					if (result) {
						setCheckCategoryName(true);
						setCheckValidate(messages.DUPLICATE_NAME);
						return;
					}
					setCheckCategoryName(false);
					setCheckValidate('');
				});
			return;
		} else {
			setCheckCategoryName(true);
			setCheckValidate(messages.INVALID_NAME);
		}
	}, 300);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setNameCate(value);
			if (value === '') {
				setCheckCategoryName(true);
			} else {
				setCheckCategoryName(false);
			}
			debouncedSetCategoryName(value);
		},
		[debouncedSetCategoryName]
	);

	const handleCreateCate = () => {
		onCreateCategory(nameCate);
		setNameCate('');
	};

	const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.checked ? 1 : 0;
	};

	return (
		<ModalLayout onClose={onClose}>
			<div className="w-[480px] bg-theme-setting-primary rounded-xl overflow-hidden">
				<div className=" flex items-center justify-between px-6 pt-4 rounded-tl-[5px] rounded-tr-[5px]">
					<div className="text-[19px] font-bold uppercase">Create Category</div>
					<button className="flex items-center justify-center opacity-50 text-theme-primary-hover" onClick={onClose}>
						<span className="text-4xl">×</span>
					</button>
				</div>
				<div className="bg-theme-setting-primary px-6 py-4">
					<div className="flex flex-col">
						<span className="font-[600] text-sm ">What is category's name?</span>
						<InputField
							type="text"
							onChange={handleInputChange}
							placeholder="Enter the category's name"
							className="py-[8px] border-theme-primary bg-theme-input-primary text-[14px] mt-2 mb-0 border-blue-600 border"
							value={nameCate}
							data-e2e={generateE2eId(`clan_page.modal.create_category.input.category_name`)}
						/>
					</div>
					{checkValidate && <p className="text-[#e44141] text-xs italic font-thin">{checkValidate}</p>}
					<div className="flex flex-row justify-between my-2 items-center">
						<div className="flex flex-row items-center">
							<Icons.LockIcon />
							<span className="text-lg font-semibold">Private Category</span>
						</div>
						<div className="relative flex flex-wrap items-center">
							<input
								className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
	after:bg-slate-500 after:transition-all
	checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
	hover:bg-slate-400 after:hover:bg-slate-600
	checked:hover:bg-[#4654C0] checked:after:hover:bg-white
	focus:outline-none checked:focus:bg-[#4654C0] checked:after:focus:bg-white
	focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:after:bg-slate-300 "
								type="checkbox"
								value={1}
								id="id-c01"
								onChange={handleToggle}
								data-e2e={generateE2eId(`clan_page.modal.create_category.toggle.private`)}
							/>
						</div>
					</div>
					<p className="text-sm">
						By making a category private, only select members and roles will be able to view this category. Synced channels in this
						category will automatically match to this setting
					</p>
				</div>
				<div className=" font-semibold text-sm flex   justify-end flex-row items-center gap-4 py-4 px-6 rounded-bl-[5px] rounded-br-[5px]">
					<button
						onClick={onClose}
						className=" hover:underline text-theme-primary"
						data-e2e={generateE2eId(`clan_page.modal.create_category.button.cancel`)}
					>
						Cancel
					</button>
					<button
						className={`px-4 py-2  btn-primary btn-primary-hover rounded-lg  ${checkValidate ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={handleCreateCate}
						disabled={checkCategoryName}
						data-e2e={generateE2eId(`clan_page.modal.create_category.button.confirm`)}
					>
						Create Category
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalCreateCategory;
