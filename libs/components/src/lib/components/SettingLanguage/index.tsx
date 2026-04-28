import { appActions, selectCurrentLanguage, useAppDispatch } from '@mezon/store';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface ISettingLanguageProps {
	menuIsOpen: boolean;
}

export const SettingLanguage = ({ menuIsOpen }: ISettingLanguageProps) => {
	const currentLanguage = useSelector(selectCurrentLanguage);
	const dispatch = useAppDispatch();
	const { i18n, t } = useTranslation(['setting', 'common']);

	const languageList = useMemo(() => {
		return [
			{
				title: t('setting:language.english'),
				value: 'en',
				contributedBy: 'Mezon Team',
				flag: <USFlag />
			},
			{
				title: t('setting:language.vietnamese'),
				value: 'vi',
				contributedBy: 'Mezon Team',
				flag: <VietNamFlag />
			},
			{
				title: `${t('setting:language.russian')}`,
				value: 'ru',
				contributedBy: 'reburst',
				flag: <RussiaFlag />
			},
			{
				title: `${t('setting:language.spanish')}`,
				value: 'es',
				contributedBy: 'robits',
				flag: <SpainFlag />
			},
			{
				title: `${t('setting:language.tatar')}`,
				value: 'tt',
				contributedBy: 'reburst',
				flag: <TatarFlag />
			},
			{
				title: `${t('setting:language.german')}`,
				value: 'de',
				contributedBy: 'robits',
				flag: <GermanyFlag />
			},
			{
				title: `${t('setting:language.italian')}`,
				value: 'it',
				contributedBy: 'robits',
				flag: <ItalyFlag />
			},
			{
				title: `${t('setting:language.portuguese')}`,
				value: 'pt',
				contributedBy: 'robits',
				flag: <PortugalFlag />
			},
			{
				title: `${t('setting:language.japanese')}`,
				value: 'jpn',
				contributedBy: 'robits',
				flag: <JapanFlag />
			},
			{
				title: `${t('setting:language.korean')}`,
				value: 'kr',
				contributedBy: 'robits'
			},
			{
				title: `${t('setting:language.swedish')}`,
				value: 'swe',
				contributedBy: 'robits'
			}
		];
	}, [t]);

	const changeLanguage = async (lang: string) => {
		try {
			dispatch(appActions.setLanguage(lang));
			await i18n.changeLanguage(lang);
		} catch (error: unknown) {
			console.error('Error changing language: ', error);
		}
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:language.title')}</h1>
			<div className="rounded-lg bg-theme-setting-nav p-4">
				<p className="text-sm font-medium mb-4">{t('setting:language.description')}</p>

				<div className="flex flex-col gap-3 mb-6">
					{languageList.map((language) => (
						<div
							key={language.value}
							className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
								currentLanguage === language.value
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
									: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
							}`}
							onClick={() => changeLanguage(language.value)}
						>
							<div className="flex items-center gap-2">
								{language.flag && <span className="flex items-center justify-center w-6 h-6">{language.flag}</span>}
								<span className="text-theme-primary font-medium">{language.title}</span>
							</div>
							{language.contributedBy ? (
								<span className="italic text-xs text-theme-primary-secondary pr-2">{`by ${language.contributedBy}`}</span>
							) : null}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

const USFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#fff"></rect>
		<path d="M1.638,5.846H30.362c-.711-1.108-1.947-1.846-3.362-1.846H5c-1.414,0-2.65,.738-3.362,1.846Z" fill="#a62842"></path>
		<path d="M2.03,7.692c-.008,.103-.03,.202-.03,.308v1.539H31v-1.539c0-.105-.022-.204-.03-.308H2.03Z" fill="#a62842"></path>
		<path fill="#a62842" d="M2 11.385H31V13.231H2z"></path>
		<path fill="#a62842" d="M2 15.077H31V16.923000000000002H2z"></path>
		<path fill="#a62842" d="M1 18.769H31V20.615H1z"></path>
		<path d="M1,24c0,.105,.023,.204,.031,.308H30.969c.008-.103,.031-.202,.031-.308v-1.539H1v1.539Z" fill="#a62842"></path>
		<path d="M30.362,26.154H1.638c.711,1.108,1.947,1.846,3.362,1.846H27c1.414,0,2.65-.738,3.362-1.846Z" fill="#a62842"></path>
		<path d="M5,4h11v12.923H1V8c0-2.208,1.792-4,4-4Z" fill="#102d5e"></path>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
		<path
			fill="#fff"
			d="M4.601 7.463L5.193 7.033 4.462 7.033 4.236 6.338 4.01 7.033 3.279 7.033 3.87 7.463 3.644 8.158 4.236 7.729 4.827 8.158 4.601 7.463z"
		></path>
		<path
			fill="#fff"
			d="M7.58 7.463L8.172 7.033 7.441 7.033 7.215 6.338 6.989 7.033 6.258 7.033 6.849 7.463 6.623 8.158 7.215 7.729 7.806 8.158 7.58 7.463z"
		></path>
		<path
			fill="#fff"
			d="M10.56 7.463L11.151 7.033 10.42 7.033 10.194 6.338 9.968 7.033 9.237 7.033 9.828 7.463 9.603 8.158 10.194 7.729 10.785 8.158 10.56 7.463z"
		></path>
		<path
			fill="#fff"
			d="M6.066 9.283L6.658 8.854 5.927 8.854 5.701 8.158 5.475 8.854 4.744 8.854 5.335 9.283 5.109 9.979 5.701 9.549 6.292 9.979 6.066 9.283z"
		></path>
		<path
			fill="#fff"
			d="M9.046 9.283L9.637 8.854 8.906 8.854 8.68 8.158 8.454 8.854 7.723 8.854 8.314 9.283 8.089 9.979 8.68 9.549 9.271 9.979 9.046 9.283z"
		></path>
		<path
			fill="#fff"
			d="M12.025 9.283L12.616 8.854 11.885 8.854 11.659 8.158 11.433 8.854 10.702 8.854 11.294 9.283 11.068 9.979 11.659 9.549 12.251 9.979 12.025 9.283z"
		></path>
		<path
			fill="#fff"
			d="M6.066 12.924L6.658 12.494 5.927 12.494 5.701 11.799 5.475 12.494 4.744 12.494 5.335 12.924 5.109 13.619 5.701 13.19 6.292 13.619 6.066 12.924z"
		></path>
		<path
			fill="#fff"
			d="M9.046 12.924L9.637 12.494 8.906 12.494 8.68 11.799 8.454 12.494 7.723 12.494 8.314 12.924 8.089 13.619 8.68 13.19 9.271 13.619 9.046 12.924z"
		></path>
		<path
			fill="#fff"
			d="M12.025 12.924L12.616 12.494 11.885 12.494 11.659 11.799 11.433 12.494 10.702 12.494 11.294 12.924 11.068 13.619 11.659 13.19 12.251 13.619 12.025 12.924z"
		></path>
		<path
			fill="#fff"
			d="M13.539 7.463L14.13 7.033 13.399 7.033 13.173 6.338 12.947 7.033 12.216 7.033 12.808 7.463 12.582 8.158 13.173 7.729 13.765 8.158 13.539 7.463z"
		></path>
		<path
			fill="#fff"
			d="M4.601 11.104L5.193 10.674 4.462 10.674 4.236 9.979 4.01 10.674 3.279 10.674 3.87 11.104 3.644 11.799 4.236 11.369 4.827 11.799 4.601 11.104z"
		></path>
		<path
			fill="#fff"
			d="M7.58 11.104L8.172 10.674 7.441 10.674 7.215 9.979 6.989 10.674 6.258 10.674 6.849 11.104 6.623 11.799 7.215 11.369 7.806 11.799 7.58 11.104z"
		></path>
		<path
			fill="#fff"
			d="M10.56 11.104L11.151 10.674 10.42 10.674 10.194 9.979 9.968 10.674 9.237 10.674 9.828 11.104 9.603 11.799 10.194 11.369 10.785 11.799 10.56 11.104z"
		></path>
		<path
			fill="#fff"
			d="M13.539 11.104L14.13 10.674 13.399 10.674 13.173 9.979 12.947 10.674 12.216 10.674 12.808 11.104 12.582 11.799 13.173 11.369 13.765 11.799 13.539 11.104z"
		></path>
		<path
			fill="#fff"
			d="M4.601 14.744L5.193 14.315 4.462 14.315 4.236 13.619 4.01 14.315 3.279 14.315 3.87 14.744 3.644 15.44 4.236 15.01 4.827 15.44 4.601 14.744z"
		></path>
		<path
			fill="#fff"
			d="M7.58 14.744L8.172 14.315 7.441 14.315 7.215 13.619 6.989 14.315 6.258 14.315 6.849 14.744 6.623 15.44 7.215 15.01 7.806 15.44 7.58 14.744z"
		></path>
		<path
			fill="#fff"
			d="M10.56 14.744L11.151 14.315 10.42 14.315 10.194 13.619 9.968 14.315 9.237 14.315 9.828 14.744 9.603 15.44 10.194 15.01 10.785 15.44 10.56 14.744z"
		></path>
		<path
			fill="#fff"
			d="M13.539 14.744L14.13 14.315 13.399 14.315 13.173 13.619 12.947 14.315 12.216 14.315 12.808 14.744 12.582 15.44 13.173 15.01 13.765 15.44 13.539 14.744z"
		></path>
	</svg>
);

const VietNamFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#c93728"></rect>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
		<path
			fill="#ff5"
			d="M18.008 16.366L21.257 14.006 17.241 14.006 16 10.186 14.759 14.006 10.743 14.006 13.992 16.366 12.751 20.186 16 17.825 19.249 20.186 18.008 16.366z"
		></path>
	</svg>
);

const JapanFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#fff"></rect>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
		<circle cx="16" cy="16" r="6" fill="#ae232f"></circle>
	</svg>
);

const RussiaFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="ru-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#ru-clip)">
			<rect x="1" y="4" width="30" height="8" fill="#fff" />
			<rect x="1" y="12" width="30" height="8" fill="#0033a0" />
			<rect x="1" y="20" width="30" height="8" fill="#da291c" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);

const SpainFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="es-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#es-clip)">
			<rect x="1" y="4" width="30" height="24" fill="#C60B1E" />
			<rect x="1" y="10" width="30" height="12" fill="#FFC400" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);

const TatarFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="tt-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#tt-clip)">
			<rect x="1" y="4" width="30" height="11" fill="#007a33" />
			<rect x="1" y="15" width="30" height="2" fill="#fff" />
			<rect x="1" y="17" width="30" height="11" fill="#ce1126" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);

const ItalyFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="it-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#it-clip)">
			<rect x="1" y="4" width="10" height="24" fill="#009246" />
			<rect x="11" y="4" width="10" height="24" fill="#fff" />
			<rect x="21" y="4" width="10" height="24" fill="#ce2b37" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);

const PortugalFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="pt-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#pt-clip)">
			<rect x="1" y="4" width="12" height="24" fill="#006600" />
			<rect x="13" y="4" width="18" height="24" fill="#ff0000" />
			<circle cx="13" cy="16" r="4.5" fill="#ffcc00" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);
const GermanyFlag = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
		<defs>
			<clipPath id="de-clip">
				<rect x="1" y="4" width="30" height="24" rx="4" ry="4" />
			</clipPath>
		</defs>
		<g clipPath="url(#de-clip)">
			<rect x="1" y="4" width="30" height="8" fill="#000" />
			<rect x="1" y="12" width="30" height="8" fill="#FF0000" />
			<rect x="1" y="20" width="30" height="8" fill="#FFCC00" />
		</g>
		<path
			d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
			opacity=".15"
		></path>
	</svg>
);
