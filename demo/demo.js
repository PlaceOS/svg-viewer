import 'regenerator-runtime/runtime';
import { createViewer, getViewer, updateViewer } from '../dist/esm/api.js';
import { applyGlobalStyles } from '../dist/esm/root-styles.js';
import { cleanCssSelector } from '../dist/esm/helpers.js';

window.debug = true;

const COLOURS = [
    '#e53935',
    '#d81b60',
    '#8e24aa',
    '#5e35b1',
    '#3949ab',
    '#1e88e5',
    '#039be5',
    '#00acc1',
    '#00897b',
    '#43a047',
    '#7cb342',
    '#c0ca33',
    '#fdd835',
    '#ffb300',
    '#fb8c00',
    '#f4511e',
];

let colour_index = 0;

window.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('svg-viewer');

    applyGlobalStyles();
    createViewer({
        element,
        labels: [
            { location: 'AU.NT', content: 'Northern\nTerritory' },
            { location: 'AU-NSW', content: 'New South\nWales' },
            { location: 'AU-VIC', content: 'Victoria' },
            { location: 'AU-QLD', content: 'Queensland' },
            { location: 'AU-WA', content: 'Western Australia' },
            { location: 'AU-SA', content: 'South Australia' },
            { location: 'AU-ACT', content: 'ACT' },
            { location: 'AU-TAS', content: 'Tasmania' },
        ],
        url: '/australia.svg',
    }).then((viewer) => {
        const el = document.querySelector('.overlays #AU\.NT');
        updateViewer(viewer, {
            features: [
                { location: 'AU.NT', hover: true, content: document.querySelector('.overlays #AU-NT') },
                { location: 'AU-QLD', hover: true, content: document.querySelector('.overlays #AU-QLD') }
            ],
            actions: ['AU.NT', 'AU-QLD', 'AU-NSW', 'AU-WA', 'AU-TAS', 'AU-VIC', 'AU-SA', 'AU-ACT'].map(id => {
                return {
                    id,
                    action: 'click',
                    callback: () => {
                        const view = getViewer(viewer);
                        const styles = view.styles;
                        styles[`#${id}`] = {
                            fill: COLOURS[colour_index++ % COLOURS.length],
                        };
                        updateViewer(viewer, { styles });
                    },
                }
            }),
        });
        let zoom = 1;
        let rotate = 0;
        const in_el = document.getElementById('zoom-in');
        in_el.addEventListener('click', () => {
            zoom = zoom * 1.1;
            updateViewer(viewer, { zoom });
        });
        const out_el = document.getElementById('zoom-out');
        out_el.addEventListener('click', () => {
            zoom = zoom * (1 / 1.1);
            updateViewer(viewer, { zoom });
        });
        const rotate_el = document.getElementById('rotate');
        rotate_el.addEventListener('click', () => {
            rotate = (rotate + 45) % 360;
            updateViewer(viewer, { rotate });
        });
    });
});
