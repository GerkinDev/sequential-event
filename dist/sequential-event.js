/**
* @file sequential-event
* 
* This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return Promises if it executes asynchronous code
* Built on 2017-10-17 14:44:14
*
* @license GPL-3.0
* @version 0.1.3
* @author Gerkin
*/
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

            var uEvent = require('uevent');

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
            function emitHandlers(handlers, object, args) {
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
            function emitHandler(handler, object, args) {
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
            }

            /**
             * Empty class that will be mixed with uEvent
             *
             * @author Gerkin
             * @mixin uEvent
             */

            var Proto = function Proto() {
                _classCallCheck(this, Proto);
            };

            uEvent.mixin(Proto.prototype, {
                trigger: 'emit'
            });

            /**
             * Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
             *
             * @extends uEvent
             * @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
             */

            var SequentialEvent = function (_Proto) {
                _inherits(SequentialEvent, _Proto);

                /**
                 * Constructs a new SequentialEvent.
                 *
                 * @author Gerkin
                 */
                function SequentialEvent() {
                    _classCallCheck(this, SequentialEvent);

                    return _possibleConstructorReturn(this, (SequentialEvent.__proto__ || Object.getPrototypeOf(SequentialEvent)).call(this));
                }

                /**
                 * SequentialEvents each corresponding handlers in sequence.
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
            }(Proto);

            module.exports = SequentialEvent;
        }, { "uevent": 2 }], 2: [function (require, module, exports) {
            /*!
             * uEvent - to make any js object an event emitter
             * Copyright 2011 Jerome Etienne (http://jetienne.com)
             * Copyright 2015-2016 Damien "Mistic" Sorel (http://www.strangeplanet.fr)
             * Licensed under MIT (http://opensource.org/licenses/MIT)
             */

            (function (root, factory) {
                if (typeof module !== 'undefined' && module.exports) {
                    module.exports = factory();
                } else if (typeof define === 'function' && define.amd) {
                    define([], factory);
                } else {
                    root.uEvent = factory();
                }
            })(this, function () {
                "use strict";

                var returnTrue = function returnTrue() {
                    return true;
                };
                var returnFalse = function returnFalse() {
                    return false;
                };

                var uEvent = function uEvent() {};

                /**
                 * Event object used to stop propagations and prevent default
                 */
                uEvent.Event = function (type, args) {
                    var typeReadOnly = type;
                    var argsReadonly = args;

                    Object.defineProperties(this, {
                        'type': {
                            get: function get() {
                                return typeReadOnly;
                            },
                            set: function set(value) {},
                            enumerable: true
                        },
                        'args': {
                            get: function get() {
                                return argsReadonly;
                            },
                            set: function set(value) {},
                            enumerable: true
                        }
                    });
                };

                uEvent.Event.prototype = {
                    constructor: uEvent.Event,

                    isDefaultPrevented: returnFalse,
                    isPropagationStopped: returnFalse,

                    preventDefault: function preventDefault() {
                        this.isDefaultPrevented = returnTrue;
                    },
                    stopPropagation: function stopPropagation() {
                        this.isPropagationStopped = returnTrue;
                    }
                };

                uEvent.prototype = {
                    constructor: uEvent,

                    /**
                     * Add one or many event handlers
                     *
                     *  obj.on('event', callback)
                     *  obj.on('event', listener) -- listener has an handleEvent method
                     *  obj.on('event1 event2', callback)
                     *  obj.on({ event1: callback1, event2: callback2 })
                     *
                     * @param {String,Object} events
                     * @param {Function,optional} callback
                     * @return {Object} main object
                     */
                    on: function on(events, callback) {
                        this.__events = this.__events || {};

                        if ((typeof events === "undefined" ? "undefined" : _typeof(events)) === 'object') {
                            for (var event in events) {
                                if (events.hasOwnProperty(event)) {
                                    this.__events[event] = this.__events[event] || [];
                                    this.__events[event].push(events[event]);
                                }
                            }
                        } else {
                            events.split(' ').forEach(function (event) {
                                this.__events[event] = this.__events[event] || [];
                                this.__events[event].push(callback);
                            }, this);
                        }

                        return this;
                    },

                    /**
                     * Remove one or many or all event handlers
                     *
                     *  obj.off('event')
                     *  obj.off('event', callback)
                     *  obj.off('event1 event2')
                     *  obj.off({ event1: callback1, event2: callback2 })
                     *  obj.off()
                     *
                     * @param {String|Object,optional} events
                     * @param {Function,optional} callback
                     * @return {Object} main object
                     */
                    off: function off(events, callback) {
                        this.__events = this.__events || {};

                        if ((typeof events === "undefined" ? "undefined" : _typeof(events)) === 'object') {
                            for (var event in events) {
                                if (events.hasOwnProperty(event) && event in this.__events) {
                                    var index = this.__events[event].indexOf(events[event]);
                                    if (index !== -1) this.__events[event].splice(index, 1);
                                }
                            }
                        } else if (!!events) {
                            events.split(' ').forEach(function (event) {
                                if (event in this.__events) {
                                    if (callback) {
                                        var index = this.__events[event].indexOf(callback);
                                        if (index !== -1) this.__events[event].splice(index, 1);
                                    } else {
                                        this.__events[event].length = 0;
                                    }
                                }
                            }, this);
                        } else {
                            this.__events = {};
                        }

                        return this;
                    },

                    /**
                     * Add one or many event handlers that will be called only once
                     * This handlers are only applicable to "trigger", not "change"
                     *
                     *  obj.once('event', callback)
                     *  obj.once('event1 event2', callback)
                     *  obj.once({ event1: callback1, event2: callback2 })
                     *
                     * @param {String|Object} events
                     * @param {Function,optional} callback
                     * @return {Object} main object
                     */
                    once: function once(events, callback) {
                        this.__once = this.__once || {};

                        if ((typeof events === "undefined" ? "undefined" : _typeof(events)) === 'object') {
                            for (var event in events) {
                                if (events.hasOwnProperty(event)) {
                                    this.__once[event] = this.__once[event] || [];
                                    this.__once[event].push(events[event]);
                                }
                            }
                        } else {
                            events.split(' ').forEach(function (event) {
                                this.__once[event] = this.__once[event] || [];
                                this.__once[event].push(callback);
                            }, this);
                        }

                        return this;
                    },

                    /**
                     * Trigger all handlers for an event
                     *
                     * @param {String} event name
                     * @param {mixed...,optional} arguments
                     * @return {uEvent.Event}
                     */
                    trigger: function trigger(event /* , args... */) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var e = new uEvent.Event(event, args);
                        var i, l, f;

                        args.push(e);

                        if (this.__events && event in this.__events) {
                            for (i = 0, l = this.__events[event].length; i < l; i++) {
                                f = this.__events[event][i];
                                if ((typeof f === "undefined" ? "undefined" : _typeof(f)) === 'object') {
                                    f.handleEvent(e);
                                } else {
                                    f.apply(this, args);
                                }
                                if (e.isPropagationStopped()) {
                                    return e;
                                }
                            }
                        }

                        if (this.__once && event in this.__once) {
                            for (i = 0, l = this.__once[event].length; i < l; i++) {
                                f = this.__once[event][i];
                                if ((typeof f === "undefined" ? "undefined" : _typeof(f)) === 'object') {
                                    f.handleEvent(e);
                                } else {
                                    f.apply(this, args);
                                }
                                if (e.isPropagationStopped()) {
                                    delete this.__once[event];
                                    return e;
                                }
                            }
                            delete this.__once[event];
                        }

                        return e;
                    },

                    /**
                     * Trigger all modificators for an event, each handler must return a value
                     *
                     * @param {String} event name
                     * @param {mixed} event value
                     * @param {mixed...,optional} arguments
                     * @return {mixed} modified value
                     */
                    change: function change(event, value /* , args... */) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var e = new uEvent.Event(event, args);
                        var i, l, f;

                        args.push(e);

                        if (this.__events && event in this.__events) {
                            for (i = 0, l = this.__events[event].length; i < l; i++) {
                                args[0] = value;
                                f = this.__events[event][i];
                                if ((typeof f === "undefined" ? "undefined" : _typeof(f)) === 'object') {
                                    value = f.handleEvent(e);
                                } else {
                                    value = f.apply(this, args);
                                }
                                if (e.isPropagationStopped()) {
                                    return value;
                                }
                            }
                        }

                        return value;
                    }
                };

                /**
                 * Copy all uEvent functions in the destination object
                 *
                 * @param {Object} target, the object which will support uEvent
                 * @param {Object,optional} names, strings map to rename methods
                 */
                uEvent.mixin = function (target, names) {
                    names = names || {};
                    target = typeof target === 'function' ? target.prototype : target;

                    ['on', 'off', 'once', 'trigger', 'change'].forEach(function (name) {
                        var method = names[name] || name;
                        target[method] = uEvent.prototype[name];
                    });

                    Object.defineProperties(target, {
                        '__events': {
                            value: null,
                            writable: true
                        },
                        '__once': {
                            value: null,
                            writable: true
                        }
                    });
                };

                return uEvent;
            });
        }, {}] }, {}, [1])(1);
});
//# sourceMappingURL=sequential-event.js.map
