# SequentialEvent.js

Code checks:  
[![Build Status](https://travis-ci.org/GerkinDev/SequentialEvent.js.svg?branch=master)](https://travis-ci.org/GerkinDev/SequentialEvent.js)
[![Dependency Status](https://gemnasium.com/badges/github.com/GerkinDev/SequentialEvent.js.svg)](https://gemnasium.com/github.com/GerkinDev/SequentialEvent.js)
[![Maintainability](https://api.codeclimate.com/v1/badges/ea9a91bf0396e7eab39d/maintainability)](https://codeclimate.com/github/GerkinDev/SequentialEvent.js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ea9a91bf0396e7eab39d/test_coverage)](https://codeclimate.com/github/GerkinDev/SequentialEvent.js/test_coverage)

Package infos:  
[![npm](https://img.shields.io/npm/dm/sequential-event.svg)](https://npmjs.org/package/sequential-event)
[![npm version](https://badge.fury.io/js/sequential-event.svg)](https://badge.fury.io/js/sequential-event)
[![license](https://img.shields.io/github/license/GerkinDev/SequentialEvent.js.svg)](https://github.com/GerkinDev/SequentialEvent.js)

> **See the API documentation on [github.io/SequentialEvent.js](https://gerkindev.github.io/SequentialEvent.js/)**

This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return **Promises** if it executes asynchronous code.

For usage in the browser, use the files in the `dist` directory

## Example usage

```javascript
const SequentialEvent = require( 'sequential-event' );

function sampleTime( startTime ) {
	return new Date().getTime() - startTime;
}
const eventEmitter = new SequentialEvent();

// We create a new array with a new timer
eventEmitter.on( 'retime', startTime => {
	return [ sampleTime( startTime ) ];
});
// We wait 100ms and we re-time
eventEmitter.on( 'retime', ( startTime, timers ) => {
	// This operation is async, so we return a Promise that will be resolved with the timers array
	return new Promise(( resolve ) => {
		setTimeout(() => {
			timers.push( sampleTime( startTime ));
			return resolve( timers );
		}, 100 );
	});
});
// We re-take a sample immediatly
eventEmitter.on( 'retime', ( startTime, timers ) => {
	// This operation is sync, so we can return our timers array directly
	timers.push( sampleTime( startTime ));
	return timers;
});

eventEmitter
	// Emit our retime event with the current date
	.emit( 'retime', new Date().getTime())
	// Log normaly if everything is OK, or log with error
	.then( timers => console.log( timers ))
	.catch( err => console.error( err ));
```

*Sample output*

> [ 1, 109, 109 ]

You can see that each `on` handlers are executed sequentially, after the end of the previous handler.

## API

The API is based on [Node's EventEmitter](https://nodejs.org/api/events.html). This package provides a re-implementation of the `emit` method.

See the [Node EventEmitter](https://nodejs.org/api/events.html) for methods documentation

## Compatibility

This package can run on
* Node `>=` 6.0.0
* Browsers:
  * Edge `>=` 12
  * Firefox `>=` 18
  * Chrome `>=` 49
  * Safari & iOS Safari `>=`10
  * Chrome for Android `>=` 61
  * Samsung Internet `>=` 5
  
## Changelogs

### 0.1.1

* Emitting an unknown event now return a Promise resolved immediatly, instead of the boolean `false`.

### 0.1.0

* Initial release.