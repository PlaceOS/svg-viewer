import { log } from './helpers';

/**
 * Add global styles for SVG Viewers to document
 */
export function applyGlobalStyles() {
    let element = document.getElementById('svg-viewer-global');
    if (!element) {
        element = document.createElement('style');
        element.id = 'svg-viewer-global';
        element.innerHTML = STYLES;
        document.head.appendChild(element);
        log('Styles', 'Added global viewer styles to document');
    }
}

export const STYLES = `
    .svg-viewer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }

    .svg-viewer .render-container {
        position: absolute;
        top: -450%;
        left: -450%;
        right: -450%;
        bottom: -450%;
    }

    .svg-viewer .svg-output {
        position: absolute;
        top: 10em;
        left: 10em;
        right: 10em;
        bottom: 10em;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .svg-viewer .svg-overlays {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .svg-viewer label {
        text-shadow: black 1px 1px;
        color: white;
        white-space: pre-line;
        text-align: center;
        min-width: 10em;
    }

    .svg-viewer .svg-overlay-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 1px;
        width: 1px;
        position: absolute;
        transform-origin: center;
    }

    .svg-viewer .svg-overlay-item.hover {
        pointer-events: auto;
    }

    .svg-viewer .svg-overlay-item.hover > * {
        display: none;
    }

    .svg-viewer .svg-overlay-item.hover:hover > * {
        display: initial;
    }

    .svg-viewer svg {
        max-width: 100%;
        max-height: 100%;
    }
`;
