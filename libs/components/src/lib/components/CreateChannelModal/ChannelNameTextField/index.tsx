import { selectTheme, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ValidateSpecialCharacters, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChannelLableModal } from '../ChannelLabel';

interface ChannelNameModalProps {
	type: ChannelType;
	channelNameProps: string;
	onChange: (value: string) => void;
	onCheckValidate?: (check: boolean) => void;
	onHandleChangeValue?: () => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	error?: string;
	placeholder: string;
	shouldValidate: boolean;
	categoryId?: string;
	clanId: string;
}

export type ChannelNameModalRef = {
	checkInput: () => boolean;
};

export const ChannelNameTextField = forwardRef<ChannelNameModalRef, ChannelNameModalProps>((props, ref) => {
	const {
		channelNameProps,
		type,
		onChange,
		onCheckValidate,
		onHandleChangeValue,
		onKeyDown,
		error,
		placeholder,
		shouldValidate,
		categoryId,
		clanId
	} = props;
	const { t } = useTranslation('createChannel');
	const [checkValidate, setCheckValidate] = useState(true);
	const [checkNameChannel, setCheckNameChannel] = useState(true);
	const theme = useAppSelector(selectTheme);
	const dispatch = useAppDispatch();
	const messages = {
		INVALID_NAME: t('validation.invalidName'),
		DUPLICATE_NAME: t('validation.duplicateName')
	};
	const [validateMessage, setValidateMesage] = useState(messages.INVALID_NAME);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			onChange(value);

			if (value === '') {
				setCheckNameChannel(true);
				setCheckValidate(true);
				setValidateMesage(messages.INVALID_NAME);
				if (onCheckValidate) {
					onCheckValidate(false);
				}
			} else {
				setCheckNameChannel(false);
				const regex = ValidateSpecialCharacters();
				if (regex.test(value)) {
					setCheckValidate(false);
					setValidateMesage('');
					if (onCheckValidate) {
						onCheckValidate(true);
					}
				} else {
					setCheckValidate(true);
					setValidateMesage(messages.INVALID_NAME);
					if (onCheckValidate) {
						onCheckValidate(false);
					}
				}
			}
		},
		[onChange, setCheckValidate, onCheckValidate, setValidateMesage]
	);

	const iconMap: Partial<Record<ChannelType, JSX.Element>> = {
		[ChannelType.CHANNEL_TYPE_CHANNEL]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_MEZON_VOICE]: <Icons.Speaker defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_FORUM]: <Icons.Forum defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_ANNOUNCEMENT]: <Icons.Announcement defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_APP]: <Icons.AppChannelIcon className="w-6 h-6" fill={theme} />,
		[ChannelType.CHANNEL_TYPE_STREAMING]: <Icons.Stream defaultSize="w-6 h-6" />,
		// 2 lines below only get index
		[ChannelType.CHANNEL_TYPE_DM]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_GROUP]: <Icons.Speaker defaultSize="w-6 h-6" />
	};

	useImperativeHandle(ref, () => ({
		checkInput: () => checkValidate || checkNameChannel
	}));

	useEffect(() => {
		if (onHandleChangeValue) {
			onHandleChangeValue();
		}
	}, [checkValidate, checkNameChannel, onHandleChangeValue]);

	return (
		<div className="Frame408 self-stretch h-[84px] flex-col justify-start items-start gap-2 flex mt-1">
			<ChannelLableModal labelProp={channelNameProps} />
			<div className="ContentContainer self-stretch h-11 flex-col items-start flex">
				<div
					className={`InputContainer self-stretch h-11 px-4 py-3 bg-item-theme rounded shadow border w-full ${error || (shouldValidate && checkValidate && !checkNameChannel) ? 'border-red-500' : 'border-blue-600'}  justify-start items-center gap-2 inline-flex`}
				>
					{iconMap[type]}
					<div className="InputValue grow shrink basis-0 self-stretch justify-start items-center flex">
						<input
							className="Input grow shrink basis-0 h-10 outline-none bg-transparent  text-sm font-normal "
							onChange={handleInputChange}
							onKeyDown={onKeyDown}
							placeholder={placeholder}
							maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
							data-e2e={generateE2eId('clan_page.modal.create_channel.input.channel_name')}
						/>
					</div>
				</div>
			</div>
			{shouldValidate && (checkValidate || checkNameChannel) ? (
				<p className="text-[#e44141] text-xs italic font-thin">{validateMessage}</p>
			) : null}
		</div>
	);
});
