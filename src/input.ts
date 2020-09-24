import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { getViewer, updateViewer } from './api';
import { eventToPoint, log } from './helpers';

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
const _action_emitter = new BehaviorSubject<ViewerEvent | null>(null);
/** Mapping of viewers to the event subscriptions */
const _subscriptions: HashMap<Subscription> = {};

const DEFAULT_ACTION_TYPES = [
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
            fn: (e: Event) => emitter.next({ id: viewer.id, type, event: e }),
        };
        element.addEventListener(type, action.fn);
        action_list.push(action);
    }
    action_map[viewer.id] = action_list;
    _view_actions.next(action_map);
    const view_emitter = emitter.pipe(filter((_) => !!_ && _.id === viewer.id));
    listenForViewPanStart(viewer, view_emitter as any);
    listenForViewScrolling(viewer, view_emitter as any);
    return;
}

export function listenForViewPanStart(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    if (_subscriptions[`${viewer.id}_pan`]) {
        _subscriptions[`${viewer.id}_pan`].unsubscribe();
    }
    _subscriptions[`${viewer.id}_pan`] = emitter
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
        });
}

export function listenForViewPanning(
    viewer: Viewer,
    emitter: Observable<ViewerEvent>,
    start: Point
) {
    if (_subscriptions[`${viewer.id}_panning`]) {
        _subscriptions[`${viewer.id}_panning`].unsubscribe();
    }
    _subscriptions[`${viewer.id}_panning`] = emitter
        .pipe(
            filter((_) => _.type === 'touchmove' || _.type === 'mousemove'),
            map((e) => e.event)
        )
        .subscribe((e: any) => {
            const view = getViewer(viewer.id);
            if (view) {
                const point = eventToPoint(e);
                const center = {
                    x: Math.max(
                        0,
                        Math.min(
                            1,
                            (point.x - start.x) / view.box.width / view.zoom + view.center.x
                        )
                    ),
                    y: Math.max(
                        0,
                        Math.min(
                            1,
                            (point.y - start.y) / view.box.height / view.zoom + view.center.y
                        )
                    ),
                };
                start = point;
                updateViewer(view, { center });
            }
        });
}

export function listenForViewPanEnd(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    _subscriptions[`${viewer.id}_pan_end`] = emitter
        .pipe(filter((_) => _.type === 'touchend' || _.type === 'mouseup'))
        .subscribe(() => {
            log('INPUT', 'Ending panning...');
            if (_subscriptions[`${viewer.id}_pan_end`]) {
                _subscriptions[`${viewer.id}_pan_end`].unsubscribe();
            }
            if (_subscriptions[`${viewer.id}_panning`]) {
                _subscriptions[`${viewer.id}_panning`].unsubscribe();
            }
        });
}

export function listenForViewScrolling(viewer: Viewer, emitter: Observable<ViewerEvent>) {
    if (_subscriptions[`${viewer.id}_scrolling`]) {
        _subscriptions[`${viewer.id}_scrolling`].unsubscribe();
    }
    _subscriptions[`${viewer.id}_scrolling`] = emitter
        .pipe(
            filter((_) => _.type === 'mousewheel' || _.type === 'wheel'),
            map((e) => e.event)
        )
        .subscribe((e: any) => {
            const event = e as WheelEvent;
            event.preventDefault(); // Prevent viewport scrolling
            const view = getViewer(viewer.id);
            if (view) {
                const delta = -event.deltaY / 100;
                const zoom = Math.min(10, Math.max(1, view.zoom + delta / 5));
                updateViewer(view, { zoom });
            }
        });
}
