import * as Renderer from '../src/renderer';
import * as Input from '../src/input';

import { Viewer } from '../src/viewer.class';

describe('Rendering Methods', () => {
    describe('createView', () => {
        it('should error when no element for viewer', () => {
            expect(() => Renderer.createView(new Viewer({ element: null }))).toThrowError();
        });

        it('should create the elements for the viewer', () => {
            const el = document.createElement('div');
            const view = new Viewer({
                element: el,
                svg_data: '<svg width="100" height="100"></svg>',
            });
            Renderer.createView(view);
            expect(el.querySelector('.svg-viewer')).toBeTruthy();
            expect(el.querySelector('style')).toBeTruthy();
            expect(el.querySelector('.svg-viewer__render-container')).toBeTruthy();
            expect(el.querySelector('.svg-viewer__svg-overlays')).toBeTruthy();
            expect(el.querySelector('.svg-viewer__svg-output')).toBeTruthy();
        });

        it('should handle no SVG data', () => {
            const el = document.createElement('div');
            const view = new Viewer({
                element: el,
                svg_data: '',
            });
            Renderer.createView(view);
        })

        it('should render view and setup listeners', () => {
            spyOn(Renderer, 'renderView');
            spyOn(Input, 'listenForViewActions');
            spyOn(Input, 'listenForResize');
            const el = document.createElement('div');
            const view = new Viewer({
                element: el,
                svg_data: '<svg width="100" height="100"></svg>',
            });
            Renderer.createView(view);
            // expect(Renderer.renderView).toHaveBeenCalled();
            expect(Input.listenForViewActions).toHaveBeenCalled();
            expect(Input.listenForResize).toHaveBeenCalled();
        });
    });

    describe('renderView', () => {
        let view: Viewer;

        beforeEach(() => {
            const el = document.createElement('div');
            view = new Viewer({ element: el, svg_data: '<svg width="100" height="100"></svg>' });
            Renderer.createView(view);
        });

        it('should update the state of the DOM', (done) => {
            Renderer.renderView(view);
            setTimeout(() => done(), 20);
        });
    });

    describe('resizeView', () => {
        let view: Viewer;

        beforeEach(() => {
            const el = document.createElement('div');
            view = new Viewer({ element: el, svg_data: '<svg width="100" height="100"></svg>' });
            Renderer.createView(view);
        });

        it('should update the box sizing of the view', (done) => {
            Renderer.resizeView(view);
            setTimeout(() => done(), 20);
        });
    });

    describe('renderLabels', () => {
        let view: Viewer;

        beforeEach(() => {
            const el = document.createElement('div');
            view = new Viewer({
                element: el,
                svg_data: '<svg id="svg" width="100" height="100"></svg>',
                labels: [{ content: 'Test', location: { x: 0.5, y: 0.5 } }],
            });
            Renderer.createView(view);
        });

        it('should update the labels renderer over the SVG', () => {
            Renderer.renderLabels(view);
            Renderer.renderLabels(new Viewer({ ...view, labels: [{ content: 'Test 2', location: 'svg' }] }));
        });
    });

    describe('renderFeatures', () => {
        let view: Viewer;

        beforeEach(() => {
            const el = document.createElement('div');
            view = new Viewer({
                element: el,
                svg_data: '<svg width="100" height="100"></svg>',
                features: [
                    { content: document.createElement('input'), location: { x: 0.5, y: 0.5 } },
                ],
            });
            Renderer.createView(view);
        });

        it('should update the features renderer over the SVG', () => {
            Renderer.renderFeatures(view);
            Renderer.renderFeatures(new Viewer({ ...view, features: [
                { content: document.createElement('button'), location: { x: 0.75, y: 0.75 } },
            ] }));
        });
    });

    describe('styleMapToString', () => {
        it('should convert a hash map of styles to a CSS string', () => {
            expect(Renderer.styleMapToString('test', { '.item': { fill: '#123456' } })).toBe(
                '#test .item { fill: #123456;  } '
            );
            expect(Renderer.styleMapToString('test', { '.item.other': { fill: '#123456' } })).toBe(
                '#test .item\\.other { fill: #123456;  } '
            );
            expect(Renderer.styleMapToString('test', { '#item': { fill: '#123456' } })).toBe(
                '#test #item { fill: #123456;  } '
            );
            expect(
                Renderer.styleMapToString('test', { '#item': { fill: '#123456', opacity: 2 } })
            ).toBe('#test #item { fill: #123456; opacity: 2;  } ');
        });
    });
});
