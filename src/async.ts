import { Subscription } from 'rxjs';

/* istanbul ignore file */

/**
 * @private
 * Store for named timers
 */
const _timers: { [name: string]: number } = {};
/**
 * @private
 * Store for named intervals
 */
const _intervals: { [name: string]: number } = {};
/**
 * @private
 * Store for named subscription unsub callbacks
 */
const _subscriptions: { [name: string]: Subscription | (() => void) } = {};

/**
 * @private
 * Perform any cleanup actions needed before the item is deleted
 */
export function destroyWaitingAsync() {
    // Clear local timers
    for (const key in _timers) {
        if (_timers.hasOwnProperty(key)) {
            clearAsyncTimeout(key);
        }
    }
    // Clear local intervals
    for (const key in _intervals) {
        if (_intervals.hasOwnProperty(key)) {
            clearAsyncInterval(key);
        }
    }
    // Clear local subscriptions
    for (const key in _subscriptions) {
        if (_subscriptions.hasOwnProperty(key)) {
            unsubscribe(key);
        }
    }
}

/**
 * @private
 * Creates a named timer
 * @param name Name of the timer
 * @param fn Callback function for the timer
 * @param delay Callback delay
 */
export function timeout(name: string, fn: () => void, delay: number = 300) {
    if (name && fn && fn instanceof Function) {
        clearAsyncTimeout(name);
        _timers[name] = setTimeout(() => {
            fn();
            delete _timers[name];
        }, delay) as any;
    } else {
        throw new Error(
            name
                ? 'Cannot create named timeout without a name'
                : 'Cannot create a timeout without a callback',
        );
    }
}

/**
 * @private
 * Clears the named timer
 * @param name Timer name
 */
export function clearAsyncTimeout(name: string) {
    if (_timers[name]) {
        clearTimeout(_timers[name]);
        delete _timers[name];
    }
}

/**
 * @private
 * Creates a named interval
 * @param name Name of the interval
 * @param fn Callback function for the interval
 * @param delay Callback delay
 */
export function interval(name: string, fn: () => void, delay: number = 300) {
    if (name && fn && fn instanceof Function) {
        clearAsyncInterval(name);
        _intervals[name] = setInterval(() => fn(), delay) as any;
    } else {
        throw new Error(
            name
                ? 'Cannot create named interval without a name'
                : 'Cannot create a interval without a callback',
        );
    }
}

/**
 * @private
 * Clears the named interval
 * @param name Timer name
 */
export function clearAsyncInterval(name: string) {
    if (_intervals[name]) {
        clearInterval(_intervals[name]);
        delete _intervals[name];
    }
}

/**
 * @private
 * Store named subscription
 * @param name Name of the subscription
 * @param fn Unsubscribe callback or Subscription object
 */
export function subscription(name: string, fn: Subscription | (() => void)) {
    unsubscribe(name);
    _subscriptions[name] = fn;
}

/**
 * @private
 * Call unsubscribe callback with the given name
 * @param name Name of the subscription
 */
export function unsubscribe(name: string) {
    if (_subscriptions && _subscriptions[name]) {
        _subscriptions[name] instanceof Subscription
            ? (_subscriptions[name] as Subscription).unsubscribe()
            : (_subscriptions[name] as any)();
        delete _subscriptions[name];
    }
}

/**
 * @private
 * Unsubscribe from subscriptions with an ID containing the given string
 * @param contains String to look for
 */
export function unsubscribeWith(contains: string) {
    Object.keys(_subscriptions)
        .filter((key) => key.includes(contains))
        .forEach((name) => unsubscribe(name));
}
