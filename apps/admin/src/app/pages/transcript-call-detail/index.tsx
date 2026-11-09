import {
	fetchRoomParticipantsByRoomId,
	fetchRoomStatisticsByRoomId,
	fetchRoomSummaryByRoomId,
	selectTranscriptRoomDetailState,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons48 } from '@mezon/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import InfoRow from '../../components/dashboard/InfoRow';
import MetricCard from '../../components/dashboard/MetricCard';
import { STATUS_BADGE } from '../../constants/dashboard';
import { formatDurationSec, formatRoomDate, formatStatus, normalizeRoomStatus } from '../../utils/dashboard/format';

type TabType = 'overview' | 'participants' | 'fullTranscript' | 'summary';

const TABS: TabType[] = ['overview', 'participants', 'fullTranscript', 'summary'];

const TranscriptCallDetail = () => {
	const { t } = useTranslation('adminApplication');
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { callId } = useParams<{ callId: string }>();
	const roomId = callId ?? '';

	const { detail, hasFetched } = useAppSelector((s) => selectTranscriptRoomDetailState(s, roomId));

	const loadRoom = useCallback(() => {
		if (!roomId) return;
		dispatch(fetchRoomStatisticsByRoomId({ roomId }));
		dispatch(fetchRoomSummaryByRoomId({ roomId }));
		dispatch(fetchRoomParticipantsByRoomId({ roomId }));
	}, [dispatch, roomId]);

	useEffect(() => {
		loadRoom();
	}, [loadRoom]);

	const stats = detail.statistics;
	const status = normalizeRoomStatus(stats?.status);

	const summaryText = detail.summary?.summary_data?.summary?.trim();
	const actionItems = detail.summary?.summary_data?.action_items ?? [];

	const participantMap = useMemo(() => {
		const map: Record<string, string> = {};
		detail.participants.forEach((p) => {
			if (p.participant_identity) {
				map[p.participant_identity] = p.display_name || p.user_name || p.participant_identity;
			}
		});
		return map;
	}, [detail.participants]);

	const messageGroups = useMemo(() => {
		if (!detail.summary?.messages) return [];
		const groups: { participant_id: string; timestamp: string; contents: string[] }[] = [];
		detail.summary.messages.forEach((m) => {
			const lastGroup = groups[groups.length - 1];
			if (lastGroup && lastGroup.participant_id === m.participant_id) {
				lastGroup.contents.push(m.content || '');
			} else {
				groups.push({
					participant_id: m.participant_id || '',
					timestamp: m.timestamp || '',
					contents: [m.content || '']
				});
			}
		});
		return groups;
	}, [detail.summary?.messages]);

	const [activeTab, setActiveTab] = useState<TabType>('overview');

	if (!roomId) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<MezonIcon icon={MzIcons48.mzVideo} className="w-16 h-16 dark:text-textSecondary text-gray-300" />
				<div className="text-lg font-medium dark:text-textSecondary text-gray-400">{t('transcriptCalls.detail.notFound')}</div>
				<button
					type="button"
					onClick={() => navigate('/developers/transcript-calls')}
					className="px-4 py-2 bg-buttonPrimary hover:bg-bgSelectItemHover text-white rounded-lg transition text-sm"
				>
					{t('transcriptCalls.detail.back')}
				</button>
			</div>
		);
	}

	const loadingBlock = !hasFetched || (detail.statisticsLoading && stats?.room_id === undefined);
	const failedBlock = hasFetched && !detail.statisticsLoading && detail.statisticsError;
	const missingStatsBlock = hasFetched && !detail.statisticsLoading && !stats?.room_id && !detail.statisticsError;

	if (loadingBlock) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
				<div className="text-sm dark:text-textSecondary text-gray-500">{t('transcriptCalls.loading')}</div>
			</div>
		);
	}

	if (failedBlock) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 max-w-md mx-auto text-center">
				<MezonIcon icon={MzIcons48.mzVideo} className="w-16 h-16 dark:text-textSecondary text-gray-300" />
				<div className="text-sm dark:text-textSecondary text-gray-500">{t('transcriptCalls.detail.loadError')}</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => navigate('/developers/transcript-calls')}
						className="px-4 py-2 rounded-lg border dark:border-borderClan text-sm"
					>
						{t('transcriptCalls.detail.back')}
					</button>
					<button
						type="button"
						onClick={loadRoom}
						className="px-4 py-2 bg-buttonPrimary hover:bg-bgSelectItemHover text-white rounded-lg text-sm"
					>
						{t('transcriptCalls.detail.refresh')}
					</button>
				</div>
			</div>
		);
	}

	if (missingStatsBlock) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<MezonIcon icon={MzIcons48.mzVideo} className="w-16 h-16 dark:text-textSecondary text-gray-300" />
				<div className="text-lg font-medium dark:text-textSecondary text-gray-400">{t('transcriptCalls.detail.notFound')}</div>
				<button
					type="button"
					onClick={() => navigate('/developers/transcript-calls')}
					className="px-4 py-2 bg-buttonPrimary hover:bg-bgSelectItemHover text-white rounded-lg transition text-sm"
				>
					{t('transcriptCalls.detail.back')}
				</button>
			</div>
		);
	}

	if (!stats) {
		return null;
	}

	const displayId = stats.room_id ?? roomId;
	const roomName = stats?.channel_name ?? detail.summary?.room_name ?? '—';

	const tabLabels: Record<TabType, string> = {
		overview: t('transcriptCalls.tabs.overview'),
		participants: t('transcriptCalls.tabs.participants'),
		fullTranscript: t('transcriptCalls.tabs.fullTranscript'),
		summary: t('transcriptCalls.tabs.summary')
	};

	return (
		<div className="w-full mx-auto flex flex-col gap-6">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={() => navigate('/developers/transcript-calls')}
						className="group flex items-center gap-1 dark:text-textSecondary text-gray-500 hover:dark:text-textDarkTheme hover:text-gray-800 transition text-sm font-medium"
					>
						<MezonIcon icon={MzIcons16.mzArrowLeft} className="text-[var(--mz-icon)] group-hover:text-[var(--mz-icon-selected)]" />
						{t('transcriptCalls.detail.back')}
					</button>
					<span className="dark:text-textSecondary text-gray-300">/</span>
					<h2 className="text-2xl font-bold dark:text-textDarkTheme text-gray-900 truncate max-w-[300px]">{displayId}</h2>
					<span
						className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}
					>
						{formatStatus(status)}
					</span>
				</div>
				<button
					type="button"
					onClick={loadRoom}
					className="flex items-center gap-2 px-4 py-2 bg-buttonPrimary hover:bg-bgSelectItemHover text-white rounded-lg transition text-sm font-medium"
				>
					<MezonIcon icon={MzIcons16.mzSync} />
					{t('transcriptCalls.detail.refresh')}
				</button>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<MetricCard label={t('transcriptCalls.detail.metrics.totalTracks')} value={stats?.total_tracks ?? 0} />
				<MetricCard
					label={t('transcriptCalls.detail.metrics.completed')}
					value={stats?.completed_tracks ?? 0}
					valueClassName="text-green-600 dark:text-green-400"
				/>
				<MetricCard
					label={t('transcriptCalls.detail.metrics.duration')}
					value={formatDurationSec(stats?.total_duration_sec)}
					valueClassName="text-blue-600 dark:text-blue-400"
				/>
				<MetricCard
					label={t('transcriptCalls.detail.metrics.segments')}
					value={stats?.total_segments ?? 0}
					valueClassName="text-purple-600 dark:text-purple-400"
				/>
			</div>

			<div className="dark:bg-[#2b2d31] bg-white rounded-lg shadow border dark:border-[#4d4f52] border-gray-200 overflow-hidden">
				<div className="border-b border-gray-200 dark:border-[#4d4f52]">
					<nav className="flex -mb-px flex-wrap">
						{TABS.map((tab) => (
							<button
								type="button"
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={
									activeTab === tab
										? 'py-4 px-6 text-sm font-medium border-b-2 border-buttonPrimary text-buttonPrimary dark:text-[#C9CDFB] transition-colors'
										: 'py-4 px-6 text-sm font-medium dark:text-textSecondary text-gray-500 hover:dark:text-textDarkTheme hover:text-gray-700 dark:hover:border-borderClan border-b-2 border-transparent transition-colors'
								}
							>
								{tabLabels[tab]}
							</button>
						))}
					</nav>
				</div>

				<div className="p-6">
					{activeTab === 'overview' && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<InfoRow label={t('transcriptCalls.columns.roomName')} value={roomName} />
								<InfoRow
									label={t('transcriptCalls.columns.status')}
									value={
										<span
											className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}
										>
											{formatStatus(status)}
										</span>
									}
								/>
								<InfoRow label={t('transcriptCalls.columns.createdAt')} value={formatRoomDate(stats.created_at)} />
								<InfoRow label={t('transcriptCalls.columns.completedAt')} value={formatRoomDate(stats.finalized_at)} />
							</div>
							{detail.summary?.participants && detail.summary.participants.length > 0 ? (
								<InfoRow label={t('transcriptCalls.detail.participants')} value={detail.summary.participants.join(', ')} />
							) : null}
						</div>
					)}

					{activeTab === 'fullTranscript' && (
						<div className="space-y-4">
							{detail.summaryLoading ? (
								<div className="text-sm dark:text-textSecondary">{t('transcriptCalls.loading')}</div>
							) : detail.summaryError ? (
								<div className="text-sm text-red-600 dark:text-red-400">{t('transcriptCalls.detail.loadError')}</div>
							) : messageGroups.length > 0 ? (
								<div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
									{messageGroups.map((group, idx) => {
										const name = participantMap[group.participant_id] || group.participant_id || 'Unknown';

										return (
											<div key={idx} className="group flex flex-col gap-2">
												<div className="flex items-baseline gap-2 flex-wrap pb-1">
													<span className="text-md font-bold dark:text-textDarkTheme text-gray-900">{name}</span>
													{name !== group.participant_id && group.participant_id && (
														<span className="text-xs dark:text-textSecondary text-gray-500">
															({group.participant_id})
														</span>
													)}
													<span className="text-md dark:text-textSecondary text-gray-400 font-medium">
														• {formatRoomDate(group.timestamp)}
													</span>
												</div>
												<div className="px-5 py-3 rounded-xl bg-gray-50 dark:bg-bgSecondary/40 text-sm dark:text-textDarkTheme text-gray-800 border dark:border-borderClan/20 group-hover:dark:border-borderClan/40 transition-colors leading-relaxed shadow-sm space-y-2">
													{group.contents.map((content, cIdx) => (
														<p key={cIdx} className="whitespace-pre-wrap">
															{content}
														</p>
													))}
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-sm dark:text-textSecondary text-gray-500 italic">
									{t('transcriptCalls.detail.transcriptEmpty')}
								</div>
							)}
						</div>
					)}

					{activeTab === 'summary' && (
						<div className="space-y-8">
							{detail.summaryLoading ? (
								<div className="text-sm dark:text-textSecondary">{t('transcriptCalls.loading')}</div>
							) : detail.summaryError ? (
								<div className="text-sm text-red-600 dark:text-red-400">{t('transcriptCalls.detail.loadError')}</div>
							) : (
								<>
									<div className="space-y-3">
										<div className="flex items-center gap-2 px-1">
											<span className="text-sm font-bold dark:text-textDarkTheme text-gray-900">
												{t('transcriptCalls.tabs.summary')}
											</span>
										</div>
										{summaryText ? (
											<div className="px-5 py-4 rounded-xl bg-gray-50 dark:bg-bgSecondary/40 text-sm dark:text-textDarkTheme text-gray-800 border dark:border-borderClan/20 shadow-sm leading-relaxed whitespace-pre-wrap">
												{summaryText}
											</div>
										) : (
											<div className="px-5 py-4 rounded-xl bg-gray-50/50 dark:bg-bgSecondary/20 text-sm dark:text-textSecondary text-gray-500 italic border border-dashed dark:border-borderClan/20">
												{t('transcriptCalls.detail.summaryEmpty')}
											</div>
										)}
									</div>

									{actionItems.length > 0 && (
										<div className="space-y-4">
											<div className="flex items-center gap-2 px-1">
												<span className="text-sm font-bold dark:text-textDarkTheme text-gray-900">
													{t('transcriptCalls.detail.actionItems')}
												</span>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{actionItems.map((entry, idx) => {
													const name = participantMap[entry.participant_id || ''] || entry.participant_id || '—';
													return (
														<div
															key={`${entry.participant_id ?? idx}`}
															className="px-5 py-4 rounded-xl bg-gray-50 dark:bg-bgSecondary/40 border dark:border-borderClan/20 shadow-sm flex flex-col gap-3"
														>
															<div className="flex items-center gap-2 border-b dark:border-borderClan/20 pb-2">
																<span className="text-sm font-bold dark:text-textDarkTheme text-gray-900">
																	{name}
																</span>
																{name !== entry.participant_id && entry.participant_id && (
																	<span className="text-[10px] dark:text-textSecondary text-gray-500">
																		({entry.participant_id})
																	</span>
																)}
															</div>
															<ul className="space-y-2">
																{(entry.items ?? []).map((item, i) => (
																	<li key={i} className="flex gap-2 text-sm dark:text-textDarkTheme text-gray-800">
																		<span className="text-buttonPrimary mt-1">•</span>
																		<span>{item}</span>
																	</li>
																))}
															</ul>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}

					{activeTab === 'participants' && (
						<div className="space-y-4">
							{detail.participantsLoading ? (
								<div className="text-sm dark:text-textSecondary">{t('transcriptCalls.loading')}</div>
							) : detail.participantsError ? (
								<div className="text-sm text-red-600 dark:text-red-400">{t('transcriptCalls.detail.loadError')}</div>
							) : detail.participants.filter((p) => p.user_name).length === 0 ? (
								<div className="flex flex-col items-center justify-center gap-4 py-8">
									<MezonIcon icon={MzIcons48.mzUserCircle} className="dark:text-textSecondary text-gray-300" />
									<div className="text-sm dark:text-textSecondary text-gray-500">
										{t('transcriptCalls.detail.participantsEmpty')}
									</div>
								</div>
							) : (
								<>
									{/* Desktop and Tablet View */}
									<div className="hidden md:block overflow-x-auto rounded-lg border dark:border-[#4d4f52] border-gray-200">
										<table className="w-full text-left border-collapse">
											<thead>
												<tr className="bg-gray-50 dark:bg-bgTertiary text-xs font-semibold uppercase dark:text-textSecondary text-gray-500 border-b dark:border-borderClan/50 border-gray-200">
													<th className="px-6 py-3.5">{t('transcriptCalls.detail.username')}</th>
													<th className="px-6 py-3.5">{t('transcriptCalls.detail.displayName')}</th>
												</tr>
											</thead>
											<tbody className="divide-y dark:divide-[#4d4f52] divide-gray-200 bg-white dark:bg-bgSecondary">
												{detail.participants
													.filter((p) => p.user_name)
													.map((p) => (
														<tr
															key={p.participant_identity}
															className="hover:bg-gray-50/50 dark:hover:bg-bgTertiary/30 transition-colors"
														>
															<td className="px-6 py-4 text-sm dark:text-textSecondary text-gray-600">
																{p.user_name || t('transcriptCalls.detail.unknown')}
															</td>
															<td className="px-6 py-4 text-sm font-semibold dark:text-textDarkTheme text-gray-900">
																{p.display_name || t('transcriptCalls.detail.unknown')}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>

									{/* Mobile View */}
									<div className="block md:hidden space-y-3">
										{detail.participants
											.filter((p) => p.user_name)
											.map((p) => (
												<div
													key={p.participant_identity}
													className="p-3 rounded-xl bg-white dark:bg-bgSecondary border dark:border-[#4d4f52] border-gray-100 shadow-sm flex flex-col gap-1.5 hover:bg-gray-50/50 dark:hover:bg-bgTertiary/30 transition-colors"
												>
													<div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-100 dark:border-[#4d4f52]/40 text-xs">
														<span className="dark:text-textSecondary text-gray-400">
															{t('transcriptCalls.detail.username')}
														</span>
														<span className="text-xs dark:text-textSecondary text-gray-600 truncate font-semibold">
															{p.user_name || t('transcriptCalls.detail.unknown')}
														</span>
													</div>
													<div className="flex items-center justify-between gap-2 text-xs pt-0.5">
														<span className="dark:text-textSecondary text-gray-400">
															{t('transcriptCalls.detail.displayName')}
														</span>
														<span className="text-sm font-semibold dark:text-textDarkTheme text-gray-900 truncate">
															{p.display_name || t('transcriptCalls.detail.unknown')}
														</span>
													</div>
												</div>
											))}
									</div>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TranscriptCallDetail;
