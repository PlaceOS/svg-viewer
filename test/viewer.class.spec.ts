import { Viewer } from "../src/viewer.class";

describe('Viewer', () => {
    let viewer: Viewer;

    beforeEach(() => {
        viewer = new Viewer({ id: `1` });
    });

    it('should create instance', () => {
        expect(viewer).toBeInstanceOf(Viewer);
    });

    it('should expose it\'s properties', () => {
        expect(viewer.id).toBe('1');
        expect(viewer.element).toBeNull();
        expect(viewer.labels).toEqual([]);
        expect(viewer.features).toEqual([]);
        expect(viewer.actions).toEqual([]);
        expect(viewer.styles).toEqual({});
        expect(viewer.svg_data).toBe('');
        expect(viewer.zoom).toBe(1);
        expect(viewer.desired_zoom).toBe(viewer.zoom);
        expect(viewer.center).toEqual({ x: .5, y: .5 });
        expect(viewer.desired_center).toEqual(viewer.center);
        expect(viewer.rotate).toBe(0);
        expect(viewer.ratio).toBe(1);
        expect(viewer.focus).toBeNull();
        expect(viewer.options).toEqual({});
        expect(viewer.box).toEqual({ top: 0, left: 0, height: 0, width: 0 });
    });

    it('should update zoom towards desired', () => {
        expect(viewer.zoom).toBe(1);
        viewer = new Viewer({ ...viewer, desired_zoom: 1.12 });
        expect(viewer.zoom).toBe(1.05);
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.1);
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.12);
        viewer = new Viewer({ ...viewer, zoom: 2, desired_zoom: 1.88 });
        expect(viewer.zoom).toBe(1.95);
    });

    it('should update center based off changes in zoom', () => {
        expect(viewer.zoom).toBe(1);
        expect(viewer.center).toEqual({ x: .5, y: .5 });
        viewer = new Viewer({ ...viewer, desired_zoom: 1.50, desired_center: { x: 1, y: 1 } });
        expect(viewer.zoom).toBe(1.05);
        expect(viewer.center).toEqual({ x: .55, y: .55 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.1);
        expect(viewer.center).toEqual({ x: .6, y: .6 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.15);
        expect(viewer.center).toEqual({ x: .65, y: .65 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.2);
        expect(viewer.center).toEqual({ x: .7, y: .7 });

    });

    it('should update center towards desired', () => {
        expect(viewer.center).toEqual({ x: .5, y: .5 });
        viewer = new Viewer({ ...viewer, desired_center: { x: .525, y: .525 } });
        expect(viewer.center).toEqual({ x: .51, y: .51 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.center).toEqual({ x: .52, y: .52 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.center).toEqual({ x: .525, y: .525 });
        viewer = new Viewer({ ...viewer, center: { x: .5, y: .5 } });
        expect(viewer.center).toEqual({ x: .51, y: .51 });
        viewer = new Viewer({ ...viewer, center: { x: .5, y: .5 }, desired_center: { x: .475, y: .475 } });
        expect(viewer.center).toEqual({ x: .49, y: .49 });
    });
})
