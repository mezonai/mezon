import { AnyToVoidFunction, NoneToVoidFunction } from '../types';
import { Scheduler, fastRaf } from '../utils';
import safeExec from '../utils/safeExec';
import { setPhase } from './stricterdom';

let pendingMeasureTasks: NoneToVoidFunction[] = [];
let pendingMutationTasks: NoneToVoidFunction[] = [];
let pendingForceReflowTasks: (() => NoneToVoidFunction | void)[] = [];

const runUpdatePassOnRaf = throttleWithRafFallback(() => {
	const currentMeasureTasks = pendingMeasureTasks;
	pendingMeasureTasks = [];
	currentMeasureTasks.forEach((task) => {
		safeExec(task);
	});

	// We use promises to provide correct order for Mutation Observer callback microtasks
	Promise.resolve()
		.then(() => {
			setPhase('mutate');

			const currentMutationTasks = pendingMutationTasks;
			pendingMutationTasks = [];

			currentMutationTasks.forEach((task) => {
				safeExec(task);
			});
		})
		.then(() => {
			setPhase('measure');

			const pendingForceReflowMutationTasks: NoneToVoidFunction[] = [];
			// Will include tasks created during the loop
			for (const task of pendingForceReflowTasks) {
				safeExec(() => {
					const mutationTask = task();
					if (mutationTask) {
						pendingForceReflowMutationTasks.push(mutationTask);
					}
				});
			}
			pendingForceReflowTasks = [];

			return pendingForceReflowMutationTasks;
		})
		.then((pendingForceReflowMutationTasks) => {
			setPhase('mutate');

			// Will include tasks created during the loop
			for (const task of pendingForceReflowMutationTasks) {
				safeExec(task);
			}
		})
		.then(() => {
			setPhase('measure');
		});
});

export function requestMeasure(cb: NoneToVoidFunction) {
	pendingMeasureTasks.push(cb);
	runUpdatePassOnRaf();
}

export function requestMutation(cb: NoneToVoidFunction) {
	pendingMutationTasks.push(cb);
	runUpdatePassOnRaf();
}

export function requestNextMutation(cb: () => NoneToVoidFunction | void) {
	requestMeasure(() => {
		requestMutation(cb);
	});
}

export function requestForcedReflow(cb: () => NoneToVoidFunction | void) {
	pendingForceReflowTasks.push(cb);
	runUpdatePassOnRaf();
}

function throttleWithRafFallback<F extends AnyToVoidFunction>(fn: F) {
	return throttleWith((throttledFn: NoneToVoidFunction) => {
		fastRaf(throttledFn, true);
	}, fn);
}

function throttleWith<F extends AnyToVoidFunction>(schedulerFn: Scheduler, fn: F) {
	let waiting = false;
	let args: Parameters<F>;

	return (..._args: Parameters<F>) => {
		args = _args;

		if (!waiting) {
			waiting = true;

			schedulerFn(() => {
				waiting = false;
				fn(...args);
			});
		}
	};
}

export * from './stricterdom';
