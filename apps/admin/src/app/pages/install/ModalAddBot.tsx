import { addBotChat, selectAllAccount, selectAllClans, useAppDispatch } from '@mezon/store';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';
import SelectField, { SelectFieldConfig } from './components/SelectField';

enum RequestStatusSuccess {
	Fulfill = 'fulfilled'
}

type ModalAddBotProps = {
	nameApp?: string;
	applicationId: string;
	handleOpenModal: () => void;
};

const ModalAddBot = memo(({ nameApp = '', applicationId, handleOpenModal }: ModalAddBotProps) => {
	const clans = useSelector(selectAllClans);
	const dispatch = useAppDispatch();
	const account = useSelector(selectAllAccount);

	const [openSuccess, setOpenSuccess] = useState(false);
	const toggleSuccess = () => setOpenSuccess((s) => !s);

	const [clanValue, setClanValue] = useState('');
	const [clanError, setClanError] = useState<string>();

	const clanConfig: SelectFieldConfig<any> = {
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

		const resp = await dispatch(addBotChat({ appId: applicationId, clanId: clanValue }));
		if (resp.meta.requestStatus === RequestStatusSuccess.Fulfill) {
			toggleSuccess();
		}
	}, [applicationId, clanValue, dispatch]);

	if (openSuccess) {
		return <ModalSuccess name={nameApp} clan={{ clanId: clanValue, clanName: '', isEmpty: false }} />;
	}

	return (
		<div className="rounded overflow-hidden dark:bg-bgProfileBody bg-bgLightMode max-w-[440px] w-full flex flex-col text-center">
			<HeaderModal name={nameApp} username={account?.user?.username} />
			<SelectField {...clanConfig} />
			<FooterModal name={nameApp} />
			<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleAdd} />
		</div>
	);
});

export default ModalAddBot;
