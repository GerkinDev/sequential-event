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
