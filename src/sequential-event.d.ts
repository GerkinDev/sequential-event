//import * as SequentialEvent from './sequential-event';

declare namespace SequentialEvent {
  export interface IEventHandler {
    (...args: any[]): Promise<any> | any
  }
  export interface IEventsHash {
    [key: string]: IEventHandler[]
  }
  export interface IOnceHandler extends IEventHandler {
    origFn: IEventHandler
  }
}

declare module 'sequential-event' {
  import SE = SequentialEvent
  export = SE
}

export = SequentialEvent
