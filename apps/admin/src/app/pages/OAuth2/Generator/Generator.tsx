import { useTranslation } from 'react-i18next';
import type { IScope } from '..';

interface IGeneratorProps {
	initialScopeValues: IScope[];
	clientScopeValues: IScope[];
	setClientScopeValues: (value: IScope[]) => void;
	setHasChange: (value: boolean) => void;
}

const Generator = ({ initialScopeValues, clientScopeValues, setClientScopeValues, setHasChange }: IGeneratorProps) => {
	const { t } = useTranslation('adminApplication');
	const handleCheckBoxOnChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const newArr = [...clientScopeValues];
		newArr[index] = {
			...initialScopeValues[index],
			isChecked: !clientScopeValues[index].isChecked
		};
		setClientScopeValues([...newArr]);
	};

	return (
		<div className="rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode flex flex-col gap-5">
			<div className="flex flex-col gap-2">
				<div className="text-black dark:text-white font-medium text-xl">{t('oauth2.generator.title')}</div>
				<div>{t('oauth2.generator.description')}</div>
			</div>
			<div className="flex flex-col gap-2">
				<div className="uppercase text-black dark:text-white font-bold text-xs">{t('oauth2.generator.scopes')}</div>
				<div className="flex flex-wrap dark:bg-bgPrimary bg-bgLightPrimary p-5 rounded-md gap-y-3 gap-5">
					{clientScopeValues.map((scope, index) => (
						<div key={index} className="w-[calc(33.33%_-_20px)] max-xl:w-[calc(50%_-_20px)] max-[962px]:w-full flex gap-2">
							<div className="w-6 h-6">
								<input
									onChange={(e) => handleCheckBoxOnChange(e, index)}
									type="checkbox"
									className="w-6 h-6"
									checked={scope.isChecked}
								/>
							</div>
							<div>{scope.value}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Generator;
