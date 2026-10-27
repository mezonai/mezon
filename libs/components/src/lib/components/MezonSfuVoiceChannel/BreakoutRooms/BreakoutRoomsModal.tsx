import type { BreakoutMenuPlacement, BreakoutParticipantItem, DraftBreakoutRoom, RootState } from '@mezon/store';
import {
	API_FAILED_PRECONDITION,
	BREAKOUT_MENU_PADDING,
	BreakoutRule,
	MAX_BREAKOUT_ROOMS,
	breakoutInviteesFromAssignments,
	breakoutMenuHeight,
	buildManualAssignments,
	canCreateRoomCount,
	canOpenBreakout,
	canOpenSelectedRooms,
	deleteLastRoom,
	effectiveBreakoutRule,
	isEligibleIdleVoiceChannel,
	pickNextUnusedIdleChannel,
	placeBreakoutMenu,
	placeUnassignedParticipants,
	rebindRoomsToIdlePrefix,
	redistributeAutomatic,
	selectBreakoutPending,
	selectChannelsByClanId,
	selectChannelsEntitiesByClanId,
	selectEntitesUserClans,
	selectHostedBreakoutByChannelId,
	selectListVoiceMemberByClan,
	selectVoiceJoined,
	sortAndLabelIdleChannels,
	toastActions,
	toggleParticipantRoom,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export interface BreakoutRoomsModalProps {
	clanId: string;
	parentChannelId: string;
	currentUserId: string;
	callParticipants: ReadonlyArray<BreakoutParticipantItem>;
	onClose: () => void;
}

export const BreakoutRoomsModal: React.FC<BreakoutRoomsModalProps> = ({ clanId, parentChannelId, currentUserId, callParticipants, onClose }) => {
	const { t } = useTranslation(['channelVoice', 'common']);
	const dispatch = useAppDispatch();

	const isVoiceJoined = useSelector(selectVoiceJoined);
	const hostedBreakout = useSelector((state: RootState) => selectHostedBreakoutByChannelId(state, parentChannelId));
	const breakoutPending = useSelector(selectBreakoutPending);
	const clanChannels = useSelector((state: RootState) => selectChannelsByClanId(state, clanId));
	const channelEntities = useSelector((state: RootState) => selectChannelsEntitiesByClanId(state, clanId));
	const listVoiceMemberByClan = useSelector(selectListVoiceMemberByClan);
	const clanMembersEntities = useSelector(selectEntitesUserClans);

	const clanVoiceRooms = listVoiceMemberByClan[clanId];

	useEffect(() => {
		if (!isVoiceJoined) {
			onClose();
		}
	}, [isVoiceJoined, onClose]);

	const idleChannels = useMemo(() => {
		const eligible: Array<{ channelId: string; label?: string | null }> = [];
		for (const ch of clanChannels ?? []) {
			const channelId = ch.channel_id || ch.id || '';
			const isVoice = ch.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
			const isPrivate = Boolean(ch.channel_private);
			const occupantCount = clanVoiceRooms?.[channelId]?.ids?.length ?? 0;
			if (isEligibleIdleVoiceChannel(parentChannelId, channelId, isVoice, isPrivate, occupantCount)) {
				eligible.push({
					channelId,
					label: ch.channel_label
				});
			}
		}
		return sortAndLabelIdleChannels(eligible, (idx) => t('channelVoice:breakout.room', { number: idx + 1 }));
	}, [clanChannels, clanVoiceRooms, parentChannelId, t]);

	const participants = useMemo(() => {
		const seen = new Set<string>();
		const out: BreakoutParticipantItem[] = [];
		for (const p of callParticipants) {
			if (!p.userId || p.userId === currentUserId || seen.has(p.userId)) {
				continue;
			}
			seen.add(p.userId);
			out.push(p);
		}
		return out;
	}, [callParticipants, currentUserId]);

	const participantById = useMemo(() => {
		const map = new Map<string, BreakoutParticipantItem>();
		for (const p of participants) {
			map.set(p.userId, p);
		}
		return map;
	}, [participants]);

	const validParticipantSet = useMemo(() => new Set(participants.map((p) => p.userId)), [participants]);

	const [recreateCount, setRecreateCount] = useState<number>(1);
	const [rule, setRule] = useState<BreakoutRule>(BreakoutRule.Manual);
	const [draftRule, setDraftRule] = useState<BreakoutRule>(BreakoutRule.Manual);
	const [recreating, setRecreating] = useState<boolean>(true);
	const [initialCreate, setInitialCreate] = useState<boolean>(true);
	const [manualDirty, setManualDirty] = useState<boolean>(false);
	const [rooms, setRooms] = useState<DraftBreakoutRoom[]>(() =>
		idleChannels.slice(0, 1).map((ch) => ({
			channelId: ch.channelId,
			label: ch.label,
			userIds: [],
			collapsed: false
		}))
	);
	const [assignMenuRoomIdx, setAssignMenuRoomIdx] = useState<number | null>(null);
	const [confirmDeleteRoomIdx, setConfirmDeleteRoomIdx] = useState<number | null>(null);
	const [memberActionMenu, setMemberActionMenu] = useState<{
		roomIdx: number;
		userId: string;
		kind: 'move' | 'exchange';
	} | null>(null);

	const [menuPlacement, setMenuPlacement] = useState<BreakoutMenuPlacement>({ up: false, maxHeight: breakoutMenuHeight(1) });
	const listRef = useRef<HTMLDivElement>(null);

	const prevParticipantIdsRef = useRef<string>('');
	const prevIdleKeyRef = useRef<string>('');

	const clearPopovers = () => {
		setAssignMenuRoomIdx(null);
		setMemberActionMenu(null);
		setConfirmDeleteRoomIdx(null);
	};

	const placeMenuFor = (anchor: HTMLElement, rowCount: number) => {
		const wanted = breakoutMenuHeight(rowCount);
		const bounds = listRef.current?.getBoundingClientRect();
		setMenuPlacement(bounds ? placeBreakoutMenu(anchor.getBoundingClientRect(), bounds, wanted) : { up: false, maxHeight: wanted });
	};

	const dismissMenus = () => {
		setAssignMenuRoomIdx(null);
		setMemberActionMenu(null);
	};

	useEffect(() => {
		const idleKey = idleChannels.map((c) => `${c.channelId}:${c.label}`).join('|');
		if (idleKey === prevIdleKeyRef.current) {
			return;
		}
		prevIdleKeyRef.current = idleKey;
		setRooms((prev) => {
			if (prev.length === 0) {
				return idleChannels.slice(0, 1).map((ch) => ({
					channelId: ch.channelId,
					label: ch.label,
					userIds: [],
					collapsed: false
				}));
			}
			return rebindRoomsToIdlePrefix(prev, idleChannels);
		});
	}, [idleChannels]);

	useEffect(() => {
		const participantIdsKey = participants.map((p) => `${p.userId}:${p.displayName}`).join(',');
		if (participantIdsKey === prevParticipantIdsRef.current) {
			return;
		}
		prevParticipantIdsRef.current = participantIdsKey;
		if (memberActionMenu && !validParticipantSet.has(memberActionMenu.userId)) {
			setMemberActionMenu(null);
		}
		if (rule === BreakoutRule.Automatic && !manualDirty) {
			setRooms((prev) => (prev.length > 0 ? placeUnassignedParticipants(prev, participants) : prev));
		}
	}, [manualDirty, memberActionMenu, participants, rule, validParticipantSet]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') {
				return;
			}
			e.stopPropagation();
			if (assignMenuRoomIdx !== null || confirmDeleteRoomIdx !== null || memberActionMenu !== null) {
				clearPopovers();
			} else if (recreating && !initialCreate) {
				setDraftRule(rule);
				setRecreating(false);
			} else {
				onClose();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [assignMenuRoomIdx, confirmDeleteRoomIdx, initialCreate, memberActionMenu, onClose, recreating, rule]);

	const handleBeginRecreate = () => {
		clearPopovers();
		setRecreateCount(Math.max(1, rooms.length));
		setDraftRule(rule);
		setRecreating(true);
	};

	const handleCancelRecreate = () => {
		setDraftRule(rule);
		setRecreating(false);
	};

	const handleApplyRecreate = () => {
		if (!canCreateRoomCount(recreateCount, idleChannels.length)) {
			return;
		}
		const nextRule = draftRule;
		const nextRooms: DraftBreakoutRoom[] = idleChannels.slice(0, recreateCount).map((ch) => ({
			channelId: ch.channelId,
			label: ch.label,
			userIds: [],
			collapsed: false
		}));
		const populated = nextRule === BreakoutRule.Automatic && recreateCount > 0 ? redistributeAutomatic(nextRooms, participants) : nextRooms;
		setRule(nextRule);
		setRooms(populated);
		setManualDirty(false);
		setRecreating(false);
		setInitialCreate(false);
		clearPopovers();
	};

	const handleAddRoom = () => {
		const nextIdle = pickNextUnusedIdleChannel(rooms, idleChannels);
		if (!nextIdle) {
			return;
		}
		const appended: DraftBreakoutRoom[] = [
			...rooms,
			{
				channelId: nextIdle.channelId,
				label: nextIdle.label,
				userIds: [],
				collapsed: false
			}
		];
		const updated = rule === BreakoutRule.Automatic && !manualDirty ? redistributeAutomatic(appended, participants) : appended;
		setRooms(updated);
		clearPopovers();
	};

	const handleConfirmDeleteRoom = (idx: number) => {
		const { rooms: nextRooms, deleted } = deleteLastRoom(rooms, idx, rule, manualDirty, participants);
		clearPopovers();
		if (deleted) {
			setRooms(nextRooms);
		}
	};

	const handleToggleParticipantInRoom = (roomIdx: number, userId: string) => {
		setManualDirty(true);
		setRooms((prev) => toggleParticipantRoom(prev, roomIdx, userId));
	};

	const handleMoveParticipant = (fromRoomIdx: number, toRoomIdx: number, userId: string) => {
		if (fromRoomIdx === toRoomIdx) {
			return;
		}
		setManualDirty(true);
		setRooms((prev) => toggleParticipantRoom(prev, toRoomIdx, userId));
		setMemberActionMenu(null);
	};

	const handleExchangeParticipant = (roomAIdx: number, userA: string, roomBIdx: number, userB: string) => {
		if (roomAIdx === roomBIdx) {
			return;
		}
		setManualDirty(true);
		setRooms((prev) =>
			prev.map((room, idx) => {
				if (idx === roomAIdx) {
					return {
						...room,
						userIds: room.userIds.map((uid) => (uid === userA ? userB : uid))
					};
				}
				if (idx === roomBIdx) {
					return {
						...room,
						userIds: room.userIds.map((uid) => (uid === userB ? userA : uid))
					};
				}
				return room;
			})
		);
		setMemberActionMenu(null);
	};

	const resolvedRule = effectiveBreakoutRule(rule, manualDirty);
	const roomsStillIdle = canOpenSelectedRooms(rooms, idleChannels);
	const canOpen = !breakoutPending && canOpenBreakout(resolvedRule, rooms, idleChannels, participants.length, validParticipantSet);
	const nextUnusedChannel = pickNextUnusedIdleChannel(rooms, idleChannels);
	const createAllowed = canCreateRoomCount(recreateCount, idleChannels.length);

	const visibleMembersByRoom = useMemo(
		() => rooms.map((room) => room.userIds.filter((uid) => validParticipantSet.has(uid))),
		[rooms, validParticipantSet]
	);
	const totalAssignedCount = useMemo(() => visibleMembersByRoom.reduce((sum, list) => sum + list.length, 0), [visibleMembersByRoom]);

	const handleOpenAllRooms = async () => {
		if (!canOpen) {
			return;
		}
		const listParticipants = buildManualAssignments(resolvedRule, rooms, participants);
		const inviteeIds = breakoutInviteesFromAssignments(
			listParticipants.map((item) => item.user_ids),
			participants,
			currentUserId
		);
		const action = await dispatch(
			voiceActions.openBreakoutRooms({
				clanId,
				parentChannelId,
				roomCount: rooms.length,
				rule: resolvedRule,
				listParticipants,
				inviteeIds
			})
		);
		const result = voiceActions.openBreakoutRooms.fulfilled.match(action) ? action.payload : undefined;
		if (result?.outcome === 'opened') {
			dispatch(toastActions.addToast({ message: t('channelVoice:breakout.opened'), type: 'success', autoClose: 3000 }));
			onClose();
		} else {
			const errCode = result?.outcome === 'failed' ? result.code : undefined;
			const message = errCode === API_FAILED_PRECONDITION ? t('channelVoice:breakout.notEnoughRooms') : t('channelVoice:breakout.failed');
			dispatch(toastActions.addToast({ message, type: 'error', autoClose: 4000 }));
		}
	};

	const handleCloseBreakoutRooms = () => {
		if (!hostedBreakout || breakoutPending) {
			return;
		}
		void dispatch(
			voiceActions.closeBreakoutRooms({
				parentChannelId,
				breakoutId: hostedBreakout.breakoutId
			})
		).then((action) => {
			if (voiceActions.closeBreakoutRooms.fulfilled.match(action) && action.payload.outcome === 'closed') {
				dispatch(toastActions.addToast({ message: t('channelVoice:breakout.closed'), type: 'info', autoClose: 3000 }));
			} else {
				dispatch(toastActions.addToast({ message: t('channelVoice:breakout.failed'), type: 'error', autoClose: 4000 }));
			}
		});
		onClose();
	};

	const resolveUserDisplay = useCallback(
		(uid: string): { displayName: string; avatarUrl?: string } => {
			const fromCall = participantById.get(uid);
			if (fromCall) {
				return { displayName: fromCall.displayName, avatarUrl: fromCall.avatarUrl };
			}
			const member = clanMembersEntities?.[uid];
			const displayName = member?.clan_nick || member?.user?.display_name || member?.user?.username || uid;
			const avatarUrl = member?.clan_avatar || member?.user?.avatar_url;
			return { displayName, avatarUrl };
		},
		[clanMembersEntities, participantById]
	);

	const isHostedActive = Boolean(hostedBreakout && hostedBreakout.roomIds.length > 0);
	const structureLoaded = Boolean(clanChannels && clanChannels.length > 0);

	const hostedRoomStatuses = useMemo(() => {
		if (!hostedBreakout) {
			return [];
		}
		const invitedSet = new Set(hostedBreakout.invitees);
		const statuses: Array<{ roomId: string; label: string; members: Array<{ userId: string; displayName: string }> }> = [];
		hostedBreakout.roomIds.forEach((roomId, idx) => {
			const roomEntity = channelEntities?.[roomId];
			if (!roomEntity && structureLoaded) {
				return;
			}
			const label = roomEntity?.channel_label?.trim() || t('channelVoice:breakout.room', { number: idx + 1 });
			const rawMemberIds = (clanVoiceRooms?.[roomId]?.ids ?? []).map(String);
			const seen = new Set<string>();
			const members: Array<{ userId: string; displayName: string }> = [];
			for (const uid of rawMemberIds) {
				if (!uid || uid === '0' || seen.has(uid)) {
					continue;
				}
				if (invitedSet.size > 0 && !invitedSet.has(uid)) {
					continue;
				}
				seen.add(uid);
				members.push({
					userId: uid,
					displayName: resolveUserDisplay(uid).displayName
				});
			}
			statuses.push({ roomId, label, members });
		});
		return statuses;
	}, [channelEntities, clanVoiceRooms, hostedBreakout, resolveUserDisplay, structureLoaded, t]);

	const headerTemplate = t('channelVoice:breakout.createHeader');
	const [createPrefix, createSuffix] = useMemo(() => {
		const parts = headerTemplate.split('{{count}}');
		if (parts.length === 2) {
			return [parts[0].trim(), parts[1].trim()];
		}
		return [t('channelVoice:breakout.roomCount'), ''];
	}, [headerTemplate, t]);

	const footerWarning = useMemo(() => {
		if (recreating) {
			return null;
		}
		if (!roomsStillIdle) {
			return t('channelVoice:breakout.notEnoughRooms');
		}
		if (participants.length === 0) {
			return t('channelVoice:breakout.noParticipants');
		}
		return null;
	}, [participants.length, recreating, roomsStillIdle, t]);

	if (isHostedActive && hostedBreakout) {
		const openRoomCount = hostedRoomStatuses.length > 0 ? hostedRoomStatuses.length : hostedBreakout.roomIds.length;
		return (
			<div
				className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onClose();
					}
				}}
			>
				<div
					className="flex w-full max-w-[440px] flex-col gap-3 rounded-xl border border-white/10 bg-[#1e1f22] p-6 text-white shadow-2xl"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center gap-2">
						<span className="text-white">
							<Icons.VoiceBreakoutIcon className="h-5 w-5" />
						</span>
						<h3 className="text-xl font-semibold text-white">{t('channelVoice:breakout.title')}</h3>
					</div>

					<div className="flex flex-col gap-4 pt-2">
						<p className="text-sm text-[#b5bac1]">{t('channelVoice:breakout.openRooms', { count: openRoomCount })}</p>

						{hostedRoomStatuses.length > 0 && (
							<div className="max-h-[220px] overflow-y-auto rounded-md border border-white/10">
								{hostedRoomStatuses.map((roomStatus) => (
									<div key={roomStatus.roomId} className="flex flex-col">
										<div className="flex h-[30px] items-center justify-between bg-[#2b2d31] px-3">
											<div className="flex min-w-0 items-center gap-2">
												<span className="text-[#b5bac1]">
													<Icons.VoiceBreakoutIcon className="h-3.5 w-3.5" />
												</span>
												<span className="truncate text-sm font-medium text-white">{roomStatus.label}</span>
											</div>
											<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#b5bac1]">
												{roomStatus.members.length}
											</span>
										</div>
										{roomStatus.members.map((member) => (
											<div key={member.userId} className="flex h-[30px] items-center gap-2 px-3">
												<span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
												<span className="truncate text-xs text-white">{member.displayName}</span>
											</div>
										))}
									</div>
								))}
							</div>
						)}

						<div className="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#dbdee1] transition-colors hover:bg-white/10"
							>
								{t('common:cancel', { defaultValue: 'Cancel' })}
							</button>
							<button
								type="button"
								disabled={breakoutPending}
								onClick={handleCloseBreakoutRooms}
								className="rounded-lg bg-[#da373c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#a1282c] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{t('channelVoice:breakout.close')}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const deletingRoom = confirmDeleteRoomIdx !== null ? rooms[confirmDeleteRoomIdx] : null;

	return (
		<div
			className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="relative flex h-[460px] w-full max-w-[520px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1f22] text-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex h-[44px] shrink-0 items-center justify-between border-b border-white/10 px-4">
					<div className="flex items-center gap-2">
						<span className="text-[#5865f2]">
							<Icons.VoiceBreakoutIcon className="h-[18px] w-[18px]" />
						</span>
						<h3 className="text-sm font-semibold text-white">{t('channelVoice:breakout.notStarted')}</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex h-7 w-7 items-center justify-center rounded-md text-[#b5bac1] transition-colors hover:bg-white/10 hover:text-white"
					>
						<Icons.Close defaultSize="w-3.5 h-3.5" />
					</button>
				</div>

				{/* Body + Overlays */}
				<div className="relative flex min-h-0 flex-1 flex-col justify-between">
					{/* Room Rows List */}
					<div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
						{rooms.map((room, roomIdx) => {
							const roomMembers = visibleMembersByRoom[roomIdx] ?? [];
							const count = roomMembers.length;
							const canDelete = rooms.length > 1 && roomIdx + 1 === rooms.length;
							const canAssign = rule !== BreakoutRule.SelfSelect;
							const isAssignOpen = assignMenuRoomIdx === roomIdx;

							const assignedInOtherRooms = new Set<string>();
							rooms.forEach((other, idx) => {
								if (idx !== roomIdx) {
									other.userIds.forEach((uid) => {
										if (validParticipantSet.has(uid)) {
											assignedInOtherRooms.add(uid);
										}
									});
								}
							});
							const assignableParticipants = participants.filter((p) => !assignedInOtherRooms.has(p.userId));

							return (
								<div key={`${room.channelId}-${roomIdx}`} className="flex flex-col">
									{/* Room Header Row */}
									<div className="group/room relative flex h-[36px] items-center justify-between border-b border-white/10 bg-[#2b2d31] px-3.5">
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={() =>
													setRooms((prev) =>
														prev.map((r, idx) => (idx === roomIdx ? { ...r, collapsed: !r.collapsed } : r))
													)
												}
												className="flex items-center gap-1.5 text-left"
											>
												<span
													className={`text-xs text-[#b5bac1] transition-transform ${
														!room.collapsed && count > 0 ? 'rotate-0' : '-rotate-90'
													}`}
												>
													▾
												</span>
												<span className="text-sm font-semibold text-white">{room.label}</span>
											</button>

											{canDelete && (
												<button
													type="button"
													onClick={() => {
														clearPopovers();
														setConfirmDeleteRoomIdx(roomIdx);
													}}
													className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#b5bac1] hover:bg-white/10 group-hover/room:flex"
												>
													<span className="text-[#f23f43]">×</span>
													<span>{t('channelVoice:breakout.delete')}</span>
												</button>
											)}
										</div>

										{canAssign && (
											<div className="relative">
												<button
													type="button"
													onClick={(e) => {
														if (isAssignOpen) {
															dismissMenus();
														} else {
															clearPopovers();
															placeMenuFor(e.currentTarget, assignableParticipants.length);
															setAssignMenuRoomIdx(roomIdx);
														}
													}}
													className="rounded px-2 py-0.5 text-sm font-semibold text-[#5865f2] transition-colors hover:bg-white/10"
												>
													{count === 0 ? t('channelVoice:breakout.assign') : String(count)}
												</button>

												{isAssignOpen && (
													<>
														<div className="fixed inset-0 z-20" onClick={dismissMenus} />
														<div
															className={`absolute right-0 z-30 w-[220px] rounded-lg border border-white/10 bg-[#1e1f22] p-2 shadow-xl ${menuPlacement.up ? 'bottom-full mb-1' : 'top-full mt-1'}`}
															onClick={(e) => e.stopPropagation()}
														>
															{assignableParticipants.length === 0 ? (
																<div className="px-2 py-2 text-xs text-[#b5bac1]">
																	{participants.length === 0
																		? t('channelVoice:breakout.noParticipants')
																		: t('channelVoice:breakout.allAssigned')}
																</div>
															) : (
																<div
																	className="flex flex-col overflow-y-auto"
																	style={{ maxHeight: menuPlacement.maxHeight - BREAKOUT_MENU_PADDING }}
																>
																	{assignableParticipants.map((p) => {
																		const checked = room.userIds.includes(p.userId);
																		return (
																			<label
																				key={p.userId}
																				className="flex h-[28px] shrink-0 cursor-pointer items-center gap-2 rounded px-2 text-sm text-white hover:bg-white/10"
																			>
																				<input
																					type="checkbox"
																					checked={checked}
																					onChange={() => handleToggleParticipantInRoom(roomIdx, p.userId)}
																					className="h-4 w-4 rounded border-white/20 accent-[#5865f2]"
																				/>
																				<span className="truncate">{p.displayName}</span>
																			</label>
																		);
																	})}
																</div>
															)}
														</div>
													</>
												)}
											</div>
										)}
									</div>

									{/* Assigned Member Rows */}
									{!room.collapsed &&
										roomMembers.map((uid) => {
											const info = resolveUserDisplay(uid);
											const isMoveOpen =
												memberActionMenu?.roomIdx === roomIdx &&
												memberActionMenu?.userId === uid &&
												memberActionMenu?.kind === 'move';
											const isExchangeOpen =
												memberActionMenu?.roomIdx === roomIdx &&
												memberActionMenu?.userId === uid &&
												memberActionMenu?.kind === 'exchange';
											const canMove = rooms.length > 1;
											const canExchange = totalAssignedCount > roomMembers.length;
											const otherRooms = rooms.map((r, idx) => ({ room: r, idx })).filter((item) => item.idx !== roomIdx);
											const exchangeableMembers = otherRooms.flatMap((item) =>
												(visibleMembersByRoom[item.idx] ?? []).map((otherUid) => ({
													roomIdx: item.idx,
													roomLabel: item.room.label,
													userId: otherUid,
													displayName: resolveUserDisplay(otherUid).displayName
												}))
											);

											return (
												<div
													key={uid}
													className={`group/member relative flex h-[36px] items-center justify-between border-b border-white/5 pl-[30px] pr-3.5 ${
														isMoveOpen || isExchangeOpen ? 'bg-white/10' : 'hover:bg-white/10'
													}`}
												>
													<span className="flex-1 truncate text-sm text-white">{info.displayName}</span>

													<div
														className={`items-center gap-2 ${
															isMoveOpen || isExchangeOpen ? 'flex' : 'hidden group-hover/member:flex'
														}`}
													>
														{canMove && (
															<div className="relative">
																<button
																	type="button"
																	onClick={(e) => {
																		if (isMoveOpen) {
																			dismissMenus();
																		} else {
																			clearPopovers();
																			placeMenuFor(e.currentTarget, otherRooms.length);
																			setMemberActionMenu({ roomIdx, userId: uid, kind: 'move' });
																		}
																	}}
																	className="flex items-center gap-1 rounded bg-[#2b2d31] px-2 py-0.5 text-xs text-white hover:bg-white/20"
																>
																	<span>→</span>
																	<span>{t('channelVoice:breakout.moveTo')}</span>
																</button>

																{isMoveOpen && (
																	<>
																		<div className="fixed inset-0 z-20" onClick={dismissMenus} />
																		<div
																			className={`absolute right-0 z-30 w-[160px] overflow-y-auto rounded-lg border border-white/10 bg-[#1e1f22] p-2 shadow-xl ${menuPlacement.up ? 'bottom-full mb-1' : 'top-full mt-1'}`}
																			style={{ maxHeight: menuPlacement.maxHeight }}
																			onClick={(e) => e.stopPropagation()}
																		>
																			{otherRooms.map((item) => (
																				<button
																					key={`${item.room.channelId}-${item.idx}`}
																					type="button"
																					onClick={() => handleMoveParticipant(roomIdx, item.idx, uid)}
																					className="flex h-[28px] w-full items-center truncate rounded px-2 text-left text-sm text-white hover:bg-white/10"
																				>
																					<span className="truncate">{item.room.label}</span>
																				</button>
																			))}
																		</div>
																	</>
																)}
															</div>
														)}

														{canExchange && (
															<div className="relative">
																<button
																	type="button"
																	onClick={(e) => {
																		if (isExchangeOpen) {
																			dismissMenus();
																		} else {
																			clearPopovers();
																			placeMenuFor(e.currentTarget, exchangeableMembers.length);
																			setMemberActionMenu({ roomIdx, userId: uid, kind: 'exchange' });
																		}
																	}}
																	className="flex items-center gap-1 rounded bg-[#2b2d31] px-2 py-0.5 text-xs text-white hover:bg-white/20"
																>
																	<span>⇄</span>
																	<span>{t('channelVoice:breakout.exchange')}</span>
																</button>

																{isExchangeOpen && (
																	<>
																		<div className="fixed inset-0 z-20" onClick={dismissMenus} />
																		<div
																			className={`absolute right-0 z-30 w-[200px] overflow-y-auto rounded-lg border border-white/10 bg-[#1e1f22] p-2 shadow-xl ${menuPlacement.up ? 'bottom-full mb-1' : 'top-full mt-1'}`}
																			style={{ maxHeight: menuPlacement.maxHeight }}
																			onClick={(e) => e.stopPropagation()}
																		>
																			{exchangeableMembers.map((ex) => (
																				<button
																					key={`${ex.roomIdx}-${ex.userId}`}
																					type="button"
																					onClick={() =>
																						handleExchangeParticipant(roomIdx, uid, ex.roomIdx, ex.userId)
																					}
																					className="flex h-[28px] w-full items-center justify-between gap-2 rounded px-2 text-left text-sm text-white hover:bg-white/10"
																				>
																					<span className="flex-1 truncate">{ex.displayName}</span>
																					<span className="shrink-0 text-xs text-[#b5bac1]">
																						{ex.roomLabel}
																					</span>
																				</button>
																			))}
																		</div>
																	</>
																)}
															</div>
														)}
													</div>
												</div>
											);
										})}
								</div>
							);
						})}
					</div>

					{/* Footer Warning */}
					{footerWarning && <div className="w-full px-4 py-1.5 text-xs text-[#f23f43]">{footerWarning}</div>}

					{/* Footer Actions */}
					<div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
						<button
							type="button"
							onClick={handleBeginRecreate}
							className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#dbdee1] transition-colors hover:bg-white/10"
						>
							{t('channelVoice:breakout.recreate')}
						</button>
						<button
							type="button"
							disabled={!nextUnusedChannel}
							onClick={handleAddRoom}
							className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#dbdee1] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{t('channelVoice:breakout.addRoom')}
						</button>
						<button
							type="button"
							disabled={!canOpen}
							onClick={() => void handleOpenAllRooms()}
							className="rounded-lg bg-[#5865f2] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{t('channelVoice:breakout.openAllRooms')}
						</button>
					</div>

					{/* Create / Recreate Overlay */}
					{recreating && (
						<div
							className="absolute inset-0 z-40 flex items-center justify-center bg-[#1e1f22]/75 p-4"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex w-[360px] flex-col gap-4 rounded-lg border border-white/10 bg-[#2b2d31] p-6 shadow-2xl">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-base font-semibold text-white">{createPrefix}</span>
									<div className="flex items-center gap-1 rounded-md border border-white/15 px-1">
										<button
											type="button"
											disabled={recreateCount <= 1}
											onClick={() => setRecreateCount((c) => Math.max(1, c - 1))}
											className="flex h-7 w-7 items-center justify-center rounded text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
										>
											-
										</button>
										<span className="w-7 text-center text-sm font-semibold text-white">{recreateCount}</span>
										<button
											type="button"
											disabled={recreateCount >= MAX_BREAKOUT_ROOMS}
											onClick={() => setRecreateCount((c) => Math.min(MAX_BREAKOUT_ROOMS, c + 1))}
											className="flex h-7 w-7 items-center justify-center rounded text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
										>
											+
										</button>
									</div>
									{createSuffix && <span className="text-base font-semibold text-white">{createSuffix}</span>}
								</div>

								<div className="flex flex-col gap-2">
									{(
										[
											{ value: BreakoutRule.Automatic, label: t('channelVoice:breakout.ruleAutomatic') },
											{ value: BreakoutRule.Manual, label: t('channelVoice:breakout.ruleManual') },
											{ value: BreakoutRule.SelfSelect, label: t('channelVoice:breakout.ruleSelfSelect') }
										] as const
									).map((opt) => {
										const selected = draftRule === opt.value;
										return (
											<button
												key={opt.value}
												type="button"
												onClick={() => setDraftRule(opt.value)}
												className="flex items-center gap-2.5 py-1 text-left text-sm text-white"
											>
												<span
													className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
														selected ? 'border-[#5865f2]' : 'border-[#949ba4]'
													}`}
												>
													{selected && <span className="h-2 w-2 rounded-full bg-[#5865f2]" />}
												</span>
												<span>{opt.label}</span>
											</button>
										);
									})}
								</div>

								{!createAllowed && (
									<div className="text-xs text-[#f23f43]">
										{idleChannels.length === 0
											? t('channelVoice:breakout.noIdleChannels')
											: t('channelVoice:breakout.notEnoughIdleChannels', { count: idleChannels.length })}
									</div>
								)}

								<div className="flex items-center justify-end gap-2 pt-2">
									{!initialCreate && (
										<button
											type="button"
											onClick={handleCancelRecreate}
											className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-[#dbdee1] hover:bg-white/10"
										>
											{t('common:cancel', { defaultValue: 'Cancel' })}
										</button>
									)}
									<button
										type="button"
										disabled={!createAllowed}
										onClick={handleApplyRecreate}
										className="rounded-lg bg-[#5865f2] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
									>
										{initialCreate ? t('channelVoice:breakout.create') : t('channelVoice:breakout.recreate')}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Delete Confirm Overlay */}
					{deletingRoom && confirmDeleteRoomIdx !== null && (
						<div
							className="absolute inset-0 z-40 flex items-center justify-center bg-[#1e1f22]/55 p-4"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex w-[240px] flex-col gap-3 rounded-lg border border-white/10 bg-[#2b2d31] p-4 shadow-2xl">
								<div className="text-center text-sm font-semibold text-white">
									{t('channelVoice:breakout.deleteConfirm', { name: deletingRoom.label })}
								</div>
								<div className="flex items-center justify-center gap-2">
									<button
										type="button"
										onClick={() => handleConfirmDeleteRoom(confirmDeleteRoomIdx)}
										className="rounded-lg bg-[#5865f2] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#4752c4]"
									>
										{t('channelVoice:breakout.yes')}
									</button>
									<button
										type="button"
										onClick={() => setConfirmDeleteRoomIdx(null)}
										className="rounded-lg border border-white/15 px-3.5 py-1.5 text-xs font-medium text-[#dbdee1] hover:bg-white/10"
									>
										{t('channelVoice:breakout.no')}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
