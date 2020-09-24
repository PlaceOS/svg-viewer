import 'regenerator-runtime/runtime'
import { createViewer, getViewer, updateViewer } from '../dist/esm/api.js';
import { applyGlobalStyles } from '../dist/esm/root-styles.js';

window.debug = true;

window.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById("svg-viewer");

    console.log('Element:', element);

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
            { location: 'AU-TAS', content: 'Tasmania' }
        ],
        url: '/australia.svg',
    }).then(viewer => {
        let zoom = 1;
        let rotate = 0;
        const in_el = document.getElementById("zoom-in");
        in_el.addEventListener('click', () => {
            zoom = zoom * 1.1;
            updateViewer(getViewer(viewer.id), { zoom })
        })
        const out_el = document.getElementById("zoom-out");
        out_el.addEventListener('click', () => {
            zoom = zoom * (1 / 1.1)
            updateViewer(getViewer(viewer.id), { zoom })
        })
        const rotate_el = document.getElementById("rotate");
        rotate_el.addEventListener('click', () => {
            rotate = (rotate + 45) % 360;
            updateViewer(getViewer(viewer.id), { rotate })
        })
    });
});

