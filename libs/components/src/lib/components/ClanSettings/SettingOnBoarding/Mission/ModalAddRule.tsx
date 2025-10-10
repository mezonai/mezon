import { editOnboarding, EGuideType, onboardingActions, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { fileTypeImage, generateE2eId, MAX_FILE_SIZE_10MB } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiOnboardingItem } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ELimitSize } from '../../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../../ModalValidateFile/ModalOverData';
import ModalControlRule, { ControlInput } from '../ModalControlRule';

const ModalAddRules = ({ onClose, ruleEdit, tempId }: { onClose: () => void; ruleEdit?: ApiOnboardingItem; tempId?: number }) => {
	const { t } = useTranslation('onboardingRules');
	const [ruleTitle, setRuleTitle] = useState(ruleEdit?.title || '');
	const [ruleDescription, setRuleDescription] = useState(ruleEdit?.content || '');
	const [ruleImage, setRuleImage] = useState<null | string>(ruleEdit?.image_url || null);
	const [file, setFile] = useState<null | File>(null);
	const [error, setError] = useState('');
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const handleChangeRuleTitle = (e: ChangeEvent<HTMLInputElement>) => {
		setRuleTitle(e.target.value);
		if (!e.target.value.length) {
			setError(t('form.required'));
			return;
		}
		if (e.target.value.length < 7) {
			setError(t('form.minCharacters'));
		} else {
			setError('');
		}
	};
	const handleChangeRuleDescription = (e: ChangeEvent<HTMLInputElement>) => {
		setRuleDescription(e.target.value);
	};

	const hasChanges = useMemo(() => {
		if (ruleEdit?.id) {
			if (ruleTitle !== ruleEdit?.title) {
				return true;
			}
			if (ruleDescription !== ruleEdit?.content) {
				return true;
			}

			return !!file;
		}
		return ruleTitle;
	}, [ruleTitle, ruleDescription, ruleEdit?.id, ruleEdit, file]);
	const { sessionRef, clientRef } = useMezon();

	const handleAddRules = async () => {
		if (!ruleTitle) {
			setError(t('form.required'));
			return;
		}
		if (ruleTitle.length < 7) {
			setError(t('form.minCharacters'));
			return;
		}
		if (!hasChanges) {
			ruleEdit?.id && onClose();
			return;
		}
		if (ruleEdit?.id) {
			let image_url = ruleEdit?.image_url;
			if (file) {
				if (clientRef.current && sessionRef.current) {
					const id = Snowflake.generate();
					const path = `onboarding/${id}.webp`;
					const uploadResponse = await handleUploadEmoticon(clientRef.current, sessionRef.current, path, file);
					if (uploadResponse) {
						image_url = uploadResponse?.url;
					}
				}
			}
			dispatch(
				editOnboarding({
					clan_id: ruleEdit?.clan_id as string,
					idOnboarding: ruleEdit?.id as string,
					content: {
						title: ruleTitle,
						content: ruleDescription,
						guide_type: EGuideType.RULE,
						image_url
					}
				})
			);
			onClose();
			return;
		}

		dispatch(
			onboardingActions.addRules({
				rule: {
					title: ruleTitle,
					content: ruleDescription,
					guide_type: EGuideType.RULE,
					file: file ? file : undefined
				},
				update: tempId
			})
		);
		onClose();
	};

	const handleRemoveRule = () => {
		if (!ruleEdit) {
			setRuleTitle('');
			setRuleDescription('');
			setRuleImage(null);
			setFile(null);
			return;
		}
		if (tempId !== undefined) {
			dispatch(
				onboardingActions.removeTempTask({
					idTask: tempId,
					type: EGuideType.RULE
				})
			);
			return;
		}

		dispatch(
			onboardingActions.removeOnboardingTask({
				clan_id: ruleEdit.clan_id as string,
				idTask: ruleEdit.id as string,
				type: EGuideType.RULE
			})
		);
	};

	const handleAddImage = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const file = event.target.files[0];
			if (!fileTypeImage.includes(file.type)) {
				setOpenTypeModal(true);
				return;
			}

			if (file.size > MAX_FILE_SIZE_10MB) {
				setOpenModal(true);
				return;
			}

			setRuleImage(URL.createObjectURL(event.target.files[0]));
			setFile(event.target.files[0]);
		}
	};
	return (
		<ModalControlRule
			onClose={onClose}
			onSave={handleAddRules}
			bottomLeftBtn={ruleEdit ? t('buttons.remove') : undefined}
			bottomLeftBtnFunction={handleRemoveRule}
		>
			<div className="flex flex-col pb-6">
				<div className="text-base font-semibold absolute top-3 left-5 text-theme-primary-active">{t('editResources')}</div>
				<ControlInput
					placeholder={t('form.namePlaceholder')}
					title={t('form.nameTitle')}
					onChange={handleChangeRuleTitle}
					value={ruleTitle}
					required
					message={error}
				/>

				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<ControlInput
					placeholder={t('form.descriptionPlaceholder')}
					title={t('form.descriptionTitle')}
					onChange={handleChangeRuleDescription}
					value={ruleDescription}
				/>
				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold text-theme-primary-active">{t('form.imageTitle')}</h1>

					<div className="flex justify-between py-2 px-4 bg-theme-input rounded items-center">
						<button className="btn-primary btn-primary-hover rounded-[4px] py-[6px] px-2 text-nowrap relative select-none h-9 text-white overflow-hidden transition-colors">
							{t('form.browse')}
							<input
								className="absolute w-full h-full cursor-pointer top-0 right-0 z-10 opacity-0 file:cursor-pointer"
								type="file"
								title=" "
								tabIndex={0}
								accept=".jpg,.jpeg,.png,.gif"
								onChange={handleAddImage}
								data-e2e={generateE2eId('clan_page.settings.upload.onboarding_resource_input')}
							/>
						</button>
						<div className="h-12 aspect-square rounded-md flex overflow-hidden bg-theme-primary-active border border-theme-border-input">
							{ruleImage && <img id="blah" src={ruleImage} alt="your image" className="h-full w-full object-cover" />}
						</div>
					</div>
				</div>
				<ModalOverData size={ELimitSize.MB_10} onClose={() => setOpenModal(false)} open={openModal} />
				<ModalErrorTypeUpload onClose={() => setOpenTypeModal(false)} open={openTypeModal} />
			</div>
		</ModalControlRule>
	);
};
export default ModalAddRules;
