import { useEscapeKeyClose } from '@mezon/core';
import { selectTheme } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { TextArea, TimePicker } from '@mezon/ui';
import type { ContenSubmitEventProps } from '@mezon/utils';
import { ERepeatType, MAX_FILE_SIZE_1MB, fileTypeImage, generateE2eId } from '@mezon/utils';
import { format } from 'date-fns';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalErrorTypeUpload, ModalOverData } from '../../../ModalValidateFile/ModalOverData';
import { checkError } from '../eventHelper';
import { getTimeTodayMidNight } from '../timeFomatEvent';

const DatePickerWrapper = lazy(() => import('./DatePickerWrapper'));

const DatePickerPlaceholder = () => <div className="w-full h-[38px]  animate-pulse rounded"></div>;

export type EventInfoModalProps = {
	contentSubmit: ContenSubmitEventProps;
	choiceLocation: boolean;
	setErrorTime: (status: boolean) => void;
	setContentSubmit: React.Dispatch<React.SetStateAction<ContenSubmitEventProps>>;
	onClose: () => void;
};

const EventInfoModal = (props: EventInfoModalProps) => {
	const { contentSubmit, setErrorTime, setContentSubmit, onClose } = props;
	const { t } = useTranslation('eventCreator');
	const [countCharacterDescription, setCountCharacterDescription] = useState(1000);
	const [errorStart, setErrorStart] = useState(false);
	const [errorEnd, setErrorEnd] = useState(false);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const date = new Date(contentSubmit.selectedDateStart);

	const dayOfMonth = date.getDate();
	const month = format(date, 'MMM'); // Jan
	const weekday = format(date, 'EEEE'); // Monday

	const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
	const weekdayOccurrence = ordinals[Math.floor((dayOfMonth - 1) / 7)] ?? 'Unknown';
	const [selectedFrequency, setSelectedFrequency] = useState(ERepeatType.DOES_NOT_REPEAT);

	useEffect(() => {
		if (errorEnd || (errorStart && selectedFrequency === ERepeatType.DOES_NOT_REPEAT)) {
			setErrorTime(true);
		} else {
			setErrorTime(false);
		}
	}, [errorStart, errorEnd, selectedFrequency]);

	const frequencies = useMemo(() => {
		const options = [
			{ value: ERepeatType.DOES_NOT_REPEAT, label: t('fields.eventFrequency.noRepeat') },
			{ value: ERepeatType.WEEKLY_ON_DAY, label: t('fields.eventFrequency.weeklyOn', { name: weekday }) },
			{ value: ERepeatType.EVERY_OTHER_DAY, label: t('fields.eventFrequency.everyOther', { name: weekday }) },
			{
				value: ERepeatType.MONTHLY,
				label: t('fields.eventFrequency.monthlyOn', { name: `${weekdayOccurrence} ${weekday}` })
			},
			{ value: ERepeatType.ANNUALLY, label: t('fields.eventFrequency.annuallyOn', { name: `${dayOfMonth} ${month}` }) }
		];

		if (weekday !== 'Sunday' && weekday !== 'Saturday') {
			options.push({
				value: ERepeatType.EVERY_WEEKDAY,
				label: t('fields.eventFrequency.everyWeekday')
			});
		}

		return options;
	}, [dayOfMonth, weekday, month, weekdayOccurrence]);

	useEffect(() => {
		setSelectedFrequency(contentSubmit.repeatType ?? ERepeatType.DOES_NOT_REPEAT);
	}, []);

	useMemo(() => {
		checkError(
			contentSubmit.selectedDateStart + contentSubmit.timeStart,
			contentSubmit.selectedDateEnd + contentSubmit.timeEnd,
			setErrorStart,
			setErrorEnd
		);
	}, [contentSubmit.timeEnd, contentSubmit.timeStart, contentSubmit.selectedDateStart, contentSubmit.selectedDateEnd, contentSubmit.repeatType]);

	const handleDateChangeStart = (date: Date) => {
		setContentSubmit((prev) => ({ ...prev, selectedDateStart: getTimeTodayMidNight(date.getTime()) }));
		if (date.getTime() > contentSubmit.selectedDateEnd) {
			handleDateChangeEnd(date);
		}
	};

	const handleDateChangeEnd = (date: Date) => {
		setContentSubmit((prev) => ({ ...prev, selectedDateEnd: getTimeTodayMidNight(date.getTime()) }));
	};

	const handleChangeTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContentSubmit((prev) => ({ ...prev, description: e.target.value }));
		setCountCharacterDescription(1000 - e.target.value.length);
	};

	const handleFrequencyChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const value = Number(e.target.value);
			setSelectedFrequency(value);
			setContentSubmit((prevContentSubmit) => {
				const updatedContent = { ...prevContentSubmit, repeatType: value };
				return updatedContent;
			});
		},
		[setSelectedFrequency, setContentSubmit, setErrorStart, setErrorEnd]
	);

	const handleChangeTimeStart = useCallback(
		(time: number) => {
			setContentSubmit((prev) => {
				const updatedContent = { ...prev, timeStart: time };
				return updatedContent;
			});
		},
		[setContentSubmit, setErrorStart, setErrorEnd]
	);

	const handleChangeTimeEnd = useCallback(
		(time: number) => {
			setContentSubmit((prev) => {
				const updatedContent = { ...prev, timeEnd: time };
				return updatedContent;
			});
		},
		[setContentSubmit, setErrorStart, setErrorEnd]
	);

	const appearanceTheme = useSelector(selectTheme);
	const [openModal, setOpenModal] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const { sessionRef, clientRef } = useMezon();
	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const sizeImage = file?.size;
		const session = sessionRef.current;
		const client = clientRef.current;
		if (!file) return;
		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		if (!fileTypeImage.includes(file.type)) {
			setOpenModalType(true);
			e.target.value = null;
			return;
		}

		if (sizeImage > MAX_FILE_SIZE_1MB) {
			setOpenModal(true);
			e.target.value = null;
			return;
		}
		handleUploadFile(client, session, file?.name, file).then((attachment: any) => {
			setContentSubmit((prev) => ({ ...prev, logo: attachment.url ?? '' }));
		});
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} className="max-h-[500px] overflow-y-auto hide-scrollbar">
			<div className="mb-4">
				<h3 className="uppercase text-[11px] font-semibold inline-flex gap-x-2">
					{t('fields.eventName.title')}
					<p className="w-fit h-fit text-left text-xs font-medium leading-[150%] text-[#dc2626]">✱</p>
				</h3>
				<input
					type="text"
					name="location"
					placeholder={t('fields.eventName.placeholder')}
					onChange={(e) => setContentSubmit((prev) => ({ ...prev, topic: e.target.value }))}
					value={contentSubmit.topic}
					className={`font-[400] rounded w-full  outline-none text-[15px]border border-theme-primary p-2 focus:outline-none focus:border-white-500 bg-theme-input ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
					maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED) * 2}
					data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.event_topic')}
				/>
			</div>
			<div className="mb-4 flex gap-x-4">
				<div className="w-1/2" data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.start_date')}>
					<h3 className="uppercase text-[11px] font-semibold inline-flex gap-x-2">
						{t('fields.startDate.title')}
						<p className="w-fit h-fit text-left text-xs font-medium leading-[150%] text-[#dc2626]">✱</p>
					</h3>
					<Suspense fallback={<DatePickerPlaceholder />}>
						<DatePickerWrapper
							className="bg-theme-input p-2 rounded outline-none w-full"
							wrapperClassName="w-full"
							selected={new Date(contentSubmit.selectedDateStart)}
							onChange={handleDateChangeStart}
							dateFormat="dd/MM/yyyy"
							minDate={new Date()}
						/>
					</Suspense>
				</div>
				<div className="w-1/2" data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.start_time')}>
					<h3 className="uppercase text-[11px] font-semibold inline-flex gap-x-2">
						{t('fields.startTime.title')}
						<p className="w-fit h-fit text-left text-xs font-medium leading-[150%] text-[#dc2626]">✱</p>
					</h3>
					<TimePicker
						value={contentSubmit.selectedDateStart + contentSubmit.timeStart}
						name="timeStart"
						handleChangeTime={handleChangeTimeStart}
					/>
				</div>
			</div>
			<div className="mb-4 flex gap-x-4">
				<div className="w-1/2" data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.end_date')}>
					<h3 className="uppercase text-[11px] font-semibold inline-flex gap-x-2">
						{t('fields.endDate.title')}
						<p className="w-fit h-fit text-left text-xs font-medium leading-[150%] text-[#dc2626]">✱</p>
					</h3>
					<Suspense fallback={<DatePickerPlaceholder />}>
						<DatePickerWrapper
							className="bg-theme-input p-2 rounded outline-none w-full"
							wrapperClassName="w-full"
							selected={new Date(contentSubmit.selectedDateEnd)}
							onChange={handleDateChangeEnd}
							dateFormat="dd/MM/yyyy"
							minDate={new Date(contentSubmit.selectedDateStart)}
						/>
					</Suspense>
				</div>
				<div className="w-1/2" data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.end_time')}>
					<h3 className="uppercase text-[11px] font-semibold inline-flex gap-x-2">
						{t('fields.endTime.title')}
						<p className="w-fit h-fit text-left text-xs font-medium leading-[150%] text-[#dc2626]">✱</p>
					</h3>
					<TimePicker value={contentSubmit.selectedDateEnd + contentSubmit.timeEnd} name="timeEnd" handleChangeTime={handleChangeTimeEnd} />
				</div>
			</div>
			<div className="mb-4">
				<h3 className="uppercase text-[11px] font-semibold">{t('fields.eventFrequency.title')}</h3>
				<select
					name="frequency"
					className={`cursor-pointer block w-full bg-theme-input   bg-option-theme rounded p-2 font-normal text-sm tracking-wide outline-none border-none ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
					value={selectedFrequency}
					onChange={handleFrequencyChange}
					data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.event_frequency')}
				>
					{frequencies.map((frequency) => (
						<option className="text-sm bg-option-theme text-theme-primary" key={frequency.value} value={frequency.value}>
							{frequency.label}
						</option>
					))}
				</select>
				{errorStart && selectedFrequency === ERepeatType.DOES_NOT_REPEAT ? (
					<p className="text-[#e44141] text-xs font-thin">{t('errorMessages.startTimeFuture')}</p>
				) : null}
				{errorEnd && <p className="text-[#e44141] text-xs font-thin">{t('errorMessages.endTimeAfterStart')}</p>}
			</div>
			<div className="mb-4">
				<h3 className="uppercase text-[11px] font-semibold">{t('fields.description.title')}</h3>
				<div className="relative" data-e2e={generateE2eId('clan_page.modal.create_event.event_info.input.description')}>
					<TextArea
						placeholder={t('fields.description.description')}
						className="resize-none h-auto min-h-[87px] w-full bg-theme-input overflow-y-hidden outline-none py-2 pl-3 pr-5"
						value={contentSubmit.description}
						onChange={handleChangeTextArea}
						rows={1}
						refTextArea={textAreaRef}
						maxLength={1000}
					></TextArea>
					<p className="absolute bottom-2 right-2 ">{countCharacterDescription}</p>
				</div>
			</div>
			<div className="mb-4 cursor-default">
				<h3 className="uppercase text-[11px] font-semibold">{t('fields.cover')}</h3>
				<label className="w-fit block">
					<div
						className="text-white font-medium bg-bgSelectItem hover:bg-bgSelectItemHover rounded px-4 py-2 my-2 w-fit cursor-pointer"
						onChange={(e) => handleFile(e)}
					>
						{t('actions.uploadImage')}
					</div>
					<input
						type="file"
						hidden
						onChange={(e) => handleFile(e)}
						className="w-full text-sm text-slate-500 "
						data-e2e={generateE2eId('clan_page.modal.create_event.upload.image_cover_input')}
					/>
				</label>
				{contentSubmit.logo && <img src={contentSubmit.logo} alt="logo" className="max-h-[180px] rounded w-full object-cover" />}
			</div>

			<ModalErrorTypeUpload open={openModalType} onClose={() => setOpenModalType(false)} />

			<ModalOverData open={openModal} onClose={() => setOpenModal(false)} />
		</div>
	);
};

export default EventInfoModal;
