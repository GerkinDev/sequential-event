import IEventHandler = SequentialEvent.IEventHandler;
import IEventsHash = SequentialEvent.IEventsHash;
import IEventHash = SequentialEvent.IEventHash;

import {
	getNextPromise,
	addEventListener,
	removeEventListener,
	ensureArray,
	emitHandlers,
	onceify,
	forEachObj,
	castArgsToEventsHash,
} from './utils';

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
	/**
	 * Events hash attached to this SequentialEvent instance
	 */
	// tslint:disable-next-line:variable-name
	protected __events: IEventsHash;

	/**
	 * Constructs a new SequentialEvent.
	 *
	 * @author Gerkin
	 */
	constructor() {
		this.__events = {};
	}

	/**
	 * Triggers each corresponding handlers in sequence.
	 *
	 * @param event Name of the event to trigger
	 * @param args Arguments to pass to each handler. Note that those arguments will be appended with previous handler resolution value, if any.
	 * @author Gerkin
	 */
	emit(event: string, ...args: any[]) {
		const events = this.__events;

		const handler = events[event];
		if (!handler) {
			return Promise.resolve();
		}

		const retPromise = emitHandlers(handler, this, args);

		return retPromise;
	}

	/**
	 * Remove one, many or all event handlers on some events.
	 *
	 * @param events String containing event names to unbind. You may indicate several events at once by separating with *spaces*
	 * @param callback Function or array of functions to unbind on specified events
	 * @author Gerkin
	 */
	off(events: string, callback?: IEventHandler | IEventHandler[]): this;
	/**
	 * Remove event handlers on several events at once.
	 *
	 * @param events Object with keys as event names containing a handler or an array of handlers to remove.
	 * @author Gerkin
	 */
	off(events: IEventHash): this;
	/**
	 * Remove all events handlers
	 *
	 * @param all Pass true to delete all handlers
	 * @author Gerkin
	 */
	// tslint:disable-next-line:unified-signatures
	off(all: true): this;
	off(
		events: string | IEventHash | true,
		callback?: IEventHandler | IEventHandler[]
	): this {
		const _events = this.__events;

		if (events === true) {
			this.__events = {};
			return this;
		} else if (typeof events === 'string' && typeof callback === 'undefined') {
			events.split(' ').forEach(event => (this.__events[event] = []));
			return this;
		}

		const eventsHash: IEventsHash = castArgsToEventsHash(events, callback);
		forEachObj(eventsHash, (handler, event) => {
			removeEventListener(_events[event], handler);
		});
		return this;
	}

	/**
	 * Add one or many event handlers.
	 *
	 * @param events String containing event names to bind. You may indicate several events at once by separating with *spaces*
	 * @param callback Function or array of functions to bind on specified events
	 * @author Gerkin
	 */
	on(events: string, callback: IEventHandler | IEventHandler[]): this;
	/**
	 * Add event handlers on several events at once.
	 *
	 * @param events Object with keys as event names containing a handler or an array of handlers to add.
	 * @author Gerkin
	 */
	on(events: IEventHash): this;
	on(
		events: string | IEventHash,
		callback?: IEventHandler | IEventHandler[]
	): this {
		const _events = this.__events;

		const eventsHash: IEventsHash = castArgsToEventsHash(events, callback);
		forEachObj(eventsHash, (handler, event) => {
			addEventListener(_events, event, handler);
		});

		return this;
	}

	/**
	 * Add one or many event handlers. These listeners will be executed once, then are removed
	 *
	 * @param events String containing event names to bind. You may indicate several events at once by separating with *spaces*
	 * @param callback Function or array of functions to bind on specified events
	 * @author Gerkin
	 */
	once(events: string, callback: IEventHandler | IEventHandler[]): this;
	/**
	 * Add event handlers on several events at once. These listeners will be executed once, then are removed
	 *
	 * @param events Object with keys as event names containing a handler or an array of handlers to add.
	 * @author Gerkin
	 */
	once(events: IEventHash): this;
	once(
		events: string | IEventHash,
		callback?: IEventHandler | IEventHandler[]
	): this {
		const _events = this.__events;

		const eventsHash: IEventsHash = castArgsToEventsHash(events, callback);
		forEachObj(eventsHash, (handlers, event) => {
			addEventListener(
				_events,
				event,
				handlers.map(eventHandler => onceify(this, event, eventHandler))
			);
		});

		return this;
	}

	/**
	 * Check if this instance has listeners for the provided event. Alias for `hasEvent`
	 *
	 * @param event Name of the event to check
	 * @author Gerkin
	 */
	has(event: string) {
		return this.hasEvent(event);
	}
	/**
	 * Check if this instance has listeners for the provided event
	 *
	 * @param event Name of the event to check
	 * @author Gerkin
	 */
	hasEvent(event: string): boolean {
		return this.__events.hasOwnProperty(event) && this.__events[event].length > 0;
	}
}
