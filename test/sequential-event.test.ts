import { SequentialEvent } from '../src/sequential-event';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const asyncMock = (ms: number, implementation?: (...args: any[]) => any) => {
	const mock = jest.fn(implementation);
	async function mockAsync(...args: any[]) {
		await sleep(ms);
		return mock(...args);
	}
	Object.assign(mockAsync as any, { mock, _isMockFunction: true }, mock);
	mockAsync.prototype = mock.prototype;
	return mockAsync;
};

describe('Event Emitter', () => {
	it('Triggering unknown event', async () => {
		const mySequentialEvent1 = new SequentialEvent();

		const ret = await mySequentialEvent1.emit('test');
		expect(ret).toBeUndefined();
	});
	it('Check hasEvent/has methods', () => {
		const mySequentialEvent1 = new SequentialEvent();

		mySequentialEvent1.on('a', () => undefined);
		expect(mySequentialEvent1.has('a')).toEqual(true);
		expect(mySequentialEvent1.has('b')).toEqual(false);
		expect(mySequentialEvent1.hasEvent('a')).toEqual(true);
		expect(mySequentialEvent1.hasEvent('b')).toEqual(false);
	});
	describe('Synchrone events', () => {
		it('Single event, single callback', async () => {
			const test = jest.fn();
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', test);
			await mySequentialEvent1.emit('test');

			expect(test).toHaveBeenCalledTimes(1);
			expect(test).toHaveBeenCalledWith();
		});
		it('Single event, multiple callbacks', async () => {
			const tests = [jest.fn(), jest.fn()];
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', tests[0]);
			mySequentialEvent1.on('test', tests[1]);

			const data = 'hello';
			await mySequentialEvent1.emit('test', data);

			expect(tests[0]).toHaveBeenCalledTimes(1);
			expect(tests[0]).toHaveBeenCalledWith(data);
			expect(tests[1]).toHaveBeenCalledTimes(1);
			expect(tests[1]).toHaveBeenCalledWith(data);
		});
		it('Multiple event, single callback', async () => {
			const tests = [jest.fn(), jest.fn()];
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test_1', tests[0]);
			mySequentialEvent1.on('test_2', tests[1]);

			const data = 'hello';
			await Promise.all([
				mySequentialEvent1.emit('test_1', data),
				mySequentialEvent1.emit('test_2', data),
			]);

			expect(tests[0]).toHaveBeenCalledTimes(1);
			expect(tests[0]).toHaveBeenCalledWith(data);
			expect(tests[1]).toHaveBeenCalledTimes(1);
			expect(tests[1]).toHaveBeenCalledWith(data);
		});
	});
	describe('Asynchrone events', () => {
		it('Single event, single callback', async () => {
			const test = asyncMock(100);
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', test);
			await mySequentialEvent1.emit('test');

			expect(test).toHaveBeenCalledTimes(1);
			expect(test).toHaveBeenCalledWith();
		});
		it('Single event, multiple callbacks', async () => {
			const tests = [asyncMock(200), asyncMock(100)];
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', tests[0]);
			mySequentialEvent1.on('test', tests[1]);

			const data = 'hello';
			await mySequentialEvent1.emit('test', data);

			expect(tests[0]).toHaveBeenCalledTimes(1);
			expect(tests[0]).toHaveBeenCalledWith(data);
			expect(tests[1]).toHaveBeenCalledTimes(1);
			expect(tests[1]).toHaveBeenCalledWith(data);
		});
	});
});
describe('Promises resolve/reject arguments', () => {
	describe('Only async handlers', () => {
		it('Single handler', async () => {
			const test = asyncMock(100, () => data);
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on('test', test);
			const ret = await mySequentialEvent1.emit('test', 'Hello', 42);

			expect(test).toHaveBeenCalledTimes(1);
			expect(test).toHaveBeenCalledWith('Hello', 42);
			expect(ret).toEqual(data);
		});
		it('Multiple handlers', async () => {
			const tests = [asyncMock(100, () => data), asyncMock(100, () => data + 100)];
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on('test', tests[0]);
			mySequentialEvent1.on('test', tests[1]);
			const ret = await mySequentialEvent1.emit('test', 'Hello', 42);

			expect(tests[0]).toHaveBeenCalledTimes(1);
			expect(tests[0]).toHaveBeenCalledWith('Hello', 42);
			expect(tests[1]).toHaveBeenCalledTimes(1);
			expect(tests[1]).toHaveBeenCalledWith('Hello', 42, data);
			expect(ret).toEqual(data + 100);
		});
		it('Handler throws error', async () => {
			const test = asyncMock(100, () => {
				throw new Error();
			});
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', test);
			return expect(mySequentialEvent1.emit('test')).rejects.toThrow();
		});
	});
	describe('Only sync handlers', () => {
		it('Single handler', async () => {
			const test = jest.fn(() => data);
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on('test', test);
			const ret = await mySequentialEvent1.emit('test', 'Hello', 42);

			expect(test).toHaveBeenCalledTimes(1);
			expect(test).toHaveBeenCalledWith('Hello', 42);
			expect(ret).toEqual(data);
		});
		it('Multiple handlers', async () => {
			const tests = [jest.fn(() => data), jest.fn(() => 'foo')];
			const mySequentialEvent1 = new SequentialEvent();
			const data = new Date().getTime();

			mySequentialEvent1.on('test', tests[0]);
			mySequentialEvent1.on('test', tests[1]);
			const ret = await mySequentialEvent1.emit('test', 'Hello', 42);

			expect(tests[0]).toHaveBeenCalledTimes(1);
			expect(tests[0]).toHaveBeenCalledWith('Hello', 42);
			expect(tests[1]).toHaveBeenCalledTimes(1);
			expect(tests[1]).toHaveBeenCalledWith('Hello', 42, data);
			expect(ret).toEqual('foo');
		});
		it('Handler throws error', () => {
			const test = jest.fn(() => {
				throw new Error('Expected error');
			});
			const mySequentialEvent1 = new SequentialEvent();

			mySequentialEvent1.on('test', test);
			expect(mySequentialEvent1.emit('test')).rejects.toThrow();
		});
	});
	it('Mixed handlers', async () => {
		const argsInc = (a, b, c = data) => c + 1;
		const tests = [
			asyncMock(100, argsInc),
			jest.fn(argsInc),
			asyncMock(200, argsInc),
		];
		const mySequentialEvent1 = new SequentialEvent();
		const data = new Date().getTime();

		mySequentialEvent1.on('test', tests[0]);
		mySequentialEvent1.on('test', tests[1]);
		mySequentialEvent1.on('test', tests[2]);
		const ret = await mySequentialEvent1.emit('test', 'Hello', 42);

		expect(tests[0]).toHaveBeenCalledTimes(1);
		expect(tests[0]).toHaveBeenCalledWith('Hello', 42);
		expect(tests[1]).toHaveBeenCalledTimes(1);
		expect(tests[1]).toHaveBeenCalledWith('Hello', 42, data + 1);
		expect(tests[2]).toHaveBeenCalledTimes(1);
		expect(tests[2]).toHaveBeenCalledWith('Hello', 42, data + 2);
		expect(ret).toEqual(data + 3);
	});
});
describe('Once & remove listeners', () => {
	it('"once" handlers should be executed only once', async () => {
		const test = jest.fn();
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.once('foo', test);
		await Promise.all([
			mySequentialEvent.emit('foo'),
			mySequentialEvent.emit('foo'),
			mySequentialEvent.emit('foo'),
		]);

		expect(test).toHaveBeenCalledTimes(1);
	});
	it('Paralllel execution of "once" should be prevented inside the handler function', async () => {
		const tests = [jest.fn(), jest.fn()];
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.once('a', tests);
		await Promise.all([
			mySequentialEvent.emit('a', 'FOO', 1),
			mySequentialEvent.emit('a', 'BAR', 42),
		]);
		expect(tests[0]).toHaveBeenCalledTimes(1);
		expect(tests[0]).toHaveBeenCalledWith('FOO', 1);
		expect(tests[1]).toHaveBeenCalledTimes(1);
		expect(tests[1]).toHaveBeenCalledWith('BAR', 42);
	});
	it('Remove all listeners', async () => {
		const tests = [jest.fn(), jest.fn()];
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.on('foo', tests[0]);
		mySequentialEvent.on('bar', tests[1]);
		mySequentialEvent.off(true);
		await Promise.all([
			mySequentialEvent.emit('foo'),
			mySequentialEvent.emit('bar'),
		]);

		expect(tests[0]).toHaveBeenCalledTimes(0);
		expect(tests[1]).toHaveBeenCalledTimes(0);
	});
	it('Remove all listeners on single event', async () => {
		const tests = [jest.fn(), jest.fn()];
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.on('foo', tests[0]);
		mySequentialEvent.on('bar', tests[1]);
		mySequentialEvent.off('foo');
		await Promise.all([
			mySequentialEvent.emit('foo'),
			mySequentialEvent.emit('bar'),
		]);

		expect(tests[0]).toHaveBeenCalledTimes(0);
		expect(tests[1]).toHaveBeenCalledTimes(1);
	});
});
describe('Use Objects to describe events', () => {
	it('Check "on"', async () => {
		const tests = {
			a: jest.fn(),
			b: [jest.fn(), jest.fn()],
		};
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.on(tests);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);

		expect(tests.a).toHaveBeenCalledTimes(2);
		expect(tests.b[0]).toHaveBeenCalledTimes(2);
		expect(tests.b[1]).toHaveBeenCalledTimes(2);
	});
	it('Check "once"', async () => {
		const tests = {
			a: jest.fn(),
			b: [jest.fn(), jest.fn()],
		};
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.once(tests);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);

		expect(tests.a).toHaveBeenCalledTimes(1);

		expect(tests.b[0]).toHaveBeenCalledTimes(1);
		expect(tests.b[1]).toHaveBeenCalledTimes(1);
	});
	it('Check "off" with "on"', async () => {
		const tests = {
			a: jest.fn(),
			b: [jest.fn(), jest.fn()],
		};
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.on(tests);
		mySequentialEvent.off({
			a: tests.a,
			b: tests.b[0],
		});
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);

		expect(tests.a).toHaveBeenCalledTimes(0);
		expect(tests.b[0]).toHaveBeenCalledTimes(0);
		expect(tests.b[1]).toHaveBeenCalledTimes(2);
	});
	it('Check "off" with "once"', async () => {
		const tests = {
			a: jest.fn(),
			b: [jest.fn(), jest.fn()],
		};
		const mySequentialEvent = new SequentialEvent();

		mySequentialEvent.once(tests);
		mySequentialEvent.off({
			a: tests.a,
			b: tests.b[0],
		});
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);
		await Promise.all([mySequentialEvent.emit('a'), mySequentialEvent.emit('b')]);

		expect(tests.a).toHaveBeenCalledTimes(0);
		expect(tests.b[0]).toHaveBeenCalledTimes(0);
		expect(tests.b[1]).toHaveBeenCalledTimes(1);
	});
});
