import { subscription, unsubscribeWith } from './async';
import { log } from './helpers';
import { createView, renderView } from './renderer';
import {
    del,
    getViewer,
    listViewers,
    onViewerChange,
    replace,
    update,
} from './store';
import { Viewer } from './viewer.class';

/**
 * @hidden
 * Mapping of URLs to their respective SVG data
 */
export const _svg_cache: Record<string, string> = {};
const CUSTOM_HEADERS: Record<string, string> = {};

/** Sets custom headers for requests to retrieve SVG data */
export function setCustomHeaders(headers: Record<string, string>) {
    for (const key in headers) {
        CUSTOM_HEADERS[key.toLowerCase()] = headers[key];
    }
}

/**
 * Create a new SVG viewer
 * @param options Definition of the view details
 */
export async function createViewer(options: Partial<Viewer>) {
    const view_list = listViewers();
    let viewer = view_list.find((v) => v.url === options.url);
    if (viewer) return viewer.id;
    const svg_data = options.svg_data || (await loadSVGData(options.url));
    if (!svg_data) throw new Error('No SVG data to display');
    viewer = new Viewer({ ...options, svg_data });
    subscription(
        `${viewer.id}-render`,
        onViewerChange(viewer.id).subscribe((view) =>
            renderView(view).catch((e) => console.warn(e)),
        ),
    );
    replace(viewer);
    await createView(viewer);
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
): Viewer | null {
    return update(viewer, options);
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
    const headers = new Headers();
    if (url.startsWith(location.origin) || url.startsWith('/')) {
        for (const key in CUSTOM_HEADERS) {
            headers.append(key, CUSTOM_HEADERS[key]);
        }
    }
    if (_svg_cache[url]) return _svg_cache[url];
    const err_result = { text: async () => '' };
    let resp: Response = await fetch(url, { headers }).catch((e) => {
        log('SVG VIEWER', 'Failed to load map', e, 'error');
        return err_result as any;
    });
    if (resp.status >= 400) {
        log('SVG VIEWER', 'Failed to load map', resp.statusText, 'error');
        resp = err_result as any;
    }
    const text = await resp.text();
    _svg_cache[url] = text;
    return text;
}
