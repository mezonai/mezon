import { captureSentryError } from '@mezon/logger';
import { AnswerByClanArgs, DONE_ONBOARDING_STATUS } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import memoizee from 'memoizee';
import { ApiOnboardingContent, ApiOnboardingItem, ApiOnboardingSteps } from 'mezon-js/api.gen';
import { clansActions } from '../clans/clans.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
const LIST_THREADS_CACHED_TIME = 1000 * 60 * 60;

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
	onboardingPreviewMode: boolean;
	missionDone: number;
	missionSum: number;
	guideFinished: boolean;
	listOnboarding: Record<string, OnboardingClanType>;
	formOnboarding: {
		greeting: ApiOnboardingContent | null;
		rules: RuleType[];
		questions: ApiOnboardingContent[];
		task: ApiOnboardingContent[];
	};
	fileRules: Record<number, File>;
	keepAnswers: Record<string, number[]>;
	answerByClanId: Record<string, AnswerByClanArgs[] | null>;
}

export const onboardingUserAdapter = createEntityAdapter({
	selectId: (a: ApiOnboardingSteps) => a.clan_id || ''
});

const fetchOnboardingCached = memoizee(
	async (mezon: MezonValueContext, clan_id: string) => {
		const response = await mezon.client.listOnboarding(mezon.session, clan_id, undefined, 100);
		return response.list_onboarding;
	},
	{
		promise: true,
		maxAge: LIST_THREADS_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[0].session.username;
		}
	}
);

export const fetchOnboarding = createAsyncThunk(
	'onboarding/fetchOnboarding',
	async ({ clan_id, noCache }: { clan_id: string; noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchOnboardingCached.delete(mezon, clan_id);
			}
			const response = await fetchOnboardingCached(mezon, clan_id);

			if (response) {
				return { response, clan_id };
			}
			return { response: [], clan_id };
		} catch (error) {
			captureSentryError(error, 'onboarding/fetchOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const createOnboardingTask = createAsyncThunk(
	'onboarding/createOnboarding',
	async ({ content, clan_id }: { content: ApiOnboardingContent[]; clan_id: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.createOnboarding(mezon.session, {
				clan_id,
				contents: [...content]
			});
			if (!response || !response?.list_onboarding) {
				return false;
			}
			return { content: response.list_onboarding, clan_id };
		} catch (error) {
			captureSentryError(error, 'onboarding/createOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const editOnboarding = createAsyncThunk(
	'onboarding/editOnboarding',
	async ({ content, idOnboarding, clan_id }: { content: ApiOnboardingContent; idOnboarding: string; clan_id: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateOnboarding(mezon.session, idOnboarding, {
				clan_id,
				...content
			});
			if (!response) {
				return false;
			}
			return { content, clan_id, idOnboarding };
		} catch (error) {
			captureSentryError(error, 'onboarding/createOnboarding');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const removeOnboardingTask = createAsyncThunk(
	'onboarding/removeOnboardingTask',
	async ({ idTask, clan_id, type }: { idTask: string; clan_id: string; type: EGuideType }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.deleteOnboarding(mezon.session, idTask, clan_id);
			if (!response) {
				return {
					clan_id: null,
					idTask: null,
					type: null
				};
			}

			return {
				clan_id,
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
	async ({ clan_id, onboarding, banner }: { clan_id: string; onboarding: boolean; banner?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.updateClanDesc(mezon.session, clan_id, {
				is_onboarding: onboarding,
				banner: banner
			});

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(
				clansActions.updateOnboardingMode({
					clanId: clan_id,
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

const fetchOnboardingStepCached = memoizee(
	async (mezon: MezonValueContext, clan_id?: string) => {
		const response = await mezon.client.listOnboardingStep(mezon.session, clan_id);
		return response.list_onboarding_step || [];
	},
	{
		promise: true,
		maxAge: LIST_THREADS_CACHED_TIME,
		normalizer: (args) => {
			return args[0].session.username || '' + args[1] || '';
		}
	}
);

export const fetchProcessingOnboarding = createAsyncThunk('onboarding/fetchProcessing', async ({ clan_id }: { clan_id?: string }, thunkAPI) => {
	try {
		const mezone = await ensureSession(getMezonCtx(thunkAPI));

		const response = await fetchOnboardingStepCached(mezone, clan_id);
		if (!response) {
			return [];
		}

		return response;
	} catch (error) {
		captureSentryError(error, 'clans/updateClans');
		return thunkAPI.rejectWithValue(error);
	}
});

export const doneOnboarding = createAsyncThunk('onboarding/doneOnboarding', async ({ clan_id }: { clan_id: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.updateOnboardingStepByClanId(mezon.session, clan_id, { onboarding_step: DONE_ONBOARDING_STATUS });
		if (!response) {
			return false;
		}

		return clan_id;
	} catch (error) {
		captureSentryError(error, 'clans/updateClans');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialOnboardingState: OnboardingState = onboardingUserAdapter.getInitialState({
	onboardingPreviewMode: false,
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
	answerByClanId: {}
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
		openOnboardingPreviewMode: (state) => {
			state.onboardingPreviewMode = true;
		},
		closeOnboardingPreviewMode: (state) => {
			state.onboardingPreviewMode = false;
		},
		doneMission: (state, action: PayloadAction<{ clan_id: string }>) => {
			if (
				state.missionDone < state.missionSum &&
				onboardingUserAdapter.getSelectors().selectById(state, action.payload.clan_id)?.onboarding_step !== DONE_ONBOARDING_STATUS
			) {
				state.missionDone = state.missionDone + 1;
				if (state.missionDone + 1 === state.missionSum) {
					state.guideFinished = true;
				}
			}
		},
		addGreeting: (state, action: PayloadAction<ApiOnboardingContent>) => {
			state.formOnboarding.greeting = action.payload;
		},
		addRules: (state, action: PayloadAction<RuleType>) => {
			state.formOnboarding.rules.push(action.payload);
		},
		addQuestion: (state, action: PayloadAction<{ data: ApiOnboardingContent; update?: number }>) => {
			const { data, update } = action.payload;
			if (update !== undefined) {
				state.formOnboarding.questions[update] = data;
				return;
			}
			state.formOnboarding.questions.push(data);
		},
		addMission: (state, action: PayloadAction<ApiOnboardingContent>) => {
			state.formOnboarding.task.push(action.payload);
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
				if (!Object.prototype.hasOwnProperty.call(state.listOnboarding, action.payload.clan_id)) {
					const onboardingClan: OnboardingClanType = {
						greeting: undefined,
						mission: [],
						question: [],
						rule: []
					};
					action.payload.response.map((onboardingItem) => {
						switch (onboardingItem.guide_type) {
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
						state.listOnboarding[action.payload.clan_id] = onboardingClan;
						state.missionSum = onboardingClan.mission.length;
					});
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
				const { content, clan_id } = action.payload;
				if (clan_id) {
					content.map((onboardingItem) => {
						switch (onboardingItem.guide_type) {
							case EGuideType.GREETING:
								state.listOnboarding[clan_id].greeting = onboardingItem;
								break;
							case EGuideType.RULE:
								state.listOnboarding[clan_id].rule.push({
									...onboardingItem
								});
								break;
							case EGuideType.QUESTION:
								state.listOnboarding[clan_id].question.push({
									...onboardingItem
								});
								break;
							case EGuideType.TASK:
								state.listOnboarding[clan_id].mission.push({
									...onboardingItem
								});
								break;
							default:
								break;
						}
					});
				}
			})
			.addCase(removeOnboardingTask.fulfilled, (state, action) => {
				if (action.payload.clan_id) {
					switch (action.payload.type) {
						case EGuideType.GREETING:
							state.listOnboarding[action.payload.clan_id].greeting = undefined;
							break;
						case EGuideType.RULE:
							state.listOnboarding[action.payload.clan_id].rule = state.listOnboarding[action.payload.clan_id].rule.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						case EGuideType.QUESTION:
							state.listOnboarding[action.payload.clan_id].question = state.listOnboarding[action.payload.clan_id].question.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						case EGuideType.TASK:
							state.listOnboarding[action.payload.clan_id].mission = state.listOnboarding[action.payload.clan_id].mission.filter(
								(task) => task.id !== action.payload.idTask
							);
							break;
						default:
							break;
					}
				}
			})
			.addCase(fetchProcessingOnboarding.fulfilled, (state, action) => {
				if (action.payload) {
					onboardingUserAdapter.setAll(state, action.payload);
				}
			})
			.addCase(editOnboarding.fulfilled, (state, action) => {
				if (!action.payload) {
					return;
				}
				const { clan_id, content, idOnboarding } = action.payload;
				if (state.listOnboarding[clan_id]) {
					switch (content.guide_type) {
						case EGuideType.RULE:
							state.listOnboarding[action.payload.clan_id].rule = state.listOnboarding[action.payload.clan_id].rule.map((rule) => {
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
							state.listOnboarding[action.payload.clan_id].mission = state.listOnboarding[action.payload.clan_id].mission.map(
								(task) => {
									if (task.id === idOnboarding) {
										return {
											...task,
											...content
										};
									}
									return task;
								}
							);
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

const { selectAll, selectEntities, selectById } = onboardingUserAdapter.getSelectors();

export const getOnboardingState = (rootState: { [ONBOARDING_FEATURE_KEY]: OnboardingState }): OnboardingState => rootState[ONBOARDING_FEATURE_KEY];

export const selectOnboardingMode = createSelector(getOnboardingState, (state) => state.onboardingPreviewMode);

export const selectMissionDone = createSelector(getOnboardingState, (state) => state.missionDone);

export const selectMissionSum = createSelector(getOnboardingState, (state) => state.missionSum);
export const selectFinishGuide = createSelector(getOnboardingState, (state) => state.guideFinished);

export const selectFormOnboarding = createSelector(getOnboardingState, (state) => state.formOnboarding);

export const selectOnboardingByClan = createSelector([getOnboardingState, (state, clan_id: string) => clan_id], (state, clan_id) => {
	return (
		state.listOnboarding[clan_id] || {
			greeting: null,
			mission: [],
			question: [],
			rule: []
		}
	);
});

export const selectProcessingByClan = (clanId: string) => createSelector(getOnboardingState, (state) => selectById(state, clanId));
export const selectCurrentMission = createSelector(
	[getOnboardingState, (state, clan_id: string) => clan_id, selectMissionDone],
	(state, clan_id, missionIndex) => {
		if (state.listOnboarding[clan_id]?.mission) {
			return state.listOnboarding[clan_id].mission[missionIndex];
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
