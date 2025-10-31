import type { IApplicationEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface IRedirectsProps {
	currentApp: IApplicationEntity;
	uriInputValuesRef: React.MutableRefObject<string[]>;
	inputArrLength: number;
	setInputArrLength: React.Dispatch<React.SetStateAction<number>>;
	setHasChange: (value: boolean) => void;
}

const Redirects = ({ currentApp, uriInputValuesRef, setInputArrLength, inputArrLength, setHasChange }: IRedirectsProps) => {
	const { t } = useTranslation('adminApplication');

	const handleAddDirectUri = () => {
		if (uriInputValuesRef.current.includes('')) {
			toast.warning(t('oauth2.redirects.toasts.fillAllInputs'));
			return;
		}
		setInputArrLength((prev) => prev + 1);
		uriInputValuesRef.current.push('');
	};

	return (
		<div className="flex flex-col gap-2 rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode">
			<div className="text-black dark:text-white font-medium text-xl">{t('oauth2.redirects.title')}</div>
			<div className="flex flex-col gap-5">
				<div>{t('oauth2.redirects.description')}</div>
				<div className="flex flex-col gap-5">
					{[...Array(inputArrLength).keys()].map((_, index) => (
						<UriItem
							key={index}
							index={index}
							uriInputValuesRef={uriInputValuesRef}
							inputArrLength={inputArrLength}
							setInputArrLength={setInputArrLength}
							currentApp={currentApp}
							setHasChange={setHasChange}
						/>
					))}

					<div
						onClick={handleAddDirectUri}
						className="py-[7px] px-4 cursor-pointer bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg w-fit select-none font-medium text-white"
					>
						{t('oauth2.redirects.addRedirect')}
					</div>
				</div>
			</div>
		</div>
	);
};

interface IUriItemProps {
	index: number;
	uriInputValuesRef: React.MutableRefObject<string[]>;
	inputArrLength: number;
	setInputArrLength: React.Dispatch<React.SetStateAction<number>>;
	currentApp: IApplicationEntity;
	setHasChange: (value: boolean) => void;
}

const UriItem = ({ index, uriInputValuesRef, setInputArrLength, inputArrLength, currentApp, setHasChange }: IUriItemProps) => {
	const [uriInput, setUriInput] = useState(uriInputValuesRef.current[index] ?? '');
	const appURIes = currentApp?.oAuthClient?.redirect_uris ?? [];

	useEffect(() => {
		const isSameURIArray =
			appURIes.length === uriInputValuesRef.current.length && JSON.stringify(appURIes) === JSON.stringify(uriInputValuesRef.current);
		if (!isSameURIArray || inputArrLength !== appURIes.length) {
			setHasChange(true);
			return;
		}
		setHasChange(false);
	}, [appURIes, inputArrLength, uriInputValuesRef, uriInput]);

	useEffect(() => {
		setUriInput(uriInputValuesRef.current[index] ?? '');
	}, [index, uriInputValuesRef.current[index], inputArrLength]);

	const handleInputOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUriInput(e.target.value);
		uriInputValuesRef.current[index] = e.target.value;
	};

	const handleDeleteInput = () => {
		setInputArrLength(inputArrLength - 1);

		const newRefArr = [...uriInputValuesRef.current];
		newRefArr.splice(index, 1);
		uriInputValuesRef.current = newRefArr;
	};

	const isValid = useMemo(() => {
		return uriInput.startsWith('http://') || uriInput.startsWith('https://');
	}, [uriInput]);

	return (
		<div className="relative">
			<div className="pr-8">
				<input
					value={uriInput}
					onChange={handleInputOnchange}
					type="text"
					className={`bg-bgLightModeThird dark:bg-[#1e1f22] border w-full ${isValid ? 'border-primary' : 'border-red-500'}  outline-none p-[10px] rounded-md`}
				/>
			</div>
			<Icons.CloseButton
				onClick={handleDeleteInput}
				className="absolute top-3 right-1 w-5 dark:text-gray-500 dark:hover:text-gray-400 text-gray-500 hover:text-gray-700 cursor-pointer"
			/>
		</div>
	);
};

export default Redirects;
