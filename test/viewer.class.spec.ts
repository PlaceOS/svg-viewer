import { beforeEach, describe, expect, test } from 'vitest';
import { Viewer } from '../src/viewer.class';

describe('Viewer', () => {
    let viewer: Viewer;

    beforeEach(() => {
        viewer = new Viewer({ id: `1` });
    });

    test('should create instance', () => {
        expect(viewer).toBeInstanceOf(Viewer);
    });

    test("should expose it's properties", () => {
        expect(viewer.id).toBe('1');
        expect(viewer.element).toBeNull();
        expect(viewer.labels).toEqual([]);
        expect(viewer.features).toEqual([]);
        expect(viewer.actions).toEqual([]);
        expect(viewer.styles).toEqual({});
        expect(viewer.svg_data).toBe('');
        expect(viewer.zoom).toBe(1);
        expect(viewer.desired_zoom).toBe(viewer.zoom);
        expect(viewer.center).toEqual({ x: 0.5, y: 0.5 });
        expect(viewer.desired_center).toEqual(viewer.center);
        expect(viewer.rotate).toBe(0);
        expect(viewer.ratio).toBe(1);
        expect(viewer.focus).toBeNull();
        expect(viewer.options).toEqual({});
        expect(viewer.box).toEqual({ top: 0, left: 0, height: 0, width: 0 });
    });

    test('should update zoom towards desired', () => {
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

    test('should update center based off changes in zoom', () => {
        expect(viewer.zoom).toBe(1);
        expect(viewer.center).toEqual({ x: 0.5, y: 0.5 });
        viewer = new Viewer({ ...viewer, desired_zoom: 1.5, desired_center: { x: 1, y: 1 } });
        expect(viewer.zoom).toBe(1.05);
        expect(viewer.center).toEqual({ x: 0.55, y: 0.55 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBe(1.1);
        expect(viewer.center.x).toBeCloseTo(0.6);
        expect(viewer.center.y).toBeCloseTo(0.6);
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBeCloseTo(1.15);
        expect(viewer.center.x).toBeCloseTo(0.65);
        expect(viewer.center.y).toBeCloseTo(0.65);
        viewer = new Viewer({ ...viewer });
        expect(viewer.zoom).toBeCloseTo(1.2);
        expect(viewer.center.x).toBeCloseTo(0.7);
        expect(viewer.center.y).toBeCloseTo(0.7);
    });

    test('should update center towards desired', () => {
        expect(viewer.center).toEqual({ x: 0.5, y: 0.5 });
        viewer = new Viewer({ ...viewer, desired_center: { x: 0.525, y: 0.525 } });
        expect(viewer.center).toEqual({ x: 0.51, y: 0.51 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.center).toEqual({ x: 0.52, y: 0.52 });
        viewer = new Viewer({ ...viewer });
        expect(viewer.center).toEqual({ x: 0.525, y: 0.525 });
        viewer = new Viewer({ ...viewer, center: { x: 0.5, y: 0.5 } });
        expect(viewer.center).toEqual({ x: 0.51, y: 0.51 });
        viewer = new Viewer({
            ...viewer,
            center: { x: 0.5, y: 0.5 },
            desired_center: { x: 0.475, y: 0.475 },
        });
        expect(viewer.center).toEqual({ x: 0.49, y: 0.49 });
    });
});
