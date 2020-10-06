import { BehaviorSubject, Observable } from 'rxjs';

import { Viewer } from "./viewer.class";
import { HashMap } from './types';
import { createView, renderView, resizeView } from './renderer';
import { listenForCustomViewActions } from './input';
import { unsubscribeWith } from './async';
import { distinct, filter, map } from 'rxjs/operators';

/**
 * @hidden
 */
export const _svg_viewers = new BehaviorSubject<Viewer[]>([]);
/**
 * @hidden
 * Mapping of custom action hash to viewer
 */
export const _update_timers: HashMap<number> = {};
/**
 * @hidden
 * Mapping of URLs to their respective SVG data
 */
export const _svg_cache: HashMap<string> = {};

export function getViewer(id: string): Viewer | undefined {
    return _svg_viewers.getValue().find(viewer => viewer.id === id);
}

/**
 * Get observable for changes made a specific viewer
 * @param id ID of the viewer to observe
 */
export function listenToViewerChanges(id: string): Observable<Viewer> {
    return _svg_viewers.pipe(
        filter(list => !!list.find(viewer => viewer.id === id)),
        map(list => list.find(viewer => viewer.id === id)),
        distinct()
    ) as any;
}

/**
 * Handle viewport changes with active viewers
 */
export function resizeViewers() {
    const viewer_list = _svg_viewers.getValue();
    for (const viewer of viewer_list) {
        resizeView(viewer);
    }
}

/**
 * Create a new SVG viewer
 * @param options Definition of the view details
 */
export async function createViewer(options: Partial<Viewer>) {
    const view_list = _svg_viewers.getValue();
    let viewer = view_list.find(viewer => viewer.url === options.url);
    if (viewer) {
        return viewer.id;
    }
    const svg_data = options.svg_data || await loadSVGData(options.url);
    viewer = new Viewer({ ...options, svg_data });
    _svg_viewers.next([...view_list, viewer]);
    createView(viewer);
    return viewer.id;
}

/**
 * Update the details of an SVG viewer
 * @param viewer Viewer or ID to update
 * @param options New details for the viewer
 */
export function updateViewer(viewer: string, options: Partial<Viewer>, render?: boolean): Viewer;
export function updateViewer(viewer: Viewer, options: Partial<Viewer>, render?: boolean): Viewer;
export function updateViewer(viewer: string | Viewer, options: Partial<Viewer>, render: boolean = true): Viewer {
    const view_list = _svg_viewers.getValue();
    if (!(viewer instanceof Viewer)) { viewer = view_list.find(v => v.id === viewer)!; }
    if (!(viewer instanceof Viewer)) throw new Error('Unable to find viewer');
    delete options.url;
    const updated_viewer = new Viewer({ ...(viewer as Viewer), ...options });
    _svg_viewers.next(view_list.filter(v => v.id !== updated_viewer.id).concat([updated_viewer]));
    if (updated_viewer.needs_update) {
        if (_update_timers[viewer.id]) {
            clearTimeout(_update_timers[viewer.id]);
        }
        _update_timers[viewer.id] = <any>setTimeout(() => updateViewer(updated_viewer, {}), 16);
    }
    if (render) {
        renderView(updated_viewer);
        listenForCustomViewActions(updated_viewer);
    }
    return updated_viewer;
}

/**
 *
 * @param id
 */
export function removeViewer(id: string) {
    const view = getViewer(id);
    if (!view) return;
    const view_el = view.element?.querySelector('.svg-viewer');
    if (!view_el) return;
    view.element!.removeChild(view_el);
    const viewer_list = _svg_viewers.getValue();
    // Remove listeners for viewer
    unsubscribeWith(`${id}`);
    _svg_viewers.next(viewer_list.filter(v => v.id !== id));
}

/**
 * @hidden
 * Load SVG from a URL
 * @param url URL to load SVG data for
 */
export async function loadSVGData(url: string = '') {
    const resp = _svg_cache[url]
        ? { text: async () => _svg_cache[url] }
        : await fetch(url);
    const text = await resp.text();
    _svg_cache[url] = text;
    return text;
}
