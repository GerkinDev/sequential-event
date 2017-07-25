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
			const mySequentialEvent1 = new SequentialEvent();

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
			}).catch( done );
		});
		it( 'Single event, multiple callbacks', done => {
			const called = {};
			const mySequentialEvent1 = new SequentialEvent();

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
			}).catch( done );
		});
		it( 'Multiple event, single callback', done => {
			const called = {};

			const mySequentialEvent1 = new SequentialEvent();
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
			}).catch( done );
		});
	});
	describe( 'Asynchrone events', ()=> {
		it( 'Single event, single callback', done => {
			const called = {};
			const mySequentialEvent1 = new SequentialEvent();

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
			}).catch( done );
		});
		it( 'Single event, multiple callbacks', done => {
			const called = {};
			const mySequentialEvent1 = new SequentialEvent();

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
			}).catch( done );
		});
	});
});
describe( 'Promises resolve/reject arguments', () => {
	describe( 'Only async handlers', () => {
		it( 'Single handler', done => {
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on( 'test', ( ...args )=> {
				return new Promise(( resolve, reject ) => {
					try {
						expect( args ).to.eql([ 'Hello', 42 ]);
						return setTimeout(() => {
							return resolve( data );
						}, 100 );
					} catch ( e ) {
						return reject( e );
					}
				});
			});
			mySequentialEvent1.emit( 'test', 'Hello', 42 ).then( ret=> {
				try {
					expect( ret ).to.equal( data );
					return done();
				} catch ( e ) {
					return done( e );
				}
			}).catch( done );
		});
		it( 'Multiple handlers', done => {
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on( 'test', ( ...args ) => {
				return new Promise(( resolve, reject ) => {
					try {
						expect( args ).to.eql([ 'Hello', 42 ]);
						return setTimeout(() => {
							return resolve( data );
						}, 100 );
					} catch ( e ) {
						return reject( e );
					}
				});
			});
			mySequentialEvent1.on( 'test', ( ...args ) => {
				return new Promise(( resolve, reject ) => {
					try {
						expect( args ).to.eql([ 'Hello', 42, data ]);
						return setTimeout(() => {
							return resolve( data );
						}, 100 );
					} catch ( e ) {
						return reject( e );
					}
				});
			});
			mySequentialEvent1.emit( 'test', 'Hello', 42 ).then( ret=> {
				try {
					expect( ret ).to.equal( data );
					return done();
				} catch ( e ) {
					return done( e );
				}
			}).catch( done );
		});
		it( 'Handler throws error', done => {
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', () => {
				return new Promise(( resolve, reject ) => {
					setTimeout(() => {
						return reject( new Error( 'Expected error' ));
					}, 100 );
				});
			});
			mySequentialEvent1.emit( 'test' ).then(() => {
				done( new Error( 'Should throw an error' ));
			}).catch( err => {
				try {
					expect( err ).to.be.a( Error ) && expect( err.message ).to.equal( 'Expected error' );
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
	});
	describe( 'Only sync handlers', () => {
		it( 'Single handler', done => {
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on( 'test', ( ...args ) => {
				expect( args ).to.eql([ 'Hello', 42 ]);
				return data;
			});
			mySequentialEvent1.emit( 'test', 'Hello', 42 ).then( ret => {
				try {
					expect( ret ).to.equal( data );
					return done();
				} catch ( e ) {
					return done( e );
				}
			}).catch( done );
		});
		it( 'Multiple handlers', done => {
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on( 'test', ( ...args ) => {
				expect( args ).to.eql([ 'Hello', 42 ]);
				return data;
			});
			mySequentialEvent1.on( 'test', ( ...args ) => {
				expect( args ).to.eql([ 'Hello', 42, data ]);
				return data;
			});
			mySequentialEvent1.emit( 'test', 'Hello', 42 ).then( ret=> {
				try {
					expect( ret ).to.equal( data );
					return done();
				} catch ( e ) {
					return done( e );
				}
			}).catch( done );
		});
		it( 'Handler throws error', done => {
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on( 'test', () => {
				throw new Error( 'Expected error' );
			});
			mySequentialEvent1.emit( 'test' ).then(() => {
				done( new Error( 'Should throw an error' ));
			}).catch( err => {
				try {
					expect( err ).to.be.a( Error ) && expect( err.message ).to.equal( 'Expected error' );
					return done();
				} catch ( e ) {
					return done( e );
				}
			});
		});
	});
	it( 'Mixed handlers', done => {
		const mySequentialEvent1 = new SequentialEvent();
		const data = new Date().getTime();

		mySequentialEvent1.on( 'test', ( ...args ) => {
			return new Promise(( resolve, reject ) => {
				try {
					expect( args ).to.eql([ 'Hello', 42 ]);
					return setTimeout(() => {
						return resolve( data );
					}, 100 );
				} catch ( e ) {
					return reject( e );
				}
			});
		});
		mySequentialEvent1.on( 'test', ( ...args ) => {
			expect( args ).to.eql([ 'Hello', 42, data ]);
			return data + 1;
		});
		mySequentialEvent1.on( 'test', ( ...args ) => {
			return new Promise(( resolve, reject ) => {
				try {
					expect( args ).to.eql([ 'Hello', 42, data + 1 ]);
					return setTimeout(() => {
						return resolve( args[2] + 1 );
					}, 100 );
				} catch ( e ) {
					return reject( e );
				}
			});
		});
		mySequentialEvent1.emit( 'test', 'Hello', 42 ).then( ret => {
			try {
				expect( ret ).to.equal( data + 2 );
				return done();
			} catch ( e ) {
				return done( e );
			}
		}).catch( done );
	});
});
