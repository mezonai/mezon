import { selectAllAccount, selectTheme } from '@mezon/store';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppearance } from '../../context/AppearanceContext';
import FooterModal from './components/FooterModal';
import HeaderModal from './components/HeaderModal';
import ModalAsk from './components/ModalAsk';
import ModalSuccess from './components/ModalSuccess';

type ModalTryProps = {
	nameApp?: string;
	handleOpenModal?: () => void;
};

const ModalTry = (props: ModalTryProps) => {
	const { nameApp = '', handleOpenModal = () => {} } = props;
	const account = useSelector(selectAllAccount);
	const appearanceTheme = useSelector(selectTheme);
	const { isDarkMode } = useAppearance();

	const [openModalSuccess, setOpenModalSuccess] = useState(false);
	const handleModalSuccess = useCallback(() => {
		setOpenModalSuccess(!openModalSuccess);
	}, [openModalSuccess]);

	return !openModalSuccess ? (
		<div
			className={`rounded max-w-[440px] w-full pt-4 flex flex-col text-center gap-y-2 bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:bg-bgSecondary dark:text-white`}
		>
			<HeaderModal name={nameApp} username={account?.user?.username} />
			<FooterModal name={nameApp} />
			<ModalAsk handelBack={handleOpenModal} handleAddBotOrApp={handleModalSuccess} />
		</div>
	) : (
		<ModalSuccess name={nameApp} isModalTry />
	);
};

export default ModalTry;
