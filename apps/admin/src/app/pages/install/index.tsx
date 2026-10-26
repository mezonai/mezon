import { getApplicationDetail, selectAppDetail, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLoaderData, useParams } from 'react-router-dom';
import { useAppearance } from '../../context/AppearanceContext';
import type { IAuthLoaderData } from '../../loader/authLoader';
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

	const dispatch = useAppDispatch();
	const appDetail = useSelector(selectAppDetail);
	const [openModalAdd, setOpenModalAdd] = useState(false);
	const [isRedirect, setIsRedirect] = useState(false);
	const handleOpenModalAdd = useCallback(() => {
		setOpenModalAdd(!openModalAdd);
	}, [openModalAdd]);

	const [openModalTry, setOpenModalTry] = useState(false);
	const handleOpenModalTry = useCallback(() => {
		setOpenModalTry(!openModalTry);
	}, [openModalTry]);

	const { isDarkMode } = useAppearance();

	const navigateDeeplinkMobile = (applicationId: string) => {
		try {
			window.location.href = `mezon.ai://bot/install/${applicationId}`;
		} catch (e) {
			console.error('log  => navigateDeeplinkMobile error', e);
		}
	};

	useEffect(() => {
		if (applicationId) {
			navigateDeeplinkMobile(applicationId);
			dispatch(getApplicationDetail({ appId: applicationId }));
		}
		const timer = setTimeout(() => setIsRedirect(true), 400);
		return () => clearTimeout(timer);
	}, [applicationId, dispatch]);

	if (!isLogin && isRedirect) {
		return <Navigate to={redirect || '/login'} replace />;
	}

	return (
		<div className="dark:bg-[#08090d] bg-[#f8fafc] flex flex-col h-screen dark:text-[#f3f4f6] text-slate-800 relative justify-center items-center overflow-hidden transition-colors duration-500 font-sans">
			<div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 dark:bg-violet-600/10 blur-[130px] pointer-events-none select-none" />
			<div className="absolute bottom-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-sky-500/15 dark:bg-blue-500/10 blur-[130px] pointer-events-none select-none" />
			<div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none select-none" />

			<HeaderInstall />

			{!openModalAdd && !openModalTry ? (
				<div
					className={`rounded-3xl dark:bg-[#121421]/80 bg-white/90 border dark:border-white/[0.06] border-slate-200/80 max-w-[440px] w-full p-8 md:p-9 flex flex-col items-center transition-all duration-300 ease-out transform hover:-translate-y-1.5 relative backdrop-blur-xl ${
						isDarkMode
							? 'shadow-[0_24px_50px_-12px_rgba(3,4,9,0.7)] hover:shadow-[0_30px_60px_-12px_rgba(99,102,241,0.15)]'
							: 'shadow-[0_24px_48px_-12px_rgba(15,23,42,0.06)] hover:shadow-[0_30px_60px_-12px_rgba(99,102,241,0.08)]'
					}`}
				>
					<div className="relative group mt-4">
						<div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-sky-400 opacity-25 group-hover:opacity-45 blur-md transition duration-500" />
						<div className="rounded-full size-24 min-w-[24px] uppercase flex justify-center items-center text-2xl font-bold border-[3px] dark:border-[#1a1d2e] border-white dark:bg-[#0d0f19] bg-slate-50 dark:text-white text-slate-900 relative z-10 overflow-hidden shadow-2xl flex-shrink-0 transition-transform duration-500 group-hover:scale-[1.03]">
							{appDetail?.applogo ? (
								<img
									src={createImgproxyUrl(appDetail.applogo, { width: 100, height: 100, resizeType: 'fill-down' })}
									alt={`imageApp: ${appDetail.appname}`}
									className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
								/>
							) : (
								<span>{appDetail?.appname?.at(0)}</span>
							)}
						</div>
					</div>

					<p className="text-2xl font-extrabold mt-6 tracking-tight dark:text-white text-slate-900 truncate max-w-full text-center px-2">
						{appDetail?.appname}
					</p>

					<div className="w-full my-6 relative">
						<div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#22263a]/80 to-transparent" />
					</div>

					<ContentInstall handleOpenModalAdd={handleOpenModalAdd} handleOpenModalTry={handleOpenModalTry} />
				</div>
			) : (
				<div className="w-full max-w-[440px] px-4 flex justify-center items-center relative z-10">
					{openModalAdd && (
						<div className="w-full">
							{modalType === MODAL_TYPE.BOT && <ModalAddBot handleOpenModal={handleOpenModalAdd} applicationId={applicationId || ''} />}
							{modalType === MODAL_TYPE.APP && <ModalAddApp handleOpenModal={handleOpenModalAdd} applicationId={applicationId || ''} />}
							{modalType !== MODAL_TYPE.BOT && modalType !== MODAL_TYPE.APP && (
								<div className="text-red-500 font-semibold text-lg bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center w-full">
									Invalid modal type: {modalType}
								</div>
							)}
						</div>
					)}
					{openModalTry && <ModalTry nameApp={appDetail?.appname} handleOpenModal={handleOpenModalTry} />}
				</div>
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
			<span className="text-2xl font-bold dark:text-[#dcdcdc] text-colorTextLightMode">MEZON</span>
		</div>
	);
});

type ContentInstallProps = {
	handleOpenModalAdd: () => void;
	handleOpenModalTry: () => void;
};

const ContentInstall = memo((props: ContentInstallProps) => {
	const { handleOpenModalAdd } = props;
	return (
		<div className="w-full">
			<div
				className="dark:bg-[#181a2b] bg-slate-50 dark:hover:bg-[#1f2238] hover:bg-violet-50/40 border dark:border-white/[0.04] border-slate-100 dark:hover:border-violet-500/30 hover:border-violet-200 rounded-2xl p-4.5 cursor-pointer flex items-center justify-between gap-4 transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
				onClick={handleOpenModalAdd}
			>
				<div className="flex items-center gap-4">
					<div className="size-12 rounded-xl dark:bg-violet-500/10 bg-violet-100 flex items-center justify-center dark:text-violet-400 text-violet-600 transition-all duration-300 group-hover:scale-105 group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-500 dark:group-hover:text-white shadow-sm">
						<Icons.AddServe className="text-contentTertiary size-5.5 transition-all" />
					</div>
					<div className="flex-1 min-w-0">
						<h4 className="text-[15px] font-bold dark:text-white text-slate-900 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
							Add to clan
						</h4>
						<p className="dark:text-contentTertiary text-colorTextLightMode text-xs mt-1 leading-normal font-medium">
							Customise your clan by adding this app
						</p>
					</div>
				</div>
				<div className="text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all transform group-hover:translate-x-1 flex-shrink-0">
					<Icons.ArrowRight className="size-5 mr-2" />
				</div>
			</div>
		</div>
	);
});
