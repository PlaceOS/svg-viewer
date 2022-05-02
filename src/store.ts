import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinct, filter, map } from 'rxjs/operators';
import { timeout } from './async';
import { Viewer } from './viewer.class';

/**
 * @hidden
 */
export const _svg_viewers = new BehaviorSubject<Viewer[]>([]);
export const _global_events = new Subject<string>();

export const on_resize = _global_events.pipe(filter(_ => _ === 'resize'));

export function postEvent(str: string) {
    _global_events.next(str);
}

export function getViewer(id: string): Viewer | undefined {
    return _svg_viewers.getValue().find((viewer) => viewer.id === id);
}

/**
 * Update the details of an SVG viewer
 * @param viewer Viewer or ID to update
 * @param options New details for the viewer
 */
export function update(
    viewer: string | Viewer,
    options: Partial<Viewer>,
): Viewer | null {
    const view_list = listViewers();
    viewer = view_list.find((v) => v.id === (viewer instanceof Viewer ? viewer.id : viewer))!;
    if (!(viewer instanceof Viewer)) return null;
    delete options.url;
    const updated_viewer = new Viewer({ ...(viewer as Viewer), ...options });
    replace(updated_viewer);
    if (updated_viewer.needs_update) {
        timeout(`${viewer.id}_updating`, () => update(updated_viewer, {}), 16);
    }
    return updated_viewer;
}

/**
 * Get observable for changes made a specific viewer
 * @param id ID of the viewer to observe
 */
export function onViewerChange(id: string): Observable<Viewer> {
    return _svg_viewers.pipe(
        filter((list) => !!list.find((viewer) => viewer.id === id)),
        map((list) => list.find((viewer) => viewer.id === id)),
        distinct()
    ) as any;
}

export function replace(viewer: Viewer) {
    const list = listViewers().filter(v => v.id !== viewer.id);
    list.push(viewer);
    _svg_viewers.next(list);
}

export function del(viewer: Viewer) {
    const list = listViewers().filter(v => v.id !== viewer.id);
    _svg_viewers.next(list);
}

export function listViewers() {
    return _svg_viewers.getValue();
}
