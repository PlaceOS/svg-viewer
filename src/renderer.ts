import { updateViewer } from './api';
import { cleanCssSelector, coordinatesForElement, log, relativeSizeOfElement } from './helpers';
import { focusOnFeature, listenForResize, listenForViewActions } from './input';
import { HashMap, ViewerStyles } from './types';
import { Viewer } from './viewer.class';

const _animation_frames: HashMap<number> = {};
const _labels: HashMap<string> = {};
const _features: HashMap<string> = {};

export function createView(viewer: Viewer) {
    const element: HTMLElement | null = viewer.element;
    if (!element) throw new Error('No element set on viewer');
    const container_el = document.createElement('div');
    const styles_el = document.createElement('style');
    const render_el = document.createElement('div');
    const svg_el = document.createElement('div');
    const overlays_el = document.createElement('div');
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
    render_el.classList.add('render-container');
    overlays_el.classList.add('svg-overlays');
    /** Add SVG to the view */
    svg_el.classList.add('svg-output');
    svg_el.id = 'svg-output';
    svg_el.innerHTML = viewer.svg_data;
    /** Append SVG viewer to selected element */
    element.appendChild(container_el);
    const container_box = container_el.getBoundingClientRect();
    let box = svg_el.firstElementChild?.getBoundingClientRect() || { height: 1, width: 1 };
    const ratio = container_box.height / container_box.width;
    if (svg_el.firstElementChild) {
        ratio < (box.height / box.width)
            ? (svg_el.firstElementChild as any).style.height = '100%'
            : (svg_el.firstElementChild as any).style.width = '100%';
        ratio < (box.height / box.width)
            ? (svg_el.firstElementChild as any).style.width = 'auto'
            : (svg_el.firstElementChild as any).style.height = 'auto';
    }
    box = svg_el.firstElementChild?.getBoundingClientRect() || { height: 1, width: 1 };
    overlays_el.style.width = box.width + 'px';
    overlays_el.style.height = box.height + 'px';
    viewer = updateViewer(
        viewer,
        { ratio: box.height / box.width, box: container_box },
        false
    );
    renderView(viewer);
    listenForViewActions(viewer);
    listenForResize();
}

export function renderView(viewer: Viewer) {
    if (_animation_frames[viewer.id]) {
        cancelAnimationFrame(_animation_frames[viewer.id]);
    }
    _animation_frames[viewer.id] = requestAnimationFrame(() => {
        const element: HTMLElement | null = viewer.element;
        if (!element) throw new Error('No element set on viewer');
        const styles_el: HTMLDivElement = element.querySelector('style') as any;
        let styles = styleMapToString(viewer.id, viewer.styles);
        const render_el: HTMLDivElement = element.querySelector('.render-container') as any;
        const scale = `scale(${viewer.zoom / 10})`;
        render_el.style.transform = `translate(${
            (viewer.center.x - 0.5) * (100 * (viewer.zoom / 10))
        }%, ${(viewer.center.y - 0.5) * (100 * (viewer.zoom / 10))}%) ${scale} rotate(${
            viewer.rotate
        }deg)`;
        styles += ` #${cleanCssSelector(viewer.id)} .svg-overlay-item > * { transform: rotate(-${
            viewer.rotate
        }deg) }`;
        styles += ` #${cleanCssSelector(viewer.id)} .svg-overlays > * { transform: scale(${
            10 / viewer.zoom
        })`;
        styles_el.innerHTML = styles;
        _animation_frames[viewer.id] = 0;
        focusOnFeature(viewer);
        renderLabels(viewer);
        renderFeatures(viewer);
    });
}

export async function resizeView(viewer: Viewer) {
    const element: HTMLElement | null = viewer.element;
    if (!element) throw new Error('No element set on viewer');
    const container_el: HTMLDivElement = element.querySelector('.svg-viewer') as any;
    const overlays_el: HTMLDivElement = element.querySelector('.svg-overlays') as any;
    const svg_el: HTMLDivElement = element.querySelector('.svg-output') as any;
    const container_box = container_el.getBoundingClientRect();
    (svg_el.firstElementChild as any).style.height = '';
    (svg_el.firstElementChild as any).style.width = '';
    requestAnimationFrame(async () => {
        let box = svg_el.firstElementChild?.getBoundingClientRect() || { height: 1, width: 1 };
        const ratio = container_box.height / container_box.width;
        ratio < (box.height / box.width) && svg_el.firstElementChild
            ? (svg_el.firstElementChild as any).style.height = '100%'
            : (svg_el.firstElementChild as any).style.width = '100%';
        ratio < (box.height / box.width) && svg_el.firstElementChild
            ? (svg_el.firstElementChild as any).style.width = 'auto'
            : (svg_el.firstElementChild as any).style.height = 'auto';
        box = svg_el.firstElementChild?.getBoundingClientRect() || { height: 1, width: 1 };
        overlays_el.style.width = (box.width * (10 / viewer.zoom)) + 'px';
        overlays_el.style.height = (box.height * (10 / viewer.zoom)) + 'px';
        viewer = await updateViewer(
            viewer,
            { ratio: box.height / box.width, box: container_box },
            false
        );
    });
}

export function renderLabels(viewer: Viewer) {
    const labels_string = JSON.stringify(viewer.labels);
    if (labels_string !== _labels[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-overlays');
        if (!overlay_el) return;
        const label_el_list = overlay_el.querySelectorAll('label');
        /** Remove existing labels */
        label_el_list.forEach((label_el) => {
            if (label_el.parentNode) {
                overlay_el.removeChild(label_el.parentNode);
            }
        });
        for (const label of viewer.labels) {
            let coordinates = { x: 0, y: 0 };
            let for_value = '~Nothing~';
            if (typeof label.location === 'string') {
                coordinates = coordinatesForElement(viewer, label.location);
                for_value = `#${label.location}`;
            } else {
                coordinates = label.location;
                for_value = `loc-${coordinates.x}-${coordinates.y}`;
            }
            const label_container_el = document.createElement('div');
            label_container_el.classList.add('svg-overlay-item');
            label_container_el.style.top = `${coordinates.y * 100}%`;
            label_container_el.style.left = `${coordinates.x * 100}%`;
            const label_el = document.createElement('label');
            label_el.setAttribute('for', for_value);
            label_el.textContent = label.content;
            label_container_el.appendChild(label_el);
            overlay_el.appendChild(label_container_el);
        }
        log('RENDER', `Added ${viewer.labels.length} labels to view.`);
        _labels[viewer.id] = labels_string;
    }
}

export function renderFeatures(viewer: Viewer) {
    const features_string = JSON.stringify(viewer.features.map((i) => ({ ...i, content: '' })));
    if (features_string !== _features[viewer.id]) {
        const overlay_el = viewer.element?.querySelector('.svg-overlays');
        if (!overlay_el) return;
        const feature_el_list = overlay_el.querySelectorAll('.feature');
        /** Remove existing features */
        feature_el_list.forEach((feature_el) => {
            if (feature_el.parentNode) {
                overlay_el.removeChild(feature_el);
            }
        });
        for (const feature of viewer.features) {
            let coordinates = { x: 0, y: 0 };
            let size = { w: 0, h: 0 };
            if (typeof feature.location === 'string') {
                coordinates = coordinatesForElement(viewer, feature.location);
                size = relativeSizeOfElement(viewer, feature.location);
            } else {
                coordinates = feature.location;
            }
            const feature_container_el = document.createElement('div');
            feature_container_el.classList.add('svg-overlay-item');
            feature_container_el.classList.add('feature');
            if (feature.hover) {
                feature_container_el.classList.add('hover');
            }
            feature_container_el.style.top = `${coordinates.y * 100}%`;
            feature_container_el.style.left = `${coordinates.x * 100}%`;
            if (size.w || size.h) {
                feature_container_el.style.width = `${size.w * 100 * (viewer.zoom / 10)}%`;
                feature_container_el.style.height = `${size.h * 100 * (viewer.zoom / 10)}%`;
                feature_container_el.id = `${feature.location}`;
            }
            feature_container_el.appendChild(feature.content);
            overlay_el.appendChild(feature_container_el);
        }
        log('RENDER', `Added ${viewer.features.length} features to view.`);
        _features[viewer.id] = features_string;
    }
}

/**
 * Convert mapping of styles to a string
 * @param id ID of the viewer
 * @param styles Style mappings
 */
export function styleMapToString(id: string, styles: ViewerStyles): string {
    let output = '';
    for (const selector in styles) {
        let properties = '';
        for (const prop in styles[selector]) {
            properties += `${prop}: ${styles[selector][prop]}; `;
        }
        output += `#${cleanCssSelector(id)} ${cleanCssSelector(selector)} { ${properties} } `;
    }
    return output;
}
