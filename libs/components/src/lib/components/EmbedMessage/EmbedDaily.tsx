import { useCurrentInbox } from '@mezon/core';
import { messagesActions, selectCurrentUserId, useAppDispatch } from '@mezon/store';
import { EMessageComponentType, IEmbedProps } from '@mezon/utils';
import { Button, Dropdown, DropdownItem, Label, TextInput } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { EmbedTitle } from './components/EmbedTitle';

export default function EmbedDaily({ embed, message_id, senderId }: { embed: IEmbedProps; message_id: string; senderId: string }) {
	const { color, title, url, fields, thumbnail, args, mess } = embed;
	const currentId = useCurrentInbox();
	const currentUserId = useSelector(selectCurrentUserId);

	const dispatch = useAppDispatch();
	const [formData, setFormData] = useState(
		fields?.reduce(
			(acc, field) => {
				if (field.inputs?.id) {
					acc[field.inputs.id] = field.value || '';
				}
				return acc;
			},
			{} as Record<string, string>
		)
	);

	const handleChange = (id: string, value: string) => {
		setFormData((prevData) => ({
			...prevData,
			[id]: value
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const formDataValues = Object.values(formData ?? {});
		const combinedData = {
			values: formDataValues,
			args: args ?? '',
			mess: mess ?? ''
		};

		const formDataString = JSON.stringify(combinedData);

		dispatch(
			messagesActions.clickButtonMessage({
				message_id: message_id,
				channel_id: currentId?.channel_id ?? '',
				button_id: '',
				sender_id: senderId,
				user_id: currentUserId,
				extra_data: formDataString
			})
		);
	};

	const renderFields = () =>
		fields?.map((field, index) => {
			const fieldId = `${field.inputs?.id}`;
			const isRequired = field.inputs?.component.required;
			const isNumber = field.inputs?.component.isNumber;

			return (
				<div key={index} className="mb-4">
					<Label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{field.name}
						{isRequired && <span className="text-red-500">*</span>}
					</Label>

					{field.inputs && field.inputs.type === EMessageComponentType.SELECT && field.inputs.component.options && (
						<div>
							<Dropdown
								label={formData?.[fieldId] || field.inputs.component.placeholder || 'Select an option'} // Display selected value or placeholder
								id={fieldId}
								className="mt-1 w-[300px] rounded-md border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
							>
								{field.inputs.component.options.map((option, idx) => (
									<DropdownItem key={idx} value={option.label} onClick={() => handleChange(fieldId, option.value)}>
										{option.label}
									</DropdownItem>
								))}
							</Dropdown>
						</div>
					)}

					{field.inputs && field.inputs.type === EMessageComponentType.INPUT && (
						<TextInput
							id={fieldId}
							placeholder={field.inputs.component.placeholder}
							required={isRequired}
							value={formData?.[fieldId] ?? ''}
							onChange={(e) => handleChange(fieldId, e.target.value)}
							className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
							type={isNumber ? 'number' : 'text'}
						/>
					)}
				</div>
			);
		});

	const handleCancel = () => {};

	return (
		<form
			className="w-full dark:bg-gray-800 bg-white rounded-lg overflow-hidden text-left relative mt-2 shadow-lg text-gray-900 dark:text-gray-300"
			onSubmit={handleSubmit}
		>
			<div className="flex flex-col px-5 pt-2 pb-4">
				<div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: color }} />
				<div className="flex flex-row justify-between">
					<div className={`flex flex-col ${thumbnail && 'pr-2'}`}>{title && <EmbedTitle title={title} url={url} />}</div>
				</div>
				<div className="mt-4">{renderFields()}</div>
				<div className="mt-6 flex justify-end">
					<Button type="button" color="gray" className="mr-2" onClick={handleCancel}>
						Cancel
					</Button>
					<Button type="submit" className="ml-2">
						Submit
					</Button>
				</div>
			</div>
		</form>
	);
}
