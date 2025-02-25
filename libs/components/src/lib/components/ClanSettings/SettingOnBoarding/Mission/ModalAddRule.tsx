import { editOnboarding, EGuideType, onboardingActions, useAppDispatch } from '@mezon/store';
import { ApiOnboardingItem } from 'mezon-js/api.gen';
import { ChangeEvent, useState } from 'react';
import ModalControlRule, { ControlInput } from '../ModalControlRule';

const ModalAddRules = ({ onClose, ruleEdit, tempId }: { onClose: () => void; ruleEdit?: ApiOnboardingItem; tempId?: number }) => {
	const [ruleTitle, setRuleTitle] = useState(ruleEdit?.title || '');
	const [ruleDescription, setRuleDescription] = useState(ruleEdit?.content || '');
	const [ruleImage, setRuleImage] = useState<null | string>(ruleEdit?.image_url || null);
	const [file, setFile] = useState<null | File>(null);
	const dispatch = useAppDispatch();

	const handleChangeRuleTitle = (e: ChangeEvent<HTMLInputElement>) => {
		setRuleTitle(e.target.value);
	};
	const handleChangeRuleDescription = (e: ChangeEvent<HTMLInputElement>) => {
		setRuleDescription(e.target.value);
	};
	const handleAddRules = () => {
		if (!tempId && tempId !== 0) {
			dispatch(
				editOnboarding({
					clan_id: ruleEdit?.clan_id as string,
					idOnboarding: ruleEdit?.id as string,
					content: {
						title: ruleTitle,
						content: ruleDescription,
						guide_type: EGuideType.RULE
					}
				})
			);
			onClose();
			return;
		}

		dispatch(
			onboardingActions.addRules({
				title: ruleTitle,
				content: ruleDescription,
				guide_type: EGuideType.RULE,
				file: file ? file : undefined
			})
		);
		onClose();
	};

	const handleRemoveRule = () => {
		if (!ruleEdit) {
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
			setRuleImage(URL.createObjectURL(event.target.files[0]));
			setFile(event.target.files[0]);
		}
	};
	return (
		<ModalControlRule
			onClose={onClose}
			onSave={handleAddRules}
			bottomLeftBtn={ruleEdit ? 'Remove' : undefined}
			bottomLeftBtnFunction={handleRemoveRule}
		>
			<div className="flex flex-col pb-6">
				<div className="text-base font-semibold absolute top-3 left-5 text-white">Edit Resources</div>
				<ControlInput
					placeholder="#rules might be Rules"
					title="Give this resource a name"
					onChange={handleChangeRuleTitle}
					value={ruleTitle}
					required
				/>

				<div className="w-full h-[1px] my-6 bg-channelTextLabel"></div>

				<ControlInput
					placeholder="Ex.Rule for the clan"
					title="Give this resource a description"
					onChange={handleChangeRuleDescription}
					value={ruleDescription}
					required
				/>
				<div className="w-full h-[1px] my-6 bg-channelTextLabel"></div>

				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold text-white">Rules Image</h1>

					<div className="flex justify-between py-2 px-4 bg-bgTertiary rounded items-center">
						<button className="hover:bg-hoverPrimary bg-primary rounded-[4px] py-[6px] px-2 text-nowrap relative select-none h-9 text-white overflow-hidden">
							Browse
							<input
								className="absolute w-full h-full cursor-pointer top-0 right-0 z-10 opacity-0 file:cursor-pointer"
								type="file"
								title=" "
								tabIndex={0}
								accept=".jpg,.jpeg,.png,.gif"
								onChange={handleAddImage}
							/>
						</button>
						<div className="h-12 aspect-square rounded-md flex overflow-hidden bg-bgSecondaryHover ">
							{ruleImage && <img id="blah" src={ruleImage} alt="your image" className="h-full w-full object-cover" />}
						</div>
					</div>
				</div>
			</div>
		</ModalControlRule>
	);
};
export default ModalAddRules;
