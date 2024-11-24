import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { DirectEntity, channelsActions, useAppDispatch } from '@mezon/store';
import { MouseButton, ValidateSpecialCharacters } from '@mezon/utils';
import { ApiUpdateChannelDescRequest, ChannelType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coords } from '../ChannelLink';
import PanelMember from '../PanelMember';

type LabelDmProps = {
	dmGroupId: string;
	currentDmGroup: DirectEntity;
};

const LabelDm = (props: LabelDmProps) => {
	const { dmGroupId, currentDmGroup } = props;
	const dispatch = useAppDispatch();
	const initLabel = (currentDmGroup?.channel_label || currentDmGroup?.usernames) ?? '';
	const [label, setLabel] = useState(initLabel);
	const [openEditName, setOpenEditName] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [isShowPanel, setIsShowPanel] = useState(false);
	const [coords, setCoords] = useState<Coords>({
		mouseX: 0,
		mouseY: 0,
		distanceToBottom: 0
	});
	const isValidGroupName = useMemo(() => {
		return ValidateSpecialCharacters().test(label);
	}, [label]);

	const handleMouseClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		// stop open popup default of web
		window.oncontextmenu = (e) => {
			e.preventDefault();
		};
		const mouseX = event.clientX;
		const mouseY = event.clientY;
		const windowHeight = window.innerHeight;

		const distanceToBottom = windowHeight - mouseY;
		if (event.button === MouseButton.RIGHT) {
			setCoords({ mouseX, mouseY, distanceToBottom });
			setIsShowPanel(true);
		}
	};

	const handleOpenEditName = () => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			setOpenEditName(true);
		}
	};

	const handleChange = (event: any) => {
		setLabel(event.target.value);
	};

	const handleKeyDown = (event: any) => {
		if (event.key === 'Enter' && isValidGroupName) {
			setOpenEditName(false);
			handleSave();
		}
	};

	const handleSave = async () => {
		const updateChannel: ApiUpdateChannelDescRequest = {
			channel_id: dmGroupId || '',
			channel_label: label,
			category_id: '0',
			app_url: ''
		};
		await dispatch(channelsActions.updateChannel(updateChannel));
	};

	const inputRef = useRef<HTMLInputElement | null>(null);
	useEffect(() => {
		if (openEditName && inputRef.current) {
			inputRef.current.focus();
		}
	}, [openEditName]);

	useEffect(() => {
		setOpenEditName(false);
		setLabel(initLabel);
		setIsShowPanel(false);
	}, [currentDmGroup?.channel_label]);

	const cancelEditTitle = useCallback(() => {
		setLabel(initLabel);
		setOpenEditName(false);
	}, [openEditName]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, cancelEditTitle);
	useOnClickOutside(modalRef, cancelEditTitle);

	return (
		<>
			{!openEditName ? (
				<h2
					ref={panelRef}
					onMouseDown={(event) => handleMouseClick(event)}
					className="shrink-1 dark:text-white text-black text-ellipsis one-line"
					onClick={handleOpenEditName}
				>
					{label || `${currentDmGroup?.creator_name}'s Group`}
				</h2>
			) : (
				<div ref={modalRef} tabIndex={-1} className={'outline-none flex flex-col w-full relative'}>
					<input
						ref={inputRef}
						defaultValue={label}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						maxLength={64}
						className="w-full dark:text-white text-black outline-none border dark:border-white border-slate-200 bg-bgLightModeButton dark:bg-bgSecondary rounded"
					/>
					{!isValidGroupName && (
						<p className={'text-colorDanger text-xs absolute top-7 italic w-full truncate'}>
							Please enter a valid channel name (max 64 characters, only words, numbers, _ or -).
						</p>
					)}
				</div>
			)}
			{isShowPanel && (
				<PanelMember
					name={currentDmGroup.channel_label}
					coords={coords}
					onClose={() => setIsShowPanel(false)}
					isMemberDMGroup={false}
					directMessageValue={{
						type: currentDmGroup?.type,
						userId: currentDmGroup?.user_id || [],
						dmID: currentDmGroup?.channel_id || ''
					}}
				/>
			)}
		</>
	);
};

export default LabelDm;
