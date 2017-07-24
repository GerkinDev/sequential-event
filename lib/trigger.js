'use strict';

const EventEmitter = require('events').EventEmitter;

function emitHandlers(handlers, object, args){
	if('function' === typeof handlers){
		return emitHandler(handlers, object, args);
	} else {
		let i = 0;
		const handlersLength = handlers.length;

		const sourcePromise = new Promise((resolve, reject) => {
			function getNextPromise(){
				if(i < handlersLength){
					const newPromise = emitHandler(handlers[i], object, args);
					newPromise.then(() => getNextPromise()).catch(reject);
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

function emitHandler(handler, object, args){
	const retVal = handler.apply(object, args);
	if('object' === typeof retVal && Promise === retVal.constructor){
		return retVal;
	} else {
		return Promise.resolve();
	}
}

class Trigger extends EventEmitter{
	constructor(){
		super();
	}

	emit(type, ...args) {
		var er, i;
		var needDomainExit = false;
		var doError = (type === 'error');

		const events = this._events;
		if (events)
			doError = (doError && events.error == null);
		else if (!doError)
			return false;

		const domain = this.domain;

		// If there is no 'error' event listener then throw.
		if (doError) {
			if (arguments.length > 1){
				er = arguments[1];
			}
			if (domain) {
				if (!er)
					er = new Error('Unhandled "error" event');
				if (typeof er === 'object' && er !== null) {
					er.domainEmitter = this;
					er.domain = domain;
					er.domainThrown = false;
				}
				domain.emit('error', er);
			} else if (er instanceof Error) {
				throw er; // Unhandled 'error' event
			} else {
				// At least give some kind of context to the user
				const err = new Error('Unhandled "error" event. (' + er + ')');
				err.context = er;
				throw err;
			}
			return false;
		}

		const handler = events[type];

		if (!handler)
			return false;

		if (domain && this !== process) {
			domain.enter();
			needDomainExit = true;
		}

		const retPromise = emitHandlers(handler, this, args);

		if (needDomainExit)
			domain.exit();

		return retPromise;
	}
}

module.exports = Trigger;
