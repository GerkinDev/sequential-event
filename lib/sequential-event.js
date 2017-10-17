'use strict';

/**
 * @file File defining the SequentialEvent class
 * @licence GPLv3
 * @author Gerkin
 */

const uEvent = require( 'uevent' );

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
function emitHandlers( handlers, object, args ) {
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
}

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
function emitHandler( handler, object, args ) {
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
}

/**
 * Empty class that will be mixed with uEvent
 *
 * @author Gerkin
 * @mixin uEvent
 */
class Proto {}

uEvent.mixin( Proto.prototype, {
	trigger: 'emit',
});

/**
 * Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
 *
 * @extends uEvent
 * @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
 */
class SequentialEvent extends Proto {
	/**
	 * Constructs a new SequentialEvent.
	 *
	 * @author Gerkin
	 */
	constructor() {
		super();
	}

	/**
	 * SequentialEvents each corresponding handlers in sequence.
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
