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
				value: 'en'
			},
			{
				title: t('setting:language.vietnamese'),
				value: 'vi'
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
			<div className="rounded-lg bg-theme-setting-nav m-4 p-4">
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
							<span className="text-theme-primary font-medium">{language.title}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
