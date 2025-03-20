import { ModalSaveChanges } from '@mezon/components';
import { editMezonOauthClient, selectApplicationById, selectCurrentAppId, useAppDispatch } from '@mezon/store';
import { ApiMezonOauthClient } from 'mezon-js/api.gen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ClientInformation from './ClientInformation/ClientInformation';
import Generator from './Generator/Generator';
import Redirects from './Redirects/Redirects';

const scopesList = process.env.NX_CHAT_APP_OAUTH2_SCOPES_LIST || '';
const defaultScopeList = scopesList.split(',');

export interface IScope {
	isChecked: boolean;
	value: string;
}

const OAuth2 = () => {
	const dispatch = useAppDispatch();
	const [hasChange, setHasChange] = useState(false);
	const currentAppId = useSelector(selectCurrentAppId);
	const currentApp = useSelector((state) => selectApplicationById(state, currentAppId as string)) ?? {};

	//For Redirects URIs
	const appURIes = useMemo(() => currentApp?.oAuthClient?.redirect_uris ?? [], [currentApp?.oAuthClient?.redirect_uris]);
	const uriInputValuesRef = useRef<string[]>([...appURIes]);
	const [inputArrLength, setInputArrLength] = useState<number>(appURIes.length);

	//For scopes
	const initialAppScopesStringArray = (currentApp?.oAuthClient?.scope || '').split(' ');

	const initialScopeValues = useMemo(() => {
		const arr: IScope[] = [];
		defaultScopeList.forEach((item) => {
			if (initialAppScopesStringArray.includes(item)) {
				const scope: IScope = {
					isChecked: true,
					value: item
				};
				arr.push(scope);
			} else {
				const scope: IScope = {
					isChecked: false,
					value: item
				};
				arr.push(scope);
			}
		});
		return arr;
	}, [initialAppScopesStringArray]);

	const [clientScopeValues, setClientScopeValues] = useState<IScope[]>([...initialScopeValues]);

	const handleSaveChanges = async () => {
		let includeInvalidURI = false;
		if (!uriInputValuesRef.current || uriInputValuesRef.current.includes('')) {
			toast.warning('There is empty input!');
			return;
		}

		for (let index = 0; index < uriInputValuesRef.current.length; index++) {
			const item = uriInputValuesRef.current[index];
			if (!item.startsWith('http://') && !item.startsWith('https://')) {
				toast.warning('URIs must be valid!');
				includeInvalidURI = true;
				break;
			}
		}

		if (!uriInputValuesRef.current.length) {
			toast.warning('Redirect URI is required!');
			return;
		}

		if (includeInvalidURI) {
			return;
		}

		let newScope = '';
		clientScopeValues.forEach((item) => {
			if (item.isChecked) newScope += item.value + ' ';
		});

		const request: ApiMezonOauthClient = {
			...currentApp?.oAuthClient,
			redirect_uris: uriInputValuesRef.current,
			scope: newScope.trim()
		};

		await dispatch(editMezonOauthClient({ body: request }));
		setHasChange(false);
	};

	const handleResetChanges = () => {
		//URIs
		uriInputValuesRef.current = [...appURIes];
		setInputArrLength(appURIes.length);
		//Scopes
		setClientScopeValues([...initialScopeValues]);

		setHasChange(false);
	};

	useEffect(() => {
		const isSameURIArray =
			appURIes.length === uriInputValuesRef.current.length && JSON.stringify(appURIes) === JSON.stringify(uriInputValuesRef.current);
		const isTheSameScopeArray = JSON.stringify(initialScopeValues) === JSON.stringify(clientScopeValues);
		if (!isTheSameScopeArray || !isSameURIArray || inputArrLength !== appURIes.length) {
			setHasChange(true);
			return;
		}
		setHasChange(false);
	}, [appURIes, clientScopeValues, initialScopeValues, inputArrLength, setHasChange]);

	return (
		<div className="flex flex-col gap-10 pb-10">
			<div className="flex gap-5 flex-col">
				<div className="text-2xl font-semibold">OAuth2</div>
				<div className="text-xl dark:text-[#b5bac1] text-[#4e5058]">
					Use Mezon as an authorization system or use our API on behalf of your users. Add a redirect URI, pick your scopes, roll a D20 for
					good luck, and go!
				</div>
				<div className="text-blue-500 cursor-pointer">Learn more about OAuth2</div>
			</div>
			<ClientInformation currentApp={currentApp} />
			<Redirects
				inputArrLength={inputArrLength}
				uriInputValuesRef={uriInputValuesRef}
				setInputArrLength={setInputArrLength}
				currentApp={currentApp}
				setHasChange={setHasChange}
			/>
			<Generator
				setClientScopeValues={setClientScopeValues}
				clientScopeValues={clientScopeValues}
				initialScopeValues={initialScopeValues}
				setHasChange={setHasChange}
			/>
			{hasChange && <ModalSaveChanges onReset={handleResetChanges} onSave={handleSaveChanges} />}
		</div>
	);
};

export default OAuth2;
