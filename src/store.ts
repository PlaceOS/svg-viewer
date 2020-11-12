import { BehaviorSubject, Observable } from 'rxjs';
import { distinct, filter, map } from 'rxjs/operators';
import { Viewer } from './viewer.class';

/**
 * @hidden
 */
export const _svg_viewers = new BehaviorSubject<Viewer[]>([]);

export function getViewer(id: string): Viewer | undefined {
    return _svg_viewers.getValue().find((viewer) => viewer.id === id);
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
