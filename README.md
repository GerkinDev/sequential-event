# SequentialEvent.js

> See the documentation on [github.io/SequentialEvent.js](https://nihilivin.github.io/SequentialEvent.js/)

This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return **Promises** if it executes asynchronous code.

For usage in the browser, use the files in the `dist` directory

## Example usage

```javascript
const SequentialEvent = require( 'sequential-event' );

const eventEmitter = new SequentialEvent();
eventEmitter.on( 'hello', () => {
	return new Promise(( resolve, reject ) => {
		setTimeout(() => {
			console.log( `Hello world! Time is ${ new Date().toISOString() }` );
			resolve();
		}, 100 );
	});
});
eventEmitter.on( 'hello', () => {
	console.log( `How are you? Time is ${ new Date().toISOString() }` );
});

console.log( `Time before emit event is ${ new Date().toISOString() }` );
eventEmitter.emit( 'hello' ).then(() => {
	console.log( `Finished event propagation on ${ new Date().toISOString() }` );
});
```

*Sample output*

> Time before emit event is 2017-07-24T17:03:41.921Z   
> Hello world! Time is 2017-07-24T17:03:43.269Z  
> How are you? Time is 2017-07-24T17:03:43.270Z  
> Finished event propagation on 2017-07-24T17:03:43.270Z  

## API

The API is based on [Node's EventEmitter](https://nodejs.org/api/events.html). This package provides a re-implementation of the `emit` method.

See the [Node EventEmitter](https://nodejs.org/api/events.html) for methods documentation