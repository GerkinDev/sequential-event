/**
* @file sequential-event
* 
* This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return Promises if it executes asynchronous code
* Built on 2017-10-17 18:03:41
*
* @license GPL-3.0
* @version 0.2.0
* @author Gerkin
*/
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (f) {
	if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
		module.exports = f();
	} else if (typeof define === "function" && define.amd) {
		define([], f);
	} else {
		var g;if (typeof window !== "undefined") {
			g = window;
		} else if (typeof global !== "undefined") {
			g = global;
		} else if (typeof self !== "undefined") {
			g = self;
		} else {
			g = this;
		}g.SequentialEvent = f();
	}
})(function () {
	var define, module, exports;return function e(t, n, r) {
		function s(o, u) {
			if (!n[o]) {
				if (!t[o]) {
					var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
				}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
					var n = t[o][1][e];return s(n ? n : e);
				}, l, l.exports, e, t, n, r);
			}return n[o].exports;
		}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
			s(r[o]);
		}return s;
	}({ 1: [function (require, module, exports) {
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

			var emitHandlers = function emitHandlers(handlers, object, args) {
				// Check if the provided handler is a single function or an array of functions
				if ('function' === typeof handlers) {
					return emitHandler(handlers, object, args);
				} else {
					var i = 0;
					var handlersLength = handlers.length;

					var sourcePromise = new Promise(function (resolve, reject) {
						/**
       * Generate next promise for sequence.
       *
       * @param   {Any} prevResolve - Event chain resolved value.
       * @returns {undefined} *This function does not return anything*.
       * @memberof SequentialEvent
       * @author Gerkin
       * @inner
       */
						function getNextPromise(prevResolve) {
							if (i < handlersLength) {
								var stepArgs = 'undefined' !== typeof prevResolve ? args.concat([prevResolve]) : args.slice(0);
								var newPromise = emitHandler(handlers[i], object, stepArgs);
								newPromise.then(getNextPromise).catch(reject);
								i++;
							} else {
								return resolve.call(null, prevResolve);
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
    * @inner
    */
			var emitHandler = function emitHandler(handler, object, args) {
				try {
					var retVal = handler.apply(object, args);
					if ('object' === (typeof retVal === "undefined" ? "undefined" : _typeof(retVal)) && 'function' === typeof retVal.then) {
						return retVal;
					} else {
						return Promise.resolve(retVal);
					}
				} catch (e) {
					return Promise.reject(e);
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
			var onceify = function onceify(target, eventName, eventFn) {
				var called = false;
				var fn = function fn() {
					if (!called) {
						target.off(eventName, fn);
						called = true;
						return eventFn.apply(undefined, arguments);
					}
				};
				return fn;
			};

			/**
    * Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
    *
    * @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
    */

			var SequentialEvent = function () {
				/**
     * Constructs a new SequentialEvent.
     *
     * @author Gerkin
     */
				function SequentialEvent() {
					_classCallCheck(this, SequentialEvent);

					this.__events = {};
				}

				/**
     * Add one or many event handlers.
     *
     * @param   {string|Object} events     - Event name or hash of events.
     * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
     * @returns {SequentialEvent} `this`.
     */


				_createClass(SequentialEvent, [{
					key: "on",
					value: function on(events, callback) {
						var _events = this.__events;

						if ('object' === (typeof events === "undefined" ? "undefined" : _typeof(events))) {
							for (var event in events) {
								if (events.hasOwnProperty(event)) {
									_events[event] = _events[event] || [];
									_events[event].push(events[event]);
								}
							}
						} else {
							events.split(' ').forEach(function (event) {
								_events[event] = _events[event] || [];
								_events[event].push(callback);
							}, this);
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

				}, {
					key: "off",
					value: function off(events, callback) {
						var _events = this.__events;

						if ('object' === (typeof events === "undefined" ? "undefined" : _typeof(events))) {
							for (var event in events) {
								if (events.hasOwnProperty(event) && event in _events) {
									var index = _events[event].indexOf(events[event]);
									if (index !== -1) {
										_events[event].splice(index, 1);
									}
								}
							}
						} else if (events) {
							events.split(' ').forEach(function (event) {
								if (event in _events) {
									if (callback) {
										var index = _events[event].indexOf(callback);
										if (index !== -1) {
											_events[event].splice(index, 1);
										}
									} else {
										_events[event].length = 0;
									}
								}
							}, this);
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

				}, {
					key: "once",
					value: function once(events, callback) {
						var _this = this;

						var _events = this.__events;

						if ('object' === (typeof events === "undefined" ? "undefined" : _typeof(events))) {
							for (var event in events) {
								if (events.hasOwnProperty(event)) {
									_events[event] = _events[event] || [];
									_events[event].push(onceify(this, event, events[event]));
								}
							}
						} else {
							events.split(' ').forEach(function (event) {
								_events[event] = _events[event] || [];
								_events[event].push(onceify(_this, event, callback));
							}, this);
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

				}, {
					key: "emit",
					value: function emit(type) {
						var events = this.__events;
						if (!events) {
							return Promise.resolve();
						}

						var handler = events[type];
						if (!handler) {
							return Promise.resolve();
						}

						for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
							args[_key - 1] = arguments[_key];
						}

						var retPromise = emitHandlers(handler, this, args);

						return retPromise;
					}
				}]);

				return SequentialEvent;
			}();

			module.exports = SequentialEvent;
		}, {}] }, {}, [1])(1);
});
//# sourceMappingURL=sequential-event.js.map
