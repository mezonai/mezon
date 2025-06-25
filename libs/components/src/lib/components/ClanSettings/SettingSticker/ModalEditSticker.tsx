import { useEscapeKeyClose } from '@mezon/core';
import { createSticker, emojiSuggestionActions, selectCurrentClanId, updateSticker, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Button, Checkbox, Icons, InputField } from '@mezon/ui';
import { LIMIT_SIZE_UPLOAD_IMG, resizeFileImage } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ClanEmoji, ClanSticker } from 'mezon-js';
import { ApiClanStickerAddRequest, MezonUpdateClanEmojiByIdBody } from 'mezon-js/api.gen';
import { ChangeEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ELimitSize, ModalErrorTypeUpload, ModalOverData } from '../../ModalError';

export enum EGraphicType {
	EMOJI = 'emoji',
	STICKER = 'sticker'
}

type ModalEditStickerProps = {
	handleCloseModal: () => void;
	graphic: ClanSticker | ClanEmoji | null;
	type?: EGraphicType;
};

type EditingGraphic = Pick<ClanSticker, 'source' | 'shortname'> & {
	fileName: string | null;
};

const STICKER_DIMENSION = {
	MAX_HEIGHT: 320,
	MAX_WIDTH: 320
};

const EMOJI_DIMENSION = {
	MAX_HEIGHT: 128,
	MAX_WIDTH: 128
};

const ModalSticker = ({ graphic, handleCloseModal, type }: ModalEditStickerProps) => {
	const isSticker = type === EGraphicType.STICKER;
	const graphicSource = isSticker ? (graphic as ClanSticker)?.source : (graphic as ClanEmoji)?.src;
	const [editingGraphic, setEditingGraphic] = useState<EditingGraphic>({
		fileName: graphicSource?.split('/').pop() ?? null,
		shortname: graphic?.shortname ?? '',
		source: graphicSource ?? ''
	});
	const [openModal, setOpenModal] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const dispatch = useAppDispatch();
	const { sessionRef, clientRef } = useMezon();
	const fileRef = useRef<HTMLInputElement>(null);
	const dimension = {
		maxHeight: isSticker ? STICKER_DIMENSION.MAX_HEIGHT : EMOJI_DIMENSION.MAX_HEIGHT,
		maxWidth: isSticker ? STICKER_DIMENSION.MAX_WIDTH : EMOJI_DIMENSION.MAX_WIDTH
	};
	const limitSizeDisplay = isSticker ? ELimitSize.KB_512 : ELimitSize.KB_256;
	const limitSize = isSticker ? LIMIT_SIZE_UPLOAD_IMG / 2 : LIMIT_SIZE_UPLOAD_IMG / 4;

	const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			if (e.target.files[0]?.size > limitSize) {
				setOpenModal(true);
				return;
			}

			const srcPreview = URL.createObjectURL(e.target.files[0]);
			setEditingGraphic({
				...editingGraphic,
				source: srcPreview,
				fileName: e.target.files[0].name
			});
		} else {
			console.error('No files selected.');
		}
	};

	const handleChangeShortName = (e: ChangeEvent<HTMLInputElement>) => {
		setEditingGraphic({
			...editingGraphic,
			shortname: e.target.value
		});
	};

	const onSaveChange = async () => {
		if (graphic && graphic.id && graphic.shortname !== editingGraphic.shortname) {
			const updateData: MezonUpdateClanEmojiByIdBody = {
				source: graphicSource,
				category: graphic?.category,
				shortname: isSticker ? editingGraphic.shortname : ':' + editingGraphic.shortname + ':',
				clan_id: currentClanId || ''
			};

			const requestData = {
				...updateData,
				media_type: 0
			};

			isSticker
				? await dispatch(updateSticker({ stickerId: graphic.id, request: requestData }))
				: await dispatch(emojiSuggestionActions.updateEmojiSetting({ request: updateData, emojiId: graphic.id }));
			handleCloseModal();
			return;
		}
		handleCreateSticker();
	};

	const handleCreateSticker = async () => {
		const checkAvailableCreate = editingGraphic.fileName && editingGraphic.shortname && editingGraphic.source;
		if (!fileRef.current?.files || !checkAvailableCreate) {
			handleCloseModal();
			return;
		}
		const session = sessionRef.current;
		const client = clientRef.current;
		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		const file = fileRef.current.files[0];
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			setOpenModalType(true);
			return;
		}

		const category = isSticker ? 'Among Us' : 'Custom';
		const id = Snowflake.generate();
		const path = (isSticker ? 'stickers/' : 'emojis/') + id + '.webp';
		let resizeFile = file;
		if (!file.name.endsWith('.gif')) {
			resizeFile = (await resizeFileImage(file, dimension.maxWidth, dimension.maxHeight, 'file')) as File;
		}
		const isForSale = isForSaleRef.current?.checked;
		const realImage = await handleUploadEmoticon(client, session, path, resizeFile as File);

		const request: ApiClanStickerAddRequest = {
			id: id,
			category: category,
			clan_id: currentClanId,
			source: realImage.url,
			shortname: isSticker ? editingGraphic.shortname : ':' + editingGraphic.shortname + ':',
			is_for_sale: isForSale
		};
		if (isForSale) {
			const idPreview = Snowflake.generate();
			const fileBlur = await createBlurredImageFile(resizeFile);
			const pathPreview = (isSticker ? 'stickers/' : 'emojis/') + idPreview + '.webp';
			await handleUploadEmoticon(client, session, pathPreview, fileBlur as File);
			request.id = idPreview;
		}

		const requestData = {
			...request,
			media_type: 0
		};

		isSticker
			? dispatch(createSticker({ request: requestData, clanId: currentClanId }))
			: dispatch(emojiSuggestionActions.createEmojiSetting({ request: request, clanId: currentClanId }));

		handleCloseModal();
	};

	const handleCloseTypeModal = () => {
		setOpenModalType(false);
	};

	const handleCloseOverModal = () => {
		setOpenModal(false);
	};

	const handleOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && !validateSaveChange) {
			handleCreateSticker();
		}
	};

	const validateSaveChange = useMemo(() => {
		return !(editingGraphic.fileName && editingGraphic.shortname && editingGraphic.shortname !== graphic?.shortname);
	}, [editingGraphic.fileName, editingGraphic.shortname, graphic?.shortname]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, handleCloseModal);

	const isForSaleRef = useRef<HTMLInputElement | null>(null);

	function createBlurredImageFile(originalFile: File, blurAmount = 7) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = URL.createObjectURL(originalFile);

			img.onload = () => {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Cannot create canvas context.'));
					return;
				}
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.filter = `blur(${blurAmount}px)`;
				ctx.drawImage(img, 0, 0);

				canvas.toBlob((blob) => {
					if (blob) {
						const newFile = new File([blob], 'blurred-image.png', { type: 'image/png' });
						resolve(newFile); // trả về file có thể dùng tiếp
					} else {
						reject(new Error('Không thể chuyển canvas thành file.'));
					}
				}, 'image/png');
			};

			img.onerror = () => reject(new Error('Không thể load ảnh.'));
		});
	}

	return (
		<>
			<div ref={modalRef} tabIndex={-1} className={'relative w-full h-[468px] flex flex-col dark:bg-bgPrimary text-textPrimary '}>
				<div className={`w-full flex-1 flex flex-col overflow-hidden overflow-y-auto gap-4`}>
					<div className={`flex flex-col gap-2 items-center select-none dark:text-textPrimary text-textPrimaryLight`}>
						<p className="text-2xl font-semibold dark:text-bgTextarea text-textPrimaryLight">Upload a file</p>
						<p className="text-base">File should be APNG, PNG, or GIF (512KB max)</p>
					</div>
					<div className={'flex flex-col select-none dark:text-textPrimary text-textPrimaryLight'}>
						<p className="text-xs font-bold h-6 uppercase">PREVIEW</p>
						<div
							className={
								'flex items-center justify-center rounded-lg border-[0.08px] dark:border-borderDivider border-borderLightTabs overflow-hidden'
							}
						>
							<div className={'relative h-56 w-[50%] flex items-center justify-center bg-bgPrimary'}>
								{editingGraphic.source ? (
									<PreviewStickerBox preview={editingGraphic.source} />
								) : (
									<Icons.UploadImage className="w-16 h-16 text-bgLightModeSecond" />
								)}
							</div>
							<div className={'h-56 w-[50%] flex items-center justify-center bg-bgLightModeSecond'}>
								{editingGraphic.source ? (
									<PreviewStickerBox preview={editingGraphic.source} />
								) : (
									<Icons.UploadImage className="w-16 h-16 text-bgPrimary" />
								)}
							</div>
						</div>
					</div>
					<div className={'flex flex-row gap-4 dark:text-textPrimary text-textPrimaryLight'}>
						<div className={'w-1/2 flex flex-col gap-2'}>
							<p className={`text-xs font-bold uppercase select-none`}>FILE {graphic && ' (THIS CANNOT BE EDITED)'}</p>
							<div
								className={`dark:bg-bgSecondary bg-bgLightSecondary border-[0.08px] dark:border-textLightTheme border-borderLightTabs flex flex-row rounded justify-between items-center py-[6px] px-3 dark:text-textPrimary box-border ${editingGraphic.fileName && 'cursor-not-allowed'}`}
							>
								<p className="select-none flex-1 truncate">{editingGraphic.fileName ?? 'Choose a file'}</p>
								{!graphic && (
									<button className="hover:bg-hoverPrimary bg-primary rounded-[4px] py-[2px] px-2 text-nowrap relative select-none text-white overflow-hidden">
										Browse
										<input
											className="absolute w-full h-full cursor-pointer top-0 right-0 z-10 opacity-0 file:cursor-pointer"
											type="file"
											title=" "
											tabIndex={0}
											accept=".jpg,.jpeg,.png,.gif"
											onChange={handleChooseFile}
											ref={fileRef}
											onKeyDown={handleOnEnter}
										/>
									</button>
								)}
							</div>
						</div>
						<div className={'w-1/2 flex flex-col gap-2'}>
							<p className={`text-xs font-bold uppercase select-none`}>Sticker Name</p>
							<div
								className={
									'bg-bgLightSearchHover dark:bg-bgTertiary border-[0.08px] dark:border-textLightTheme border-borderLightTabs flex flex-row rounded justify-between items-center p-2 pl-3 dark:text-textPrimary box-border overflow-hidden'
								}
							>
								<InputField
									type="string"
									placeholder="ex. cat hug"
									className={'px-[8px] bg-bgLightSearchHover dark:bg-bgTertiary'}
									value={editingGraphic.shortname}
									onChange={handleChangeShortName}
									onKeyDown={handleOnEnter}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className={`absolute w-full h-[54px] bottom-0 flex items-end justify-end select-none gap-2`}>
					<div className="flex items-center flex-1 h-full gap-2">
						<Checkbox ref={isForSaleRef} id="sale_item" className="accent-blue-600 w-4 h-4" />
						<label htmlFor="sale_item" className="!text-textPrimaryLight dark:!text-textPrimary">
							This is for sale
						</label>
					</div>
					<Button
						label="Never Mind"
						className=" !text-textPrimaryLight dark:!text-textPrimary  rounded px-4 py-1.5 hover:underline hover:bg-transparent bg-transparent"
						onClick={handleCloseModal}
					/>
					<Button
						label="Save Changes"
						className={`bg-blue-600 rounded-[4px] px-4 py-1.5 text-nowrap text-white`}
						disable={validateSaveChange}
						onClick={onSaveChange}
					/>
				</div>
			</div>

			<ModalOverData openModal={openModal} handleClose={handleCloseOverModal} sizeLimit={limitSizeDisplay} />
			<ModalErrorTypeUpload openModal={openModalType} handleClose={handleCloseTypeModal} />
		</>
	);
};

export default ModalSticker;

const PreviewStickerBox = ({ preview }: { preview: string }) => {
	return (
		<div className={'m-auto absolute w-40 aspect-square overflow-hidden flex items-center justify-center'}>
			<img className="h-full w-auto object-cover" src={preview} />
		</div>
	);
};
