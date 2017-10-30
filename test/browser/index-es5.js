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
		return mySequentialEvent.emit('foo').then(function () {
			return mySequentialEvent.emit('foo');
		}).then(function () {
			return mySequentialEvent.emit('foo');
		}).then(function () {
			expect(called, 'Callback should be executed once, but was executed ' + called + ' times').to.eql(1);
		});
	});
	it('Remove all listeners', function () {
		var mySequentialEvent = new SequentialEvent();

		mySequentialEvent.on('foo', function () {
			return Promise.reject('"foo" should not be called');
		});
		mySequentialEvent.on('bar', function () {
			return Promise.reject('"bar" should not be called');
		});
		mySequentialEvent.off();
		return mySequentialEvent.emit('foo').then(function () {
			return mySequentialEvent.emit('bar');
		});
	});
	it('Remove listeners on single event', function () {
		var mySequentialEvent = new SequentialEvent();

		var called = 0;
		mySequentialEvent.on('foo', function () {
			return Promise.reject('"foo" should not be called');
		});
		mySequentialEvent.on('bar', function () {
			called++;
		});
		mySequentialEvent.off('foo');
		return mySequentialEvent.emit('foo').then(function () {
			return mySequentialEvent.emit('bar');
		}).then(function () {
			expect(called, '"bar" should be executed once, but was executed ' + called + ' times').to.eql(1);
		});
	});
	it('Remove listeners on single non existent event', function () {
		var mySequentialEvent = new SequentialEvent();

		var called = 0;
		mySequentialEvent.on('bar', function () {
			called++;
		});
		var events = {};
		for (var eventCat in mySequentialEvent.__events) {
			events[eventCat] = mySequentialEvent.__events[eventCat];
		}
		mySequentialEvent.off('foo');
		return mySequentialEvent.emit('foo').then(function () {
			return mySequentialEvent.emit('bar');
		}).then(function () {
			expect(called, '"bar" should be executed once, but was executed ' + called + ' times').to.eql(1);
			for (var i in events) {
				expect(events[i]).to.be.equal(mySequentialEvent.__events[i]);
			}
		});
	});
	it('Manually add an event listener', function () {
		var mySequentialEvent = new SequentialEvent();

		var called = 0;
		mySequentialEvent.__events.bar = function () {
			called++;
		};
		return mySequentialEvent.emit('bar').then(function () {
			expect(called, '"bar" should be executed once, but was executed ' + called + ' times').to.eql(1);
		});
	});
	describe('Use Objects to describe events', function () {
		it('Check "on"', function () {
			var mySequentialEvent = new SequentialEvent();

			var called = {};
			mySequentialEvent.on({
				a: function a() {
					called.a = true;
				},
				b: [function () {
					called.b1 = true;
				}, function () {
					called.b2 = true;
				}]
			});
			return mySequentialEvent.emit('a').then(function () {
				return mySequentialEvent.emit('b');
			}).then(function () {
				expect(called).to.be.eql({
					a: true,
					b1: true,
					b2: true
				}, 'All callbacks should have been called');
			});
		});
		it('Check "once"', function () {
			var mySequentialEvent = new SequentialEvent();

			var called = {};
			mySequentialEvent.once({
				a: function a() {
					called.a = true;
				},
				b: [function () {
					called.b1 = true;
				}, function () {
					called.b2 = true;
				}]
			});
			return mySequentialEvent.emit('a').then(function () {
				return mySequentialEvent.emit('b');
			}).then(function () {
				expect(called).to.be.eql({
					a: true,
					b1: true,
					b2: true
				}, 'All callbacks should have been called');
				expect(mySequentialEvent.__events).to.have.property('a');
				expect(mySequentialEvent.__events.a).to.be.an('array').and.to.be.empty;
				expect(mySequentialEvent.__events).to.have.property('b');
				expect(mySequentialEvent.__events.b).to.be.an('array').and.to.be.empty;
			});
		});
		it('Check "off" with "on"', function () {
			var mySequentialEvent = new SequentialEvent();

			var called = {};
			var fcts = {
				a: function a() {
					called.a = true;
				},
				b: [function () {
					called.b1 = true;
				}, function () {
					called.b2 = true;
				}]
			};
			mySequentialEvent.on(fcts);
			mySequentialEvent.off({
				a: fcts.a,
				b: fcts.b[0]
			});
			return mySequentialEvent.emit('a').then(function () {
				return mySequentialEvent.emit('b');
			}).then(function () {
				expect(called).to.be.eql({
					b2: true
				}, 'Only callback b2 should have been executed');
			});
		});
		it('Check "off" with "once"', function () {
			var mySequentialEvent = new SequentialEvent();

			var called = {};
			var fcts = {
				a: function a() {
					called.a = true;
				},
				b: [function () {
					called.b1 = true;
				}, function () {
					called.b2 = true;
				}]
			};
			mySequentialEvent.once(fcts);
			mySequentialEvent.off({
				a: fcts.a,
				b: fcts.b[0]
			});
			return mySequentialEvent.emit('a').then(function () {
				return mySequentialEvent.emit('b');
			}).then(function () {
				expect(called).to.be.eql({
					b2: true
				}, 'Only callback b2 should have been executed');
				expect(mySequentialEvent.__events).to.have.property('a');
				expect(mySequentialEvent.__events.a).to.be.an('array').and.to.be.empty;
				expect(mySequentialEvent.__events).to.have.property('b');
				expect(mySequentialEvent.__events.b).to.be.an('array').and.to.be.empty;
			});
		});
	});
}

if ('undefined' !== typeof process && process.env.SAUCE === 'yes') {
	require('./selenium.js');
}
