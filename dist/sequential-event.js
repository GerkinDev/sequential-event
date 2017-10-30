/**
* @file sequential-event
* 
* This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return Promises if it executes asynchronous code
* Built on 2017-10-30 23:18:31
*
* @license GPL-3.0
* @version 0.3.0
* @author Gerkin
*/
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
    * @param   {SequentialEvent}     object   - Objecto call event on.
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
					var promiseGen = getNextPromise(handlers, object, args);
					var sourcePromise = new Promise(promiseGen);
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

			var getNextPromise = function getNextPromise(handlers, object, args) {
				var i = 0;
				var handlersLength = handlers.length;
				return function (resolve, reject) {
					var _getNextPromise = function _getNextPromise(prevResolve) {
						var handlersLength2 = handlers.length;
						if (handlersLength2 !== handlersLength) {
							i -= handlersLength - handlersLength2;
							handlersLength = handlersLength2;
						}
						if (i < handlersLength) {
							var stepArgs = 'undefined' !== typeof prevResolve ? args.concat([prevResolve]) : args.slice(0);
							var newPromise = emitHandler(handlers[i], object, stepArgs);
							newPromise.then(_getNextPromise).catch(reject);
							i++;
						} else {
							return resolve.call(null, prevResolve);
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
				var once = function once() {
					if (!called) {
						target.off(eventName, once);
						called = true;
						return eventFn.apply(undefined, arguments);
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
			var removeEventListener = function removeEventListener(eventCat, callback) {
				var indexes = [eventCat.indexOf(callback), function () {
					var I = eventCat.length;
					for (var i = 0; i < I; i++) {
						if (eventCat[i].origFn === callback) {
							return i;
						}
					}
					return -1;
				}()];
				var index = Math.min.apply(Math, _toConsumableArray(indexes.filter(function (v) {
					return v >= 0;
				})));
				if (isFinite(index)) {
					eventCat.splice(index, 1);
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
			var addEventListener = function addEventListener(eventHash, eventName, callback) {
				eventHash[eventName] = ensureArray(eventHash[eventName]).concat(ensureArray(callback));
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
			var castToEventObject = function castToEventObject(events, callback) {
				if ('object' !== (typeof events === "undefined" ? "undefined" : _typeof(events))) {
					var eventsObj = {};
					events.split(' ').forEach(function (event) {
						eventsObj[event] = callback;
					});
					return eventsObj;
				} else {
					return events;
				}
			};

			var ensureArray = function ensureArray(data) {
				if ('undefined' === typeof data) {
					return [];
				}
				return Array === data.constructor ? data : [data];
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
     * Triggers each corresponding handlers in sequence.
     *
     * @param   {Any}   type   - Name of the event to sequential-event.
     * @param   {Any[]} [args] - Parameters to pass to handlers.
     * @returns {Promise} Returns a Promise resolved when then chain is done.
     * @author Gerkin
     */


				_createClass(SequentialEvent, [{
					key: "emit",
					value: function emit(type) {
						var events = this.__events;

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

					/**
      * Remove one or many or all event handlers.
      *
      * @param   {string|Object} [events]   - Event name or hash of events.
      * @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
      * @returns {SequentialEvent} Returns `this`.
      */

				}, {
					key: "off",
					value: function off(events, callback) {
						var _events = this.__events;

						if (!events) {
							this.__events = {};
							return this;
						}

						var eventsObj = castToEventObject(events, callback);
						for (var event in eventsObj) {
							if (eventsObj.hasOwnProperty(event)) {
								if (eventsObj[event]) {
									removeEventListener(_events[event], eventsObj[event]);
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

				}, {
					key: "once",
					value: function once(events, callback) {
						var _this = this;

						var _events = this.__events;

						var eventsObj = castToEventObject(events, callback);

						var _loop = function _loop(event) {
							if (eventsObj.hasOwnProperty(event)) {
								var _events2 = ensureArray(eventsObj[event]);
								_events2.forEach(function (eventHandler) {
									addEventListener(_events, event, onceify(_this, event, eventHandler));
								});
							}
						};

						for (var event in eventsObj) {
							_loop(event);
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

				}, {
					key: "on",
					value: function on(events, callback) {
						var _events = this.__events;

						var eventsObj = castToEventObject(events, callback);
						for (var event in eventsObj) {
							if (eventsObj.hasOwnProperty(event)) {
								addEventListener(_events, event, eventsObj[event]);
							}
						}

						return this;
					}
				}]);

				return SequentialEvent;
			}();

			module.exports = SequentialEvent;
		}, {}] }, {}, [1])(1);
});
//# sourceMappingURL=sequential-event.js.map
