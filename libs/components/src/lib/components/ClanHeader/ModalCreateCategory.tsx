import { useEscapeKeyClose } from '@mezon/core';
import { checkDuplicateCategoryInClan, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { InputField } from '@mezon/ui';
import { ValidateSpecialCharacters, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { ModalLayout } from '../../components';

type ModalCreateCategoryProps = {
	onClose: () => void;
	onCreateCategory: (nameCate: string) => void;
};

const ModalCreateCategory = ({ onClose, onCreateCategory }: ModalCreateCategoryProps) => {
	const { t } = useTranslation('clan');
	const [nameCate, setNameCate] = useState('');
	const [checkCategoryName, setCheckCategoryName] = useState(true);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const [checkValidate, setCheckValidate] = useState(t('createCategoryModal.invalidName'));

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	useEffect(() => {
		if (modalRef.current) {
			modalRef.current.focus();
		}
	}, []);

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
						setCheckValidate(t('createCategoryModal.duplicateName'));
						return;
					}
					setCheckCategoryName(false);
					setCheckValidate('');
				});
			return;
		} else {
			setCheckCategoryName(true);
			setCheckValidate(t('createCategoryModal.invalidName'));
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

	return (
		<ModalLayout onClose={onClose}>
			<div ref={modalRef} className="w-[90%] max-w-[480px] bg-theme-setting-primary rounded-xl overflow-hidden" tabIndex={-1} autoFocus>
				<div className=" flex items-center justify-between px-6 pt-4 rounded-tl-[5px] rounded-tr-[5px]">
					<div className="text-[19px] font-bold uppercase">{t('createCategoryModal.title')}</div>
					<button className="flex items-center justify-center opacity-50 text-theme-primary-hover" onClick={onClose}>
						<span className="text-4xl">×</span>
					</button>
				</div>
				<div className="bg-theme-setting-primary px-6 py-4">
					<div className="flex flex-col">
						<span className="font-[600] text-sm ">{t('createCategoryModal.nameLabel')}</span>
						<InputField
							type="text"
							onChange={handleInputChange}
							placeholder={t('createCategoryModal.namePlaceholder')}
							className="py-[8px] border-theme-primary bg-theme-input-primary text-[14px] mt-2 mb-0 border-blue-600 border"
							value={nameCate}
							data-e2e={generateE2eId(`clan_page.modal.create_category.input.category_name`)}
						/>
					</div>
					{checkValidate && (
						<p
							className="text-[#e44141] text-xs italic font-thin"
							data-e2e={generateE2eId(`clan_page.modal.create_category.error_message`)}
						>
							{checkValidate}
						</p>
					)}
				</div>
				<div className=" font-semibold text-sm flex   justify-end flex-row items-center gap-4 py-4 px-6 rounded-bl-[5px] rounded-br-[5px]">
					<button
						onClick={onClose}
						className=" hover:underline text-theme-primary"
						data-e2e={generateE2eId(`clan_page.modal.create_category.button.cancel`)}
					>
						{t('createCategoryModal.cancel')}
					</button>
					<button
						className={`px-4 py-2  btn-primary btn-primary-hover rounded-lg  ${checkValidate ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={handleCreateCate}
						disabled={checkCategoryName}
						data-e2e={generateE2eId(`clan_page.modal.create_category.button.confirm`)}
					>
						{t('createCategoryModal.create')}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalCreateCategory;
