(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
'use strict';

/* global describe:false, it: false, SequentialEvent: false, expect: false, exports: false, global: false */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
	// ....
	if ('undefined' === typeof window && 'object' === (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) && typeof exports.nodeName !== 'string') {
		global.SequentialEvent = require('../index');
		global.expect = require('expect.js');
	}
})();

if (process.env.SAUCE === 'no' || typeof process.env.SAUCE === 'undefined') {
	describe('Event Emitter', function () {
		describe('Synchrone events', function () {
			it('Single event, single callback', function () {
				var called = {};
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function () {
					called.test = true;
				});
				return mySequentialEvent1.emit('test').then(function () {
					expect(called).to.only.have.property('test', true);
				});
			});
			it('Single event, multiple callbacks', function () {
				var called = {};
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function (data) {
					called.test_1 = data;
				});
				mySequentialEvent1.on('test', function (data) {
					called.test_2 = data;
				});

				var data = 'hello';
				return mySequentialEvent1.emit('test', data).then(function () {
					expect(called).to.eql({
						test_1: data,
						test_2: data
					});
				});
			});
			it('Multiple event, single callback', function () {
				var called = {};

				var mySequentialEvent1 = new SequentialEvent();
				mySequentialEvent1.on('test_1', function (data) {
					called.test_1 = data;
				});
				mySequentialEvent1.on('test_2', function (data) {
					called.test_2 = data;
				});

				var data = 'hello';
				return Promise.all([mySequentialEvent1.emit('test_1', data), mySequentialEvent1.emit('test_2', data)]).then(function () {
					expect(called).to.eql({
						test_1: data,
						test_2: data
					});
				});
			});
		});
		describe('Asynchrone events', function () {
			it('Single event, single callback', function () {
				var called = {};
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function () {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							try {
								expect(called).to.eql({});
							} catch (e) {
								return reject(e);
							}
							called.test = true;
							resolve();
						}, 100);
					});
				});
				return mySequentialEvent1.emit('test').then(function () {
					expect(called).to.only.have.property('test', true);
				});
			});
			it('Single event, multiple callbacks', function () {
				var called = {};
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function (data) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							try {
								expect(called).to.eql({});
							} catch (e) {
								return reject(e);
							}
							called.test_1 = data;
							resolve();
						}, 200);
					});
				});
				mySequentialEvent1.on('test', function (data) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							try {
								expect(called).to.eql({
									test_1: data
								});
							} catch (e) {
								return reject(e);
							}
							called.test_2 = data;
							resolve();
						}, 100);
					});
				});

				var data = 'hello';
				return mySequentialEvent1.emit('test', data).then(function () {
					expect(called).to.eql({
						test_1: data,
						test_2: data
					});
				});
			});
		});
	});
	describe('Promises resolve/reject arguments', function () {
		describe('Only async handlers', function () {
			it('Single handler', function () {
				var mySequentialEvent1 = new SequentialEvent();
				var data = new Date().getTime();

				mySequentialEvent1.on('test', function () {
					for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
						args[_key] = arguments[_key];
					}

					return new Promise(function (resolve, reject) {
						try {
							expect(args).to.eql(['Hello', 42]);
							return setTimeout(function () {
								return resolve(data);
							}, 100);
						} catch (e) {
							return reject(e);
						}
					});
				});
				return mySequentialEvent1.emit('test', 'Hello', 42).then(function (ret) {
					expect(ret).to.equal(data);
				});
			});
			it('Multiple handlers', function () {
				var mySequentialEvent1 = new SequentialEvent();
				var data = new Date().getTime();

				mySequentialEvent1.on('test', function () {
					for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
						args[_key2] = arguments[_key2];
					}

					return new Promise(function (resolve, reject) {
						try {
							expect(args).to.eql(['Hello', 42]);
							return setTimeout(function () {
								return resolve(data);
							}, 100);
						} catch (e) {
							return reject(e);
						}
					});
				});
				return mySequentialEvent1.on('test', function () {
					for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
						args[_key3] = arguments[_key3];
					}

					return new Promise(function (resolve, reject) {
						try {
							expect(args).to.eql(['Hello', 42, data]);
							return setTimeout(function () {
								return resolve(data);
							}, 100);
						} catch (e) {
							return reject(e);
						}
					});
				});
				mySequentialEvent1.emit('test', 'Hello', 42).then(function (ret) {
					expect(ret).to.equal(data);
				});
			});
			it('Handler throws error', function () {
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function () {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							return reject(new Error('Expected error'));
						}, 100);
					});
				});
				return mySequentialEvent1.emit('test').then(function () {
					return Promise.reject(new Error('Should throw an error'));
				}).catch(function (err) {
					expect(err).to.be.a(Error) && expect(err.message).to.equal('Expected error');
				});
			});
		});
		describe('Only sync handlers', function () {
			it('Single handler', function () {
				var mySequentialEvent1 = new SequentialEvent();
				var data = new Date().getTime();

				mySequentialEvent1.on('test', function () {
					for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
						args[_key4] = arguments[_key4];
					}

					expect(args).to.eql(['Hello', 42]);
					return data;
				});
				return mySequentialEvent1.emit('test', 'Hello', 42).then(function (ret) {
					expect(ret).to.equal(data);
				});
			});
			it('Multiple handlers', function () {
				var mySequentialEvent1 = new SequentialEvent();
				var data = new Date().getTime();

				mySequentialEvent1.on('test', function () {
					for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
						args[_key5] = arguments[_key5];
					}

					expect(args).to.eql(['Hello', 42]);
					return data;
				});
				mySequentialEvent1.on('test', function () {
					for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
						args[_key6] = arguments[_key6];
					}

					expect(args).to.eql(['Hello', 42, data]);
					return data;
				});
				return mySequentialEvent1.emit('test', 'Hello', 42).then(function (ret) {
					expect(ret).to.equal(data);
				});
			});
			it('Handler throws error', function () {
				var mySequentialEvent1 = new SequentialEvent();

				mySequentialEvent1.on('test', function () {
					throw new Error('Expected error');
				});
				return mySequentialEvent1.emit('test').then(function () {
					return Promise.reject(new Error('Should throw an error'));
				}).catch(function (err) {
					expect(err).to.be.a(Error) && expect(err.message).to.equal('Expected error');
					return Promise.resolve();
				});
			});
		});
		it('Mixed handlers', function () {
			var mySequentialEvent1 = new SequentialEvent();
			var data = new Date().getTime();

			mySequentialEvent1.on('test', function () {
				for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
					args[_key7] = arguments[_key7];
				}

				return new Promise(function (resolve, reject) {
					try {
						expect(args).to.eql(['Hello', 42]);
						return setTimeout(function () {
							return resolve(data);
						}, 100);
					} catch (e) {
						return reject(e);
					}
				});
			});
			mySequentialEvent1.on('test', function () {
				for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
					args[_key8] = arguments[_key8];
				}

				expect(args).to.eql(['Hello', 42, data]);
				return data + 1;
			});
			mySequentialEvent1.on('test', function () {
				for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
					args[_key9] = arguments[_key9];
				}

				return new Promise(function (resolve, reject) {
					try {
						expect(args).to.eql(['Hello', 42, data + 1]);
						return setTimeout(function () {
							return resolve(args[2] + 1);
						}, 100);
					} catch (e) {
						return reject(e);
					}
				});
			});
			mySequentialEvent1.emit('test', 'Hello', 42).then(function (ret) {
				expect(ret).to.equal(data + 2);
			});
		});
	});
	it('Triggering unknown event', function () {
		var mySequentialEvent1 = new SequentialEvent();

		return mySequentialEvent1.emit('test').then(function () {
			return Promise.resolve();
		});
	});
	it('"once" handlers should be executed only once', function () {
		var mySequentialEvent = new SequentialEvent();

		var called = 0;
		mySequentialEvent.once('foo', function () {
			called++;
		});
		mySequentialEvent.emit('foo').then(function () {
			return mySequentialEvent.emit('foo');
		}).then(function () {
			return mySequentialEvent.emit('foo');
		}).then(function () {
			expect('called').to.eql(1);
		});
	});
}

if ('undefined' !== typeof process && process.env.SAUCE === 'yes') {
	require('./selenium.js');
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../index":undefined,"./selenium.js":undefined,"_process":1,"expect.js":undefined}]},{},[2]);
