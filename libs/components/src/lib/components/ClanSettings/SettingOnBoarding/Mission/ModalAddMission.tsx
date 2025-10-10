import {
	editOnboarding,
	EGuideType,
	ETypeMission,
	onboardingActions,
	selectAllChannels,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelStatusEnum } from '@mezon/utils';
import { ApiOnboardingItem } from 'mezon-js/api.gen';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ModalControlRule, { ControlInput } from '../ModalControlRule';
type TypeMission = {
	id: number;
	description: string;
	name: string;
};
const ModalAddMission = ({ onClose, missionEdit, tempId }: { onClose: () => void; missionEdit?: ApiOnboardingItem; tempId?: number }) => {
	const { t } = useTranslation('onboardingMissions');
	
	const listTypeMisstion: TypeMission[] = [
		{
			id: ETypeMission.SEND_MESSAGE,
			description: t('missions.sendMessage.description'),
			name: t('missions.sendMessage.name')
		},
		{
			id: ETypeMission.VISIT,
			description: t('missions.visit.description'),
			name: t('missions.visit.name')
		},
		{
			id: ETypeMission.DOSOMETHING,
			description: t('missions.doSomething.description'),
			name: t('missions.doSomething.name')
		}
	];
	const currentClanId = useSelector(selectCurrentClanId);
	const allChannel = useAppSelector(selectAllChannels);
	const listMissionChannel = useMemo(() => {
		return allChannel.filter((channel) => channel.channel_private !== ChannelStatusEnum.isPrivate && channel.id);
	}, [allChannel]);

	const [title, setTitle] = useState(missionEdit?.title || '');
	const [missionChannel, setMissionChannel] = useState(missionEdit?.channel_id || listMissionChannel[0]?.id || '');
	const [mission, setMission] = useState<ETypeMission>(missionEdit?.task_type || ETypeMission.SEND_MESSAGE);
	const [error, setError] = useState('');
	const dispatch = useAppDispatch();
	const handleChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
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

	const handleSetMission = (value: number) => {
		setMission(value);
	};

	const handleSetChannelMission = (e: ChangeEvent<HTMLSelectElement>) => {
		setMissionChannel(e.target.value);
	};

	const hasChanges = useMemo(() => {
		if (missionEdit?.id) {
			if (title !== missionEdit?.title) {
				return true;
			}
			if (missionChannel !== missionEdit?.channel_id) {
				return true;
			}
			if (mission !== missionEdit?.task_type) {
				return true;
			}
			return false;
		}
		return title.length >= 7;
	}, [title, mission, missionChannel, missionEdit?.id, missionEdit]);

	const handleAddTask = () => {
		if (!title) {
			setError(t('form.required'));
			return;
		}
		if (title.length < 7) {
			setError(t('form.minCharacters'));
			return;
		}

		if (!hasChanges) {
			missionEdit?.id && onClose();
			return;
		}
		if (missionEdit?.id) {
			dispatch(
				editOnboarding({
					clan_id: currentClanId as string,
					idOnboarding: missionEdit?.id as string,
					content: {
						title: title,
						guide_type: EGuideType.TASK,
						task_type: mission || 0,
						channel_id: missionChannel
					}
				})
			);
			onClose();
			return;
		}

		dispatch(
			onboardingActions.addMission({
				data: {
					title: title,
					guide_type: EGuideType.TASK,
					task_type: mission || 0,
					channel_id: missionChannel
				},
				update: tempId
			})
		);
		onClose();
	};

	const handleRemoveTask = () => {
		if (!missionEdit) {
			setTitle('');
			setMissionChannel(listMissionChannel[0]?.id || '');
			setMission(ETypeMission.SEND_MESSAGE);
			return;
		}
		if (tempId !== undefined) {
			dispatch(
				onboardingActions.removeTempTask({
					idTask: tempId,
					type: EGuideType.TASK
				})
			);
			return;
		}
		dispatch(
			onboardingActions.removeOnboardingTask({
				clan_id: missionEdit.clan_id as string,
				idTask: missionEdit.id as string,
				type: EGuideType.TASK
			})
		);
	};
	return (
		<ModalControlRule
			onClose={onClose}
			onSave={handleAddTask}
			bottomLeftBtn={missionEdit ? t('buttons.remove') : undefined}
			bottomLeftBtnFunction={handleRemoveTask}
		>
			<div className="flex flex-col pb-3">
				<ControlInput
					message={error}
					placeholder={t('form.placeholder')}
					title={t('form.title')}
					onChange={handleChangeTitle}
					value={title}
					required
				/>
				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold text-theme-primary-active">
						{t('form.channelTitle')} <span className="text-red-500">*</span>
					</h1>
					<div className="flex flex-col">
						<select
							className="w-full p-[10px] outline-none rounded text-theme-primary bg-theme-input"
							onChange={handleSetChannelMission}
							value={missionChannel}
						>
							{listMissionChannel.map((channel) => (
								<option value={channel.id} key={channel.id}>
									{channel.channel_label}
								</option>
							))}
						</select>

						<span className="text-xs mt-1 text-theme-primary">{t('form.channelNote')}</span>
					</div>
				</div>

				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<div className="flex flex-col">
					<h1 className="text-base font-semibold text-theme-primary-active">
						{t('form.completeWhen')} <span className="text-red-500">*</span>
					</h1>

					{listTypeMisstion.map((missions) => (
						<div className="w-full flex mt-2 gap-2 items-center" key={missions.name}>
							<input
								id={missions.name}
								onChange={(e) => handleSetMission(missions.id)}
								type="radio"
								className={`appearance-none w-5 h-5 bg-transparent relative rounded-full accent-indigo-500 border-2 border-gray-400 dark:border-channelTextLabel checked:after:absolute checked:after:w-3 checked:after:h-3 checked:after:top-[2.4px] checked:after:left-[2.4px] checked:after:bg-indigo-500 checked:after:content-[""] checked:after:rounded-full ${mission === missions.id ? 'border-indigo-500' : ''} `}
								name="mission"
								checked={mission === missions.id}
							/>
							<label
								htmlFor={missions.name}
								className={`text-base font-medium ${mission === missions.id ? 'text-indigo-600 text-theme-primary-active' : 'text-theme-primary'}`}
							>
								{missions.description}
							</label>
						</div>
					))}
				</div>
			</div>
		</ModalControlRule>
	);
};

export default ModalAddMission;
