'use strict';

/**
 * @file File defining the Trigger class
 * @licence GPLv3
 * @author Gerkin
 */

const EventEmitter = require( 'events' ).EventEmitter;

/**
 * Handle execution of all handlers in sequence
 * @param	{Function|Function[]}	handlers	Function(s) to execute. Each function may return a Promise
 * @param	{EventEmitter}			object		Objecto call event on
 * @param	{Any[]}					[args]		Arguments to pass to each called function
 * @returns	{Promise}				Promise resolved once each function is executed
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
			 * Generate next promise for sequence
			 * @returns {undefined}
			 * @author Gerkin
			 * @private
			 */
			function getNextPromise() {
				if ( i < handlersLength ) {
					const newPromise = emitHandler( handlers[i], object, args );
					newPromise.then(() => getNextPromise()).catch( reject );
					i++;
				} else {
					return resolve();
				}
			}
			getNextPromise();
		});
		return sourcePromise;
	}
}

/**
 * Handle execution of a single handler
 * @param	{Function}		handler	Function to execute. It may return a Promise
 * @param	{EventEmitter}	object	Object to call event on
 * @param	{Any[]}			[args]	Arguments to pass to each called function
 * @returns	{Promise}		Promise resolved once this function is done
 * @author Gerkin
 * @private
 */
function emitHandler( handler, object, args ) {
	const retVal = handler.apply( object, args );
	if ( 'object' === typeof retVal && Promise === retVal.constructor ) {
		return retVal;
	} else {
		return Promise.resolve();
	}
}

/**
 * @classdesc Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**
 * @extends EventEmitter
 */
class Trigger extends EventEmitter {
	/**
	 * Constructs a new Trigger
	 * @author Gerkin
	 */
	constructor() {
		super();
	}

	/**
	 * Triggers each corresponding handlers in sequence
	 * @param   {Any}				type		Name of the event to trigger
	 * @param   {Any[]}				[args...]	Parameters to pass to handlers
	 * @returns	{boolean|Promise}	false if no handlers found or an error occured. Otherwise, returns a Promise resolved when then chain is done
	 * @author Gerkin
	 */
	emit( type, ...args ) {
		let needDomainExit = false;
		let doError = ( 'error' === type );

		const events = this._events;
		if ( events ) {
			doError = ( doError && null == events.error );
		} else if ( !doError ) {
			return false;
		}

		const domain = this.domain;

		// If there is no 'error' event listener then throw.
		if ( doError ) {
			let er;
			if ( arguments.length > 1 ) {
				er = arguments[1];
			}
			if ( domain ) {
				if ( !er ) {
					er = new Error( 'Unhandled "error" event' );
				}
				if ( 'object' === typeof er && er !== null ) {
					er.domainEmitter = this;
					er.domain = domain;
					er.domainThrown = false;
				}
				domain.emit( 'error', er );
			} else if ( er instanceof Error ) {
				throw er; // Unhandled 'error' event
			} else {
				// At least give some kind of context to the user
				const err = new Error( `Unhandled "error" event. (${  er  })` );
				err.context = er;
				throw err;
			}
			return false;
		}

		const handler = events[type];

		if ( !handler ) {
			return false;
		}

		if ( 'undefined' !== typeof process && domain && this !== process ) {
			domain.enter();
			needDomainExit = true;
		}

		const retPromise = emitHandlers( handler, this, args );

		if ( needDomainExit ) {
			domain.exit();
		}

		return retPromise;
	}
}

module.exports = Trigger;
