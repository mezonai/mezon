import {
	categoriesActions,
	createChannelApp,
	fetchClans,
	getApplicationDetail,
	selectAllAccount,
	selectAllCategories,
	selectAllClans,
	selectAppDetail,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ApiCreateChannelDescRequest } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import type { SelectFieldConfig } from './components/SelectField';
import SelectField from './components/SelectField';
import TextField from './components/TextField';

type ModalAddAppProps = {
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddApp = memo(({ applicationId, handleOpenModal }: ModalAddAppProps) => {
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);
	const appDetail = useAppSelector(selectAppDetail);
	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);
	const [clanValue, setClanValue] = useState('');
	const [labelValue, setLabelValue] = useState('');
	const [clanError, setClanError] = useState<string>();
	const [categoryValue, setCategoryValue] = useState('');
	const [createdChannelId, setCreatedChannelId] = useState<string>('');
	const [categoryError, setCategoryError] = useState<string>();
	const activeSince = new Date((appDetail?.create_time_seconds || 0) * 1000);

	const activeSincecv = activeSince ? new Date(activeSince).toLocaleDateString() : '';

	useEffect(() => {
		if (clanValue) {
			dispatch(categoriesActions.fetchCategories({ clanId: clanValue }));
		}
	}, [clanValue, dispatch]);

	useEffect(() => {
		if (applicationId) {
			dispatch(getApplicationDetail({ appId: applicationId }));
		}
	}, [applicationId, dispatch]);

	const clans = useSelector(selectAllClans);
	useEffect(() => {
		dispatch(fetchClans({}));
	}, [dispatch]);
	const categories = useAppSelector((state) => selectAllCategories(state, clanValue));

	const clanConfig: SelectFieldConfig<any> = {
		label: 'Add to clan',
		value: clanValue,
		onChange: (v) => {
			setClanError(undefined);
			setClanValue(v);
			setCategoryValue('');
		},
		errorMessage: clanError,
		options: clans.map((clan) => ({
			label: clan.clan_name,
			value: clan.id
		}))
	};

	const categoryConfig: SelectFieldConfig<any> = {
		label: 'Add to category',
		value: categoryValue,
		onChange: (v) => {
			setCategoryError(undefined);
			setCategoryValue(v);
		},
		errorMessage: categoryError,
		options: categories.map((mapCategoryToOption) => ({
			label: mapCategoryToOption.category_name,
			value: mapCategoryToOption.id
		}))
	};

	const handleAdd = useCallback(async () => {
		let hasError = false;
		if (!clanValue) {
			setClanError('Please select a clan.');
			hasError = true;
		}
		if (!categoryValue) {
			setCategoryError('Please select a category.');
			hasError = true;
		}
		if (hasError) return;
		const sanitizeLabel = (label: string) =>
			label
				.replace(/[^\p{L}\p{M}\p{N} \-_]/gu, '')
				.normalize('NFC')
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 32);

		const data: ApiCreateChannelDescRequest = {
			channel_label: sanitizeLabel(labelValue) || sanitizeLabel(appDetail?.appname || ''),
			app_id: applicationId,
			clan_id: clanValue,
			category_id: categoryValue,
			type: ChannelType.CHANNEL_TYPE_APP,
			channel_private: 0,
			parent_id: '0'
		};

		try {
			const resp = await dispatch(createChannelApp(data)).unwrap();
			if (resp?.channel_id) {
				setCreatedChannelId(resp.channel_id as string);
			}
			toggleSuccess();
		} catch (error: any) {
			console.error('Failed to Add App:', error);

			const isForbidden =
				error?.status === 403 ||
				error?.message?.includes?.('403') ||
				error?.message?.includes?.('Forbidden') ||
				(typeof error === 'string' && (error.includes('403') || error.includes('Forbidden')));

			if (isForbidden) {
				toast.error('You do not have permission to add to this clan. Please choose another clan where you have permission.');
			} else {
				toast.error(error?.message || 'Failed to add app. Please try again.');
			}
		}
	}, [applicationId, clanValue, categoryValue, labelValue, dispatch, appDetail]);

	if (openSuccess) {
		const selectedClan = clans.find((clan) => clan.id === clanValue);
		return (
			<ModalSuccess
				name={appDetail?.appname || ''}
				clan={{
					clanId: clanValue,
					clanName: selectedClan?.clan_name || '',
					channelId: createdChannelId,
					isEmpty: false
				}}
			/>
		);
	}

	return (
		<div className="rounded-2xl dark:bg-[#121421]/90 bg-white border dark:border-white/[0.06] border-slate-200/80 max-w-[400px] w-full p-4 sm:p-4.5 flex flex-col items-center text-center backdrop-blur-xl transition-all duration-300 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-12px_rgba(3,4,9,0.7)] relative overflow-hidden my-auto">
			{appDetail && (
				<div className="flex flex-col items-center mt-0 mb-1.5 w-full">
					<div className="relative group mb-1">
						<div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-sky-400 opacity-25 blur-sm transition duration-500" />
						<div className="rounded-full size-11 min-w-[44px] uppercase flex justify-center items-center text-lg font-extrabold border-2 dark:border-[#1a1d2e] border-white dark:bg-[#0d0f19] bg-slate-50 dark:text-white text-slate-900 relative z-10 overflow-hidden shadow-md">
							{appDetail.applogo ? (
								<img src={appDetail.applogo} alt={appDetail.appname} className="w-full h-full object-cover" />
							) : (
								<span className="bg-gradient-to-tr from-violet-500 to-sky-400 bg-clip-text text-transparent truncate overflow-hidden max-w-[300px]">
									{appDetail.appname?.[0]}
								</span>
							)}
						</div>
					</div>
					<p className="text-base font-extrabold tracking-tight dark:text-white text-slate-900 truncate max-w-[300px]">
						{appDetail.appname}
					</p>
				</div>
			)}

			<div className="w-full flex flex-col gap-2 text-left">
				<HeaderModal name={appDetail?.appname || ''} username={account?.user?.username} />

				<div className="w-full">
					<SelectField uppercase={true} {...clanConfig} />
				</div>

				{clanValue && (
					<div className="w-full">
						<SelectField {...categoryConfig} />
					</div>
				)}

				<div className="w-full">
					<TextField label="Channel Name" value={labelValue} onChange={(v) => setLabelValue(v)} placeholder={appDetail?.appname || ''} />
				</div>

				<FooterModal activeSince={activeSincecv} name={appDetail?.appname || ''} />

				<div className="w-full">
					<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
				</div>
			</div>
		</div>
	);
});

export default ModalAddApp;
