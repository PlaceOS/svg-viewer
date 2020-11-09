import 'regenerator-runtime/runtime';
import { applyGlobalStyles, createViewer, getViewer, updateViewer } from '../dist/svg-viewer.module.js';

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
            { location: 'NT-mainland', content: 'Northern\nTerritory' },
            { location: 'NSW', content: 'New South\nWales' },
            { location: 'VIC', content: 'Victoria' },
            { location: 'QLD-mainland', content: 'Queensland' },
            { location: 'WA', content: 'Western Australia' },
            { location: 'SA-mainland', content: 'South Australia' },
            { location: 'ACT', content: 'ACT' },
            { location: 'TAS-mainland', content: 'Tasmania' },
        ],
        url: '/australia.svg',
    }).then((viewer) => {
        const el = document.querySelector('.overlays #NT');
        updateViewer(viewer, {
            features: [
                { location: 'NT-mainland', hover: true, content: document.querySelector('.overlays #NT') },
                { location: 'QLD-mainland', hover: true, content: document.querySelector('.overlays #QLD') }
            ],
            actions: ['NT-mainland', 'QLD-mainland', 'NSW', 'WA', 'TAS-mainland', 'VIC', 'SA-mainland', 'ACT'].map(id => {
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
            updateViewer(viewer, { desired_zoom: zoom });
        });
        const out_el = document.getElementById('zoom-out');
        out_el.addEventListener('click', () => {
            zoom = zoom * (1 / 1.1);
            updateViewer(viewer, { desired_zoom: zoom });
        });
        const rotate_el = document.getElementById('rotate');
        rotate_el.addEventListener('click', () => {
            rotate = (rotate + 45) % 360;
            updateViewer(viewer, { rotate });
        });
        const focus_el = document.getElementById('focus');
        focus_el.addEventListener('click', () => {
            const view = getViewer(viewer);
            const focus_on = {
                location: view.labels[Math.floor(Math.random() * view.labels.length)].location,
                zoom_level: 1.5
            }
            updateViewer(viewer, { focus: focus_on });
        });
    });
});
