import { BehaviorSubject } from 'rxjs';

import { Viewer } from "./viewer.class";
import { ViewerOptions, HashMap } from './types';
import { createView, renderView } from './renderer';

/**
 * @hidden
 */
const _svg_viewers = new BehaviorSubject<Viewer[]>([]);

export function getViewer(id: string): Viewer | undefined {
    return _svg_viewers.getValue().find(viewer => viewer.id === id);
}

/**
 * Create a new SVG viewer
 * @param options Definition of the view details
 */
export async function createViewer(options: ViewerOptions) {
    const view_list = _svg_viewers.getValue();
    let viewer = view_list.find(viewer => viewer.url === options.url);
    if (viewer) {
        return viewer;
    }
    const svg_data = options.svg_data || await loadSVGData(options.url || '');
    viewer = new Viewer({ ...options, svg_data });
    _svg_viewers.next([...view_list, viewer]);
    createView(viewer);
    return viewer;
}

/**
 * Update the details of an SVG viewer
 * @param viewer Viewer or ID to update
 * @param options New details for the viewer
 */
export async function updateViewer(viewer: string, options: HashMap, render?: boolean): Promise<Viewer>;
export async function updateViewer(viewer: Viewer, options: HashMap, render?: boolean): Promise<Viewer>;
export async function updateViewer(viewer: string | Viewer, options: HashMap, render: boolean = true): Promise<Viewer> {
    const view_list = _svg_viewers.getValue();
    if (!(viewer instanceof Viewer)) {
        viewer = view_list.find(v => v.id === viewer) as any;
    }
    if (!viewer) throw new Error('Unable to find viewer');
    delete options.url;
    const updated_viewer = new Viewer({ ...(viewer as Viewer), ...options });
    _svg_viewers.next(view_list.filter(v => v.id !== updated_viewer.id).concat([updated_viewer]));
    if (render) {
        renderView(updated_viewer);
    }
    return updated_viewer;
}

/**
 * @hidden
 * Load SVG from a URL
 * @param url URL to load SVG data for
 */
export async function loadSVGData(url: string) {
    const resp = await fetch(url);
    return resp.text();
}
