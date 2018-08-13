import { SequentialEvent } from './sequential-event';
import { IEventHandler, IOnceHandler, IEventHash, IEventsHash} from './interfaces';

/**
 * Handle execution of a single handler.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const emitHandler = (
	handler: IEventHandler,
	object: SequentialEvent,
	args: any[]
): Promise<any> => {
	try {
		const retVal = handler.apply(object, args);
		if ('object' === typeof retVal && 'function' === typeof retVal.then) {
			return retVal;
		} else {
			return Promise.resolve(retVal);
		}
	} catch (e) {
		return Promise.reject(e);
	}
};
/**
 * Handle execution of all handlers in sequence.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const emitHandlers = (
	handlers: IEventHandler | IEventHandler[],
	object: SequentialEvent,
	args: any[]
): Promise<any> => {
	handlers = ensureArray(handlers);
	const promiseGen = getNextPromise(handlers, object, args);
	return new Promise(promiseGen);
};

/**
 * Generate next promise for sequence.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */

export const getNextPromise = (
	handlers: IEventHandler[],
	object: SequentialEvent,
	args: any[]
): ((resolve: Function, reject: (reason: any) => any) => Function) => {
	let i = 0;
	let handlersLength = handlers.length;
	return (resolve: Function, reject: (reason: any) => any) => {
		const _getNextPromise = (prevResolve?: any) => {
			// Handle if an event handler disapeared during event dispatching
			if (i < handlersLength) {
				const stepArgs =
					'undefined' !== typeof prevResolve
						? args.concat([prevResolve])
						: args.slice(0);
				const newPromise = emitHandler(handlers[i], object, stepArgs);
				newPromise.then(_getNextPromise).catch(reject);
				i++;
			} else {
				return resolve.call(null, prevResolve);
			}
		};
		return _getNextPromise();
	};
};

/**
 * Generate an event handler that deregister itself when executed. This handler will be executed  just once.
 *
 * @param   target    - Event emitter that will use the handler.
 * @param   eventName - Name of the event to trigger.
 * @param   eventFn   - Handler for the event.
 * @returns Function that will be executed only once.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const onceify = (
	target: SequentialEvent,
	eventName: string,
	eventFn: IEventHandler
): IOnceHandler => {
	let called = false;
	const once = function(...args: any[]) {
		if (!called) {
			target.off(eventName, once);
			called = true;
			return eventFn(...args);
		}
	} as IOnceHandler;
	once.origFn = eventFn;
	return once;
};

const removeSingleListener = (
	eventCat: IEventHandler[],
	callback: IEventHandler
): boolean => {
	const indexes = [
		// Check in normal events
		eventCat.indexOf(callback),
		// Check in once events
		(() => {
			const I = eventCat.length;
			for (let i = 0; i < I; i++) {
				if ((eventCat[i] as IOnceHandler).origFn === callback) {
					return i;
				}
			}
			return -1;
		})(),
	];
	const index = Math.min(...indexes.filter(v => v >= 0));
	if (isFinite(index)) {
		eventCat.splice(index, 1);
		return true;
	} else {
		return false;
	}
};

/**
 * Remove provided `callback` from listeners of event `eventCat`.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const removeEventListener = (
	eventCat: IEventHandler[],
	callback: IEventHandler[]
): void => {
	const I = callback.length;
	for (let i = 0; i < I; i++) {
		if (removeSingleListener(eventCat, callback[i])) {
			i--;
		}
	}
};

/**
 * Add an event listener to the provided event hash.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const addEventListener = (
	eventHash: IEventsHash,
	eventName: string,
	callback: IEventHandler[]
): void => {
	eventHash[eventName] = ensureArray(eventHash[eventName] || []).concat(
		callback
	);
};

/**
 * Ensure that event & callback are on the associative hash format.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */

export const ensureArray: <T>(data: T | T[]) => T[] = <T>(data: T | T[]) => {
	if ('undefined' === typeof data) {
		return [];
	}
	return (Array === data.constructor ? data : [data]) as T[];
};

export const forEachObj = <T>(
	object: { [key: string]: T },
	callback: (value: T, key: string) => any
) => {
	Object.keys(object).forEach((key: any) => callback(object[key], key));
};

export const castArgsToEventsHash = (
	events: string | IEventHash,
	callback?: IEventHandler | IEventHandler[]
) => {
	if (typeof events === 'string' && typeof callback !== 'undefined') {
		const eventsHash: IEventsHash = {};
		const callbackArr: IEventHandler[] = ensureArray(callback);
		events.split(' ').forEach(event => {
			eventsHash[event] = callbackArr;
		});
		return eventsHash;
	} else if (typeof events === 'object' && typeof callback === 'undefined') {
		const eventsHash: IEventsHash = {};
		forEachObj(
			events,
			(callback, event) => (eventsHash[event] = ensureArray(callback))
		);
		return eventsHash;
	} else {
		throw new Error('Incorrect parameters');
	}
};
