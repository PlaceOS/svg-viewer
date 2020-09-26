import { Point } from './types';
import { Viewer } from './viewer.class';

declare global {
    interface Window {
        debug: boolean;
    }
}

/** Available console output streams. */
export type ConsoleStream = 'debug' | 'warn' | 'log' | 'error';

/**
 * Log data to the browser console
 * @param type Type of message
 * @param msg Message body
 * @param args array of argments to log to the console
 * @param stream Stream to emit the console on. 'debug', 'log', 'warn' or 'error'
 * @param force Whether to force message to be emitted when debug is disabled
 */
export function log(
    type: string,
    msg: string,
    args?: any,
    stream: ConsoleStream = 'debug',
    force: boolean = false,
    app_name: string = 'SVG VIEWER'
) {
    if (window.debug || force) {
        const colors: string[] = ['color: #E91E63', 'color: #ffb300', 'color: default'];
        if (args) {
            console[stream](`%c[${app_name}]%c[${type}] %c${msg}`, ...colors, args);
        } else {
            console[stream](`%c[${app_name}]%c[${type}] %c${msg}`, ...colors);
        }
    }
}

/**
 *
 * @param name
 */
export function cleanCssSelector(name: string) {
    let selector = name.replace(/[!"#$%&'()*+,.\/;<=>?@[\\\]^`{|}~]/g, '\\$&');
    const parts = selector.split(' ');
    for (const p of parts) {
        parts.splice(parts.indexOf(p), 1, [p.replace(/^\\/g, '')] as any);
    }
    selector = parts.join(' ');
    return selector;
}

/**
 * Grab point details from mouse or touch event
 * @param event Event to grab details from
 */
export function eventToPoint(event: MouseEvent | TouchEvent): Point {
    if (!event) {
        return { x: -1, y: -1 };
    }
    if (event instanceof MouseEvent) {
        return { x: event.clientX, y: event.clientY };
    } else {
        return event.touches && event.touches.length > 0
            ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
            : { x: -1, y: -1 };
    }
}

export function coordinatesForElement(viewer: Viewer, id: string, svg_box?: ClientRect) {
    const svg_el = viewer.element?.querySelector(`svg`);
    const element = svg_el?.querySelector(`#${cleanCssSelector(id)}`);
    if (element && svg_el) {
        const box = svg_box || svg_el.getBoundingClientRect();
        const el_box = element.getBoundingClientRect();
        const coords = {
            x: ((el_box.left + el_box.width / 2) - box.left) / box.width,
            y: ((el_box.top + el_box.height / 2) - box.top) / box.height,
        };
        return coords;
    } else {
        log('DOM', `Unable to find element with ID ${id}`, undefined, 'warn');
    }
    return { x: -9, y: -9 };
}

export function relativeSizeOfElement(viewer: Viewer, id: string, svg_box?: ClientRect) {
    const svg_el = viewer.element?.querySelector(`svg`);
    const element = svg_el?.querySelector(`#${cleanCssSelector(id)}`);
    if (element && svg_el) {
        const box = svg_box || svg_el.getBoundingClientRect();
        const el_box = element.getBoundingClientRect();
        return {
            w: el_box.width / box.width,
            h: el_box.height / box.height,
        }
    } else {
        log('DOM', `Unable to find element with ID ${id}`, undefined, 'warn');
    }
    return { w: 0, h: 0 };
}
