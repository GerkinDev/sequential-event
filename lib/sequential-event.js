'use strict';

/**
 * @file File defining the SequentialEvent class
 * @licence GPLv3
 * @author Gerkin
 */

/**
 * Handle execution of all handlers in sequence.
 *
 * @param   {Function|Function[]} handlers - Function(s) to execute. Each function may return a Promise.
 * @param   {EventEmitter}        object   - Objecto call event on.
 * @param   {Any[]}               [args]   - Arguments to pass to each called function.
 * @returns {Promise} Promise resolved once each function is executed.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const emitHandlers = ( handlers, object, args ) => {
	// Check if the provided handler is a single function or an array of functions
	if ( 'function' === typeof handlers ) {
		return emitHandler( handlers, object, args );
	} else {
		let i = 0;
		const handlersLength = handlers.length;

		const sourcePromise = new Promise(( resolve, reject ) => {
			/**
			 * Generate next promise for sequence.
			 *
			 * @param   {Any} prevResolve - Event chain resolved value.
			 * @returns {undefined} *This function does not return anything*.
			 * @memberof SequentialEvent
			 * @author Gerkin
			 * @inner
			 */
			const getNextPromise = prevResolve => {
				if ( i < handlersLength ) {
					const stepArgs = 'undefined' !== typeof prevResolve ? args.concat([ prevResolve ]) : args.slice( 0 );
					const newPromise = emitHandler( handlers[i], object, stepArgs );
					newPromise.then( getNextPromise ).catch( reject );
					i++;
				} else {
					return resolve.call( null, prevResolve );
				}
			};
			getNextPromise();
		});
		return sourcePromise;
	}
};

/**
 * Handle execution of a single handler.
 *
 * @param   {Function}     handler - Function to execute. It may return a Promise.
 * @param   {EventEmitter} object  - Object to call event on.
 * @param   {Any[]}        [args]  - Arguments to pass to each called function.
 * @returns {Promise} Promise resolved once this function is done.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const emitHandler = ( handler, object, args ) => {
	try {
		const retVal = handler.apply( object, args );
		if ( 'object' === typeof retVal && 'function' === typeof retVal.then ) {
			return retVal;
		} else {
			return Promise.resolve( retVal );
		}
	} catch ( e ) {
		return Promise.reject( e );
	}
};

/**
 * Generate an event handler that deregister itself when executed. This handler will be executed just once.
 *
 * @param   {Object}   target    - Event emitter that will use the handler.
 * @param   {string}   eventName - Name of the event to trigger.
 * @param   {Function} eventFn   - Handler for the event.
 * @returns {Function} Function that will be executed only once.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const onceify = ( target, eventName, eventFn ) => {
	let called = false;
	const fn = ( ...args ) => {
		if ( !called ) {
			target.off( eventName, fn );
			called = true;
			return eventFn( ...args );
		}
	};
	return fn;
};

const removeEventListener = ( eventCat, callback ) => {
	const index = eventCat.indexOf( callback );
	if ( index !== -1 ) {
		eventCat.splice( index, 1 );
	}
};

const addEventListener = ( eventHash, event, callback ) => {
	eventHash[event] = eventHash[event] || [];
	eventHash[event].push( callback );
};

const castToEventObject = ( events, callback ) => {
	if ( 'object' !== typeof events ) {
		const eventsObj = {};
		events.split( ' ' ).forEach( event => {
			eventsObj[event] = callback;
		});
		return eventsObj;
	} else {
		return events;
	}
};

/**
 * Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
 *
 * @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
 */
class SequentialEvent {
	/**
	 * Constructs a new SequentialEvent.
	 *
	 * @author Gerkin
	 */
	constructor() {
		this.__events = {};
	}

	/**
	 * Add one or many event handlers.
	 *
	 * @param   {string|Object} events     - Event name or hash of events.
	 * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	 * @returns {SequentialEvent} Returns `this`.
	 */
	on( events, callback ) {
		const _events = this.__events;

		const eventsObj = castToEventObject( events, callback );
		for ( const event in eventsObj ) {
			if ( eventsObj.hasOwnProperty( event )) {
				addEventListener( _events, event, eventsObj[event]);
			}
		}

		return this;
	}

	/**
	 * Remove one or many or all event handlers.
	 *
	 * @param   {string|Object} [events]   - Event name or hash of events.
	 * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	 * @returns {SequentialEvent} Returns `this`.
	 */
	off( events, callback ) {
		const _events = this.__events;

		if ( 'object' === typeof events ) {
			for ( const event in events ) {
				if ( events.hasOwnProperty( event )) {
					removeEventListener( _events[event], events[event]);
				}
			}
		} else if ( events ) {
			events.split( ' ' ).forEach( event => {
				if ( callback ) {
					removeEventListener( _events[event], callback );
				} else {
					_events[event].length = 0;
				}
			});
		} else {
			this.__events = {};
		}

		return this;
	}

	/**
	 * Add one or many event handlers that will be called only once.
	 *
	 * @param   {string|Object} events     - Event name or hash of events.
	 * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	 * @returns {SequentialEvent} Returns `this`.
	 */
	once( events, callback ) {
		const _events = this.__events;

		const eventsObj = castToEventObject( events, callback );
		for ( const event in eventsObj ) {
			if ( eventsObj.hasOwnProperty( event )) {
				addEventListener( _events, event, onceify( this, event, eventsObj[event]));
			}
		}

		return this;
	}

	/**
	 * Triggers each corresponding handlers in sequence.
	 *
	 * @param   {Any}   type   - Name of the event to sequential-event.
	 * @param   {Any[]} [args] - Parameters to pass to handlers.
	 * @returns {Promise} Returns a Promise resolved when then chain is done.
	 * @author Gerkin
	 */
	emit( type, ...args ) {
		const events = this.__events;
		if ( !events ) {
			return Promise.resolve();
		}

		const handler = events[type];
		if ( !handler ) {
			return Promise.resolve();
		}

		const retPromise = emitHandlers( handler, this, args );

		return retPromise;
	}
}

module.exports = SequentialEvent;
