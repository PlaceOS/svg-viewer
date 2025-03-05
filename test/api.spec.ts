import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Viewer } from '../src/viewer.class';

import * as API from '../src/api';
import * as Input from '../src/input';
import * as Renderer from '../src/renderer';
import * as STORE from '../src/store';

describe('API Methods', () => {
    describe('getViewer', () => {
        afterEach(() => {
            STORE._svg_viewers.next([]);
        });

        test('should return the viewer with the given ID', () => {
            expect(STORE.getViewer('1')).toBeUndefined();
            STORE._svg_viewers.next([new Viewer({ id: '1' })]);
            expect(STORE.getViewer('1')).toBeInstanceOf(Viewer);
            STORE._svg_viewers.next([new Viewer({ id: '1' }), new Viewer({ id: '2' })]);
            expect(STORE.getViewer('2')?.id).toBe('2');
        });
    });

    describe('listenToViewerChanges', () => {
        afterEach(() => {
            STORE._svg_viewers.next([]);
        });

        test('should return the viewer with the given ID', () =>
            new Promise<void>((resolve) => {
                expect.assertions(2);
                let count = 0;
                STORE.onViewerChange('1').subscribe((viewer) => {
                    if (count === 0) {
                        expect(viewer.zoom).toBe(1.5);
                        setTimeout(() =>
                            STORE._svg_viewers.next([new Viewer({ id: '1', zoom: 2 })]),
                        );
                    } else if (count === 1) {
                        expect(viewer.zoom).toBe(2);
                        resolve();
                    }
                    count++;
                });
                STORE._svg_viewers.next([new Viewer({ id: '1', zoom: 1.5 })]);
                STORE._svg_viewers.next(
                    STORE._svg_viewers.getValue().concat([new Viewer({ id: '2' })]),
                );
            }));
    });

    describe('createViewer', () => {
        afterEach(() => {
            STORE._svg_viewers.next([]);
        });

        test('should add a new viewer with the given details', async () => {
            const el = document.createElement('div');
            (window as any).fetch = vi.fn(() => ({ text: async () => '' }));
            const id = await API.createViewer({ element: el, url: '1' });
            expect(STORE.getViewer(id)).toBeInstanceOf(Viewer);
            const id2 = await API.createViewer({ element: el, url: '2' });
            expect(id).not.toBe(id2);
            const id3 = await API.createViewer({ element: el, url: '1' });
            expect(id).toBe(id3);
        });
    });

    describe('updateViewer', () => {
        let spy: any;
        let input_spy: any;

        beforeEach(() => {
            spy = vi.spyOn(Renderer, 'renderView');
            input_spy = vi.spyOn(Input, 'listenForViewActions');
        });

        afterEach(() => {
            spy.mockRestore();
            input_spy.mockRestore();
            STORE._svg_viewers.next([]);
        });

        test('should update the viewer with the given ID', () => {
            STORE._svg_viewers.next([]);
            expect(() => API.updateViewer('1', {})).toThrowError();
            STORE._svg_viewers.next([new Viewer({ id: '1' })]);
            let view = API.updateViewer('1', {});
            expect(Renderer.renderView).toBeCalled();
            expect(Input.listenForViewActions).toBeCalled();
            expect(view).toBeInstanceOf(Viewer);
            view = API.updateViewer(view!, {});
            expect(view).toBeInstanceOf(Viewer);
        });

        test('should allow preventing rendering', () => {
            STORE._svg_viewers.next([new Viewer({ id: '1' })]);
            API.updateViewer('1', {});
            expect(Renderer.renderView).not.toBeCalled();
            expect(Input.listenForViewActions).not.toBeCalled();
        });

        test('should automatically perform the next update if the viewer needs more updates', () => {
            vi.useFakeTimers();
            STORE._svg_viewers.next([new Viewer({ id: '1' })]);
            API.updateViewer('1', { zoom: 1, desired_zoom: 10 });
            expect(STORE.getViewer('1')?.zoom).toBe(1.05);
            vi.runOnlyPendingTimers();
            expect(STORE.getViewer('1')?.zoom).toBe(1.1);
            vi.useRealTimers();
        });
    });

    describe('removeViewer', () => {
        afterEach(() => {
            STORE._svg_viewers.next([]);
        });

        test('should remove the viewer with the given ID', () => {
            const parent_el = document.createElement('div');
            const child_el = document.createElement('div');
            child_el.classList.add('svg-viewer');
            parent_el.appendChild(child_el);
            API.removeViewer('1'); // Should exit early as no viewer for ID
            STORE._svg_viewers.next([new Viewer({ id: '1' })]);
            API.removeViewer('1'); // Should exit early as no element to detach
            STORE._svg_viewers.next([new Viewer({ id: '1', element: parent_el })]);
            API.removeViewer('1');
            expect(child_el.parentElement).toBeNull();
        });
    });

    describe('loadSVGData', () => {
        afterEach(() => {
            for (const k in API._svg_cache) {
                delete API._svg_cache[k];
            }
        });

        test('should load SVG data from given URL', async () => {
            (window as any).fetch = vi.fn(() => ({ text: async () => 'file' }));
            let data = await API.loadSVGData();
            data = await API.loadSVGData('my.svg');
            expect(data).toBe('file');
            (window as any).fetch.mockImplementation(() => ({ text: async () => 'another file' }));
            const data2 = await API.loadSVGData('another.svg');
            expect(data2).toBe('another file');
        });

        test('should load SVG data cache if available', async () => {
            (window as any).fetch = vi.fn(() => ({ text: async () => 'a file' }));
            let data = await API.loadSVGData('my.svg');
            expect(data).toBe('a file');
            (window as any).fetch.mockImplementation(() => ({ text: async () => 'another file' }));
            data = await API.loadSVGData('my.svg');
            expect(data).toBe('a file');
        });
    });
});
