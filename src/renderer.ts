import { subscription, timeout } from './async';
import {
    cleanCssSelector,
    generateCoordinateListForTree,
    log,
    simplifyDataObject,
    stringToBase64,
} from './helpers';
import { focusOnFeature, listenForResize, listenForViewActions } from './input';
import { listViewers, on_resize, update } from './store';
import { HashMap, Rect, ViewerStyles } from './types';
import { Viewer } from './viewer.class';

const _animation_frames: HashMap<Promise<void>> = {};

const _element_mappings: HashMap<HashMap<Rect>> = {};
/** Map of viewer to last rendered labels */
const _labels: HashMap<string> = {};
/** Map of viewer to last rendered features */
const _features: HashMap<string> = {};
/** Map of viewer to last rendered zones */
const _zones: HashMap<string> = {};
/** Map of viewer to last rendered styles */
const _styles: HashMap<string> = {};
/** Map of viewer to last rendered styles */
const _resize_resolves: HashMap<(() => void)[]> = {};

subscription(
    'on_resize',
    on_resize.subscribe(() => {
        const viewer_list = listViewers();
        for (const viewer of viewer_list) {
            try {
                timeout(`resize-${viewer.id}`, () => resizeView(viewer));
            } catch (e) {
                console.warn(e);
            }
        }
    })
);

export function clearRenderCache(viewer: Viewer) {
    delete _labels[viewer.id];
    delete _features[viewer.id];
    delete _zones[viewer.id];
    delete _styles[viewer.id];
}

export async function createView(viewer: Viewer) {
    const element: HTMLElement | null = viewer.element;
    if (!element) throw new Error('No element set on viewer');
    const container_el = document.createElement('div');
    const styles_el = document.createElement('style');
    const view_el = document.createElement('div');
    const render_el = document.createElement('div');
    const svg_el = document.createElement('div');
    const overlays_el = document.createElement('div');
    const iframe_el = document.createElement('iframe');
    /** Add rendered elements to container */
    render_el.appendChild(svg_el);
    render_el.appendChild(overlays_el);
    /** Add root elements to container */
    container_el.appendChild(styles_el);
    container_el.appendChild(view_el);
    view_el.appendChild(render_el);
    /** Set classes for elements */
    container_el.classList.add('svg-viewer');
    container_el.id = viewer.id;
    styles_el.id = viewer.id;
    iframe_el.id = 'svg-display';
    iframe_el.classList.add('svg-viewer__iframe');
    view_el.classList.add('svg-viewer__view-container');
    render_el.classList.add('svg-viewer__render-container');
    overlays_el.classList.add('svg-viewer__svg-overlays');
    /** Add SVG to the view */
    svg_el.classList.add('svg-viewer__svg-output');
    svg_el.id = 'svg-output';
    svg_el.innerHTML = viewer.svg_data;
    const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
    view_el.style.width = `${view_box.width}px`;
    view_el.style.height = `${view_box.height}px`;
    overlays_el.style.width = `${view_box.width}px`;
    overlays_el.style.height = `${view_box.height}px`;
    overlays_el.appendChild(iframe_el);
    /** Append SVG viewer to selected element */
    element.appendChild(container_el);
    const container_box = view_el?.getBoundingClientRect() || {};
    const view = update(viewer, { box: container_box })!;
    if (!view) return;
    viewer = view;
    await setupElementMapping(viewer);
    listenForViewActions(viewer);
    listenForResize();
    resizeView(viewer);
}

export function setupElementMapping(viewer: Viewer) {
    return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            const svg: HTMLElement = viewer.element?.querySelector('svg') as any;
            if (!svg || !svg.clientWidth)
                return timeout(
                    `${viewer.id}-setup`,
                    () => setupElementMapping(viewer).then((_) => resolve()),
                    100
                );
            const element_map = _element_mappings[viewer.url] || generateCoordinateListForTree(svg);
            _element_mappings[viewer.url] = element_map;
            update(viewer, { mappings: element_map });
            svg.style.display = 'none';
            renderToIFrame(viewer);
            renderOverlays(viewer);
            resolve();
        });
    });
}

export function renderView(viewer: Viewer) {
    if (!_animation_frames[viewer.id]) {
        _animation_frames[viewer.id] = new Promise<void>((resolve) => {
            const frame = requestAnimationFrame(() => {
                if (!_animation_frames[viewer.id]) return;
                const element: HTMLElement | null = viewer.element;
                if (!element) throw new Error('No element set on viewer');
                const styles_el: HTMLStyleElement | null = element.querySelector('style');
                let styles = ``;
                const render_el: HTMLDivElement | null = element.querySelector(
                    '.svg-viewer__render-container'
                );
                const scale = `scale(${viewer.zoom * viewer.svg_ratio})`;
                if (!render_el || !styles_el) throw new Error('Viewer is not setup yet.');
                const x = (viewer.center.x - 0.5) * (100 * viewer.zoom * viewer.svg_ratio);
                const y = (viewer.center.y - 0.5) * (100 * viewer.zoom * viewer.svg_ratio);
                const translate = viewer.use_gpu
                    ? `translate3d(${x}%, ${y}%, 0)`
                    : `translate(${x}%, ${y}%)`;
                render_el.style.transform = `${translate} ${scale} rotate(${viewer.rotate}deg)`;
                styles += `#${
                    viewer.id
                } .svg-viewer__svg-overlay-item > *:not([no-scale="true"]) { transform: rotate(-${
                    viewer.rotate
                }deg) scale(${(1 / viewer.zoom) * (1 / viewer.svg_ratio)}); }`;
                styles += `#${viewer.id} .svg-viewer__svg-overlay-item > * { transform: rotate(-${viewer.rotate}deg); height: 100%; width: 100%; }`;
                styles_el.innerHTML = styles;
                applyStylesToIframe(viewer);
                focusOnFeature(viewer);
                renderOverlays(viewer);
                delete _animation_frames[viewer.id];
                cancelAnimationFrame(frame);
                resolve();
            });
        });
    }
    return _animation_frames[viewer.id] as Promise<void>;
}

export async function renderToIFrame(viewer: Viewer) {
    const style_string = JSON.stringify({ ...viewer.styles }) || '';
    if (style_string.localeCompare(_styles[viewer.id])) {
        const element: HTMLElement | null = viewer.element;
        if (!element) throw new Error('No element set on viewer');
        const iframe: HTMLIFrameElement | null = element.querySelector('.svg-viewer__iframe');
        const svg_el: HTMLDivElement = element.querySelector('.svg-viewer__svg-output') as any;
        if (!iframe) throw new Error('No iframe created for viewer');
        const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
        let svg_string = `${viewer.svg_data}`;
        svg_string = /<svg[^>]*width="[^>]*>/.test(svg_string)
            ? svg_string
            : svg_string.replace(
                  `<svg`,
                  `<svg width="${view_box.width}" height="${view_box.height}" `
              );
        const domain_js = `
<script>
    function updateStyles(evt) {
        try {
            var message = JSON.parse(evt.data);
            if (message.id === 'svg-styles') {
                const style_el = document.getElementById('style');
                style_el.innerHTML = message.content;
            }
        } catch(e) {}
    }

    if (window.addEventListener) {
        window.addEventListener("message", updateStyles, false);
    } else {
        window.attachEvent("onmessage", updateStyles);
    }
</script>`;
        const style: any = {};
        const styles = styleMapToString({ ...viewer.styles, ...style });
        const svg64 = stringToBase64(
            `<html><head><style>*{overflow:hidden;}html,body{padding:0;margin:0;}</style><style id="style">${styles}</style>${domain_js}</head><body>${svg_string}</body></html>`
        );
        const b64Start = 'data:text/html;base64,';
        const image64 = b64Start + svg64;
        iframe.src = image64;
        _styles[viewer.id] = style_string;
    }
}

export async function applyStylesToIframe(viewer: Viewer) {
    const style_string = JSON.stringify({ ...viewer.styles }) || '';
    if (style_string.localeCompare(_styles[viewer.id])) {
        const element: HTMLElement | null = viewer.element;
        if (!element) throw new Error('No element set on viewer');
        const iframe: HTMLIFrameElement | null = element.querySelector('.svg-viewer__iframe');
        if (!iframe) throw new Error('No iframe created for viewer');
        if (!iframe.contentWindow) {
            iframe.onload = () => {
                setTimeout(() => applyStylesToIframe(viewer), 50);
                setTimeout(() => applyStylesToIframe(viewer), 500);
            };
            return;
        }
        const style: any = {};
        style[`[empty${Math.floor(Math.random() * 999_999)}]`] = {};
        const styles = styleMapToString({ ...viewer.styles, ...style });
        iframe.contentWindow.postMessage(
            JSON.stringify({ id: 'svg-styles', content: styles }),
            '*'
        );
    }
}

export async function resizeView(viewer: Viewer) {
    return new Promise<void>((resolve) => {
        if (!_resize_resolves[viewer.id]) {
            _resize_resolves[viewer.id] = [];
        }
        _resize_resolves[viewer.id].push(resolve);
        timeout(
            `resize-${viewer.id}`,
            () => {
                const element: HTMLElement | null = viewer.element;
                if (!element) throw new Error('No element set on viewer');
                const view_el: HTMLDivElement | null = element.querySelector(
                    '.svg-viewer__view-container'
                );
                const overlays_el: HTMLDivElement | null = element.querySelector(
                    '.svg-viewer__svg-overlays'
                );
                const render_el: HTMLDivElement | null = element.querySelector(`#${viewer.id}`);
                const container_el: HTMLDivElement = element.querySelector('.svg-viewer') as any;
                const svg_el: HTMLDivElement | null =
                    element.querySelector('.svg-viewer__svg-output');
                const iframe_el = element.querySelector('iframe');
                const container_box = container_el?.getBoundingClientRect() || {};
                const view_el_box = view_el?.getBoundingClientRect() || {};
                if (!overlays_el || !svg_el || !iframe_el || !view_el)
                    throw new Error('Viewer elements not ready yet.');
                requestAnimationFrame(async () => {
                    const ratio = container_box.height / container_box.width;
                    const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
                    const ratio_svg = view_box.height / view_box.width;
                    if (svg_el.firstElementChild) {
                        (svg_el.firstElementChild as any).style.width = '200%';
                    }
                    const width = (container_box.width - 32) * Math.min(1, ratio / ratio_svg);
                    const box = { width, height: width * ratio_svg };
                    overlays_el.style.width = view_box.width + 'px';
                    overlays_el.style.height = view_box.height + 'px';
                    view_el.style.width = view_box.width + 'px';
                    view_el.style.height = view_box.height + 'px';
                    iframe_el.style.width = view_box.width + 'px';
                    iframe_el.style.height = view_box.height + 'px';
                    iframe_el.width = `${view_box.width}`;
                    iframe_el.height = `${view_box.height}`;
                    const svg_ratio = Math.min(
                        container_box.height / view_box.height,
                        container_box.width / view_box.width
                    );
                    const render_box = render_el?.getBoundingClientRect();
                    const overlay_box = overlays_el?.getBoundingClientRect();
                    let content_ratio = { x: 1, y: 1 };
                    if (render_box && overlay_box) {
                        content_ratio = {
                            x: (overlay_box.width * svg_ratio * 0.975) / render_box.width,
                            y: (overlay_box.height * svg_ratio * 0.975) / render_box.height,
                        };
                    }
                    // Clear styles to redraw SVG to iframe
                    _styles[viewer.id] = '';
                    let view = update(viewer, {
                        ratio: box.height / box.width,
                        svg_ratio,
                        box: view_el_box as any,
                        content_ratio,
                    });
                    if (!view) return;
                    viewer = view;
                    await renderView(viewer);
                    _resize_resolves[viewer.id].forEach((res) => res());
                    _resize_resolves[viewer.id] = [];
                });
            },
            100
        );
    });
}

export function renderOverlays(viewer: Viewer): void {
    const svg_el = viewer.element?.querySelector(`svg`);
    if (!Object.keys(viewer.mappings || {}).length) return;
    const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
    if (!overlay_el || !svg_el) return;
    const box = overlay_el.getBoundingClientRect();
    if (!box.width)
        return timeout(`${viewer.id}|render-overlays`, () => renderOverlays(viewer), 50);
    requestAnimationFrame(() => {
        renderLabels(viewer);
        renderActionZones(viewer);
        renderFeatures(viewer);
    });
}

export function renderLabels(viewer: Viewer) {
    const label_list = viewer.labels.filter((_) => !_.zoom_level || _.zoom_level <= viewer.zoom);
    const labels_string = JSON.stringify(label_list);
    if (labels_string !== _labels[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
        if (!overlay_el) return;
        const label_el_list: Element[] = Array.from(overlay_el.querySelectorAll('[label]'));
        /** Remove existing labels */
        label_el_list.filter((el) => el.parentNode).forEach((el) => overlay_el.removeChild(el));
        for (const label of label_list) {
            let coordinates = { x: 0, y: 0 };
            let for_value = '~Nothing~';
            if (typeof label.location === 'string') {
                coordinates = viewer.mappings[label.location] || coordinates;
                for_value = `#${label.location}`;
            } else if (label.location?.y || label.location?.x) {
                coordinates = label.location;
                for_value = `loc-${coordinates.x}-${coordinates.y}`;
            }
            const label_container_el = document.createElement('div');
            label_container_el.setAttribute('label', 'true');
            label_container_el.classList.add('svg-viewer__svg-overlay-item');
            label_container_el.classList.add('label');
            label_container_el.style.top = `${coordinates.y * 100}%`;
            label_container_el.style.left = `${coordinates.x * 100}%`;
            const div_el = document.createElement('div');
            const label_el = document.createElement('label');
            label_el.classList.add('svg-viewer__label');
            label_el.setAttribute('for', for_value);
            if (label.css_class?.length) {
                label_el.classList.add(...label.css_class);
            }
            if (label.z_index) {
                label_container_el.style.zIndex = `${label.z_index}`;
            }
            label_el.textContent = label.content;
            div_el.appendChild(label_el);
            label_container_el.appendChild(div_el);
            overlay_el.appendChild(label_container_el);
        }
        log('RENDER', `Added ${viewer.labels.length} labels to view.`);
        _labels[viewer.id] = labels_string;
    }
}

export function renderFeatures(viewer: Viewer) {
    const features_string = JSON.stringify(
        viewer.features.map((i) => ({ ...i, content: '', data: simplifyDataObject(i.data) as any }))
    );
    if (features_string !== _features[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
        if (!overlay_el) return console.log('Unable to get overlay element.');
        const feature_el_list = overlay_el.querySelectorAll('.feature');
        const existing: Element[] = [];
        (window as any).overlay_el = overlay_el;
        /** Remove existing features */
        feature_el_list.forEach((el) => {
            if (!el.parentNode) return;
            const track_id = el.getAttribute('track-id');
            if (track_id === 'none' || !viewer.features.find((_) => _.track_id === track_id))
                overlay_el.removeChild(el);
            else existing.push(el);
        });
        for (const feature of viewer.features) {
            if (!feature.content || existing.includes(feature.content)) continue;
            let coordinates = { x: 0, y: 0 };
            let size = { w: 0, h: 0 };
            const feature_container_el = document.createElement('div');
            if (typeof feature.location === 'string') {
                feature_container_el.id = `${feature.location}`;
                coordinates = viewer.mappings[feature.location] || coordinates;
                if (feature.hover || feature.full_size) {
                    size = viewer.mappings[feature.location] || size;
                }
            } else if (feature.location?.y || feature.location?.x) {
                coordinates = feature.location;
            }
            if (!coordinates.x && !coordinates.y) continue;
            feature_container_el.classList.add('svg-viewer__svg-overlay-item');
            feature_container_el.setAttribute('feature', 'true');
            feature_container_el.setAttribute('track-id', `${feature.track_id || 'none'}`);
            feature_container_el.classList.add('feature');
            if (feature.z_index) {
                feature_container_el.style.zIndex = `${feature.z_index}`;
            }
            if (feature.hover) {
                feature_container_el.classList.add('svg-viewer__svg-overlay-item__hover');
            }
            feature_container_el.style.top = `${coordinates.y * 100}%`;
            feature_container_el.style.left = `${coordinates.x * 100}%`;
            if (size.w || size.h) {
                feature_container_el.style.width = `${size.w * 100}%`;
                feature_container_el.style.height = `${size.h * 100}%`;
            } else {
                feature_container_el.style.width = `1%`;
                feature_container_el.style.height = `${1 / viewer.ratio}%`;
            }
            feature_container_el.style.transform = `translate(-50%, -50%)`;
            if (feature.content instanceof Node) {
                feature_container_el.appendChild(feature.content);
            }
            overlay_el.appendChild(feature_container_el);
        }
        log('RENDER', `Added ${viewer.features.length} features to view.`);
        _features[viewer.id] = features_string;
    }
}

export function renderActionZones(viewer: Viewer) {
    const zone_string = JSON.stringify(viewer.actions.map((i) => ({ ...i, callback: '' })));
    if (zone_string !== _zones[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
        if (!overlay_el) return;
        const zone_el_list: Element[] = Array.from(overlay_el.querySelectorAll('.action-zone'));
        /** Remove existing features */
        zone_el_list
            .filter((el) => el.parentNode && overlay_el.contains(el.parentNode))
            .forEach((el) => overlay_el.removeChild(el));
        for (const event of viewer.actions) {
            if (!event.action || !event.id || event.id === '*' || event.zone === false) continue;
            const zone_el = document.createElement('button');
            zone_el.id = `${event.id}`;
            const coordinates = viewer.mappings[event.id] || { x: 0, y: 0 };
            const size = viewer.mappings[event.id] || { w: 0, h: 0 };
            zone_el.classList.add('svg-viewer__svg-overlay-item');
            zone_el.classList.add('action-zone');
            zone_el.style.top = `${coordinates.y * 100}%`;
            zone_el.style.left = `${coordinates.x * 100}%`;
            if (size.w || size.h) {
                zone_el.style.width = `${size.w * 100}%`;
                zone_el.style.height = `${size.h * 100}%`;
                zone_el.style.transform = `translate(-50%, -50%)`;
            }
            overlay_el.appendChild(zone_el);
        }
        _zones[viewer.id] = zone_string;
    }
}

/**
 * Convert mapping of styles to a string
 * @param id ID of the viewer
 * @param styles Style mappings
 */
export function styleMapToString(styles: ViewerStyles): string {
    let output = '';
    for (const selector in styles) {
        if (!styles[selector]) {
            continue;
        }
        let properties = '';
        for (const prop in styles[selector]) {
            if (!styles[selector][prop]) {
                continue;
            }
            properties += `${prop}: ${styles[selector][prop]}; `;
        }
        output += `svg ${selector
            .split(' ')
            .map((_) => cleanCssSelector(_))
            .join(' ')} { ${properties} } `;
    }
    return output;
}
