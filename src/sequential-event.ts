import IEventHandler = SequentialEvent.IEventHandler
import IEventsHash = SequentialEvent.IEventsHash
import IEventHash = SequentialEvent.IEventHash

import {
	getNextPromise,
	addEventListener,
	removeEventListener,
	ensureArray,
	castToEventObject,
	emitHandlers,
	onceify,
	forEachObj,
} from './utils'

/**
 * @file File defining the SequentialEvent class
 * @licence GPLv3
 * @author Gerkin
 */

/**
 * Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
 *
 * @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
 */
export class SequentialEvent {
	// tslint:disable-next-line:variable-name
	protected __events: IEventsHash

	/**
	 * Constructs a new SequentialEvent.
	 *
	 * @author Gerkin
	 */
	constructor() {
		this.__events = {}
	}

	/**
	 * Triggers each corresponding handlers in sequence.
	 *
	 * @author Gerkin
	 */
	emit(type: string, ...args: any[]) {
		const events = this.__events

		const handler = events[type]
		if (!handler) {
			return Promise.resolve()
		}

		const retPromise = emitHandlers(handler, this, args)

		return retPromise
	}

	/**
	 * Remove one or many or all event handlers.
	 *
	 * @author Gerkin
	 */
	off(events: string, callback?: IEventHandler): this
	off(events?: IEventsHash): this
	off(events?: any, callback?: IEventHandler): this {
		const _events = this.__events

		if (!events) {
			this.__events = {}
			return this
		}

		if ('function' !== typeof callback) {
			if ('string' === typeof events) {
				events.split(' ').forEach(event => (_events[event] = []))
			} else {
				const eventsHash: IEventHash = events
				forEachObj(eventsHash, (handler, event) => {
					removeEventListener(_events[event], handler)
				})
			}
		} else {
			const eventsObj = castToEventObject(events, callback)
			forEachObj(eventsObj, (handler, event) => {
				if (_events[event]) {
					removeEventListener(_events[event], handler)
				} else {
					_events[event] = []
				}
			})
		}
		return this
	}

	/**
	 * Add one or many event handlers.
	 *
	 * @author Gerkin
	 */
	on(events: string | IEventsHash, callback?: IEventHandler) {
		const _events = this.__events

		const eventsObj = castToEventObject(events, callback)
		forEachObj(eventsObj, (handler, event) => {
			addEventListener(_events, event, handler)
		})

		return this
	}

	/**
	 * Add one or many event handlers that will be called only once.
	 *
	 * @author Gerkin
	 */
	once(events: string | IEventsHash, callback?: IEventHandler) {
		const _events = this.__events

		const eventsObj = castToEventObject(events, callback)
		forEachObj(eventsObj, (handler, event) => {
			const handlers = ensureArray(handler)
			handlers.forEach(eventHandler => {
				addEventListener(_events, event, onceify(this, event, eventHandler))
			})
		})

		return this
	}

	has(event: string) {
		return this.hasEvent(event)
	}
	hasEvent(event: string): boolean {
		return this.__events.hasOwnProperty(event)
	}
}
