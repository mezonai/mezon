import { useCategory } from '@mezon/core';
import {
	defaultNotificationActions,
	defaultNotificationCategoryActions,
	notificationSettingActions,
	selectAllchannelCategorySetting,
	selectCurrentChannelNotificatonSelected,
	selectCurrentClan,
	selectCurrentClanId,
	selectDefaultNotificationClan,
	selectTheme,
	useAppDispatch
} from '@mezon/store';
import { Modal } from '@mezon/ui';
import { ThemeApp } from '@mezon/utils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Creatable from 'react-select/creatable';
import { notificationTypesList } from '../PanelChannel';
export type ModalParam = {
	onClose: () => void;
	open: boolean;
};

export const customStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: 'black'
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: 'bg-[#36393e]'
	}),
	option: (provided: any, state: any) => ({
		...provided,
		backgroundColor: state.isFocused ? '#36393e' : '#1f2023',
		color: 'white'
	}),
	multiValue: (provided: any) => ({
		...provided,
		backgroundColor: '#1f2023'
	}),
	multiValueLabel: (provided: any) => ({
		...provided,
		color: 'black'
	}),
	multiValueRemove: (provided: any) => ({
		...provided,
		color: 'red',
		':hover': {
			backgroundColor: '#36393e',
			color: 'white'
		}
	})
};

export const lightCustomStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: 'white'
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: 'bg-[#d5d6d7]'
	}),
	option: (provided: any, state: any) => ({
		...provided,
		backgroundColor: state.isFocused ? 'white' : '#e8e9e9',
		color: 'black'
	}),
	multiValue: (provided: any) => ({
		...provided,
		backgroundColor: '#c5c6c7'
	}),
	multiValueLabel: (provided: any) => ({
		...provided,
		color: 'black'
	}),
	multiValueRemove: (provided: any) => ({
		...provided,
		color: 'red',
		':hover': {
			backgroundColor: '#cecfd0',
			color: 'white'
		}
	})
};

const ModalNotificationSetting = (props: ModalParam) => {
	const appearanceTheme = useSelector(selectTheme);
	const currentClan = useSelector(selectCurrentClan);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const notificatonSelected = useSelector(selectCurrentChannelNotificatonSelected);
	const channelCategorySettings = useSelector(selectAllchannelCategorySetting);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const sortedChannelCategorySettings = React.useMemo(() => {
		const settingsCopy = [...channelCategorySettings];
		settingsCopy.sort((a, b) => {
			if (a.channel_category_label && b.channel_category_label) {
				if (a.channel_category_label < b.channel_category_label) {
					return -1;
				}
				if (a.channel_category_label > b.channel_category_label) {
					return 1;
				}
			}
			return 0;
		});
		return settingsCopy;
	}, [channelCategorySettings]);
	const handleNotificationClanChange = (event: any, notification: number) => {
		dispatch(defaultNotificationActions.setDefaultNotificationClan({ clan_id: currentClan?.id, notification_type: notification }));
	};
	const { categorizedChannels } = useCategory();
	const options = categorizedChannels.flatMap((category) => [
		{
			id: category.id,
			label: category.category_name,
			title: 'category'
		},
		...category.channels
			.filter((channel) => channel.type !== 4)
			.map((channel) => ({
				id: channel.id,
				label: `# ${channel.channel_label}`,
				title: 'channel'
			}))
	]);
	const [selectedOption, setSelectedOption] = useState(null);
	const handleChange = (newValue: any) => {
		setSelectedOption(newValue);
		if (newValue.title === 'category') {
			dispatch(
				defaultNotificationCategoryActions.setDefaultNotificationCategory({
					category_id: newValue.id,
					notification_type: defaultNotificationClan?.notification_setting_type,
					clan_id: currentClanId || ''
				})
			);
		}
		if (newValue.title === 'channel') {
			if (notificatonSelected?.notification_setting_type === 0 || notificatonSelected?.notification_setting_type === undefined) {
				dispatch(
					notificationSettingActions.setNotificationSetting({
						channel_id: newValue.id,
						notification_type: defaultNotificationClan?.notification_setting_type,
						clan_id: currentClanId || ''
					})
				);
			} else {
				dispatch(
					notificationSettingActions.setNotificationSetting({
						channel_id: newValue.id,
						notification_type: notificatonSelected?.notification_setting_type,
						clan_id: currentClanId || ''
					})
				);
			}
		}
	};

	const handleDefaultNotificationChange = (notificationType: any, channelCategoryId: any, title: string) => {
		if (title === 'category') {
			dispatch(
				defaultNotificationCategoryActions.setDefaultNotificationCategory({
					category_id: channelCategoryId,
					notification_type: notificationType,
					clan_id: currentClanId || ''
				})
			);
		}
		if (title === 'channel') {
			dispatch(
				notificationSettingActions.setNotificationSetting({
					channel_id: channelCategoryId,
					notification_type: notificationType,
					clan_id: currentClanId || ''
				})
			);
		}
	};

	const handleRemoveOverride = (title: string, id: string) => {
		if (title === 'category') {
			dispatch(defaultNotificationCategoryActions.deleteDefaultNotificationCategory({ category_id: id, clan_id: currentClan?.clan_id }));
		}
		if (title === 'channel') {
			dispatch(notificationSettingActions.deleteNotiChannelSetting({ channel_id: id, clan_id: currentClanId || '' }));
		}
	};

	return (
		<Modal
			title="Notification Setting"
			onClose={props.onClose}
			showModal={props.open}
			subTitleBox={`${currentClan?.clan_name}`}
			classSubTitleBox="ml-[0px] cursor-default dark:text-zinc-400 text-colorTextLightMode"
			borderBottomTitle="border-b "
		>
			<div>
				<div className={`${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
					<div className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase mb-2">CLAN NOTIFICATION SETTINGS</div>
					<div className="space-y-2">
						{notificationTypesList.map((notificationType, index) => (
							<div
								key={index}
								className="flex items-center gap-x-3 p-[12px] dark:bg-bgModifierHover bg-bgModifierHoverLight hover:dark:bg-black hover:bg-bgLightModeButton rounded text-sm"
							>
								<input
									type="radio"
									id={`notification-${index}`}
									name="notification-setting"
									value={notificationType.label}
									className="relative disabled:bg-slate-500  float-left mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
									checked={notificationType.value === defaultNotificationClan?.notification_setting_type}
									onChange={(event) => handleNotificationClanChange(event, Number(notificationType.value))}
								/>
								<label htmlFor={`notification-${index}`}>{notificationType.label}</label>
							</div>
						))}
					</div>

					<hr className="border-zinc-500 my-4" />
					<div className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase mb-2">NOTIFICATION OVERRIDES</div>
					<div className="text-sm font-normal dark:text-textSecondary text-textSecondary800 mb-2">
						Add a channel to override its default notification settings
					</div>
					<div className={appearanceTheme === ThemeApp.Dark ? '' : 'lightModeScrollBarMention'}>
						<Creatable
							isClearable
							onChange={handleChange}
							options={options}
							value={selectedOption}
							placeholder="Select or create an option..."
							styles={appearanceTheme === ThemeApp.Dark ? customStyles : lightCustomStyles}
						/>
					</div>
					<div className={`mt-4 overflow-visible ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''} `}>
						<table className="w-full mt-4 hide-scrollbar overflow-hidden space-y-2">
							<thead>
								<tr className="grid grid-cols-7">
									<th className="text-xs font-bold dark:text-white text-colorTextLightMode uppercase mb-2 col-span-3">
										CHANNEL OR CATEGORY
									</th>
									<th className="text-xs font-bold dark:text-white text-colorTextLightMode uppercase mb-2 col-span-1">ALL</th>
									<th className="text-xs font-bold dark:text-white text-colorTextLightMode uppercase mb-2 col-span-1">MENTIONS</th>
									<th className="text-xs font-bold dark:text-white text-colorTextLightMode uppercase mb-2 col-span-1">NOTHING</th>
									<th className="text-xs font-bold dark:text-white text-colorTextLightMode uppercase mb-2 col-span-1">Mute</th>
								</tr>
							</thead>
							<tbody>
								{sortedChannelCategorySettings.map((channelCategorySetting) => (
									<tr
										key={channelCategorySetting.id}
										className="group relative grid grid-cols-7 mb-2.5 dark:bg-bgModifierHover bg-bgModifierHoverLight hover:dark:bg-black hover:bg-bgLightModeButton rounded p-[10px]"
									>
										<td className="col-span-3">{channelCategorySetting.channel_category_label}</td>
										{notificationTypesList.map((notificationType) => (
											<td key={notificationType.value} className="col-span-1 text-center">
												<input
													type="radio"
													name={`notification-${channelCategorySetting.id}`}
													checked={notificationType.value === channelCategorySetting.notification_setting_type}
													onChange={() =>
														handleDefaultNotificationChange(
															notificationType.value,
															channelCategorySetting.id,
															channelCategorySetting.channel_category_title || ''
														)
													}
												/>
											</td>
										))}
										<td className="col-span-1 text-center">
											<input type="checkbox" />
											<button
												className="absolute top-0 right-0 text-red-500 rounded-full dark:bg-white bg-bgLightModeThird size-[15px] justify-center items-center hidden group-hover:flex px-3 py-3"
												onClick={() =>
													handleRemoveOverride(
														channelCategorySetting.channel_category_title || '',
														channelCategorySetting.id || ''
													)
												}
											>
												x
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</Modal>
	);
};
export default ModalNotificationSetting;
