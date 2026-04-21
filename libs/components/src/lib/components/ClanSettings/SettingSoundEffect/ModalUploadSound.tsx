import { MediaType, selectCurrentClanId, soundEffectActions, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Icons, InputField, Modal } from '@mezon/ui';
import { generateE2eId, getIdSaleItemFromSource } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ELimitSize } from '../../ModalValidateFile';
import { ModalErrorTypeUploadVoice, ModalOverData } from '../../ModalValidateFile/ModalOverData';
import AudioVisualizer from './AudioVisualizer';
import type { SoundType } from './index';

const MAX_TRIM = 10;

type TrimSeconds = {
	startSec: number;
	endSec: number;
	durationSec: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const encodeWavMonoPCM16 = (samples: Float32Array, sampleRate: number): Blob => {
	const numChannels = 1;
	const bytesPerSample = 2;
	const blockAlign = numChannels * bytesPerSample;
	const byteRate = sampleRate * blockAlign;
	const dataSize = samples.length * blockAlign;

	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);

	const writeString = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};

	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, 'WAVE');

	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, 16, true);

	writeString(36, 'data');
	view.setUint32(40, dataSize, true);

	let offset = 44;
	for (let i = 0; i < samples.length; i++) {
		const s = clamp(samples[i], -1, 1);
		view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		offset += 2;
	}

	return new Blob([buffer], { type: 'audio/wav' });
};

const downsampleMono = (input: Float32Array, inputRate: number, outputRate: number): Float32Array => {
	if (outputRate >= inputRate) return input;

	const ratio = inputRate / outputRate;
	const newLength = Math.floor(input.length / ratio);
	const result = new Float32Array(newLength);

	for (let i = 0; i < newLength; i++) {
		const start = Math.floor(i * ratio);
		const end = Math.min(input.length, Math.floor((i + 1) * ratio));
		let sum = 0;
		let count = 0;
		for (let j = start; j < end; j++) {
			sum += input[j];
			count++;
		}
		result[i] = count > 0 ? sum / count : 0;
	}

	return result;
};

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
	if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') return sharedAudioCtx;
	const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!AudioContextCtor) throw new Error('AudioContext is not supported');
	sharedAudioCtx = new AudioContextCtor();
	return sharedAudioCtx;
};

const trimAudioToWavFallback = async (audioBlob: Blob, startSec: number, endSec: number): Promise<{ file: File; extension: 'wav' }> => {
	if (typeof window === 'undefined') throw new Error('Window is not available');

	const arrayBuffer = await audioBlob.arrayBuffer();
	const ctx = getAudioContext();

	const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
		ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
	});

	const duration = audioBuffer.duration || 0;
	const start = clamp(startSec, 0, duration);
	const end = clamp(endSec, start, duration);

	const sampleRate = audioBuffer.sampleRate || 44100;
	const startSample = Math.floor(start * sampleRate);
	const endSample = Math.max(startSample + 1, Math.floor(end * sampleRate));
	const length = Math.max(1, endSample - startSample);

	const numChannels = audioBuffer.numberOfChannels || 1;
	const mono = new Float32Array(length);
	for (let ch = 0; ch < numChannels; ch++) {
		const chData = audioBuffer.getChannelData(ch).subarray(startSample, endSample);
		for (let i = 0; i < length; i++) mono[i] += (chData[i] ?? 0) / numChannels;
	}

	const targetSampleRate = 22050;
	const downsampled = downsampleMono(mono, sampleRate, targetSampleRate);

	const wavBlob = encodeWavMonoPCM16(downsampled, targetSampleRate);
	const file = new File([wavBlob], `trimmed-${Date.now()}.wav`, { type: 'audio/wav' });
	return { file, extension: 'wav' };
};

function WaveformPlayer({
	blob,
	src,
	volume,
	onTrimChange
}: {
	blob: Blob | null;
	src: string;
	volume: number;
	onTrimChange?: (trim: TrimSeconds) => void;
}) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const visualizerRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);
	const [trimStart, setTrimStart] = useState(0);
	const [trimEnd, setTrimEnd] = useState(0);

	useEffect(() => {
		if (audioRef.current) audioRef.current.volume = volume;
	}, [volume]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const updateWidth = () => {
			const w = el.getBoundingClientRect().width;
			if (w > 0) setContainerWidth(Math.floor(w));
		};

		updateWidth();

		const observer = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width;
			if (width && width > 0) setContainerWidth(Math.floor(width));
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [blob, src]);

	useEffect(() => {
		setIsPlaying(false);
		setCurrentTime(0);
		setDuration(0);
		setTrimStart(0);
		setTrimEnd(0);
	}, [src]);

	useEffect(() => {
		if (duration > 0 && trimEnd === 0) {
			setTrimEnd(duration);
			onTrimChange?.({
				startSec: trimStart,
				endSec: duration,
				durationSec: duration - trimStart
			});
		}
	}, [duration, trimEnd, trimStart, onTrimChange]);

	const togglePlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch((error) => {
				console.error(error);
				// Autoplay may be blocked; silently ignore.
			});
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying]);

	const handleTimeUpdate = () => {
		if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
	};

	const handleLoadedMetadata = () => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
			setDuration(audioRef.current.duration);
		}
	};

	const handleEnded = () => setIsPlaying(false);

	const formatTime = (s: number) => {
		if (!isFinite(s)) return '0.00s';
		return `${s.toFixed(2)}s`;
	};

	const trimStartPx = duration > 0 ? (trimStart / duration) * containerWidth : 0;
	const trimEndPx = duration > 0 ? (trimEnd / duration) * containerWidth : containerWidth;

	const makeDragHandler = (handle: 'start' | 'end') => (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX;
		const startSec = handle === 'start' ? trimStart : trimEnd;

		const onMove = (ev: MouseEvent) => {
			const deltaX = ev.clientX - startX;
			const deltaSec = (deltaX / containerWidth) * duration;
			let newSec = startSec + deltaSec;
			if (handle === 'start') {
				newSec = Math.max(0, Math.min(newSec, trimEnd - 0.1));
				setTrimStart(newSec);
				onTrimChange?.({
					startSec: newSec,
					endSec: trimEnd,
					durationSec: trimEnd - newSec
				});
			} else {
				newSec = Math.max(trimStart + 0.1, Math.min(newSec, duration));
				setTrimEnd(newSec);
				onTrimChange?.({
					startSec: trimStart,
					endSec: newSec,
					durationSec: newSec - trimStart
				});
			}
		};
		const onUp = () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	};
	const barColor = 'var(--bg-theme-sound-bar)';
	const barUnselectColor = 'var(--bg-theme-sound-unselect)';

	return (
		<div className="w-full rounded-lg overflow-hidden bg-item-theme p-3">
			<audio
				ref={audioRef}
				src={src}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
				onEnded={handleEnded}
				preload="metadata"
			/>
			<div className="flex items-center gap-3">
				<div>
					<button
						onClick={togglePlay}
						className="flex-shrink-0 w-9 h-9 rounded-full bg-item-theme text-theme-primary-active flex items-center justify-center hover:bg-item-theme-hover transition-colors"
					>
						{isPlaying ? (
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<rect x="2" y="1" width="4" height="12" rx="1" fill="currentColor" />
								<rect x="8" y="1" width="4" height="12" rx="1" fill="currentColor" />
							</svg>
						) : (
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path d="M3 1.5L13 7L3 12.5V1.5Z" fill="currentColor" />
							</svg>
						)}
					</button>
					<div
						className={`mt-1 text-xs font-medium transition-colors duration-200 text-center w-full ${
							trimEnd > 0 && trimEnd - trimStart <= MAX_TRIM ? 'text-colorSuccess' : 'text-colorDanger'
						}`}
					>
						{formatTime(trimEnd > 0 ? trimEnd - trimStart : duration || 0)}
					</div>
				</div>

				{blob ? (
					<div ref={containerRef} className="relative flex-1 min-w-0" style={{ height: 80 }}>
						{containerWidth > 0 && (
							<>
								<AudioVisualizer
									ref={visualizerRef}
									blob={blob}
									width={containerWidth}
									height={80}
									barWidth={2}
									gap={1}
									barColor={barColor}
									barUnselectColor={barUnselectColor}
									trimStart={duration > 0 ? trimStart / duration : 0}
									trimEnd={duration > 0 ? trimEnd / duration : 1}
								/>

								{duration > 0 && (
									<div
										className="absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize select-none z-20"
										style={{ left: trimStartPx - 4, width: 8 }}
										onMouseDown={makeDragHandler('start')}
									>
										<div className="w-[4px] h-full bg-current text-theme-primary-active rounded-sm shadow-lg" />
									</div>
								)}

								{duration > 0 && (
									<div
										className="absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize select-none z-20"
										style={{ left: trimEndPx - 4, width: 8 }}
										onMouseDown={makeDragHandler('end')}
									>
										<div className="w-[4px] h-full bg-current text-theme-primary-active rounded-sm shadow-lg" />
									</div>
								)}

								{duration > 0 && (
									<div
										className="absolute top-0 bottom-0 w-[2px] bg-buttonPrimary pointer-events-none"
										style={{ left: `${(currentTime / duration) * 100}%` }}
									/>
								)}

								<input
									type="range"
									min={0}
									max={duration || 0}
									step={0.01}
									value={currentTime}
									onChange={(e) => {
										const t = Number(e.target.value);
										setCurrentTime(t);
										if (audioRef.current) audioRef.current.currentTime = t;
									}}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-buttonPrimary focus:outline-none focus-visible:outline-none"
								/>
							</>
						)}
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center text-xs text-gray-500">Loading waveform...</div>
				)}
			</div>
		</div>
	);
}

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
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [soundVolume, setSoundVolume] = useState<number>(0.8); // HTMLMediaElement.volume: 0..1
	const [trimStartSec, setTrimStartSec] = useState<number>(0);
	const [trimEndSec, setTrimEndSec] = useState<number>(0);
	const selectedTrimDurationSec = Math.max(0, trimEndSec - trimStartSec);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const isUploadingRef = useRef(false);
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
			setTrimStartSec(0);
			setTrimEndSec(0);

			fetch(sound.url)
				.then((res) => {
					if (!res.ok) throw new Error(`Failed to load audio: ${res.status}`);
					return res.blob();
				})
				.then((b) => setAudioBlob(b))
				.catch((err) => {
					console.error('Error loading audio blob:', err);
					setAudioBlob(null);
					setError(t('modal.errorLoadFailed'));
				});
		}
	}, [sound, t]);

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
		setAudioBlob(f);
		setTrimStartSec(0);
		setTrimEndSec(0);
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
		if (isUploadingRef.current) {
			return;
		}
		isUploadingRef.current = true;

		setIsUploading(true);

		try {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session) {
				throw new Error('Client or session is not initialized');
			}

			if (sound && !validFile) {
				await dispatch(
					soundEffectActions.updateSound({
						soundId: sound.id,
						request: {
							shortname: name.trim(),
							source: sound.url,
							category: 'Among Us',
							clan_id: currentClanId,
							media_type: MediaType.AUDIO
						}
					})
				);
				onSuccess({ id: sound.id, name: name.trim(), url: sound.url });
				return;
			}

			let audioSourceBlob = validFile ?? audioBlob;
			if (!audioSourceBlob && sound?.url) {
				const res = await fetch(sound.url);
				if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status} ${res.statusText}`);
				audioSourceBlob = await res.blob();
			}

			if (!audioSourceBlob) {
				throw new Error('Audio blob is not available');
			}

			const tempId = sound?.id || Snowflake.generate();
			const trimmed = await trimAudioToWavFallback(audioSourceBlob, trimStartSec, trimEndSec);
			const path = `sounds/${tempId}.${trimmed.extension}`;

			const attachment = await handleUploadEmoticon(client, session, path, trimmed.file);

			if (attachment && attachment.url) {
				const request = {
					shortname: name.trim(),
					source: attachment.url,
					category: 'Among Us',
					clan_id: currentClanId,
					media_type: MediaType.AUDIO
				};

				if (sound) {
					await dispatch(
						soundEffectActions.updateSound({
							soundId: sound.id,
							request
						})
					);
					onSuccess({ id: sound.id, name: name.trim(), url: attachment.url });
				} else {
					const id = getIdSaleItemFromSource(attachment.url);
					await dispatch(soundEffectActions.createSound({ request: { ...request, id }, clanId: currentClanId }));
					onSuccess({ id, name: name.trim(), url: attachment.url });
				}
			}
		} catch (error) {
			console.error('Error uploading sound:', error);
			setError(t('modal.errorUploadFailed'));
		} finally {
			isUploadingRef.current = false;
			setIsUploading(false);
		}
	};

	const handleTrimChange = useCallback((trim: { startSec: number; endSec: number }) => {
		setTrimStartSec(trim.startSec);
		setTrimEndSec(trim.endSec);
	}, []);

	const formatFileSize = (bytes: number) => {
		return `${(bytes / 1024).toFixed(1)} KB`;
	};

	const removeFile = () => {
		setFile(null);
		setValidFile(null);
		setPreviewUrl(null);
		setAudioBlob(null);
		setError('');
		setTrimStartSec(0);
		setTrimEndSec(0);
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
										{previewUrl && selectedTrimDurationSec > MAX_TRIM && (
											<span className="text-xs italic text-colorDanger whitespace-nowrap">Maximum duration is 10 seconds.</span>
										)}
									</div>

									<div className="flex items-center justify-center rounded-lg border-theme-primary overflow-hidden">
										<div className="relative h-full w-full flex items-center justify-center bg-item-theme py-3 px-3">
											{previewUrl ? (
												<WaveformPlayer
													src={previewUrl}
													blob={audioBlob}
													volume={soundVolume}
													onTrimChange={handleTrimChange}
												/>
											) : (
												<Icons.UploadSoundIcon className="w-12 h-12 " />
											)}
										</div>
									</div>

									{previewUrl && (
										<div className="flex flex-col gap-2 pt-1">
											<div className="text-xs font-bold uppercase text-theme-primary-active">{t('modal.soundVolume')}</div>
											<div className="flex items-center gap-3">
												<input
													type="range"
													min={0}
													max={100}
													step={1}
													value={Math.round(soundVolume * 100)}
													onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
													className="w-full h-1 accent-buttonPrimary"
												/>
												<div className="w-10 text-right text-xs text-theme-primary-hover">
													{Math.round(soundVolume * 100)}%
												</div>
											</div>
										</div>
									)}
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
															? 'border-buttonPrimary bg-buttonPrimary/25'
															: 'border-color-primary hover:border-buttonPrimary'
												}
                                            `}
											>
												{!file ? (
													<div className="flex items-center justify-between h-full px-2">
														<p className="text-xs truncate">{t('modal.chooseOrDrop')}</p>
														<button className="btn-primary btn-primary-hover rounded-[4px] py-1 px-2 text-nowrap text-xs">
															{t('modal.browse')}
														</button>
													</div>
												) : (
													<div className="flex items-center gap-2 py-1 px-2 h-full">
														<div className="relative">
															<div className="w-8 h-8 bg-buttonPrimary rounded-full flex items-center justify-center">
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
											<span title={t('modal.characters')} className="text-colorDanger cursor-pointer">
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
														(name.length ?? 0) > 59
															? 'text-colorDanger'
															: (name.length ?? 0) > 40
																? 'text-colorWarning'
																: ''
													}`}
												>
													{name.length ?? 0}/62
												</span>
											</div>
										</div>
									</div>
								</div>

								{error && (
									<div className="flex items-center gap-3 p-2 bg-colorDanger/10 rounded-md animate-in slide-in-from-top-2 duration-300">
										<div className="flex-shrink-0">
											<Icons.AppHelpIcon className="w-4 h-4 text-colorDanger" />
										</div>
										<div>
											<p
												className="text-xs text-colorDanger"
												data-e2e={generateE2eId('clan_page.settings.upload.voice_sticker_input.error')}
											>
												{error}
											</p>
										</div>
									</div>
								)}
							</div>

							<div className="flex items-end justify-end gap-2 pt-3 mt-3 border-t-theme-primary">
								<button
									className="px-3 py-1.5 bg-transparent rounded-md text-sm font-medium hover:underline transition-all duration-200"
									onClick={onClose}
								>
									{t('modal.cancel')}
								</button>

								<button
									className="btn-primary btn-primary-hover px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
									onClick={handleUpload}
									disabled={
										(!file && !sound) ||
										!name.trim() ||
										isUploading ||
										name.length < 3 ||
										name.length > 64 ||
										selectedTrimDurationSec <= 0 ||
										selectedTrimDurationSec > MAX_TRIM ||
										trimEndSec <= trimStartSec
									}
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

			<ModalErrorTypeUploadVoice open={openModalType} onClose={() => setOpenModalType(false)} />
			<ModalOverData open={openModalSize} onClose={() => setOpenModalSize(false)} size={ELimitSize.MB} />
		</>
	);
};

export default ModalUploadSound;
