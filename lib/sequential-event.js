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
 * @param   {SequentialEvent}     object   - Objecto call event on.
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
		const promiseGen = getNextPromise( handlers, object, args );
		const sourcePromise = new Promise( promiseGen );
		return sourcePromise;
	}
};

/**
 * Generate next promise for sequence.
 *
 * @param   {Function|Function[]} handlers - Function(s) to execute. Each function may return a Promise.
 * @param   {SequentialEvent}     object   - Objecto call event on.
 * @param   {Any[]}               [args]   - Arguments to pass to each called function.
 * @returns {Function} Promise handler.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */

const getNextPromise = ( handlers, object, args ) => {
	let i = 0;
	let handlersLength = handlers.length;
	return ( resolve, reject ) => {
		const _getNextPromise = ( prevResolve ) => {
			const handlersLength2 = handlers.length;
			if ( handlersLength2 !== handlersLength ) {
				i -= handlersLength - handlersLength2;
				handlersLength = handlersLength2;
			}
			if ( i < handlersLength ) {
				const stepArgs = 'undefined' !== typeof prevResolve ? args.concat([ prevResolve ]) : args.slice( 0 );
				const newPromise = emitHandler( handlers[i], object, stepArgs );
				newPromise.then( _getNextPromise ).catch( reject );
				i++;
			} else {
				return resolve.call( null, prevResolve );
			}
		};
		return _getNextPromise();
	};
};

/**
 * Handle execution of a single handler.
 *
 * @param   {Function}        handler - Function to execute. It may return a Promise.
 * @param   {SequentialEvent} object  - Object to call event on.
 * @param   {Any[]}           [args]  - Arguments to pass to each called function.
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
	const once = function once( ...args ) {
		if ( !called ) {
			target.off( eventName, once );
			called = true;
			return eventFn( ...args );
		}
	};
	once.origFn = eventFn;
	return once;
};

/**
 * Remove provided `callback` from listeners of event `eventCat`.
 *
 * @param   {Function[]} eventCat   - Array of listeners to remove callback from.
 * @param   {Function}   [callback] - Callback to remove.
 * @returns {undefined} This function does not returns anything.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const removeEventListener = ( eventCat, callback ) => {
	const indexes = [ eventCat.indexOf( callback ), (() => {
		const I = eventCat.length;
		for(let i = 0; i < I; i++){
			if(eventCat[i].origFn === callback){
				return i;
			}
		}
		return -1;
	})() ];
	const index = Math.min( ...indexes.filter( v => v >= 0 ));
	if ( isFinite( index )) {
		eventCat.splice( index, 1 );
	}
};


/**
 * Add an event listener to the provided event hash.
 *
 * @param   {Object}   eventHash  - Hash of events of the object. It is usually retrieved from `object.__events`.
 * @param   {string}   eventName  - Name of the event to add listener on.
 * @param   {Function} [callback] - Callback to add.
 * @returns {undefined} This function does not returns anything.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
const addEventListener = ( eventHash, eventName, callback ) => {
	eventHash[eventName] = ensureArray( eventHash[eventName]).concat( ensureArray( callback ));
};

/**
 * Ensure that event & callback are on the associative hash format.
 *
 * @param   {Object<string, Function>|string} events   - Events to cast in hash form.
 * @param   {Function}                        callback - Function to associate with those events.
 * @returns {Object<string, Function>} Events in hash format.
 * @memberof SequentialEvent
 * @author Gerkin
 * @inner
 */
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

const ensureArray = data => {
	if ( 'undefined' === typeof data ) {
		return [];
	}
	return Array === data.constructor ? data : [ data ];
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
	 * Triggers each corresponding handlers in sequence.
	 *
	 * @param   {Any}   type   - Name of the event to sequential-event.
	 * @param   {Any[]} [args] - Parameters to pass to handlers.
	 * @returns {Promise} Returns a Promise resolved when then chain is done.
	 * @author Gerkin
	 */
	emit( type, ...args ) {
		const events = this.__events;

		const handler = events[type];
		if ( !handler ) {
			return Promise.resolve();
		}

		const retPromise = emitHandlers( handler, this, args );

		return retPromise;
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

		if ( !events ) {
			this.__events = {};
			return this;
		}

		const eventsObj = castToEventObject( events, callback );
		for ( const event in eventsObj ) {
			if ( eventsObj.hasOwnProperty( event )) {
				if ( eventsObj[event]) {
					removeEventListener( _events[event], eventsObj[event]);
				} else {
					_events[event] = [];
				}
			}
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
				const events = ensureArray( eventsObj[event]);
				events.forEach( eventHandler => {
					addEventListener( _events, event, onceify( this, event, eventHandler ));
				});
			}
		}

		return this;
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
}

module.exports = SequentialEvent;
