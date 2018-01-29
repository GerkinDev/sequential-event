# sequential-event

Code checks:
[![Build Status](https://travis-ci.org/GerkinDev/sequential-event.svg?branch=master)](https://travis-ci.org/GerkinDev/sequential-event)
[![Dependency Status](https://gemnasium.com/badges/github.com/GerkinDev/sequential-event.svg)](https://gemnasium.com/github.com/GerkinDev/sequential-event)
[![Maintainability](https://api.codeclimate.com/v1/badges/6f730e6f07635b7a57ad/maintainability)](https://codeclimate.com/github/GerkinDev/sequential-event/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6f730e6f07635b7a57ad/test_coverage)](https://codeclimate.com/github/GerkinDev/sequential-event/test_coverage)

Package infos:
[![npm](https://img.shields.io/npm/dm/sequential-event.svg)](https://npmjs.org/package/sequential-event)
[![npm version](https://badge.fury.io/js/sequential-event.svg)](https://badge.fury.io/js/sequential-event)
[![license](https://img.shields.io/github/license/GerkinDev/sequential-event.svg)](https://github.com/GerkinDev/sequential-event)

> **See the API documentation on [github.io/sequential-event](https://gerkindev.github.io/sequential-event/)**

This library is a variation of standard event emitters. Handlers are executed
sequentialy, and may return **Promises** if it executes asynchronous code.

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
    // This operation is async, so we return a Promise that will be resolved
    // with the timers array
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

Here is an example of output of this code:

> [ 1, 109, 109 ]

You can see that each `on` handlers are executed sequentially, after the end of
the previous handler.

## API

### emit

Triggers all listeners of the provided events, spraying `params` to each
callbacks. Returned or resolved values from callbacks (if returning a
`Promise`) are passed as last parameter of the next callback function.

Signature:

> emit(*string* `eventName`[, *...any* `params`]) => *Promise(any)*

### off

Remove callbacks from events.

Signature:

> off(*object* `events` ) => *this*

```
// Remove all listeners
eventListener.off();
// Remove all listeners on 'eventFoo'
eventListener.off( 'eventFoo' );
// Remove `cb` from 'eventFoo'
eventListener.off( 'eventFoo', cb );
// Remove `cbFoo` from 'event1' and `cbBar` from 'event2'
eventListener.off({
    event1: cbFoo,
    event2: cbBar,
});
```

### once

Bind callbacks to specified events. The callback will be executable a single
time for each event.

Signatures:

> once(*string* `eventName`, *function* `callback`) => *this*
>
> once(*object* `events` ) => *this*

```
// Attach the same callback to `event1` & `event2`. `event1` callback may be
// executed a single time, as `event2`.
eventListener.once( 'event1 event2', () => Promise.resolve( 'foo' ));
// Bind a callback that returns 'foo' on `event1`, and 'bar' on `event2`. Both
// will be run a single time.
eventListener.once({
    event1: () => Promise.resolve( 'foo' ),
    event2: () => Promise.resolve( 'bar' ),
});
```

### on

Attach callbacks to specified events.

Signatures:

> on(*string* `eventName`, *function* `callback`) => *this*
>
> on(*object* `events` ) => *this*

```
// Attach the same callback to `event1` & `event2`
eventListener.on( 'event1 event2', () => Promise.resolve( 'foo' ));
// Bind a callback that returns 'foo' on `event1`, and 'bar' on `event2`
eventListener.off({
    event1: () => Promise.resolve( 'foo' ),
    event2: () => Promise.resolve( 'bar' ),
});
```

## Compatibility

This package can run on:

* Node `>=` 6.0.0
* Most modern browsers

### NPM scripts

 - `npm t`: Run test suite
 - `npm start`: Run `npm run build` in watch mode
 - `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
 - `npm run test:prod`: Run linting and generate coverage
 - `npm run build`: Generate bundles and typings, create docs
 - `npm run lint`: Lints code
 - `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)
