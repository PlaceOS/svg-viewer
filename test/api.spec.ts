
import { Viewer } from '../src/viewer.class';

import * as API from '../src/api';
import * as Renderer from '../src/renderer';
import * as Input from '../src/input';

describe('API Methods', () => {

    describe('resizeViewers', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(Renderer, 'resizeView');
        });

        afterEach(() => {
            spy.mockRestore();
            API._svg_viewers.next([]);
        })

        it('should call resize for each viewer', () => {
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            API.resizeViewers();
            expect(Renderer.resizeView).toBeCalledTimes(1);
            API._svg_viewers.next([new Viewer({ id: '1' }), new Viewer({ id: '2' })]);
            API.resizeViewers();
            expect(Renderer.resizeView).toBeCalledTimes(3);
        });
    });

    describe('getViewer', () => {

        afterEach(() => {
            API._svg_viewers.next([]);
        });

        it('should return the viewer with the given ID', () => {
            expect(API.getViewer('1')).toBeUndefined();
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            expect(API.getViewer('1')).toBeInstanceOf(Viewer);
            API._svg_viewers.next([new Viewer({ id: '1' }), new Viewer({ id: '2' })]);
            expect(API.getViewer('2')?.id).toBe('2');
        });
    });

    describe('listenToViewerChanges', () => {

        afterEach(() => {
            API._svg_viewers.next([]);
        });

        it('should return the viewer with the given ID', (done) => {
            expect.assertions(2);
            let count = 0;
            API.listenToViewerChanges('1').subscribe((viewer) => {
                if (count === 0) {
                    expect(viewer.zoom).toBe(1.5);
                    setTimeout(() => API._svg_viewers.next([new Viewer({ id: '1', zoom: 2 })]));
                } else if (count === 1) {
                    expect(viewer.zoom).toBe(2);
                    done();
                }
                count++;
            });
            API._svg_viewers.next([new Viewer({ id: '1', zoom: 1.5 })]);
            API._svg_viewers.next(API._svg_viewers.getValue().concat([new Viewer({ id: '2' })]));
        });
    });

    describe('createViewer', () => {

        afterEach(() => {
            API._svg_viewers.next([]);
        });

        it('should add a new viewer with the given details', async () => {
            const el = document.createElement('div');
            (window as any).fetch = jest.fn(() => ({ text: async () => '' }))
            const id = await API.createViewer({ element: el, url: '1' });
            expect(API.getViewer(id)).toBeInstanceOf(Viewer);
            const id2 = await API.createViewer({ element: el, url: '2'});
            expect(id).not.toBe(id2);
            const id3 = await API.createViewer({ element: el, url: '1' });
            expect(id).toBe(id3);
        });
    });

    describe('updateViewer', () => {
        let spy: jest.SpyInstance;
        let input_spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(Renderer, 'renderView');
            input_spy = jest.spyOn(Input, 'listenForCustomViewActions');
        });

        afterEach(() => {
            spy.mockRestore();
            input_spy.mockRestore();
            API._svg_viewers.next([]);
        })

        it('should update the viewer with the given ID', () => {
            API._svg_viewers.next([]);
            expect(() => API.updateViewer('1', {})).toThrowError();
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            let view = API.updateViewer('1', {});
            expect(Renderer.renderView).toBeCalled();
            expect(Input.listenForCustomViewActions).toBeCalled();
            expect(view).toBeInstanceOf(Viewer);
            view = API.updateViewer(view, {});
            expect(view).toBeInstanceOf(Viewer);
        });

        it('should allow preventing rendering', () => {
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            API.updateViewer('1', {}, false);
            expect(Renderer.renderView).not.toBeCalled();
            expect(Input.listenForCustomViewActions).not.toBeCalled();
        });

        it('should automatically perform the next update if the viewer needs more updates', () => {
            jest.useFakeTimers();
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            API.updateViewer('1', { zoom: 1, desired_zoom: 10 });
            expect(API.getViewer('1')?.zoom).toBe(1.05);
            jest.runOnlyPendingTimers();
            expect(API.getViewer('1')?.zoom).toBe(1.1);
            jest.useRealTimers();
        })
    });

    describe('removeViewer', () => {

        afterEach(() => {
            API._svg_viewers.next([]);
        });

        it('should remove the viewer with the given ID', () => {
            const parent_el = document.createElement('div');
            const child_el = document.createElement('div');
            child_el.classList.add('svg-viewer');
            parent_el.appendChild(child_el);
            API.removeViewer('1');  // Should exit early as no viewer for ID
            API._svg_viewers.next([new Viewer({ id: '1' })]);
            API.removeViewer('1'); // Should exit early as no element to detach
            API._svg_viewers.next([new Viewer({ id: '1', element: parent_el })]);
            API.removeViewer('1');
            expect(child_el.parentElement).toBeNull();
        });
    });

    describe('loadSVGData', () => {

        afterEach(() => {
            for (const k in API._svg_cache) {
                delete API._svg_cache[k];
            }
        })

        it('should load SVG data from given URL', async () => {
            (window as any).fetch = jest.fn(() => ({ text: async () => 'file' }));
            let data = await API.loadSVGData();
            data = await API.loadSVGData('my.svg');
            expect(data).toBe('file');
            (window as any).fetch.mockImplementation(() => ({ text: async () => 'another file' }));
            const data2 = await API.loadSVGData('another.svg');
            expect(data2).toBe('another file');
        });

        it('should load SVG data cache if available', async () => {
            (window as any).fetch = jest.fn(() => ({ text: async () => 'a file' }));
            let data = await API.loadSVGData('my.svg');
            expect(data).toBe('a file');
            (window as any).fetch.mockImplementation(() => ({ text: async () => 'another file' }));
            data = await API.loadSVGData('my.svg');
            expect(data).toBe('a file');
        });
    });

});
