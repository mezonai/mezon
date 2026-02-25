import type {
	AnimationComponent,
	DatePickerComponent,
	GridComponent,
	IFieldEmbed,
	InputComponent,
	ObserveFn,
	RadioComponent,
	SelectComponent
} from '@mezon/utils';
import { EMessageComponentType } from '@mezon/utils';
import { useMemo } from 'react';
import { MessageButton } from '../../MessageActionsPanel/components/MessageButton';
import { MessageDatePicker } from '../../MessageActionsPanel/components/MessageDatePicker';
import { MessageInput } from '../../MessageActionsPanel/components/MessageInput';
import { MessageSelect } from '../../MessageActionsPanel/components/MessageSelect';
import { EmbedAnimation } from './EmbedAnimation';
import { EmbedGrid } from './EmbedGrid';
import { EmbedOptionRatio } from './EmbedOptionRatio';
interface EmbedFieldsProps {
	fields: IFieldEmbed[];
	message_id: string;
	senderId: string;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
}

export function EmbedFields({ fields, message_id, senderId, channelId, observeIntersectionForLoading }: EmbedFieldsProps) {
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
		<div className="mt-2 grid gap-2  w-fit">
			{groupedFields.map((row, index) => (
				<div key={index} className={`grid gap-4 ${row.length === 1 ? 'grid-cols-1' : row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
					{row.map((field, index) => (
						<div
							key={index}
							className={`${field.inline ? `col-span-${3 / row.length}` : 'col-span-3'} ${field.button ? 'flex justify-between' : 'flex-col'}`}
						>
							<div className="flex flex-col gap-1 break-all">
								<div className="font-semibold text-sm">{field.name}</div>
								<div className=" text-sm">{field.value}</div>
							</div>
							{field.inputs && (
								<div className="flex flex-col gap-1 w-max-[500px]">
									<InputEmbedByType
										component={field.inputs}
										messageId={message_id}
										senderId={senderId}
										max_options={field.inputs?.max_options || 1}
										channelId={channelId}
										observeIntersectionForLoading={observeIntersectionForLoading}
									/>
								</div>
							)}
							{field.shape && (
								<div className="flex flex-col gap-1 w-max-[500px]">
									<ShapeEmbedMessage
										shape={field.shape}
										messageId={message_id}
										senderId={senderId}
										channelId={channelId}
										observeIntersectionForLoading={observeIntersectionForLoading}
									/>
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
											channelId={channelId}
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

type InputEmbedByType = {
	messageId: string;
	senderId: string;
	component: SelectComponent | InputComponent | DatePickerComponent | RadioComponent | AnimationComponent;
	max_options?: number;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
};

const InputEmbedByType = ({ messageId, senderId, component, max_options, channelId, observeIntersectionForLoading }: InputEmbedByType) => {
	switch (component.type) {
		case EMessageComponentType.INPUT:
			return <MessageInput buttonId={component?.id || ''} messageId={messageId} senderId={senderId} input={component?.component} />;
		case EMessageComponentType.SELECT:
			return <MessageSelect buttonId={component.id} messageId={messageId} senderId={senderId} select={component.component} inside={true} />;
		case EMessageComponentType.DATEPICKER:
			return <MessageDatePicker buttonId={component.id} messageId={messageId} senderId={senderId} datepicker={component.component} />;
		case EMessageComponentType.RADIO:
			return (
				<EmbedOptionRatio
					key={component.id}
					idRadio={component.id}
					options={component.component}
					message_id={messageId}
					max_options={max_options}
				/>
			);
		case EMessageComponentType.ANIMATION:
			return (
				<EmbedAnimation
					url_image={component.component?.url_image}
					url_position={component.component?.url_position}
					pool={component.component?.pool}
					messageId={messageId}
					duration={component.component?.duration}
					repeat={component.component?.repeat}
					isResult={component.component?.isResult}
					channelId={channelId}
					observeIntersectionForLoading={observeIntersectionForLoading}
				/>
			);

		default:
			return;
	}
};

type ShapeEmbedMessage = {
	messageId: string;
	senderId: string;
	shape: GridComponent;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
};

const ShapeEmbedMessage = ({ messageId, senderId, shape, channelId, observeIntersectionForLoading }: ShapeEmbedMessage) => {
	return (
		<EmbedGrid
			pool={shape.component.items}
			columns={shape.columns}
			senderId={senderId}
			messageId={messageId}
			channelId={channelId}
			rows={shape.rows}
		/>
	);
};
