import { useCategorizedAllChannels, useEscapeKeyClose } from '@mezon/core';
import type { MuteCatePayload, MuteChannelPayload } from '@mezon/store';
import {
	defaultNotificationActions,
	defaultNotificationCategoryActions,
	notificationSettingActions,
	selectAllchannelCategorySetting,
	selectCategoryEntityStateByClanId,
	selectChannelsEntitiesByClanId,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentClanName,
	selectDefaultNotificationClanByClanId,
	selectNotifiSettingsEntitiesById,
	selectOverrideChannelNotificationMuteSeconds,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Button, Icons } from '@mezon/ui';
import type { ICategoryChannel, IChannel } from '@mezon/utils';
import { EMuteState } from '@mezon/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { ModalLayout } from '../../components';
import { createNotificationTypesListTranslated } from '../PanelChannel';
export type ModalParam = {
	onClose: () => void;
	open: boolean;
};

export const customStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: 'var(--bg-tertiary)',
		borderRadius: '8px',
		color: 'var(--text-secondary)',
		cursor: 'pointer'
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: 'var(--bg-option-theme)'
	}),
	option: (provided: any, state: any) => ({
		...provided,
		backgroundColor: state.isFocused ? 'var(--bg-option-active)' : '',
		color: 'var(--text-secondary)',
		cursor: 'pointer'
	}),
	multiValue: (provided: any) => ({
		...provided,
		backgroundColor: 'var(--bg-tertiary)'
	}),
	multiValueLabel: (provided: any) => ({
		...provided,
		color: 'var(--text-secondary)'
	}),
	multiValueRemove: (provided: any) => ({
		...provided,
		color: 'red',
		':hover': {
			backgroundColor: 'var(--bg-tertiary)',
			color: 'var(--text-secondary)'
		}
	}),
	input: (provided: any) => ({
		...provided,
		color: 'var(--text-secondary)'
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: 'var(--text-secondary)'
	}),
	menuList: (provided: any) => ({
		...provided,
		maxHeight: 250,
		overflowY: 'auto'
	})
};

const radioButtonClassName =
	"relative disabled:bg-slate-500 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]";

const checkboxClassName =
	"relative disabled:bg-slate-500 h-5 w-5 shrink-0 appearance-none rounded border-2 border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-[42%] checked:after:block checked:after:h-[0.55rem] checked:after:w-[0.3rem] checked:after:border-2 checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)_rotate(45deg)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]";

const ModalNotificationSetting = (props: ModalParam) => {
	const { t } = useTranslation('notificationSetting');
	const notificationTypesListTranslated = createNotificationTypesListTranslated(t);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const defaultNotificationClan = useAppSelector((state) => selectDefaultNotificationClanByClanId(state, currentClanId || ''));
	const currentChannel = useSelector(selectCurrentChannel);
	const notificatonSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, currentChannel?.id || ''));

	const channelCategorySettings = useSelector(selectAllchannelCategorySetting);
	const channelsEntities = useAppSelector((state) => selectChannelsEntitiesByClanId(state, currentClanId || ''));
	const categoriesEntities = useAppSelector((state) => selectCategoryEntityStateByClanId(state, currentClanId || '')?.entities ?? {});
	const channelNotificationMuteSeconds = useAppSelector(selectOverrideChannelNotificationMuteSeconds);
	const categoryNotificationSettings = useAppSelector(
		(state) => (currentClanId ? state.defaultnotificationcategory.byClans[currentClanId]?.categoriesSettings : undefined) ?? {}
	);
	const isMutedFromMuteTime = (muteTime?: number | null) => {
		if (muteTime === undefined || muteTime === null || muteTime === EMuteState.UN_MUTE) {
			return false;
		}
		if (muteTime === EMuteState.MUTED_INFINITY) {
			return true;
		}
		return muteTime > Date.now();
	};
	const getIsMuted = useCallback(
		(setting: (typeof channelCategorySettings)[number]) => {
			const muteTime =
				setting.channel_category_title === 'category'
					? categoryNotificationSettings[setting.id]?.time_mute
					: channelNotificationMuteSeconds[setting.id];

			if (muteTime !== undefined && muteTime !== null && muteTime !== EMuteState.UN_MUTE) {
				return isMutedFromMuteTime(muteTime);
			}

			return (setting.action ?? 1) === 0;
		},
		[categoryNotificationSettings, channelNotificationMuteSeconds]
	);
	const getChannelCategoryLabel = useCallback(
		(setting: (typeof channelCategorySettings)[number]) =>
			setting.channel_category_label || channelsEntities[setting.id]?.channel_label || categoriesEntities[setting.id]?.category_name || '',
		[channelsEntities, categoriesEntities]
	);
	const dispatch = useAppDispatch();
	const sortedChannelCategorySettings = React.useMemo(() => {
		const settingsCopy = [...channelCategorySettings];
		settingsCopy.sort((a, b) => {
			const labelA = getChannelCategoryLabel(a);
			const labelB = getChannelCategoryLabel(b);
			if (labelA && labelB) {
				if (labelA < labelB) {
					return -1;
				}
				if (labelA > labelB) {
					return 1;
				}
			}
			return 0;
		});
		return settingsCopy;
	}, [channelCategorySettings, getChannelCategoryLabel]);
	const handleNotificationClanChange = (event: any, notification: number) => {
		dispatch(defaultNotificationActions.setDefaultNotificationClan({ clan_id: currentClanId as string, notification_type: notification }));
	};
	const categorizedChannels = useCategorizedAllChannels();
	const options = categorizedChannels.reduce<Array<{ id: string; label: string; title: string }>>((acc, category) => {
		const isAlreadySelected = sortedChannelCategorySettings.some((setting) => setting.id === category.id);
		if (!isAlreadySelected) {
			acc.push({
				id: category.id,
				label: (category as IChannel).channel_label || category.category_name || '',
				title: (category as ICategoryChannel).channels ? 'category' : 'channel'
			});
		}

		return acc;
	}, []);

	const [selectedOption, setSelectedOption] = useState(null);
	const handleChange = (newValue: any) => {
		if (!newValue) {
			setSelectedOption(null);
			return;
		}

		if (newValue?.title === 'category') {
			dispatch(
				defaultNotificationCategoryActions.setDefaultNotificationCategory({
					category_id: newValue?.id,
					notification_type: defaultNotificationClan?.notification_setting_type,
					clan_id: currentClanId || '',
					label: newValue?.label,
					title: newValue?.title
				})
			);
		}
		if (newValue?.title === 'channel') {
			if (notificatonSelected?.notification_setting_type === 0 || notificatonSelected?.notification_setting_type === undefined) {
				dispatch(
					notificationSettingActions.setNotificationSetting({
						channel_id: newValue?.id,
						notification_type: defaultNotificationClan?.notification_setting_type,
						clan_id: currentClanId || '',
						label: newValue?.label,
						title: newValue?.title
					})
				);
			} else {
				dispatch(
					notificationSettingActions.setNotificationSetting({
						channel_id: newValue.id,
						notification_type: notificatonSelected?.notification_setting_type,
						clan_id: currentClanId || '',
						label: newValue?.label,
						title: newValue?.title
					})
				);
			}
		}

		setSelectedOption(null);
	};

	const handleMuteChange = (channelCategoryId: string, title: string, active: number) => {
		const muteTime = active === 1 ? EMuteState.UN_MUTE : EMuteState.MUTED_INFINITY;

		if (title === 'category') {
			const payload: MuteCatePayload = {
				id: channelCategoryId || '',
				mute_time: muteTime,
				active,
				clan_id: currentClanId || ''
			};
			dispatch(defaultNotificationCategoryActions.setMuteCategory(payload));
		}
		if (title === 'channel') {
			const payload: MuteChannelPayload = {
				channel_id: channelCategoryId || '',
				mute_time: muteTime,
				clan_id: currentClanId || ''
			};
			dispatch(notificationSettingActions.setMuteChannel(payload));
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
			dispatch(defaultNotificationCategoryActions.deleteDefaultNotificationCategory({ category_id: id, clan_id: currentClanId as string }));
		}
		if (title === 'channel') {
			dispatch(notificationSettingActions.deleteNotiChannelSetting({ channel_id: id, clan_id: currentClanId || '' }));
		}
	};
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, props.onClose);

	useEffect(() => {
		if (modalRef.current) {
			modalRef.current.focus();
		}
	}, []);

	return (
		<ModalLayout onClose={props.onClose}>
			<div
				ref={modalRef}
				className="flex flex-col bg-theme-setting-primary rounded-xl overflow-hidden max-w-[684px] w-screen mx-4 md:mx-0"
				tabIndex={-1}
				autoFocus
			>
				<div className="flex-1 flex items-center justify-between border-b-theme-primary rounded-t p-4">
					<div className="flex flex-col">
						<p className="font-bold text-base md:text-xl text-theme-primary-active">{t('title')}</p>
						<p className="text-sm md:text-base">{currentClanName}</p>
					</div>
					<Button
						className="rounded-full aspect-square w-6 h-6 text-5xl leading-3 !p-0 opacity-50 text-theme-primary-hover"
						onClick={props.onClose}
					>
						×
					</Button>
				</div>
				<div className={`px-5 py-4 max-h-[500px] overflow-y-auto hide-scrollbar`}>
					<div className="text-[10px] md:text-xs font-bold  uppercase mb-2 text-theme-primary-active">{t('clanNotificationSettings')}</div>
					<div className="space-y-2">
						{notificationTypesListTranslated.map((notificationType, index) => (
							<div key={index} className="flex items-center gap-x-3 p-[12px]  rounded text-xs md:text-sm">
								<input
									type="radio"
									id={`notification-${index}`}
									name="notification-setting"
									value={notificationType.label}
									className={`${radioButtonClassName} float-left mr-1 mt-0.5`}
									checked={notificationType.value === defaultNotificationClan?.notification_setting_type}
									onChange={(event) => handleNotificationClanChange(event, Number(notificationType.value))}
								/>
								<label htmlFor={`notification-${index}`}>{notificationType.label}</label>
							</div>
						))}
					</div>

					<hr className="border-zinc-500 my-4" />
					<div className="text-[10px] md:text-xs font-bold  uppercase mb-2 text-theme-primary-active">{t('notificationOverrides')}</div>
					<div className="text-xs md:text-sm font-normal  mb-2">{t('addChannelOverride')}</div>
					<div className="bg-theme-setting-primary">
						<Select
							isClearable
							isSearchable
							onChange={handleChange}
							options={options}
							value={selectedOption}
							placeholder={t('selectChannelOrCategory')}
							getOptionLabel={(option) => option?.label ?? ''}
							getOptionValue={(option) => option?.id ?? ''}
							styles={customStyles}
							classNames={{
								menuList: () => 'thread-scroll'
							}}
							menuPlacement="top"
						/>
					</div>
					<div className="mt-4 overflow-hidden bg-theme-setting-primary">
						<table className="w-full mt-4 hide-scrollbar overflow-hidden space-y-2 table-fixed">
							<thead>
								<tr className="grid grid-cols-7 text-theme-primary-active">
									<th className="col-span-3 min-w-0 truncate text-left text-[10px] md:text-xs font-bold uppercase mb-2 text-theme-primary-active">
										{t('headers.channelOrCategory')}
									</th>
									<th className="col-span-1 flex items-center justify-center text-[10px] md:text-xs font-bold uppercase mb-2 text-theme-primary-active">
										{t('headers.all')}
									</th>
									<th className="col-span-1 flex items-center justify-center text-[10px] md:text-xs font-bold uppercase mb-2 text-theme-primary-active">
										{t('headers.mentions')}
									</th>
									<th className="col-span-1 flex items-center justify-center text-[10px] md:text-xs font-bold uppercase mb-2 text-theme-primary-active">
										{t('headers.nothing')}
									</th>
									<th className="col-span-1 flex items-center justify-center text-[10px] md:text-xs font-bold uppercase mb-2 text-theme-primary-active">
										{t('headers.mute')}
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedChannelCategorySettings.map((channelCategorySetting) => {
									const channelCategoryLabel = getChannelCategoryLabel(channelCategorySetting);
									return (
										<tr
											key={channelCategorySetting.id}
											className="group relative grid min-w-0 grid-cols-7 items-center mb-2.5 rounded p-[10px]"
										>
											<td className="col-span-3 min-w-0 truncate text-left text-xs md:text-sm" title={channelCategoryLabel}>
												{channelCategoryLabel}
											</td>
											{notificationTypesListTranslated.map((notificationType) => (
												<td key={notificationType.value} className="col-span-1 flex items-center justify-center">
													<input
														type="radio"
														name={`notification-${channelCategorySetting.id}`}
														checked={notificationType.value === channelCategorySetting.notification_setting_type}
														className={radioButtonClassName}
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
											<td className="col-span-1 relative flex items-center justify-center">
												<input
													type="checkbox"
													checked={getIsMuted(channelCategorySetting)}
													className={checkboxClassName}
													onChange={() =>
														handleMuteChange(
															channelCategorySetting.id,
															channelCategorySetting.channel_category_title || '',
															getIsMuted(channelCategorySetting) ? 1 : 0
														)
													}
												/>
												<button
													type="button"
													aria-label="Remove override"
													className="absolute right-0 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/15 text-red-500 hover:bg-red-500/25 group-hover:flex"
													onClick={() =>
														handleRemoveOverride(
															channelCategorySetting.channel_category_title || '',
															channelCategorySetting.id || ''
														)
													}
												>
													<Icons.Close className="h-2.5 w-2.5" defaultFill1="currentColor" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</ModalLayout>
	);
};
export default ModalNotificationSetting;
