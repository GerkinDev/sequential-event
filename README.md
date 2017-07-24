# SequentialEvent.js

> See the documentation on [github.io/SequentialEvent.js](https://nihilivin.github.io/SequentialEvent.js/)

This library is a variation of standard event emitters. Handlers are executed sequentialy, and may return **Promises** if it executes asynchronous code

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
	return new Promise(( resolve, reject ) => {
		setTimeout(() => {
			console.log( `How are you? Time is ${ new Date().toISOString() }` );
			resolve();
		}, 200 );
	});
});

console.log( `Time before emit event is ${ new Date().toISOString() }` );
eventEmitter.emit( 'hello' ).then(() => {
	console.log( `Finished event propagation on ${ new Date().toISOString() }` );
});
```

*Sample output*

> Time before emit event is 2017-07-24T16:49:08.433Z  
> Hello world! Time is 2017-07-24T16:49:08.549Z  
> How are you? Time is 2017-07-24T16:49:08.755Z  
> Finished event propagation on 2017-07-24T16:49:08.756Z  
