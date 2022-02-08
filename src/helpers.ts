import { HashMap, Point, Rect } from './types';
import { Viewer } from './viewer.class';

declare global {
    interface Window {
        debug: boolean;
    }
}

/** Available console output streams. */
export type ConsoleStream = 'debug' | 'warn' | 'log' | 'error'; // No testing needed for logging

/* istanbul ignore next */ /**
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
    }
    return event.touches && event.touches.length > 0
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : { x: -1, y: -1 };
}

export function generateCoordinateListForTree(element: HTMLElement): HashMap<Rect> {
    if (!element) return {};
    let mapping: HashMap<Rect> = {};
    const p_box = element?.getBoundingClientRect() || {};
    const children = element.querySelectorAll('[id]');
    children.forEach((el) => {
        const box = el?.getBoundingClientRect() || {};
        mapping[el.id] = {
            x:
                Math.floor(
                    ((box.left + box.width / 2 - p_box.left) / (p_box.width)) * 100000
                ) / 100000,
            y:
                Math.floor(
                    ((box.top + box.height / 2 - p_box.top) / (p_box.height)) * 100000
                ) / 100000,
            w: Math.floor((box.width / p_box.width) * 100000) / 100000,
            h: Math.floor((box.height / p_box.height) * 100000) / 100000,
        };
    });
    return mapping;
}

export function coordinatesForElement(viewer: Viewer, id: string, svg_box?: ClientRect) {
    const overlay_el = viewer.element?.querySelector(`.svg-viewer__svg-overlays`);
    const svg_el = viewer.element?.querySelector(`svg`);
    const element = svg_el?.querySelector(`#${cleanCssSelector(id)}`);
    if (element && svg_el && overlay_el) {
        const box = svg_box || overlay_el?.getBoundingClientRect() || {};
        const el_box = element?.getBoundingClientRect() || {};
        const coords = {
            x: (el_box.left + el_box.width / 2 - box.left) / box.width,
            y: (el_box.top + el_box.height / 2 - box.top) / box.height,
        };
        return coords;
    } else {
        log('DOM', `Unable to find element with ID ${id}`, undefined, 'warn');
    }
    return { x: -1, y: -1 };
}

export function coordinatesForPoint(
    viewer: Viewer,
    point: Point,
    svg_box?: ClientRect,
    zoom: number = 1
) {
    const overlay_el = viewer.element?.querySelector(`.svg-viewer__svg-overlays`);
    const svg_el = viewer.element?.querySelector(`svg`);
    if (svg_el && overlay_el) {
        const box = svg_box || overlay_el?.getBoundingClientRect() || {};
        const coords = {
            x: Math.max(0, Math.min(1, ((point.x - box.left) / box.width) * zoom)),
            y: Math.max(0, Math.min(1, ((point.y - box.top) / box.height) * zoom)),
        };
        return coords;
    } else {
        log('DOM', `Unable to find SVG element`, undefined, 'warn');
    }
    return { x: -1, y: -1 };
}

export function relativeSizeOfElement(viewer: Viewer, id: string, svg_box?: ClientRect) {
    const overlay_el = viewer.element?.querySelector(`.svg-viewer__svg-overlays`);
    const svg_el = viewer.element?.querySelector(`svg`);
    const element = svg_el?.querySelector(`#${cleanCssSelector(id)}`);
    if (element && svg_el && overlay_el) {
        const box = svg_box || overlay_el.getBoundingClientRect();
        const el_box = element.getBoundingClientRect();
        return {
            w: el_box.width / box.width,
            h: el_box.height / box.height,
        };
    } else {
        log('DOM', `Unable to find element with ID ${id}`, undefined, 'warn');
    }
    return { w: 0, h: 0 };
}

export function distanceBetween(first: Point, second: Point) {
    return Math.sqrt(Math.pow(first.x - second.x, 2) + Math.pow(first.y - second.y, 2));
}

/** Get point in the middle of a list of points */
export function middleOf(points: Point[]) {
    let x_max = 0,
        x_min = 1;
    let y_max = 0,
        y_min = 1;
    for (const { x, y } of points) {
        if (x > x_max) x_max = x;
        else if (x < x_min) x_min = x;
        if (y > y_max) y_max = y;
        else if (y < y_min) y_min = y;
    }
    return {
        x: (x_max - x_min) / 2 + x_min,
        y: (y_max - y_min) / 2 + y_min,
    };
}

export function calculateCenterFromZoomOffset(delta: number, towards: Point, from: Point, scaling = { x: 1, y: 1 }) {
    return {
        x: +(from.x + (towards.x - from.x) * delta * scaling.x).toFixed(5),
        y: +(from.y + (towards.y - from.y) * delta * scaling.y).toFixed(5),
    };
}

export function basicHash(str: string) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export function simplifyDataObject(obj: any) {
    if (!obj) return '';
    const data = { ...obj };
    for (const key in data) {
        if (data[key] instanceof Object) {
            data[key] = `${data[key]}`;
        }
    }
    return data;
}
