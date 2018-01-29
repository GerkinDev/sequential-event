import SequentialEvent from './sequential-event.d'

import IEventHandler = SequentialEvent.IEventHandler
import IEventsHash = SequentialEvent.IEventsHash
import IEventHash = SequentialEvent.IEventHash

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
		const retVal = handler.apply(object, args)
		if ('object' === typeof retVal && 'function' === typeof retVal.then) {
			return retVal
		} else {
			return Promise.resolve(retVal)
		}
	} catch (e) {
		return Promise.reject(e)
	}
}
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
	handlers = ensureArray(handlers)
	const promiseGen = getNextPromise(handlers, object, args)
	return new Promise(promiseGen)
}

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
	let i = 0
	let handlersLength = handlers.length
	return (resolve: Function, reject: (reason: any) => any) => {
		const _getNextPromise = (prevResolve?: any) => {
			// Handle if an event handler disapeared during event dispatching
			const handlersLength2 = handlers.length
			if (handlersLength2 !== handlersLength) {
				i -= handlersLength - handlersLength2
				handlersLength = handlersLength2
			}
			if (i < handlersLength) {
				const stepArgs =
					'undefined' !== typeof prevResolve
						? args.concat([prevResolve])
						: args.slice(0)
				const newPromise = emitHandler(handlers[i], object, stepArgs)
				newPromise.then(_getNextPromise).catch(reject)
				i++
			} else {
				return resolve.call(null, prevResolve)
			}
		}
		return _getNextPromise()
	}
}

/**
 * Generate an event handler that deregister itself when executed. This handler will be executed  just once.
 *
 * @param   {SequentialEvent}   target    - Event emitter that will use the handler.
 * @param   {string}   eventName - Name of the event to trigger.
 * @param   {IEventHandler} eventFn   - Handler for the event.
 * @returns {IEventHandler} Function that will be executed only once.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const onceify = (
	target: SequentialEvent,
	eventName: string,
	eventFn: IEventHandler
): SequentialEvent.IOnceHandler => {
	let called = false
	const once = function(...args: any[]) {
		if (!called) {
			target.off(eventName, once)
			called = true
			return eventFn(...args)
		}
	} as SequentialEvent.IOnceHandler
	once.origFn = eventFn
	return once
}

const removeSingleListener = (
	eventCat: IEventHandler[],
	callback: IEventHandler
): boolean => {
	const indexes = [
		// Check in normal events
		eventCat.indexOf(callback),
		// Check in once events
		(() => {
			const I = eventCat.length
			for (let i = 0; i < I; i++) {
				if ((eventCat[i] as SequentialEvent.IOnceHandler).origFn === callback) {
					return i
				}
			}
			return -1
		})(),
	]
	const index = Math.min(...indexes.filter(v => v >= 0))
	if (isFinite(index)) {
		eventCat.splice(index, 1)
		return true
	} else {
		return false
	}
}

/**
 * Remove provided `callback` from listeners of event `eventCat`.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const removeEventListener = (
	eventCat: IEventHandler[],
	callback: IEventHandler | IEventHandler[]
): void => {
	callback = ensureArray(callback)
	const I = callback.length
	for (let i = 0; i < I; i++) {
		if (removeSingleListener(eventCat, callback[i])) {
			i--
		}
	}
}

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
	callback: IEventHandler | IEventHandler[]
): void => {
	eventHash[eventName] = ensureArray(eventHash[eventName]).concat(
		ensureArray(callback)
	)
}

/**
 * Ensure that event & callback are on the associative hash format.
 *
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
export const castToEventObject = (
	events: IEventHash | string,
	callback?: IEventHandler | boolean
): IEventHash => {
	if ('string' === typeof events && 'function' === typeof callback) {
		const eventsObj: IEventHash = {}
		events.split(' ').forEach((event: string) => {
			eventsObj[event] = 'function' === typeof callback ? callback : null
		})
		return eventsObj
	} else if ('object' === typeof events) {
		return events
	} else {
		throw new TypeError('Incorrect parameters')
	}
}

export const ensureArray: <T>(data: T | T[]) => T[] = <T>(data: T | T[]) => {
	if ('undefined' === typeof data) {
		return []
	}
	return (Array === data.constructor ? data : [data]) as T[]
}

export const forEachObj = (
	object: { [key: string]: any },
	callback: Function
) => {
	Object.keys(object).map((key: any) => callback(object[key], key))
}
