import {
	addBotChat,
	fetchClans,
	getApplicationDetail,
	selectAllAccount,
	selectAllClans,
	selectAppDetail,
	selectChannelsByClanId,
	useAppDispatch,
	type ChannelsEntity
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import type { SelectFieldConfig } from './components/SelectField';
import SelectField from './components/SelectField';

enum RequestStatusSuccess {
	Fulfill = 'fulfilled'
}

type ModalAddBotProps = {
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddBot = memo(({ applicationId, handleOpenModal }: ModalAddBotProps) => {
	const clans = useSelector(selectAllClans);
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);
	const appDetail = useSelector(selectAppDetail);
	const activeSince = new Date(appDetail?.create_time_seconds || 0 * 1000);
	const activeSincecv = activeSince ? new Date(activeSince).toLocaleDateString() : '';
	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);

	const [clanValue, setClanValue] = useState('');
	const [clanError, setClanError] = useState<string>();

	const channels = useSelector((state: unknown) => (clanValue ? selectChannelsByClanId(state as never, clanValue) : []));

	const defaultChannelId = useMemo(() => {
		if (!clanValue || channels.length === 0) return null;
		const defaultChannel = channels.find(
			(channel: ChannelsEntity) => channel.parent_id === '0' && channel.type === ChannelType.CHANNEL_TYPE_CHANNEL
		);
		return defaultChannel ? defaultChannel.id : null;
	}, [clanValue, channels]);

	useEffect(() => {
		dispatch(fetchClans({}));
	}, [dispatch]);

	useEffect(() => {
		if (applicationId) {
			dispatch(getApplicationDetail({ appId: applicationId }));
		}
	}, [applicationId, dispatch]);

	const clanConfig: SelectFieldConfig<string> = {
		label: 'Add to clan',
		value: clanValue,
		onChange: (v) => {
			setClanError(undefined);
			setClanValue(v);
		},
		errorMessage: clanError,
		options: clans.map((clan) => ({
			label: clan.clan_name,
			value: clan.id
		}))
	};

	const handleAdd = useCallback(async () => {
		let hasError = false;
		if (!clanValue) {
			setClanError('Please select a clan.');
			hasError = true;
		}
		if (hasError) return;

		const cleanAppId = applicationId.replace(/\s+/g, ' ').trim();
		const cleanClanId = clanValue.replace(/\s+/g, ' ').trim();

		try {
			const resp = await dispatch(
				addBotChat({
					appId: cleanAppId,
					clanId: cleanClanId
				})
			);

			if (resp.meta.requestStatus === RequestStatusSuccess.Fulfill) {
				toggleSuccess();
			} else {
				toast.error('You are not the owner of this clan. Please choose your own clan.');
			}
		} catch (error: unknown) {
			console.error('Add bot failed:', error);
			toast.error('Add bot failed. Refresh the page and try again.');
		}
	}, [applicationId, clanValue, dispatch]);

	if (openSuccess) {
		const selectedClan = clans.find((clan) => clan.id === clanValue);
		return (
			<ModalSuccess
				name={appDetail?.appname || ''}
				clan={{
					clanId: clanValue,
					clanName: selectedClan?.clan_name || '',
					channelId: defaultChannelId || undefined,
					isEmpty: false
				}}
			/>
		);
	}

	return (
		<div className="rounded-3xl dark:bg-[#121421]/90 bg-white border dark:border-white/[0.06] border-slate-200/80 max-w-[440px] w-full p-6 md:p-7 flex flex-col items-center text-center backdrop-blur-xl transition-all duration-300 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-12px_rgba(3,4,9,0.7)] relative overflow-hidden">
			{appDetail && (
				<div className="flex flex-col items-center mt-2 mb-3 w-full">
					<div className="relative group mb-3">
						<div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-sky-400 opacity-25 blur-sm transition duration-500" />
						<div className="rounded-full size-16 min-w-[64px] uppercase flex justify-center items-center text-2xl font-extrabold border-2 dark:border-[#1a1d2e] border-white dark:bg-[#0d0f19] bg-slate-50 dark:text-white text-slate-900 relative z-10 overflow-hidden shadow-md">
							{appDetail.applogo ? (
								<img src={appDetail.applogo} alt={appDetail.appname} className="w-full h-full object-cover" />
							) : (
								<span className="bg-gradient-to-tr from-violet-500 to-sky-400 bg-clip-text text-transparent">
									{appDetail.appname?.[0]}
								</span>
							)}
						</div>
					</div>
					<p className="text-xl font-extrabold tracking-tight dark:text-white text-slate-900 truncate max-w-[300px]">{appDetail.appname}</p>
				</div>
			)}

			<div className="w-full flex flex-col gap-4 text-left">
				<HeaderModal name={appDetail?.appname || ''} username={account?.user?.username} />

				<div className="w-full">
					<SelectField uppercase={true} {...clanConfig} />
				</div>

				<FooterModal activeSince={activeSincecv} name={appDetail?.appname || ''} />

				<div className="mt-2 w-full">
					<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
				</div>
			</div>
		</div>
	);
});

export default ModalAddBot;
