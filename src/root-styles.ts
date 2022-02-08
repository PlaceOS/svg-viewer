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
    .svg-viewer__view-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .svg-viewer__render-container {
        position: absolute;
        top: 0%;
        left: 0%;
        right: 0%;
        bottom: 0%;
        transform-box: fill-box;
    }

    .svg-viewer__svg-output {
        position: absolute;
        top: -100%;
        left: -100%;
        right: -100%;
        bottom: -100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateZ(0);
        pointer-events: none;
    }

    .svg-viewer__svg-output svg {
        opacity: 0;
        height: auto;
        max-width: 200%;
        max-height: 200%;
        width: 2000px;
    }

    .svg-viewer__svg-overlays {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .svg-viewer__label {
        text-shadow: black 1px 1px;
        color: white;
        white-space: pre-line;
        text-align: center;
        min-width: 10em;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1
    }

    .svg-viewer__svg-overlay-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 0.1%;
        width: 0.1%;
        position: absolute;
        transform-origin: center;
    }

    .svg-viewer__svg-overlay-item > * {
        will-change: transform;
    }

    .svg-viewer__svg-overlay-item__hover {
        pointer-events: auto;
    }

    .svg-viewer__svg-overlay-item__hover > * {
        display: none;
    }

    .svg-viewer__svg-overlay-item__hover:hover > * {
        display: initial;
    }

    .action-zone {
        pointer-events: auto;
    }
`;
