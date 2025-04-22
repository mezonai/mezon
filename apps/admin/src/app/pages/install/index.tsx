import { selectAppById } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLoaderData, useParams } from 'react-router-dom';
import { useAppearance } from '../../context/AppearanceContext';
import { IAuthLoaderData } from '../../loader/authLoader';
import ModalAddApp from './ModalAddApp';
import ModalAddBot from './ModalAddBot';
import ModalTry from './ModalTry';

const Install: React.FC = () => {
	const { isLogin, redirect } = useLoaderData() as IAuthLoaderData;
	const { applicationId, modalType } = useParams();
	const MODAL_TYPE = {
		BOT: 'bot',
		APP: 'app'
	} as const;

	const appSelect = useSelector(selectAppById(applicationId || ''));
	const [openModalAdd, setOpenModalAdd] = useState(false);
	const handleOpenModalAdd = useCallback(() => {
		setOpenModalAdd(!openModalAdd);
	}, [openModalAdd]);

	const [openModalTry, setOpenModalTry] = useState(false);
	const handleOpenModalTry = useCallback(() => {
		setOpenModalTry(!openModalTry);
	}, [openModalTry]);

	const { isDarkMode } = useAppearance();

	if (!isLogin) {
		return <Navigate to={redirect || '/login'} replace />;
	}

	return (
		<div className="dark:bg-bgPrimary bg-bgLightPrimary flex flex-col h-screen dark:text-textDarkTheme text-textLightTheme relative justify-center items-center">
			<HeaderInstall />
			{!openModalAdd && !openModalTry ? (
				<div
					className={`rounded dark:bg-bgProfileBody bg-bgLightMode border dark:border-bgTertiary border-gray-200 max-w-[440px] w-full px-4 py-8 flex flex-col items-center ${
						isDarkMode ? '' : 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
					}`}
				>
					<div className="rounded-full dark:text-bgAvatarLight text-bgAvatarDark dark:bg-bgAvatarDark bg-bgAvatarLight text-2xl font-bold size-[80px] min-w-[80px] uppercase flex justify-center items-center">
						{appSelect?.applogo ? (
							<img
								src={appSelect.applogo}
								alt={`imageApp: ${appSelect?.appname}`}
								className="w-full h-full object-cover rounded-full"
							/>
						) : (
							<span>{appSelect?.appname?.at(0)}</span>
						)}
					</div>
					<p className="text-2xl font-semibold mt-2 truncate max-w-full">{appSelect?.appname}</p>

					<ContentInstall handleOpenModalAdd={handleOpenModalAdd} handleOpenModalTry={handleOpenModalTry} />
				</div>
			) : (
				<>
					{openModalAdd && (
						<>
							{modalType === MODAL_TYPE.BOT && (
								<ModalAddBot nameBot={appSelect?.appname} handleOpenModal={handleOpenModalAdd} applicationId={applicationId || ''} />
							)}
							{modalType === MODAL_TYPE.APP && (
								<ModalAddApp nameApp={appSelect?.appname} handleOpenModal={handleOpenModalAdd} applicationId={applicationId || ''} />
							)}
							{modalType !== MODAL_TYPE.BOT && modalType !== MODAL_TYPE.APP && (
								<div className="text-red-500 font-semibold text-lg">Invalid modal type: {modalType}</div>
							)}
						</>
					)}
					{openModalTry && <ModalTry nameApp={appSelect?.appname} handleOpenModal={handleOpenModalTry} />}
				</>
			)}
		</div>
	);
};

export default Install;

const HeaderInstall = memo(() => {
	const { isDarkMode } = useAppearance();

	return (
		<div className="flex flex-row items-center justify-center gap-[4px] absolute top-5 left-5">
			<img
				src={isDarkMode ? 'assets/images/mezon-logo-black.svg' : 'assets/images/mezon-logo-white.svg'}
				alt="LogoMezon"
				width={36}
				height={36}
			/>
			<span className="text-2xl font-bold dark:text-black text-colorTextLightMode">MEZON</span>
		</div>
	);
});

type ContentInstallProps = {
	handleOpenModalAdd: () => void;
	handleOpenModalTry: () => void;
};

const ContentInstall = memo((props: ContentInstallProps) => {
	const { handleOpenModalAdd, handleOpenModalTry } = props;
	return (
		<div className="dark:bg-bgTertiary bg-bgLightModeThird rounded w-full cursor-pointer">
			<div className="flex items-center gap-x-3 py-2" onClick={handleOpenModalAdd}>
				<Icons.AddServe className="text-contentTertiary ml-4" />
				<div className="flex justify-between items-center flex-1">
					<div>
						<h4 className="text-base font-medium ">Add to clan</h4>
						<p className="dark:text-contentTertiary text-colorTextLightMode text-xs">Customise your clan by adding this app</p>
					</div>
					<Icons.ArrowRight defaultSize="size-6 mr-2 dark:text-contentTertiary text-contentTertiary" />
				</div>
			</div>
		</div>
	);
});
