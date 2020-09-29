import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { getViewer, updateViewer } from './api';
import { subscription, unsubscribe, unsubscribeWith } from './async';
import {
    calculateCenterFromZoomOffset,
    coordinatesForElement,
    coordinatesForPoint,
    eventToPoint,
    log,
} from './helpers';

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
const _view_actions = new BehaviorSubject<HashMap<ViewerAction[]>>({});
/** Emitter for view events */
const _action_emitter = new Subject<ViewerEvent>();
/** Mapping of custom action hash to viewer */
const _custom_action_map: HashMap<string> = {};
/** Mapping of custom action hash to viewer */
const _focus_feature_map: HashMap<string> = {};

const DEFAULT_ACTION_TYPES = [
    'dblclick',
    'click',
    'mousedown',
    'mouseup',
    'touchstart',
    'touchmove',
    'touchend',
    'mousemove',
    'mousewheel',
    'wheel',
];

let _ignore_actions: string[] = [];

export function focusOnFeature(viewer: Viewer) {
    const _focus_string = JSON.stringify(viewer.focus);
    if (viewer.focus && _focus_string !== _focus_feature_map[viewer.id]) {
        let coordinates = { x: 0, y: 0 };
        const zoom = Math.max(1, Math.min(10, viewer.focus.zoom_level || 1));
        if (typeof viewer.focus.location === 'string') {
            coordinates = coordinatesForElement(viewer, viewer.focus.location);
        } else {
            coordinates = viewer.focus.location;
        }
        _focus_feature_map[viewer.id] = _focus_string;
        updateViewer(viewer, {
            desired_center: { x: 1 - coordinates.x, y: 1 - coordinates.y },
            desired_zoom: zoom,
        });
    }
}

export function listenForViewActions(viewer: Viewer, actions: string[] = DEFAULT_ACTION_TYPES) {
    const action_map = _view_actions.getValue();
    const element = viewer.element as HTMLElement;
    if (action_map[viewer.id]) {
        for (const action of action_map[viewer.id]) {
            element.removeEventListener(action.type, action.fn);
        }
    }
    const action_list = [];
    const emitter = _action_emitter;
    for (const type of actions) {
        const action: ViewerAction = {
            type,
            fn: (e: Event) =>
                _ignore_actions.includes(type)
                    ? ''
                    : emitter.next({ id: viewer.id, type, event: e }),
        };
        element.addEventListener(type, action.fn);
        action_list.push(action);
    }
    action_map[viewer.id] = action_list;
    _view_actions.next(action_map);
    const view_emitter = emitter.pipe(filter((_) => !!_ && _.id === viewer.id));
    listenForViewClick(viewer, view_emitter as any);
    listenForViewDoubleClick(viewer, view_emitter as any);
    listenForViewPanStart(viewer, view_emitter as any);
    listenForViewScrolling(viewer, view_emitter as any);
    return;
}

export function listenForViewClick(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    subscription(
        `${viewer.id}-click`,
        emitter
            .pipe(
                filter((_) => _.type === 'click'),
                map((e) => e.event)
            )
            .subscribe((e: any) => {
                log('INPUT', 'Resetting zoom level and center position...');
                const view = getViewer(viewer.id);
                if (view) {
                    log('INPUT', `Clicked:`, coordinatesForPoint(viewer, eventToPoint(e)));
                }
            })
    );
}

export function listenForViewDoubleClick(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    subscription(
        `${viewer.id}-dblclick`,
        emitter
            .pipe(
                filter((_) => _.type === 'dblclick'),
                map((e) => e.event)
            )
            .subscribe((_) => {
                log('INPUT', 'Resetting zoom level and center position...');
                const view = getViewer(viewer.id);
                if (view) {
                    updateViewer(view, { desired_zoom: 1, desired_center: { x: 0.5, y: 0.5 } });
                }
            })
    );
}

export function listenForViewPanStart(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    subscription(
        `${viewer.id}-pan`,
        emitter
            .pipe(
                filter((_) => _.type === 'touchstart' || _.type === 'mousedown'),
                map((e) => e.event)
            )
            .subscribe((e: any) => {
                log('INPUT', 'Starting panning...');
                const view = getViewer(viewer.id);
                if (view) {
                    const start_point = eventToPoint(e);
                    listenForViewPanning(view, emitter, start_point);
                    listenForViewPanEnd(view, emitter);
                }
            })
    );
}

export function listenForViewPanning(
    viewer: Viewer,
    emitter: Observable<ViewerEvent>,
    start: Point
) {
    subscription(
        `${viewer.id}-panning`,
        emitter
            .pipe(
                filter((_) => _.type === 'touchmove' || _.type === 'mousemove'),
                map((e) => e.event)
            )
            .subscribe((e: any) => {
                const view = getViewer(viewer.id);
                if (view) {
                    const point = eventToPoint(e);
                    const diff = Math.abs(point.x - start.x + (point.y - start.y));
                    if (!_ignore_actions.includes('click') && diff > 1) {
                        _ignore_actions.push('click');
                    }
                    const center = {
                        x: Math.max(
                            0,
                            Math.min(
                                1,
                                (point.x - start.x) / view.box.width / view.desired_zoom +
                                    view.center.x
                            )
                        ),
                        y: Math.max(
                            0,
                            Math.min(
                                1,
                                (point.y - start.y) / view.box.height / view.desired_zoom +
                                    view.center.y
                            )
                        ),
                    };
                    start = point;
                    updateViewer(view, { center, desired_center: center });
                }
            })
    );
}

export function listenForViewPanEnd(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    subscription(
        `${viewer.id}-pan_end`,
        emitter.pipe(filter((_) => _.type === 'touchend' || _.type === 'mouseup')).subscribe(() => {
            log('INPUT', 'Ending panning...');
            unsubscribe(`${viewer.id}-pan_end`);
            unsubscribe(`${viewer.id}-panning`);
            setTimeout(() => {
                _ignore_actions = _ignore_actions.filter((i) => i !== 'click');
            }, 100);
        })
    );
}

export function listenForViewScrolling(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    subscription(
        `${viewer.id}-scrolling`,
        emitter
            .pipe(
                filter((_) => _.type === 'mousewheel' || _.type === 'wheel'),
                map((e) => e.event)
            )
            .subscribe((e: any) => {
                const event = e as WheelEvent;
                event.preventDefault(); // Prevent viewport scrolling
                const view = getViewer(viewer.id);
                if (view) {
                    const delta = event.deltaY >= 0 ? -0.02 : 0.02;
                    const zoom = Math.min(10, Math.max(1, view.zoom * (1 + delta)));
                    const box = view.element
                        ?.querySelector('.render-container')
                        ?.getBoundingClientRect();
                    const cursor_point = coordinatesForPoint(view, eventToPoint(e), box);
                    const point = { x: 1 - cursor_point.x, y: 1 - cursor_point.y };
                    const center =
                        zoom === 1 || zoom === 10 || zoom === view.zoom
                            ? view.center
                            : calculateCenterFromZoomOffset(1 + delta, point, view.center);
                    updateViewer(view, {
                        zoom,
                        center,
                        desired_zoom: zoom,
                        desired_center: center,
                    });
                }
            })
    );
}

export function listenForCustomViewActions(
    viewer: Viewer,
    emitter: Observable<ViewerEvent> = _action_emitter as any
) {
    const actions_string = JSON.stringify(viewer.actions);
    if (_custom_action_map[viewer.id] !== actions_string) {
        unsubscribeWith(`${viewer.id}_`);
        for (const action of viewer.actions) {
            subscription(
                `${viewer.id}_${action.id}-${action.action}`,
                emitter.pipe(filter((e) => e && e.type === action.action)).subscribe((e) => {
                    const el: HTMLElement = e.event.target as any;
                    if (el.id === action.id) {
                        action.callback(e.event);
                    }
                })
            );
        }
    }
}
