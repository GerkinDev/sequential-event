import SequentialEvent from './sequential-event'

declare module 'sequential-event' {
	export namespace SequentialEvent {
		export interface IEventHandler {
			(...args: any[]): Promise<any> | any
		}
		export interface IEventsHash {
			[key: string]: IEventHandler[]
		}
		export interface IEventHash {
			[key: string]: IEventHandler | IEventHandler[]
		}
		export interface IOnceHandler extends IEventHandler {
			origFn: IEventHandler
		}
	}
	export = SequentialEvent
}
