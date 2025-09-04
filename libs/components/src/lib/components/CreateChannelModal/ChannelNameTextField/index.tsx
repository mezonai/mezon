import { checkDuplicateChannelInCategory, selectTheme, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ValidateSpecialCharacters, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { ChannelLableModal } from '../ChannelLabel';

interface ChannelNameModalProps {
	type: ChannelType;
	channelNameProps: string;
	onChange: (value: string) => void;
	onCheckValidate?: (check: boolean) => void;
	onHandleChangeValue?: () => void;
	error?: string;
	placeholder: string;
	shouldValidate: boolean;
	categoryId?: string;
}

export type ChannelNameModalRef = {
	checkInput: () => boolean;
};

export const ChannelNameTextField = forwardRef<ChannelNameModalRef, ChannelNameModalProps>((props, ref) => {
	const { channelNameProps, type, onChange, onCheckValidate, onHandleChangeValue, error, placeholder, shouldValidate, categoryId } = props;
	const [checkValidate, setCheckValidate] = useState(true);
	const [checkNameChannel, setCheckNameChannel] = useState(true);
	const theme = useAppSelector(selectTheme);
	const dispatch = useAppDispatch();
	const messages = {
		INVALID_NAME: `Please enter a valid channel name (max 64 characters, only words, numbers, _ or -).`,
		DUPLICATE_NAME: `The channel  name already exists in the category . Please enter another name.`
	};
	const [validateMessage, setValidateMesage] = useState(messages.INVALID_NAME);

	const handleInputChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			onChange(value);

			if (value === '') {
				setCheckNameChannel(true);
			} else {
				setCheckNameChannel(false);
			}

			debouncedSetChannelName(value);
		},
		[onChange, setCheckValidate, onCheckValidate, setValidateMesage]
	);

	const debouncedSetChannelName = useDebouncedCallback(async (value: string) => {
		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			await dispatch(
				checkDuplicateChannelInCategory({
					channelName: value.trim(),
					categoryId: categoryId ?? ''
				})
			)
				.then(unwrapResult)
				.then((result) => {
					if (result) {
						setCheckValidate(true);
						setValidateMesage(messages.DUPLICATE_NAME);
						if (onCheckValidate) {
							onCheckValidate(false);
						}
						return;
					}
					setCheckValidate(false);
					setValidateMesage('');
					if (onCheckValidate) {
						onCheckValidate(true);
					}
				});
			return;
		} else {
			setCheckValidate(true);
			if (onCheckValidate) {
				onCheckValidate(false);
				setValidateMesage(messages.INVALID_NAME);
			}
		}
	}, 300);

	const iconMap: Partial<Record<ChannelType, JSX.Element>> = {
		[ChannelType.CHANNEL_TYPE_CHANNEL]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_GMEET_VOICE]: <Icons.Speaker defaultSize="w-6 h-6" />,
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
					className={`InputContainer self-stretch h-11 px-4 py-3 bg-item-theme rounded shadow border w-full ${error ? 'border border-red-500' : 'border-blue-600'}  justify-start items-center gap-2 inline-flex`}
				>
					{iconMap[type]}
					<div className="InputValue grow shrink basis-0 self-stretch justify-start items-center flex">
						<input
							className="Input grow shrink basis-0 h-10 outline-none bg-transparent  text-sm font-normal "
							onChange={handleInputChange}
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
