import { EMessageComponentType, IFieldEmbed } from '@mezon/utils';
import { useMemo } from 'react';
import { MessageButton } from '../../MessageActionsPanel/components/MessageButton';
import { MessageInput } from '../../MessageActionsPanel/components/MessageInput';
import { MessageSelect } from '../../MessageActionsPanel/components/MessageSelect';
import { EmbedOptionRatio } from './EmbedOptionRatio';
interface EmbedFieldsProps {
	fields: IFieldEmbed[];
	message_id: string;
	senderId: string;
}

export function EmbedFields({ fields, message_id, senderId }: EmbedFieldsProps) {
	const groupedFields = useMemo(() => {
		return fields.reduce<IFieldEmbed[][]>((acc, field) => {
			if (!field.inline) {
				acc.push([field]);
			} else {
				const lastRow = acc[acc.length - 1];
				if (lastRow && lastRow[0].inline && lastRow.length < 3) {
					lastRow.push(field);
				} else {
					acc.push([field]);
				}
			}
			return acc;
		}, []);
	}, [fields]);

	return (
		<div className="mt-2 grid gap-2">
			{groupedFields.map((row, index) => (
				<div key={index} className={`grid gap-4 ${row.length === 1 ? 'grid-cols-1' : row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
					{row.map((field, index) => (
						<div
							key={index}
							className={`${field.inline ? `col-span-${3 / row.length}` : 'col-span-3'} ${field.button ? 'flex gap-3' : 'flex-col'}`}
						>
							<div className="flex flex-col gap-1">
								<div className="font-semibold text-sm">{field.name}</div>
								<div className="text-textSecondary800 dark:text-textSecondary text-sm">{field.value}</div>
							</div>
							{field.options && (
								<div className="flex flex-col gap-1">
									<EmbedOptionRatio key={field.value} options={field.options} message_id={message_id} />
								</div>
							)}
							{field.inputs && (
								<div className="flex flex-col gap-1">
									{field.inputs.type === EMessageComponentType.INPUT ? (
										<MessageInput
											buttonId={field.inputs.id}
											messageId={message_id}
											senderId={senderId}
											select={field.inputs.component}
										/>
									) : (
										<MessageSelect
											select={field.inputs.component}
											messageId={message_id}
											senderId={senderId}
											buttonId={field.inputs.id}
										/>
									)}
								</div>
							)}
							<div className="flex gap-1">
								{field.button &&
									field.button.map((button) => (
										<MessageButton
											inside={true}
											key={button.id}
											button={button.component}
											buttonId={button.id}
											senderId={senderId}
											messageId={message_id}
										/>
									))}
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
}
