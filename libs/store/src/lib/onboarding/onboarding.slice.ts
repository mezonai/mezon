import { captureSentryError } from '@mezon/logger';
import type { AnswerByClanArgs } from '@mezon/utils';
import { DONE_ONBOARDING_STATUS } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiOnboardingContent, ApiOnboardingItem, ApiOnboardingSteps } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { clansActions, selectClanById } from '../clans/clans.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, timestampToString, withRetry } from '../helpers';
import type { RootState } from '../store';

export const ONBOARDING_FEATURE_KEY = 'ONBOARDING_FEATURE_KEY';

export interface OnboardingClanEntity extends ApiOnboardingSteps {
	id: string; // Primary ID
}

export type OnboardingClanType = {
	greeting?: ApiOnboardingItem;
	rule: ApiOnboardingItem[];
	question: ApiOnboardingItem[];
	mission: ApiOnboardingItem[];
};

export interface RuleType extends ApiOnboardingContent {
	file?: File;
}

export interface OnboardingState extends EntityState<ApiOnboardingSteps, string> {
	onboardingPreviewMode: {
		open: boolean;
		clanId: string | null;
	};
	toOnboard: boolean | null;
	listOnboarding: Record<
		string,
		OnboardingClanType & {
			sumMission?: number;
			doneMission?: number;
			allDone?: boolean;
		}
	>;
	formOnboarding: {
		greeting: ApiOnboardingContent | null;
		rules: RuleType[];
		questions: ApiOnboardingContent[];
		task: ApiOnboardingContent[];
	};
	fileRules: Record<number, File>;
	keepAnswers: Record<string, number[]>;
	answerByClanId: Record<string, AnswerByClanArgs[] | null>;
	onboardingCache: Record<
		string,
		{
			onboarding?: ApiOnboardingItem[];
			cache?: CacheMetadata;
		}
	>;
	onboardingStepCache?: CacheMetadata;
}

export const onboardingUserAdapter = createEntityAdapter({
	selectId: (a: ApiOnboardingSteps) => a.clanId || ''
});

const getInitialOnboardingState = () => ({
	onboarding: []
});

export const fetchOnboardingCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const onboardingState = currentState[ONBOARDING_FEATURE_KEY];
	const clanData = onboardingState.onboardingCache[clanId] || getInitialOnboardingState();

	const apiKey = createApiKey('fetchOnboarding', clanId, mezon.session.username || '');
	const shouldForceCall = shouldForceApiCall(apiKey, clanData.cache, noCache);

	if (!shouldForceCall) {
		return {
			listOnboarding: clanData.onboarding,
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await withRetry(() => mezon.client.listOnboarding(mezon.session, clanId, undefined, 100), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'list-clan-onboarding'
	});

	markApiFirstCalled(apiKey);

	return {
		listOnboarding: response.listOnboarding,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchOnboarding = createAsyncThunk(
	'onboarding/fetchOnboarding',
	async ({ clanId, noCache }: { clanId: string; noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchOnboardingCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));

			if (response.listOnboarding) {
				return {
					response: response.listOnboarding,
					clanId,
					fromCache: response.fromCache
				};
			}
			return {
				response: [],
				clanId,
				fromCache: response.fromCache
			};
		} catch (error) {
			captureSentryError(error, 'onboarding/fetchOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const createOnboardingTask = createAsyncThunk(
	'onboarding/createOnboarding',
	async ({ content, clanId }: { content: ApiOnboardingContent[]; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const contentsWithTypeName = content.map((item) => ({
				$typeName: 'mezon.api.OnboardingContent' as const,
				guideType: item.guideType ?? 0,
				taskType: item.taskType ?? 0,
				channelId: item.channelId || '',
				title: item.title || '',
				content: item.content || '',
				imageUrl: item.imageUrl || '',
				answers: (item.answers || []).map((ans) => ({
					$typeName: 'mezon.api.OnboardingAnswer' as const,
					title: ans.title || '',
					description: ans.description || '',
					emoji: ans.emoji || '',
					imageUrl: ans.imageUrl || ''
				}))
			}));
			const response = await mezon.client.createOnboarding(mezon.session, {
				$typeName: 'mezon.api.CreateOnboardingRequest' as const,
				clanId,
				contents: contentsWithTypeName
			});
			if (!response || !response?.listOnboarding) {
				return false;
			}
			return { content: response.listOnboarding, clanId };
		} catch (error) {
			captureSentryError(error, 'onboarding/createOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const editOnboarding = createAsyncThunk(
	'onboarding/editOnboarding',
	async ({ content, idOnboarding, clanId }: { content: ApiOnboardingContent; idOnboarding: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateOnboarding(mezon.session, idOnboarding, {
				$typeName: 'mezon.api.UpdateOnboardingRequest' as const,
				id: idOnboarding,
				clanId,
				taskType: content.taskType ?? 0,
				channelId: content.channelId || '',
				title: content.title || '',
				content: content.content || '',
				imageUrl: content.imageUrl || '',
				answers: (content.answers || []).map((ans) => ({
					$typeName: 'mezon.api.OnboardingAnswer' as const,
					title: ans.title || '',
					description: ans.description || '',
					emoji: ans.emoji || '',
					imageUrl: ans.imageUrl || ''
				}))
			});
			if (!response) {
				return false;
			}
			return { content, clanId, idOnboarding };
		} catch (error) {
			captureSentryError(error, 'onboarding/createOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const removeOnboardingTask = createAsyncThunk(
	'onboarding/removeOnboardingTask',
	async ({ idTask, clanId, type }: { idTask: string; clanId: string; type: EGuideType }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.deleteOnboarding(mezon.session, idTask, clanId);
			if (!response) {
				return {
					clanId: null,
					idTask: null,
					type: null
				};
			}

			return {
				clanId,
				idTask,
				type
			};
		} catch (error) {
			captureSentryError(error, 'onboarding/removeOnboardingTask');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const enableOnboarding = createAsyncThunk(
	'clans/updateClans',
	async ({ clanId, onboarding, banner }: { clanId: string; onboarding: boolean; banner?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const clan = selectClanById(clanId)(state);

			const response = await mezon.client.updateClanDesc(mezon.session, clanId, {
				$typeName: 'mezon.api.UpdateClanDescRequest' as const,
				clanId,
				clanName: clan?.clanName || '',
				status: clan?.status ?? 0,
				welcomeChannelId: clan?.welcomeChannelId || '',
				preventAnonymous: clan?.preventAnonymous ?? false,
				isOnboarding: onboarding,
				banner
			});

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(
				clansActions.updateOnboardingMode({
					clanId,
					onboarding
				})
			);
			return onboarding;
		} catch (error) {
			captureSentryError(error, 'clans/updateClans');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchOnboardingStepCached = async (getState: () => RootState, mezon: MezonValueContext, clanId?: string, noCache = false) => {
	const currentState = getState();
	const onboardingState = currentState[ONBOARDING_FEATURE_KEY];

	const apiKey = createApiKey('fetchOnboardingStep', mezon.session.username || '', clanId || '');

	const shouldForceCall = shouldForceApiCall(apiKey, onboardingState.onboardingStepCache, noCache);

	if (!shouldForceCall) {
		return {
			listOnboardingStep: Object.values(onboardingState.entities).filter(Boolean),
			fromCache: true,
			time: onboardingState.onboardingStepCache?.lastFetched || Date.now()
		};
	}

	const response = await withRetry(() => mezon.client.listOnboardingStep(mezon.session, clanId), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'clan-onboarding-steps'
	});

	markApiFirstCalled(apiKey);

	return {
		listOnboardingStep: response.listOnboardingStep || [],
		fromCache: false,
		time: Date.now()
	};
};

export const fetchProcessingOnboarding = createAsyncThunk(
	'onboarding/fetchProcessing',
	async ({ clanId, noCache }: { clanId?: string; noCache?: boolean } = {}, thunkAPI) => {
		try {
			const mezone = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchOnboardingStepCached(thunkAPI.getState as () => RootState, mezone, clanId, Boolean(noCache));
			if (!response.listOnboardingStep) {
				return {
					steps: [],
					fromCache: response.fromCache
				};
			}

			return {
				steps: response.listOnboardingStep,
				fromCache: response.fromCache
			};
		} catch (error) {
			captureSentryError(error, 'clans/updateClans');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const doneOnboarding = createAsyncThunk('onboarding/doneOnboarding', async ({ clanId }: { clanId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.updateOnboardingStepByClanId(mezon.session, clanId, {
			$typeName: 'mezon.api.UpdateOnboardingStepRequest' as const,
			clanId,
			onboardingStep: DONE_ONBOARDING_STATUS
		});
		if (!response) {
			return false;
		}

		return clanId;
	} catch (error) {
		captureSentryError(error, 'clans/updateClans');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialOnboardingState: OnboardingState = onboardingUserAdapter.getInitialState({
	onboardingPreviewMode: {
		open: false,
		clanId: null
	},
	toOnboard: null,
	missionDone: 0,
	missionSum: 0,
	guideFinished: false,
	listOnboarding: {},
	formOnboarding: {
		greeting: null,
		rules: [],
		questions: [],
		task: []
	},
	fileRules: [],
	keepAnswers: {},
	answerByClanId: {},
	onboardingCache: {}
});

export enum ETypeMission {
	SEND_MESSAGE = 1,
	VISIT = 2,
	DOSOMETHING = 3
}
export enum EGuideType {
	GREETING = 1,
	RULE = 2,
	TASK = 3,
	QUESTION = 4
}

export const onboardingSlice = createSlice({
	name: ONBOARDING_FEATURE_KEY,
	initialState: initialOnboardingState,
	reducers: {
		openOnboardingPreviewMode: (state, action: PayloadAction<{ clanId: string }>) => {
			state.onboardingPreviewMode = {
				open: true,
				clanId: action.payload.clanId
			};
		},
		closeOnboardingPreviewMode: (state) => {
			state.onboardingPreviewMode = {
				open: false,
				clanId: null
			};
			state.toOnboard = true;
		},
		closeToOnboard: (state) => {
			state.toOnboard = false;
		},
		doneMission: (state, action: PayloadAction<{ clanId: string }>) => {
			const missionDone = state.listOnboarding[action.payload.clanId].doneMission || 0;
			const sumMission = state.listOnboarding[action.payload.clanId].sumMission || 0;
			if (
				missionDone < sumMission &&
				onboardingUserAdapter.getSelectors().selectById(state, action.payload.clanId)?.onboardingStep !== DONE_ONBOARDING_STATUS
			) {
				state.listOnboarding[action.payload.clanId].doneMission = (state.listOnboarding[action.payload.clanId].doneMission || 0) + 1;
			}
		},
		addGreeting: (state, action: PayloadAction<ApiOnboardingContent>) => {
			state.formOnboarding.greeting = action.payload;
		},
		addRules: (state, action: PayloadAction<{ rule: RuleType; update?: number }>) => {
			const { rule, update } = action.payload;

			if (update !== undefined) {
				state.formOnboarding.rules[update] = rule;
				return;
			}
			state.formOnboarding.rules.push(rule);
		},
		addQuestion: (state, action: PayloadAction<{ data: ApiOnboardingContent; update?: number }>) => {
			const { data, update } = action.payload;
			if (update !== undefined) {
				state.formOnboarding.questions[update] = data;
				return;
			}
			state.formOnboarding.questions.push(data);
		},
		addMission: (state, action: PayloadAction<{ data: ApiOnboardingContent; update?: number }>) => {
			const { data, update } = action.payload;

			if (update !== undefined) {
				state.formOnboarding.task[update] = data;
				return;
			}
			state.formOnboarding.task.push(data);
		},
		removeTempTask: (state, action: PayloadAction<{ idTask: number; type: EGuideType }>) => {
			const removeIndex = action.payload.idTask;
			switch (action.payload.type) {
				case EGuideType.GREETING:
					state.formOnboarding.greeting = null;
					break;
				case EGuideType.RULE:
					state.formOnboarding.rules.splice(removeIndex, 1);
					break;
				case EGuideType.QUESTION:
					state.formOnboarding.questions.splice(removeIndex, 1);
					break;
				case EGuideType.TASK:
					state.formOnboarding.task.splice(removeIndex, 1);
					break;
				default:
					break;
			}
		},
		addFileRule: (state, action: PayloadAction<{ index: number; file: File }>) => {
			state.fileRules[action.payload.index] = action.payload.file;
		},
		clearFileRule: (state) => {
			state.fileRules = [];
		},
		doAnswer: (state, action: PayloadAction<{ idQuestion: string; answer: number }>) => {
			const { idQuestion, answer } = action.payload;
			if (state.keepAnswers[idQuestion] && state.keepAnswers[idQuestion].includes(answer)) {
				state.keepAnswers[idQuestion] = state.keepAnswers[idQuestion].filter((value) => value !== answer);
				return;
			}
			if (state.keepAnswers[idQuestion]) {
				state.keepAnswers[idQuestion].push(answer);
				return;
			}
			state.keepAnswers[idQuestion] = [answer];
		},

		setAnswerByClanId: (state, action: PayloadAction<{ clanId: string; answerState: AnswerByClanArgs | null }>) => {
			const { clanId, answerState } = action.payload;

			if (!answerState) {
				return;
			}

			const existingAnswers = state.answerByClanId[clanId] || [];
			const index = existingAnswers.findIndex((item) => item.clanIdQuestionIdAndIndex === answerState.clanIdQuestionIdAndIndex);

			if (index !== -1) {
				existingAnswers.splice(index, 1);
			} else {
				existingAnswers.push(answerState);
			}

			state.answerByClanId[clanId] = existingAnswers;
		},
		resetOnboarding: (state, action) => {
			state.formOnboarding = {
				greeting: null,
				rules: [],
				questions: [],
				task: []
			};
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchOnboarding.fulfilled, (state, action) => {
				const { clanId, response, fromCache } = action.payload;

				if (!fromCache && !Object.prototype.hasOwnProperty.call(state.listOnboarding, clanId)) {
					const onboardingClan: OnboardingClanType = {
						greeting: undefined,
						mission: [],
						question: [],
						rule: []
					};
					response.map((onboardingItem: any) => {
						switch (onboardingItem.guideType) {
							case EGuideType.GREETING:
								onboardingClan.greeting = onboardingItem;
								break;
							case EGuideType.RULE:
								onboardingClan.rule.push(onboardingItem);
								break;
							case EGuideType.QUESTION:
								onboardingClan.question.push(onboardingItem);
								break;
							case EGuideType.TASK:
								onboardingClan.mission.push(onboardingItem);
								break;
							default:
								break;
						}
					});

					state.listOnboarding[clanId] = onboardingClan;
					state.listOnboarding[clanId].sumMission = onboardingClan.mission.length;

					if (!state.onboardingCache[clanId]) {
						state.onboardingCache[clanId] = getInitialOnboardingState();
					}

					state.onboardingCache[clanId].onboarding = response.map((item) => ({
						...item,
						createTime: timestampToString(item.createTime),
						updateTime: timestampToString((item as any).updateTime)
					}));
					state.onboardingCache[clanId].cache = {
						lastFetched: Date.now(),
						expiresAt: Date.now() + 1000 * 60 * 60,
						isFirstLoad: false
					};
				}
			})
			.addCase(createOnboardingTask.fulfilled, (state, action) => {
				if (!action.payload) {
					return;
				}
				state.formOnboarding = {
					greeting: null,
					rules: [],
					questions: [],
					task: []
				};
				const { content, clanId } = action.payload;
				if (clanId) {
					const onboardingClan: OnboardingClanType = {
						greeting: state.listOnboarding[clanId].greeting,
						mission: state.listOnboarding[clanId].mission,
						question: state.listOnboarding[clanId].question,
						rule: state.listOnboarding[clanId].rule
					};
					content.map((onboardingItem: any) => {
						switch (onboardingItem.guideType) {
							case EGuideType.GREETING:
								onboardingClan.greeting = onboardingItem;
								break;
							case EGuideType.RULE:
								onboardingClan.rule.push({
									...onboardingItem
								});
								break;
							case EGuideType.QUESTION:
								onboardingClan.question.push({
									...onboardingItem
								});
								break;
							case EGuideType.TASK:
								onboardingClan.mission.push({
									...onboardingItem
								});
								break;
							default:
								break;
						}
					});
					state.listOnboarding[clanId] = onboardingClan;
				}
			})
			.addCase(removeOnboardingTask.fulfilled, (state, action) => {
				if (action.payload.clanId) {
					switch (action.payload.type) {
						case EGuideType.GREETING:
							state.listOnboarding[action.payload.clanId].greeting = undefined;
							break;
						case EGuideType.RULE:
							state.listOnboarding[action.payload.clanId].rule = state.listOnboarding[action.payload.clanId].rule.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						case EGuideType.QUESTION:
							state.listOnboarding[action.payload.clanId].question = state.listOnboarding[action.payload.clanId].question.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						case EGuideType.TASK:
							state.listOnboarding[action.payload.clanId].mission = state.listOnboarding[action.payload.clanId].mission.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						default:
							break;
					}
				}
			})
			.addCase(fetchProcessingOnboarding.fulfilled, (state, action) => {
				if (action.payload && !action.payload.fromCache) {
					onboardingUserAdapter.setMany(state, action.payload.steps);
					state.onboardingStepCache = {
						lastFetched: Date.now(),
						expiresAt: Date.now() + 1000 * 60 * 60,
						isFirstLoad: false
					};
				}
			})
			.addCase(editOnboarding.fulfilled, (state, action) => {
				if (!action.payload) {
					return;
				}
				const { clanId, content, idOnboarding } = action.payload;
				if (state.listOnboarding[clanId]) {
					switch (content.guideType) {
						case EGuideType.RULE:
							state.listOnboarding[action.payload.clanId].rule = state.listOnboarding[action.payload.clanId].rule.map((rule) => {
								if (rule.id === idOnboarding) {
									return {
										...rule,
										...content
									};
								}
								return rule;
							});
							break;
						case EGuideType.TASK:
							state.listOnboarding[action.payload.clanId].mission = state.listOnboarding[action.payload.clanId].mission.map((task) => {
								if (task.id === idOnboarding) {
									return {
										...task,
										...content
									};
								}
								return task;
							});
							break;
						default:
							break;
					}
				}
			});
	}
});

export const onboardingReducer = onboardingSlice.reducer;

export const onboardingActions = {
	...onboardingSlice.actions,
	createOnboardingTask,
	fetchOnboarding,
	removeOnboardingTask,
	enableOnboarding,
	fetchProcessingOnboarding,
	doneOnboarding,
	editOnboarding
};

const { selectById } = onboardingUserAdapter.getSelectors();

export const getOnboardingState = (rootState: { [ONBOARDING_FEATURE_KEY]: OnboardingState }): OnboardingState => rootState[ONBOARDING_FEATURE_KEY];

export const selectOnboardingMode = createSelector(getOnboardingState, (state) => state.onboardingPreviewMode);
export const selectToOnboard = createSelector(getOnboardingState, (state) => state.toOnboard);

export const selectMissionDone = createSelector([getOnboardingState, (state, clanId: string) => clanId], (state, clanId) => {
	return state.listOnboarding[clanId]?.doneMission || 0;
});

export const selectMissionSum = createSelector([getOnboardingState, (state, clanId: string) => clanId], (state, clanId) => {
	return state.listOnboarding[clanId]?.sumMission || 0;
});

export const selectFormOnboarding = createSelector(getOnboardingState, (state) => state.formOnboarding);

export const selectOnboardingByClan = createSelector([getOnboardingState, (state, clanId: string) => clanId], (state, clanId) => {
	return (
		state.listOnboarding[clanId] || {
			greeting: null,
			mission: [],
			question: [],
			rule: [],
			sumMission: 0
		}
	);
});

export const selectProcessingByClan = createSelector([getOnboardingState, (state, clanId: string) => clanId], (state, clanId) => {
	return selectById(state, clanId);
});
export const selectCurrentMission = createSelector(
	[getOnboardingState, (state, clanId: string) => clanId, selectMissionDone],
	(state, clanId, missionIndex) => {
		if (state.listOnboarding[clanId]?.mission) {
			return state.listOnboarding[clanId].mission[missionIndex];
		}
		return null;
	}
);

export const selectRuleImages = createSelector(getOnboardingState, (state) => state.fileRules);

export const selectAnswerByQuestionId = createSelector([getOnboardingState, (state, questionId: string) => questionId], (state, questionId) => {
	return state.keepAnswers[questionId] || [];
});

export const selectAnswerByClanId = createSelector(
	[getOnboardingState, (state, clanId: string) => clanId],
	(state, clanId) => state.answerByClanId?.[clanId]
);
