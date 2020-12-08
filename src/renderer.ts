import { subscription, timeout } from './async';
import { cleanCssSelector, coordinatesForElement, log, relativeSizeOfElement } from './helpers';
import { focusOnFeature, listenForResize, listenForViewActions } from './input';
import { listViewers, on_resize, update } from './store';
import { HashMap, ViewerStyles } from './types';
import { Viewer } from './viewer.class';

const _animation_frames: HashMap<number> = {};
/** Map of viewer to last rendered labels */
const _labels: HashMap<string> = {};
/** Map of viewer to last rendered features */
const _features: HashMap<string> = {};
/** Map of viewer to last rendered zones */
const _zones: HashMap<string> = {};
/** Map of viewer to last rendered styles */
const _styles: HashMap<string> = {};

subscription(
    'on_resize',
    on_resize.subscribe(() => {
        const viewer_list = listViewers();
        for (const viewer of viewer_list) {
            timeout(`resize-${viewer.id}`, () => resizeView(viewer));
        }
    })
);

export function createView(viewer: Viewer) {
    const element: HTMLElement | null = viewer.element;
    if (!element) throw new Error('No element set on viewer');
    const container_el = document.createElement('div');
    const styles_el = document.createElement('style');
    const render_el = document.createElement('div');
    const svg_el = document.createElement('div');
    const overlays_el = document.createElement('div');
    const canvas_el = document.createElement('canvas');
    /** Add rendered elements to container */
    render_el.appendChild(svg_el);
    render_el.appendChild(overlays_el);
    /** Add root elements to container */
    container_el.appendChild(styles_el);
    container_el.appendChild(render_el);
    /** Set classes for elements */
    container_el.classList.add('svg-viewer');
    container_el.id = viewer.id;
    styles_el.id = viewer.id;
    canvas_el.id = 'svg-display';
    canvas_el.classList.add('svg-viewer__canvas');
    render_el.classList.add('svg-viewer__render-container');
    overlays_el.classList.add('svg-viewer__svg-overlays');
    /** Add SVG to the view */
    svg_el.classList.add('svg-viewer__svg-output');
    svg_el.id = 'svg-output';
    svg_el.innerHTML = viewer.svg_data;
    const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
    overlays_el.style.width = `${view_box.width}px`;
    overlays_el.style.height = `${view_box.height}px`;
    overlays_el.appendChild(canvas_el);
    /** Append SVG viewer to selected element */
    element.appendChild(container_el);
    const container_box = container_el.getBoundingClientRect();
    viewer = update(viewer, { box: container_box });
    listenForViewActions(viewer);
    listenForResize();
    resizeView(viewer);
}

export function renderView(viewer: Viewer) {
    if (_animation_frames[viewer.id]) {
        cancelAnimationFrame(_animation_frames[viewer.id]);
    }
    _animation_frames[viewer.id] = requestAnimationFrame(() => {
        const element: HTMLElement | null = viewer.element;
        if (!element) throw new Error('No element set on viewer');
        const styles_el: HTMLDivElement = element.querySelector('style') as any;
        let styles = ``;
        const render_el: HTMLDivElement = element.querySelector(
            '.svg-viewer__render-container'
        ) as any;
        const scale = `scale(${viewer.zoom / 10})`;
        render_el.style.transform = `translate3d(${
            (viewer.center.x - 0.5) * (100 * (viewer.zoom / 10))
        }%, ${(viewer.center.y - 0.5) * (100 * (viewer.zoom / 10))}%, 0) ${scale} rotate(${
            viewer.rotate
        }deg)`;
        styles += ` #${cleanCssSelector(
            viewer.id
        )} .svg-viewer__svg-overlay-item > * { transform: rotate(-${viewer.rotate}deg) scale(${
            10 / viewer.zoom
        }); height: ${(viewer.zoom / 10) * 100}%; width: ${(viewer.zoom / 10) * 100}%; }`;
        styles_el.innerHTML = styles;
        renderToCanvas(viewer);
        focusOnFeature(viewer);
        renderOverlays(viewer);
        _animation_frames[viewer.id] = 0;
    });
}

export function renderToCanvas(viewer: Viewer) {
    const style_string = JSON.stringify(viewer.styles) || ' ';
    if (style_string !== _styles[viewer.id]) {
        const element: HTMLElement | null = viewer.element;
        if (!element) throw new Error('No element set on viewer');
        const canvas: HTMLCanvasElement | null = element.querySelector('.svg-viewer__canvas');
        const svg_el: HTMLDivElement = element.querySelector('.svg-viewer__svg-output') as any;
        if (!canvas) throw new Error('No canvas created for viewer');
        const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
        const img: HTMLImageElement = document.createElement('img')!;
        const styles = styleMapToString(viewer.id, viewer.styles, false);
        let svg_string = `${viewer.svg_data}`.replace(
            /[^\?\-]>/,
            `$&<defs><style>${styles}</style></defs>`
        );
        svg_string = /<svg[^>]*width="[^>]*>/.test(svg_string)
            ? svg_string
            : svg_string.replace(
                  `<svg`,
                  `<svg width="${view_box.width}" height="${view_box.height}" `
              );
        const svg64 = btoa(svg_string);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;
        img.onload = () =>
            canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = image64;
        _styles[viewer.id] = style_string;
    }
}

export async function resizeView(viewer: Viewer) {
    timeout(
        `resize-${viewer.id}`,
        () => {
            const element: HTMLElement | null = viewer.element;
            if (!element) throw new Error('No element set on viewer');
            const overlays_el: HTMLDivElement = element.querySelector(
                '.svg-viewer__svg-overlays'
            ) as any;
            const container_el: HTMLDivElement = element.querySelector('.svg-viewer') as any;
            const svg_el: HTMLDivElement = element.querySelector('.svg-viewer__svg-output') as any;
            const canvas_el: HTMLCanvasElement = element.querySelector('canvas') as any;
            const container_box = container_el.getBoundingClientRect();
            requestAnimationFrame(async () => {
                const ratio = container_box.height / container_box.width;
                const view_box = (svg_el.firstElementChild as any)?.viewBox?.baseVal || {};
                const ratio_svg = view_box.height / view_box.width;
                (svg_el.firstElementChild as any).style.width =
                    Math.min(100, 100 * (ratio / ratio_svg)) + '%';
                const width = (container_box.width - 32) * Math.min(1, ratio / ratio_svg);
                const box = { width, height: width * ratio_svg };
                overlays_el.style.width = box.width * (10 / viewer.zoom) + 'px';
                overlays_el.style.height = box.height * (10 / viewer.zoom) + 'px';
                canvas_el.style.width = box.width * (10 / viewer.zoom) + 'px';
                canvas_el.style.height = box.height * (10 / viewer.zoom) + 'px';
                canvas_el.width = box.width * 6 * ratio;
                canvas_el.height = box.height * 6 * ratio;
                // Clear styles to redraw SVG to canvas
                _styles[viewer.id] = '';
                viewer = update(viewer, { ratio: box.height / box.width, box: container_box });
                renderView(viewer);
            });
        },
        100
    );
}

export function renderOverlays(viewer: Viewer): void {
    const svg_el = viewer.element?.querySelector(`svg`);
    const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
    if (!overlay_el || !svg_el) return;
    const box = overlay_el.getBoundingClientRect();
    console.log('Box:', box);
    if (!box.width)
        return timeout(`${viewer.id}|render-overlays`, () => renderOverlays(viewer), 50);
    svg_el.style.display = 'initial';
    requestAnimationFrame(() => {
        renderActionZones(viewer, box);
        renderLabels(viewer, box);
        renderFeatures(viewer, box);
        svg_el.style.display = 'none';
    });
}

export function renderLabels(viewer: Viewer, box: ClientRect) {
    const labels_string = JSON.stringify(viewer.labels);
    if (labels_string !== _labels[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
        if (!overlay_el) return;
        const label_el_list: Element[] = Array.from(overlay_el.querySelectorAll('[label]'));
        /** Remove existing labels */
        label_el_list.filter((el) => el.parentNode).forEach((el) => overlay_el.removeChild(el));
        for (const label of viewer.labels) {
            let coordinates = { x: 0, y: 0 };
            let for_value = '~Nothing~';
            if (typeof label.location === 'string') {
                coordinates = coordinatesForElement(viewer, label.location, box);
                for_value = `#${label.location}`;
            } else {
                coordinates = label.location;
                for_value = `loc-${coordinates.x}-${coordinates.y}`;
            }
            const label_container_el = document.createElement('div');
            label_container_el.setAttribute('label', 'true');
            label_container_el.classList.add('svg-viewer__svg-overlay-item');
            label_container_el.classList.add('label');
            label_container_el.style.top = `${coordinates.y * 100}%`;
            label_container_el.style.left = `${coordinates.x * 100}%`;
            const label_el = document.createElement('label');
            label_el.classList.add('svg-viewer__label');
            label_el.setAttribute('for', for_value);
            label_el.textContent = label.content;
            label_container_el.appendChild(label_el);
            overlay_el.appendChild(label_container_el);
        }
        log('RENDER', `Added ${viewer.labels.length} labels to view.`);
        _labels[viewer.id] = labels_string;
    }
}

export function renderFeatures(viewer: Viewer, box: ClientRect) {
    const features_string = JSON.stringify(viewer.features.map((i) => ({ ...i, content: '' })));
    if (features_string !== _features[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-viewer__svg-overlays');
        if (!overlay_el) return;
        const feature_el_list: Element[] = Array.from(overlay_el.querySelectorAll('[feature]'));
        /** Remove existing features */
        feature_el_list.filter((el) => el.parentNode).forEach((el) => overlay_el.removeChild(el));
        for (const feature of viewer.features) {
            if (!feature.content) continue;
            let coordinates = { x: 0, y: 0 };
            let size = { w: 0, h: 0 };
            const feature_container_el = document.createElement('div');
            if (typeof feature.location === 'string') {
                feature_container_el.id = `${feature.location}`;
                coordinates = coordinatesForElement(viewer, feature.location, box);
                if (feature.hover) {
                    size = relativeSizeOfElement(viewer, feature.location, box);
                }
            } else {
                coordinates = feature.location;
            }
            feature_container_el.classList.add('svg-viewer__svg-overlay-item');
            feature_container_el.setAttribute('feature', 'true');
            feature_container_el.classList.add('feature');
            if (feature.hover) {
                feature_container_el.classList.add('svg-viewer__svg-overlay-item__hover');
            }
            feature_container_el.style.top = `${coordinates.y * 100}%`;
            feature_container_el.style.left = `${coordinates.x * 100}%`;
            if (size.w || size.h) {
                feature_container_el.style.width = `${size.w * 100}%`;
                feature_container_el.style.height = `${size.h * 100}%`;
                feature_container_el.style.transform = `translate(-50%, -50%)`;
            } else {
                feature_container_el.style.width = `1%`;
                feature_container_el.style.height = `${1 / viewer.ratio}%`;
            }
            if (feature.content instanceof Node) {
                feature_container_el.appendChild(feature.content);
            }
            overlay_el.appendChild(feature_container_el);
        }
        log('RENDER', `Added ${viewer.features.length} features to view.`);
        _features[viewer.id] = features_string;
    }
}

export function renderActionZones(viewer: Viewer, box: ClientRect) {
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
            const zone_el = document.createElement('div');
            zone_el.id = `${event.id}`;
            const coordinates = coordinatesForElement(viewer, event.id, box);
            const size = relativeSizeOfElement(viewer, event.id, box);
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
export function styleMapToString(
    id: string,
    styles: ViewerStyles,
    with_id: boolean = true
): string {
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
        output +=
            (with_id ? `#${cleanCssSelector(id)} ` : '') +
            `svg ${cleanCssSelector(selector)} { ${properties} } `;
    }
    return output;
}
