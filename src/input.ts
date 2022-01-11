/* istanbul ignore file */

// TODO: Add tests for this file

import { BehaviorSubject, fromEvent, merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { clearAsyncTimeout, timeout } from './async';
import {
    calculateCenterFromZoomOffset,
    coordinatesForElement,
    coordinatesForPoint,
    distanceBetween,
    eventToPoint,
    log,
    middleOf,
} from './helpers';
import { getViewer, postEvent, update } from './store';

import { HashMap, Point } from './types';
import { Viewer } from './viewer.class';

export interface ViewerEvent<T extends Event = Event> {
    /** ID of the viewer associated with the event */
    id: string;
    /** Event type */
    type: string;
    /** Event sent */
    event: T;
}

export interface ViewerAction {
    /** Event type */
    type: string;
    /** Callback for event */
    fn: (_: Event) => void;
}
/** Mapping of Viewers to the lister actions */
const _view_actions = new BehaviorSubject<HashMap<Subscription>>({});
/** Mapping of custom action hash to viewer */
const _focus_feature_map: HashMap<string> = {};
/** Whether user is currently performming a pinch */
let _pinching: boolean = false;
/** Whether user is currently performing a pan */
let _panning: boolean = false;
/** Starting point of the current panning action */
let _start_point: Point;
/** Starting point of the current action */
let _action_start: Point;
/** Starting distance of the current pinch action */
let _distance: number;

let _mousemove: any;
let _mouseend: any;
let _touchmove: any;
let _touchend: any;

const DEFAULT_ACTION_TYPES = [
    'click',
    'mousedown',
    'mousemove',
    'mouseup',
    'touchstart',
    'touchmove',
    'touchend',
    'mousewheel',
    'wheel',
];

let _listening_for_resize = false;

window.addEventListener('blur', () => handlePinchAndPanEnd());

export function focusOnFeature(viewer: Viewer) {
    const _focus_string = JSON.stringify(viewer.focus);
    if (viewer.focus && _focus_string !== _focus_feature_map[viewer.id]) {
        let coordinates = { x: 0, y: 0 };
        const zoom = Math.max(0.5, Math.min(10, viewer.focus.zoom_level || 1));
        if (typeof viewer.focus.location === 'string') {
            coordinates = coordinatesForElement(viewer, viewer.focus.location);
        } else {
            coordinates = viewer.focus.location;
        }
        _focus_feature_map[viewer.id] = _focus_string;
        const center = { x: 1 - coordinates.x, y: 1 - coordinates.y };
        update(viewer, {
            center,
            desired_center: center,
            zoom,
            desired_zoom: zoom,
        });
    }
}

export function listenForResize() {
    if (_listening_for_resize) return;
    window.addEventListener('resize', () => postEvent('resize'));
    window.addEventListener('blur', () => handlePinchAndPanEnd());
    _listening_for_resize = true;
}

export function listenForViewActions(viewer: Viewer, actions: string[] = DEFAULT_ACTION_TYPES) {
    const action_map = _view_actions.getValue();
    const element = viewer.element as HTMLElement;
    if (action_map[viewer.id]) {
        action_map[viewer.id].unsubscribe();
    }
    const action_list: Observable<ViewerEvent>[] = [];

    for (const type of actions) {
        action_list.push(
            fromEvent(element, type).pipe(map((e) => ({ id: viewer.id, type, event: e })))
        );
    }
    action_map[viewer.id] = merge(...action_list).subscribe((details) => {
        const { id, type, event } = details;
        const e: any = event;
        e.preventDefault();
        handleCustomEvents(details);
        switch (type) {
            case 'touchstart':
            case 'mousedown':
                e.touches?.length >= 2 ? handlePinchStart(id, e) : handlePanStart(id, e);
                break;
            case 'touchend':
            case 'mouseup':
                if (!_panning && !_pinching) {
                    handleViewClick(id, e);
                }
                handlePinchAndPanEnd();
                break;
            case 'mousewheel':
            case 'wheel':
                handleScrolling(id, e);
                break;
        }
    });
    _view_actions.next(action_map);
    return;
}

export function handleViewClick(id: string, event: MouseEvent) {
    const view = getViewer(id);
    if (view) {
        log('INPUT', `Clicked:`, coordinatesForPoint(view, eventToPoint(event)));
    }
}

export function handleDoubleClick(id: string) {
    log('INPUT', 'Resetting zoom level and center position...');
    const view = getViewer(id);
    if (view) {
        update(view, { desired_zoom: 1, desired_center: { x: 0.5, y: 0.5 } });
    }
}

export function handlePanStart(id: string, event: MouseEvent) {
    if (_pinching) return;
    log('INPUT', 'Starting panning...');
    const view = getViewer(id);
    if (_mousemove) window.removeEventListener('mousemove', _mousemove);
    if (_mousemove) window.removeEventListener('mouseup', _mouseend);
    if (_touchmove) window.removeEventListener('touchmove', _touchmove);
    if (_touchmove) window.removeEventListener('touchend', _touchend);
    if (view && !view.options.disable_pan) {
        _start_point = eventToPoint(event);
        if (event instanceof MouseEvent) {
            _mousemove = (e: MouseEvent) => handlePanning(id, e, _start_point);
            _mouseend = () => handlePinchAndPanEnd();
            window.addEventListener('mousemove', _mousemove);
            window.addEventListener('mouseup', _mouseend);
        } else {
            _touchmove = (e: MouseEvent) => handlePanning(id, e, _start_point);
            _touchend = () => handlePinchAndPanEnd();
            window.addEventListener('touchmove', _touchmove);
            window.addEventListener('touchend', _touchend);
        }
        timeout('pan_start', () => (_panning = true), 200);
    }
}

export function handlePanning(id: string, event: MouseEvent, start: Point = _start_point) {
    if (_pinching) return;
    _panning = true;
    const view = getViewer(id);
    if (view) {
        const point = eventToPoint(event);
        const center = {
            x: Math.max(
                0,
                Math.min(
                    1,
                    (point.x - start.x) / view.box.width / view.desired_zoom + view.center.x
                )
            ),
            y: Math.max(
                0,
                Math.min(
                    1,
                    (point.y - start.y) / view.box.height / view.desired_zoom + view.center.y
                )
            ),
        };
        _start_point = point;
        update(view, { center, desired_center: center });
    }
}

export function handlePinchStart(id: string, event: TouchEvent) {
    log('INPUT', 'Starting pinching...');
    if (_touchmove) window.removeEventListener('touchmove', _touchmove);
    const view = getViewer(id);
    _pinching = true;
    if (view && !view.options.disable_zoom) {
        const points = [
            { x: event.touches[0].clientX, y: event.touches[0].clientY },
            { x: event.touches[1].clientX, y: event.touches[1].clientY },
        ];
        const { x, y } = middleOf(points.map((_) => coordinatesForPoint(view, _)));
        _action_start = { x: 1 - x, y: 1 - y };
        _distance = distanceBetween(points[0], points[1]);
        if (!(event instanceof MouseEvent)) {
            _touchmove = (e: TouchEvent) =>
                e.touches.length >= 2 ? handlePinch(id, e, _distance) : '';
            window.addEventListener('touchmove', _touchmove);
        }
    }
}

export function handlePinch(id: string, event: TouchEvent, distance: number = _distance) {
    const view = getViewer(id);
    if (view && !view.options.disable_zoom) {
        const points = [
            { x: event.touches[0].clientX, y: event.touches[0].clientY },
            { x: event.touches[1].clientX, y: event.touches[1].clientY },
        ];
        const dist = distanceBetween(points[0], points[1]);
        const zoom = Math.max(0.5, Math.min(10, (view.zoom * dist) / distance));
        const center =
            zoom === 1 || zoom === 10 || zoom === view.zoom
                ? view.center
                : calculateCenterFromZoomOffset(+(dist / distance - 1).toFixed(5), _action_start, view.center, view.content_ratio);
        _distance = dist;
        update(view, {
            zoom,
            center,
            desired_zoom: zoom,
            desired_center: center,
        });
    }
}

export function handlePinchAndPanEnd() {
    log('INPUT', 'Ending pinch/pan...');
    clearAsyncTimeout('pan_start');
    _pinching = false;
    _panning = false;
    if (_mousemove) window.removeEventListener('mousemove', _mousemove);
    if (_mouseend) window.removeEventListener('mouseup', _mouseend);
    if (_touchmove) window.removeEventListener('touchmove', _touchmove);
    if (_touchend) window.removeEventListener('touchend', _touchend);
    _mousemove = _mouseend = _touchmove = _touchend = _action_start = null as any;
}

export function handleScrolling(id: string, event: WheelEvent) {
    const view = getViewer(id);
    if (view) {
        const delta = event.deltaY >= 0 ? -0.02 : 0.02;
        const zoom = Math.min(10, Math.max(0.5, view.zoom * (1 + delta)));
        _action_start = coordinatesForPoint(view, eventToPoint(event));
        timeout('clear_action_start', () => _action_start = null as any);
        const point = {
            x: 1 - _action_start.x,
            y: 1 - _action_start.y,
        };
        const center =
            zoom === 1 || zoom === 10 || zoom === view.zoom
                ? view.center
                : calculateCenterFromZoomOffset(+(delta).toFixed(5), point, view.center, view.content_ratio);
        update(view, {
            zoom,
            center,
            desired_zoom: zoom,
            desired_center: center,
        });
    }
}

export function handleCustomEvents(details: ViewerEvent) {
    const { id, type, event } = details;
    const viewer = getViewer(id);
    if (!viewer || !viewer.actions?.length) return;
    const action = viewer.actions.find(
        (e) => e.action === type && (e.id === '*' || e.id === (event.target as any)?.id)
    );
    if (!action) return;
    action.callback(event, coordinatesForPoint(viewer, eventToPoint(event as any)));
}
