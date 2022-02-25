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
                Math.floor(((box.left + box.width / 2 - p_box.left) / p_box.width) * 100000) /
                100000,
            y:
                Math.floor(((box.top + box.height / 2 - p_box.top) / p_box.height) * 100000) /
                100000,
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

export function calculateCenterFromZoomOffset(
    delta: number,
    towards: Point,
    from: Point,
    scaling = { x: 1, y: 1 }
) {
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

/* Base64 string to array encoding */

export function uint6ToB64(nUint6: number) {
    return nUint6 < 26
        ? nUint6 + 65
        : nUint6 < 52
        ? nUint6 + 71
        : nUint6 < 62
        ? nUint6 - 4
        : nUint6 === 62
        ? 43
        : nUint6 === 63
        ? 47
        : 65;
}

export function base64EncArr(aBytes: Uint8Array) {
    var nMod3 = 2,
        sB64Enc = '';

    for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
        nMod3 = nIdx % 3;
        if (nIdx > 0 && ((nIdx * 4) / 3) % 76 === 0) {
            sB64Enc += '\r\n';
        }
        nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
        if (nMod3 === 2 || aBytes.length - nIdx === 1) {
            sB64Enc += String.fromCodePoint(
                uint6ToB64((nUint24 >>> 18) & 63),
                uint6ToB64((nUint24 >>> 12) & 63),
                uint6ToB64((nUint24 >>> 6) & 63),
                uint6ToB64(nUint24 & 63)
            );
            nUint24 = 0;
        }
    }

    return (
        sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
        (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==')
    );
}

export function strToUTF8Arr(sDOMStr: string) {
    var aBytes,
        nChr,
        nStrLen = sDOMStr.length,
        nArrLen = 0;

    /* mapping... */

    for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
        nChr = sDOMStr.codePointAt(nMapIdx) ?? 0;

        if (nChr > 65536) {
            nMapIdx++;
        }

        nArrLen +=
            nChr < 0x80
                ? 1
                : nChr < 0x800
                ? 2
                : nChr < 0x10000
                ? 3
                : nChr < 0x200000
                ? 4
                : nChr < 0x4000000
                ? 5
                : 6;
    }

    aBytes = new Uint8Array(nArrLen);

    /* transcription... */

    for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
        nChr = sDOMStr.codePointAt(nChrIdx) ?? 0;
        if (nChr < 128) {
            /* one byte */
            aBytes[nIdx++] = nChr;
        } else if (nChr < 0x800) {
            /* two bytes */
            aBytes[nIdx++] = 192 + (nChr >>> 6);
            aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x10000) {
            /* three bytes */
            aBytes[nIdx++] = 224 + (nChr >>> 12);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x200000) {
            /* four bytes */
            aBytes[nIdx++] = 240 + (nChr >>> 18);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        } else if (nChr < 0x4000000) {
            /* five bytes */
            aBytes[nIdx++] = 248 + (nChr >>> 24);
            aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        } /* if (nChr <= 0x7fffffff) */ else {
            /* six bytes */
            aBytes[nIdx++] = 252 + (nChr >>> 30);
            aBytes[nIdx++] = 128 + ((nChr >>> 24) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        }
    }

    return aBytes;
}

export function stringToBase64(str: string) {
    return base64EncArr(strToUTF8Arr(str));
}