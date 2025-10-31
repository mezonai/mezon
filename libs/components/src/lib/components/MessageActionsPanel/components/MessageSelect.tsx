import {
	embedActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentUserId,
	selectDmGroupCurrentId,
	selectModeResponsive,
	useAppDispatch
} from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import type { IMessageSelect, IMessageSelectOption } from '@mezon/utils';
import { ModeResponsive } from '@mezon/utils';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

type MessageSelectProps = {
	select: IMessageSelect;
	messageId: string;
	senderId: string;
	buttonId: string;
	inside?: boolean;
};

export const MessageSelect: React.FC<MessageSelectProps> = ({ select, messageId, senderId, buttonId, inside }) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const modeResponsive = useSelector(selectModeResponsive);
	const currentUserId = useSelector(selectCurrentUserId);
	const [selectedOptions, setSelectedOptions] = useState<Array<IMessageSelectOption>>([]);

	const [availableOptions, setAvailableOptions] = useState(select?.options || []);
	const dispatch = useAppDispatch();
	const handleOptionSelect = (option: { value: string; label: string }) => {
		if (select?.disabled) {
			return;
		}
		if (selectedOptions.length >= (select?.max_options || select?.options?.length)) {
			return;
		}
		if (!select?.min_options && !select?.max_options) {
			setSelectedOptions([option]);
			setAvailableOptions(select?.options?.filter((o) => o.value !== option?.value));
		} else {
			setSelectedOptions((prev) => [...prev, option]);
			setAvailableOptions((prev) => prev.filter((o) => o.value !== option?.value));
		}
		if (!inside) {
			dispatch(
				messagesActions.clickButtonMessage({
					message_id: messageId,
					channel_id: (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmId) as string,
					button_id: buttonId,
					sender_id: senderId,
					user_id: currentUserId,
					extra_data: option?.value
				})
			);
			return;
		}
		if (selectedOptions.filter((item) => item.value === option.value).length > 0) {
			dispatch(
				embedActions.removeEmbedValuel({
					message_id: messageId,
					data: {
						id: buttonId,
						value: option.value
					},
					multiple: true
				})
			);
			return;
		}
		dispatch(
			embedActions.addEmbedValue({
				message_id: messageId,
				data: {
					id: buttonId,
					value: option.value
				},
				multiple: checkMultipleSelect,
				onlyChooseOne: !checkMultipleSelect
			})
		);
		dispatch(
			messagesActions.clickButtonMessage({
				message_id: messageId,
				channel_id: (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmId) as string,
				button_id: buttonId,
				sender_id: senderId,
				user_id: currentUserId,
				extra_data: option.value
			})
		);
	};

	const checkMultipleSelect = useMemo(() => {
		return (!!select?.min_options && select?.min_options > 1) || (!!select?.max_options && select?.max_options >= 2);
	}, [select?.min_options, select?.max_options]);
	useEffect(() => {
		if (select?.valueSelected) {
			handleOptionSelect(select?.valueSelected);
		}
	}, []);

	const handleRemoveOption = (e: React.MouseEvent<HTMLButtonElement>, option: { value: string; label: string }) => {
		e.stopPropagation();

		setSelectedOptions((prev) => prev.filter((o) => o.value !== option.value));
		setAvailableOptions((prev) => {
			const updatedOptions = [...prev, option];

			return updatedOptions.sort(
				(a, b) => select.options.findIndex((opt) => opt.value === a.value) - select.options.findIndex((opt) => opt.value === b.value)
			);
		});
		dispatch(
			embedActions.removeEmbedValuel({
				message_id: messageId,
				data: {
					id: buttonId,
					value: option.value
				},
				multiple: true
			})
		);
	};

	const handleClearSelection = () => {
		setAvailableOptions(select.options);
		setSelectedOptions([]);
	};

	const handleSubmitSelection = () => {
		handleClearSelection();
	};

	const getSelectNote = () => {
		if (select?.min_options && select?.max_options) {
			return `Select from ${select?.min_options} to ${select?.max_options} options`;
		}

		if (select?.max_options) {
			return `Select up to ${select?.max_options} option${select?.max_options > 1 ? 's' : ''}`;
		}

		if (select?.min_options) {
			return `Select at least ${select?.min_options} option${select?.min_options > 1 ? 's' : ''}`;
		}

		return 'Select 1 option';
	};

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];

		availableOptions?.map((option) =>
			menuItems.push(
				<Menu.Item
					key={option?.value}
					onClick={() => {
						handleOptionSelect(option);
					}}
					className="flex w-[400px] flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm hover:bg-bgIconDark dark:hover:bg-bgModifierHover text-sm w-full py-2 px-4 text-left cursor-pointer"
				>
					<p className="dark:text-textSecondary text-textSecondary800">{option.label}</p>
				</Menu.Item>
			)
		);
		return <>{menuItems}</>;
	}, [availableOptions]);

	return (
		<Menu menu={menu} className="h-fit max-h-[200px] text-xs overflow-y-scroll customSmallScrollLightMode dark:bg-bgTertiary px-2 z-20">
			<div className="w-full max-w-[400px] h-auto rounded-md flex p-3 justify-between items-center text-sm border-theme-primary ">
				<div>
					{selectedOptions?.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-2">
							{selectedOptions?.map((option) => (
								<div key={option.value} className="flex items-center px-2 py-1 ">
									<span>{option.label}</span>
									<button
										className="ml-2 text-red-500 hover:text-red-700"
										onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
											handleRemoveOption(e, option);
										}}
									>
										✕
									</button>
								</div>
							))}
						</div>
					)}
					<div className="flex flex-col justify-between items-start w-full">
						<p className="dark:text-textPrimary text-textPrimary400">{select?.placeholder}</p>
						<p className={'text-xs italic'}>{getSelectNote()}</p>
					</div>
				</div>
				<Icons.ArrowDownFill />
			</div>
		</Menu>
	);
};
