import { MediaType, selectCurrentClanId, soundEffectActions, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Icons, InputField, Modal } from '@mezon/ui';
import { generateE2eId, getIdSaleItemFromSource } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ELimitSize } from '../../ModalValidateFile';
import { ModalErrorTypeUpload, ModalOverData } from '../../ModalValidateFile/ModalOverData';
import type { SoundType } from './index';

interface ModalUploadSoundProps {
	sound?: SoundType | null;
	onSuccess: (sound: SoundType) => void;
	onClose: () => void;
}

const ModalUploadSound = ({ sound, onSuccess, onClose }: ModalUploadSoundProps) => {
	const { t } = useTranslation('clanSoundSetting');
	const [file, setFile] = useState<File | null>(null);
	const [validFile, setValidFile] = useState<File | null>(null);
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const [openModalSize, setOpenModalSize] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const { sessionRef, clientRef } = useMezon();

	useEffect(() => {
		if (sound) {
			setName(sound.name);
			setPreviewUrl(sound.url);
		}
	}, [sound]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		processFile(f);
	};

	const processFile = (f: File) => {
		if (!['audio/mp3', 'audio/mpeg', 'audio/wav'].includes(f.type)) {
			setOpenModalType(true);
			if (inputRef.current) {
				inputRef.current.value = '';
			}
			return;
		}
		if (f.size > 1024 * 1024) {
			setOpenModalSize(true);
			if (inputRef.current) {
				inputRef.current.value = '';
			}
			return;
		}
		setFile(f);
		setValidFile(f);
		setPreviewUrl(URL.createObjectURL(f));
		setError('');
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		const f = e.dataTransfer.files?.[0];
		if (f) processFile(f);
	};

	const handleUpload = async () => {
		if (!name.trim()) return;

		setIsUploading(true);

		try {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session) {
				throw new Error('Client or session is not initialized');
			}
			if (sound && !file) {
				const request = {
					id: sound.id,
					clan_id: currentClanId,
					shortname: name.trim(),
					source: sound.url,
					media_type: MediaType.AUDIO
				};

				await dispatch(
					soundEffectActions.updateSound({
						soundId: sound.id,
						request
					})
				);

				onSuccess({
					id: sound.id,
					name: name.trim(),
					url: sound.url
				});
				return;
			}

			if (!validFile) return;

			const tempId = sound?.id || Snowflake.generate();
			const path = `sounds/${tempId}.${validFile.name.split('.').pop()}`;

			const attachment = await handleUploadEmoticon(client, session, path, validFile);

			if (attachment && attachment.url) {
				const id = getIdSaleItemFromSource(attachment.url);
				const request = {
					id,
					category: 'Among Us',
					clan_id: currentClanId,
					shortname: name.trim(),
					source: attachment.url,
					media_type: MediaType.AUDIO
				};

				if (sound) {
					await dispatch(
						soundEffectActions.updateSound({
							soundId: id,
							request
						})
					);
				} else {
					await dispatch(soundEffectActions.createSound({ request, clanId: currentClanId }));
				}

				onSuccess({
					id,
					name: name.trim(),
					url: attachment.url
				});
			}
		} catch (error) {
			console.error('Error uploading sound:', error);
			setError(t('modal.errorUploadFailed'));
		} finally {
			setIsUploading(false);
		}
	};

	const formatFileSize = (bytes: number) => {
		return `${(bytes / 1024).toFixed(1)} KB`;
	};

	const removeFile = () => {
		setFile(null);
		setValidFile(null);
		setPreviewUrl(null);
		setError('');
		if (inputRef.current) inputRef.current.value = '';
	};

	return (
		<>
			<Modal showModal={true} onClose={onClose} title="" classNameBox="max-w-[550px] w-full !p-0 overflow-hidden">
				<div className="relative">
					<div className="absolute inset-0"></div>

					<div className="relative">
						<div className="relative px-4 pt-4 pb-3 border-b-theme-primary">
							<div className="text-center">
								<h2 className="text-lg font-bold text-theme-primary-active">
									{sound ? t('modal.titleEdit') : t('modal.titleUpload')}
								</h2>
								<p className=" text-xs">{t('modal.subtitle')}</p>
							</div>
						</div>

						<div className="p-4 flex flex-col max-h-[80vh] md:h-[400px]">
							<div className="flex-1 flex flex-col overflow-hidden overflow-y-auto gap-3">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold uppercase text-theme-primary-active">{t('modal.preview')}</span>
									</div>

									<div className="flex items-center justify-center rounded-lg border-theme-primary overflow-hidden min-h-[140px] md:h-36">
										<div className="relative h-full w-full flex items-center justify-center bg-item-theme py-3">
											{previewUrl ? (
												<div className="flex flex-col items-center w-full px-4">
													<div className="w-12 h-12 bg-[#5865f2] rounded-full flex items-center justify-center mb-2">
														<Icons.Speaker defaultFill="text-white " />
													</div>
													<audio controls src={previewUrl} className="w-full min-w-[250px] max-w-[380px] h-10" />
												</div>
											) : (
												<Icons.UploadSoundIcon className="w-12 h-12 " />
											)}
										</div>
									</div>
								</div>

								<div className="flex flex-col md:flex-row gap-3 ">
									<div className="w-full md:w-1/2 flex flex-col gap-1">
										<p className="text-xs font-bold uppercase text-theme-primary-active">{t('modal.audioFile')}</p>
										<div
											className={`
                                            relative group transition-all duration-200
                                            ${isDragOver ? 'scale-[1.02]' : 'scale-100'}
                                        `}
											onDragOver={handleDragOver}
											onDragLeave={handleDragLeave}
											onDrop={handleDrop}
										>
											<input
												ref={inputRef}
												type="file"
												accept="audio/mp3,audio/mpeg,audio/wav"
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
												onChange={handleFileChange}
												data-e2e={generateE2eId('clan_page.settings.upload.voice_sticker_input')}
											/>

											<div
												className={`
                                                relative border-2 border-dashed border-color-primary rounded-md p-2 transition-all duration-200 h-[60px]
                                                ${
													file
														? 'border-color-primary'
														: isDragOver
															? 'border-[#5865f2] bg-[#4752c440] '
															: 'border-color-primary   hover:border-[#5865f2] '
												}
                                            `}
											>
												{!file ? (
													<div className="flex items-center justify-between h-full px-2">
														<p className="text-xs truncate">{t('modal.chooseOrDrop')}</p>
														<button className="hover:bg-[#4752c4] bg-[#5865f2] rounded-[4px] py-1 px-2 text-nowrap text-white text-xs">
															{t('modal.browse')}
														</button>
													</div>
												) : (
													<div className="flex items-center gap-2 py-1 px-2 h-full">
														<div className="relative">
															<div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center">
																<Icons.Speaker defaultFill="text-white " />
															</div>
														</div>

														<div className="flex-1 min-w-0">
															<h4 className="text-sm font-semibold  truncate">{file.name}</h4>
															<div className="flex items-center gap-2 text-xs ">
																<span>{formatFileSize(file.size)}</span>
																<span>{file.type.split('/')[1].toUpperCase()}</span>
															</div>
														</div>

														<button
															onClick={(e) => {
																e.stopPropagation();
																removeFile();
															}}
															className="w-7 h-7  rounded-full flex items-center justify-center transition-all duration-200 to-colorDangerHover z-40"
														>
															<Icons.Close className="w-3.5 h-3.5 " />
														</button>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className="w-full md:w-1/2 flex flex-col gap-1">
										<p className="text-xs font-bold uppercase text-theme-primary-active	">
											{t('modal.soundName')}{' '}
											<span title={t('modal.characters')} className="text-red-500 cursor-pointer">
												*
											</span>
										</p>
										<div className="relative border-theme-primary bg-item-theme rounded-md h-[60px] flex items-center">
											<InputField
												type="text"
												placeholder={t('modal.placeholder')}
												value={name}
												maxLength={62}
												onChange={(e) => setName(e.target.value)}
												className="w-full h-full px-3 py-2 bg-transparent text-theme-messaga=e border-none rounded-md text-sm focus:outline-none focus:ring-0 focus:border-none pr-[50px]"
											/>
											<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
												<span
													className={`text-xs font-medium ${
														(name.length ?? 0) > 59 ? 'text-red-500' : (name.length ?? 0) > 40 ? 'text-[#faa61a]' : ''
													}`}
												>
													{name.length ?? 0}/62
												</span>
											</div>
										</div>
									</div>
								</div>

								{error && (
									<div className="flex items-center gap-3 p-2 bg-[#f04747] bg-opacity-10 rounded-md animate-in slide-in-from-top-2 duration-300">
										<div className="flex-shrink-0">
											<Icons.AppHelpIcon className="w-4 h-4 text-[#f04747]" />
										</div>
										<div>
											<p
												className="text-xs text-[#f04747]"
												data-e2e={generateE2eId('clan_page.settings.upload.voice_sticker_input.error')}
											>
												{error}
											</p>
										</div>
									</div>
								)}
							</div>

							<div className="flex justify-end gap-2 pt-3 mt-3 border-t-theme-primary">
								<button
									className="px-3 py-1.5 bg-transparent  rounded-md text-sm font-medium hover:underline transition-all duration-200"
									onClick={onClose}
								>
									{t('modal.cancel')}
								</button>

								<button
									className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
									onClick={handleUpload}
									disabled={(!file && !sound) || !name.trim() || isUploading || name.length < 3 || name.length > 64}
								>
									{isUploading ? (
										<span className="flex items-center gap-1.5">
											<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
											{t('modal.uploading')}
										</span>
									) : sound ? (
										t('modal.update')
									) : (
										t('modal.upload')
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<ModalErrorTypeUpload open={openModalType} onClose={() => setOpenModalType(false)} />
			<ModalOverData open={openModalSize} onClose={() => setOpenModalSize(false)} size={ELimitSize.MB} />
		</>
	);
};

export default ModalUploadSound;
