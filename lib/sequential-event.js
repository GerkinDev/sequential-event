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
 * @private
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
			function getNextPromise( prevResolve ) {
				if ( i < handlersLength ) {
					const stepArgs = 'undefined' !== typeof prevResolve ? args.concat([ prevResolve ]) : args.slice( 0 );
					const newPromise = emitHandler( handlers[i], object, stepArgs );
					newPromise.then( getNextPromise ).catch( reject );
					i++;
				} else {
					return resolve.call( null, prevResolve );
				}
			}
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
 * @private
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

const onceify = ( target, eventName, eventFn ) => {
	const fn = ( ...args ) => {
		target.off( eventName, fn );
		return eventFn( ...args );
	};
	return fn;
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
	}

	/**
	 * Add one or many event handlers.
	 *
	 * @param   {string|Object} events     - Event name or hash of events.
	 * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	 * @returns {SequentialEvent} `this`.
	 */
	on( events, callback ) {
		const _events = ( this.__events = this.__events || {});

		if ( 'object' === typeof events ) {
			for ( const event in events ) {
				if ( events.hasOwnProperty( event )) {
					_events[event] = _events[event] || [];
					_events[event].push( events[event]);
				}
			}
		} else {
			events.split( ' ' ).forEach( event => {
				_events[event] = _events[event] || [];
				_events[event].push( callback );
			}, this );
		}

		return this;
	}

	/**
	 * Remove one or many or all event handlers.
	 *
	 * @param   {string|Object} [events]   - Event name or hash of events.
	 * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	 * @returns {SequentialEvent} `this`.
	 */
	off( events, callback ) {
		const _events = this.__events = this.__events || {};

		if ( 'object' === typeof events ) {
			for ( const event in events ) {
				if ( events.hasOwnProperty( event ) && ( event in _events )) {
					var index = _events[event].indexOf( events[event]);
					if ( index !== -1 ) {
						_events[event].splice( index, 1 );
					}
				}
			}
		} else if ( events ) {
			events.split( ' ' ).forEach( event => {
				if ( event in _events ) {
					if ( callback ) {
						var index = _events[event].indexOf( callback );
						if ( index !== -1 ) {
							_events[event].splice( index, 1 );
						}
					} else {
						_events[event].length = 0;
					}
				}
			}, this );
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
	 * @returns {SequentialEvent} `this`.
	 */
	once( events, callback ) {
		const _events = this.__events = this.__events || {};

		if ( 'object' === typeof events ) {
			for ( const event in events ) {
				if ( events.hasOwnProperty( event )) {
					_events[event] = _events[event] || [];
					_events[event].push( onceify( this, event, events[event]));
				}
			}
		} else {
			events.split( ' ' ).forEach( event => {
				_events[event] = _events[event] || [];
				_events[event].push( onceify( this, event, callback ));
			}, this );
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
