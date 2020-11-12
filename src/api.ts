
import { timeout, unsubscribeWith } from './async';
import { createView, renderView, resizeView } from './renderer';
import { del, getViewer, listViewers, replace } from './store';
import { HashMap } from './types';
import { Viewer } from './viewer.class';

/**
 * @hidden
 * Mapping of URLs to their respective SVG data
 */
export const _svg_cache: HashMap<string> = {};

/**
 * Handle viewport changes with active viewers
 */
export function resizeViewers() {
    const viewer_list = listViewers();
    for (const viewer of viewer_list) {
        timeout(`resize-${viewer.id}`, () => resizeView(viewer));
    }
}

/**
 * Create a new SVG viewer
 * @param options Definition of the view details
 */
export async function createViewer(options: Partial<Viewer>) {
    const view_list = listViewers();
    let viewer = view_list.find((v) => v.url === options.url);
    if (viewer) {
        return viewer.id;
    }
    const svg_data = options.svg_data || (await loadSVGData(options.url));
    viewer = new Viewer({ ...options, svg_data });
    replace(viewer);
    createView(viewer);
    return viewer.id;
}

/**
 * Update the details of an SVG viewer
 * @param viewer Viewer or ID to update
 * @param options New details for the viewer
 */
export function updateViewer(
    viewer: string | Viewer,
    options: Partial<Viewer>,
    render: boolean = true
): Viewer {
    const view_list = listViewers();
    viewer = view_list.find((v) => v.id === (viewer instanceof Viewer ? viewer.id : viewer))!;
    if (!(viewer instanceof Viewer)) throw new Error('Unable to find viewer');
    delete options.url;
    const updated_viewer = new Viewer({ ...(viewer as Viewer), ...options });
    replace(updated_viewer)
    if (updated_viewer.needs_update) {
        timeout(`${viewer.id}_updating`, () => updateViewer(updated_viewer, {}), 16);
    }
    if (render) {
        renderView(updated_viewer);
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
    del(view);
    // Remove listeners for viewer
    unsubscribeWith(`${id}`);
}

/**
 * @hidden
 * Load SVG from a URL
 * @param url URL to load SVG data for
 */
export async function loadSVGData(url: string = '') {
    const resp = _svg_cache[url] ? { text: async () => _svg_cache[url] } : await fetch(url);
    const text = await resp.text();
    _svg_cache[url] = text;
    return text;
}
