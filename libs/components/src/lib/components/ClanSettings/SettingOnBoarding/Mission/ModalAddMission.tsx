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
import { useSelector } from 'react-redux';
import ModalControlRule, { ControlInput } from '../ModalControlRule';
type TypeMission = {
	id: number;
	description: string;
	name: string;
};
const ModalAddMission = ({ onClose, missionEdit, tempId }: { onClose: () => void; missionEdit?: ApiOnboardingItem; tempId?: number }) => {
	const listTypeMisstion: TypeMission[] = [
		{
			id: ETypeMission.SEND_MESSAGE,
			description: 'Member sends a message in the channel',
			name: 'mission1'
		},
		{
			id: ETypeMission.VISIT,
			description: 'Member visits the channel',
			name: 'mission2'
		},
		{
			id: ETypeMission.DOSOMETHING,
			description: 'Reading this mission',
			name: 'mission3'
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
			setError('This field is required.');
			return;
		}
		if (e.target.value.length < 7) {
			setError('Actions must be at least 7 characters');
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
			setError('This field is required.');
			return;
		}
		if (title.length < 7) {
			setError('Actions must be at least 7 characters');
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
			bottomLeftBtn={missionEdit ? 'Remove' : undefined}
			bottomLeftBtnFunction={handleRemoveTask}
		>
			<div className="flex flex-col pb-3">
				<ControlInput
					message={error}
					placeholder="Ex. Post a photo of your pet"
					title="What should the new member do?"
					onChange={handleChangeTitle}
					value={title}
					required
				/>
				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold text-gray-800 dark:text-white">
						Where should they do it? <span className="text-red-500">*</span>
					</h1>
					<div className="flex flex-col">
						<select
							className="w-full p-[10px] outline-none rounded bg-gray-100 dark:bg-borderDefault text-gray-800 dark:text-white border border-gray-200 dark:border-transparent"
							onChange={handleSetChannelMission}
							value={missionChannel}
						>
							{listMissionChannel.map((channel) => (
								<option value={channel.id} key={channel.id}>
									{channel.channel_label}
								</option>
							))}
						</select>

						<span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Channels must be viewable by @everyone (public channel)</span>
					</div>
				</div>

				<div className="w-full h-[1px] my-6 bg-gray-300 dark:bg-channelTextLabel"></div>

				<div className="flex flex-col">
					<h1 className="text-base font-semibold text-gray-800 dark:text-white">
						This task is complete when: <span className="text-red-500">*</span>
					</h1>

					{listTypeMisstion.map((missions) => (
						<div className="w-full flex mt-2 gap-2 items-center" key={missions.name}>
							<input
								id={missions.name}
								onChange={(e) => handleSetMission(missions.id)}
								type="radio"
								className={`appearance-none w-5 h-5 bg-transparent relative rounded-full accent-indigo-500 border-2 border-gray-400 dark:border-channelTextLabel checked:after:absolute checked:after:w-3 checked:after:h-3 checked:after:top-[2.4px] checked:after:left-[2.4px] checked:after:bg-indigo-500 dark:checked:after:bg-white checked:after:content-[""] checked:after:rounded-full ${mission === missions.id ? 'border-indigo-500 dark:border-white' : ''} `}
								name="mission"
								checked={mission === missions.id}
							/>
							<label
								htmlFor={missions.name}
								className={`text-base font-medium ${mission === missions.id ? 'text-indigo-600 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}
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
