'use strict';

/* global describe:false, it: false, SequentialEvent: false, expect: false, exports: false, global: false */

(() => {
	// ....
	if ( 'object' === typeof exports && typeof exports.nodeName !== 'string' ) {
		global.SequentialEvent = require( '../index' );
		global.expect = require( 'expect.js' );
	}
})();

describe( 'Event Emitter', ()=> {
	describe( 'Synchrone events', ()=> {
		it( 'Single event, single callback', done => {
			const called = {};
			let mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', ()=> {
				called.test = true;
			});
			mySequentialEvent1.emit( 'test' ).then(()=> {
				try {
					expect( called ).to.only.have.property( 'test', true );
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
		it( 'Single event, multiple callbacks', done => {
			const called = {};
			let mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', data => {
				called.test_1 = data;
			});
			mySequentialEvent1.on( 'test', data => {
				called.test_2 = data;
			});

			const data = 'hello';
			mySequentialEvent1.emit( 'test', data ).then(()=> {
				try {
					expect( called ).to.eql({
						test_1: data,
						test_2: data,
					});
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
		it( 'Multiple event, single callback', done => {
			const called = {};

			let mySequentialEvent1 = new SequentialEvent();
			mySequentialEvent1.on( 'test_1', data => {
				called.test_1 = data;
			});
			mySequentialEvent1.on( 'test_2', data => {
				called.test_2 = data;
			});

			const data = 'hello';
			Promise.all([
				mySequentialEvent1.emit( 'test_1', data ),
				mySequentialEvent1.emit( 'test_2', data ),
			]).then(()=> {
				try {
					expect( called ).to.eql({
						test_1: data,
						test_2: data,
					});
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
	});
	describe( 'Asynchrone events', ()=> {
		it( 'Single event, single callback', done => {
			const called = {};
			let mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', ()=> {
				return new Promise(( resolve, reject ) => {
					setTimeout(()=> {
						try {
							expect( called ).to.eql({});
						} catch ( e ) {
							return reject( e );
						}
						called.test = true;
						resolve();
					}, 100 );
				});
			});
			mySequentialEvent1.emit( 'test' ).then(()=> {
				try {
					expect( called ).to.only.have.property( 'test', true );
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
		it( 'Single event, multiple callbacks', done => {
			const called = {};
			let mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', data => {
				return new Promise(( resolve, reject ) => {
					setTimeout(()=> {
						try {
							expect( called ).to.eql({});
						} catch ( e ) {
							return reject( e );
						}
						called.test_1 = data;
						resolve();
					}, 200 );
				});
			});
			mySequentialEvent1.on( 'test', data => {
				return new Promise(( resolve, reject ) => {
					setTimeout(()=> {
						try {
							expect( called ).to.eql({
								test_1: data,
							});
						} catch ( e ) {
							return reject( e );
						}
						called.test_2 = data;
						resolve();
					}, 100 );
				});
			});

			const data = 'hello';
			mySequentialEvent1.emit( 'test', data ).then(()=> {
				try {
					expect( called ).to.eql({
						test_1: data,
						test_2: data,
					});
					return done();
				} catch ( e ) {
					return done( e );
				}
			}).catch( e => {
				return done( e );
			});
		});
	});
});

//console.log(, mySequentialEvent1.on, mySequentialEvent1.emit);
