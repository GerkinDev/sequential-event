import SequentialEvent from './sequential-event.d'

import IEventHandler = SequentialEvent.IEventHandler
import IEventsHash = SequentialEvent.IEventsHash

/**
* @file File defining the SequentialEvent class
* @licence GPLv3
* @author Gerkin
*/

/**
* Handle execution of all handlers in sequence.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const emitHandlers = (
  handlers: IEventHandler | IEventHandler[],
  object: SequentialEvent,
  args: any[]
): Promise<any> => {
  // Check if the provided handler is a single function or an array of functions
  if ('function' === typeof handlers) {
    return emitHandler(handlers, object, args)
  } else {
    const promiseGen = getNextPromise(handlers, object, args)
    const sourcePromise = new Promise(promiseGen)
    return sourcePromise
  }
}

/**
* Generate next promise for sequence.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/

const getNextPromise = (
  handlers: IEventHandler[],
  object: SequentialEvent,
  args: any[]
): ((resolve: Function, reject: Function) => Function) => {
  let i = 0
  let handlersLength = handlers.length
  return (resolve, reject) => {
    const _getNextPromise = (prevResolve?: any) => {
      // Handle if an event handler disapeared during event dispatching
      const handlersLength2 = handlers.length
      if (handlersLength2 !== handlersLength) {
        i -= handlersLength - handlersLength2
        handlersLength = handlersLength2
      }
      if (i < handlersLength) {
        const stepArgs =
          'undefined' !== typeof prevResolve
            ? args.concat([prevResolve])
            : args.slice(0)
        const newPromise = emitHandler(handlers[i], object, stepArgs)
        newPromise.then(_getNextPromise).catch(reject)
        i++
      } else {
        return resolve.call(null, prevResolve)
      }
    }
    return _getNextPromise()
  }
}

/**
* Handle execution of a single handler.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const emitHandler = (
  handler: IEventHandler,
  object: SequentialEvent,
  args: any[]
): Promise<any> => {
  try {
    const retVal = handler.apply(object, args)
    if ('object' === typeof retVal && 'function' === typeof retVal.then) {
      return retVal
    } else {
      return Promise.resolve(retVal)
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
* Generate an event handler that deregister itself when executed. This handler will be executed  just once.
*
* @param   {SequentialEvent}   target    - Event emitter that will use the handler.
* @param   {string}   eventName - Name of the event to trigger.
* @param   {IEventHandler} eventFn   - Handler for the event.
* @returns {IEventHandler} Function that will be executed only once.
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const onceify = (
  target: SequentialEvent,
  eventName: string,
  eventFn: IEventHandler
): SequentialEvent.IOnceHandler => {
  let called = false
  const once = function(...args: any[]) {
    if (!called) {
      target.off(eventName, once)
      called = true
      return eventFn(...args)
    }
  } as SequentialEvent.IOnceHandler
  once.origFn = eventFn
  return once
}

/**
* Remove provided `callback` from listeners of event `eventCat`.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const removeEventListener = (
  eventCat: IEventHandler[],
  callback: IEventHandler
): void => {
  const indexes = [
    // Check in normal events
    eventCat.indexOf(callback),
    // Check in once events
    (() => {
      const I = eventCat.length
      for (let i = 0; i < I; i++) {
        if ((eventCat[i] as SequentialEvent.IOnceHandler).origFn === callback) {
          return i
        }
      }
      return -1
    })()
  ]
  const index = Math.min(...indexes.filter(v => v >= 0))
  if (isFinite(index)) {
    eventCat.splice(index, 1)
  }
}

/**
* Add an event listener to the provided event hash.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const addEventListener = (
  eventHash: IEventsHash,
  eventName: string,
  callback: IEventHandler
): void => {
  eventHash[eventName] = ensureArray(eventHash[eventName]).concat(
    ensureArray(callback)
  )
}

/**
* Ensure that event & callback are on the associative hash format.
*
* @memberof SequentialEvent
* @author Gerkin
* @inner
*/
const castToEventObject = (
  events: IEventsHash | string,
  callback: IEventHandler
): IEventsHash => {
  if ('object' !== typeof events) {
    const eventsObj: IEventsHash = {}
    events.split(' ').forEach(event => {
      eventsObj[event] = [callback]
    })
    return eventsObj
  } else {
    return events
  }
}

const ensureArray: <T>(data: T | T[]) => T[] = <T>(data: T | T[]) => {
  if ('undefined' === typeof data) {
    return []
  }
  return (Array === data.constructor ? data : [data]) as T[]
}

/**
* Event emitter that guarantees sequential execution of handlers. Each handler may return a **Promise**.
*
* @see {@link https://nodejs.org/api/events.html Node EventEmitter}.
*/
export class SequentialEvent {
  // tslint:disable-next-line:variable-name
  protected __events: { [key: string]: Function[] }
  /**
	* Constructs a new SequentialEvent.
	*
	* @author Gerkin
	*/
  constructor() {
    this.__events = {}
  }

  /**
	* Triggers each corresponding handlers in sequence.
	*
	* @param   {Any}   type   - Name of the event to sequential-event.
	* @param   {Any[]} [args] - Parameters to pass to handlers.
	* @returns {Promise} Returns a Promise resolved when then chain is done.
	* @author Gerkin
	*/
  emit(type: string, ...args: any[]) {
    const events = this.__events

    const handler = events[type]
    if (!handler) {
      return Promise.resolve()
    }

    const retPromise = emitHandlers(handler, this, args)

    return retPromise
  }

  /**
	* Remove one or many or all event handlers.
	*
	* @param   {string|Object} [events]   - Event name or hash of events.
	* @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	* @returns {SequentialEvent} Returns `this`.
	*/
  off(events?: string | { [key: string]: Function }, callback?: Function) {
    const _events = this.__events

    if (!events) {
      this.__events = {}
      return this
    }

    const eventsObj = castToEventObject(events, callback)
    for (const event in eventsObj) {
      if (eventsObj.hasOwnProperty(event)) {
        if (eventsObj[event]) {
          removeEventListener(_events[event], eventsObj[event])
        } else {
          _events[event] = []
        }
      }
    }
    return this
  }

  /**
	* Add one or many event handlers that will be called only once.
	*
	* @param   {string|Object} events     - Event name or hash of events.
	* @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	* @returns {SequentialEvent} Returns `this`.
	*/
  once(events: string | { [key: string]: Function }, callback?: Function) {
    const _events = this.__events

    const eventsObj = castToEventObject(events, callback)
    for (const event in eventsObj) {
      if (eventsObj.hasOwnProperty(event)) {
        const events = ensureArray(eventsObj[event])
        events.forEach(eventHandler => {
          addEventListener(_events, event, onceify(this, event, eventHandler))
        })
      }
    }

    return this
  }

  /**
	* Add one or many event handlers.
	*
	* @param   {string|Object} events     - Event name or hash of events.
	* @param   {Function}      [callback] - If provided an event name with `events`, function to associate with the event.
	* @returns {SequentialEvent} Returns `this`.
	*/
  on(events: string | { [key: string]: Function }, callback?: Function) {
    const _events = this.__events

    const eventsObj = castToEventObject(events, callback)
    for (const event in eventsObj) {
      if (eventsObj.hasOwnProperty(event)) {
        addEventListener(_events, event, eventsObj[event])
      }
    }

    return this
  }
}
