import { describe, expect, test, vi } from 'vitest';
import {
    cleanCssSelector,
    coordinatesForElement,
    coordinatesForPoint,
    distanceBetween,
    eventToPoint,
    relativeSizeOfElement,
    transformPointTowards,
} from '../src/helpers';
import { Viewer } from '../src/viewer.class';

describe('Helper Methods', () => {
    describe('cleanCssSelector', () => {
        test('should escape invalid selector symbols within words', () => {
            expect(cleanCssSelector('.test')).toBe('.test');
            expect(cleanCssSelector('.test.yelp')).toBe('.test\\.yelp');
            expect(cleanCssSelector('.test .yelp')).toBe('.test .yelp');
            expect(cleanCssSelector('.test .yelp #other')).toBe('.test .yelp #other');
            expect(cleanCssSelector('#other')).toBe('#other');
            expect(cleanCssSelector('.test#other')).toBe('.test\\#other');
        });
    });

    describe('eventToPoint', () => {
        test('should return a simple point when event invalid', () => {
            expect(eventToPoint(null as any)).toEqual({ x: -1, y: -1 });
            expect(eventToPoint({} as any)).toEqual({ x: -1, y: -1 });
        });

        test('should get the clientX and clientY from a mouse event', () => {
            const position = { clientX: 1, clientY: 2 };
            expect(eventToPoint(new MouseEvent('click', position as any))).toEqual({ x: 1, y: 2 });
            expect(eventToPoint(new MouseEvent('click', {}))).not.toEqual({ x: 1, y: 2 });
        });

        test('should get the clientX and clientY from a touch event', () => {
            const position = { clientX: 1, clientY: 2 };
            expect(
                eventToPoint(new TouchEvent('touchend', { touches: [position as any] })),
            ).toEqual({ x: 1, y: 2 });
            expect(eventToPoint(new TouchEvent('touchend', position as any))).not.toEqual({
                x: 1,
                y: 2,
            });
        });
    });

    describe('coordinatesForElement', () => {
        test('should return a simple position when elements invalid', () => {
            expect(coordinatesForElement(new Viewer({}), '')).toEqual({ x: -1, y: -1 });
            const parent_el = document.createElement('div');
            expect(coordinatesForElement(new Viewer({ element: parent_el }), '')).toEqual({
                x: -1,
                y: -1,
            });
        });

        test('should get the position of the given element', () => {
            const parent_el = document.createElement('div');
            const svg_el = document.createElement('svg');
            const el = document.createElement('g');
            el.id = 'test';
            parent_el.appendChild(svg_el);
            svg_el.appendChild(el);
            const svg_spy = vi.spyOn(svg_el, 'getBoundingClientRect');
            svg_spy.mockImplementation(
                () =>
                    ({ top: 0, left: 0, right: 100, bottom: 100, height: 100, width: 100 }) as any,
            );
            const el_spy = vi.spyOn(el, 'getBoundingClientRect');
            el_spy.mockImplementation(
                () => ({ top: 45, left: 45, right: 55, bottom: 55, height: 10, width: 10 }) as any,
            );
            const viewer = new Viewer({ element: parent_el });
            expect(coordinatesForElement(viewer, 'test')).toEqual({ x: 0.5, y: 0.5 });
            expect(
                coordinatesForElement(viewer, 'test', {
                    top: 0,
                    left: 0,
                    right: 80,
                    bottom: 80,
                    height: 80,
                    width: 80,
                } as any),
            ).toEqual({ x: 0.625, y: 0.625 });
        });
    });

    describe('coordinatesForPoint', () => {
        test('should return a simple position when elements invalid', () => {
            expect(coordinatesForPoint(new Viewer({}), { x: 25, y: 25 })).toEqual({ x: -1, y: -1 });
            const parent_el = document.createElement('div');
            expect(
                coordinatesForPoint(new Viewer({ element: parent_el }), { x: 25, y: 25 }),
            ).toEqual({ x: -1, y: -1 });
        });

        test('should get the position of the given element', () => {
            const parent_el = document.createElement('div');
            const svg_el = document.createElement('svg');
            parent_el.appendChild(svg_el);
            const svg_spy = vi.spyOn(svg_el, 'getBoundingClientRect');
            svg_spy.mockImplementation(
                () =>
                    ({ top: 0, left: 0, right: 100, bottom: 100, height: 100, width: 100 }) as any,
            );
            const viewer = new Viewer({ element: parent_el });
            expect(coordinatesForPoint(viewer, { x: 45, y: 45 })).toEqual({ x: 0.45, y: 0.45 });
            expect(
                coordinatesForPoint(viewer, { x: 50, y: 50 }, {
                    top: 0,
                    left: 0,
                    right: 80,
                    bottom: 80,
                    height: 80,
                    width: 80,
                } as any),
            ).toEqual({ x: 0.625, y: 0.625 });
        });
    });

    describe('relativeSizeOfElement', () => {
        test('should return a simple position when elements invalid', () => {
            expect(relativeSizeOfElement(new Viewer({}), '')).toEqual({ w: 0, h: 0 });
            const parent_el = document.createElement('div');
            expect(relativeSizeOfElement(new Viewer({ element: parent_el }), '')).toEqual({
                w: 0,
                h: 0,
            });
        });

        test('should get the position of the given element', () => {
            const parent_el = document.createElement('div');
            const svg_el = document.createElement('svg');
            const el = document.createElement('g');
            el.id = 'test';
            parent_el.appendChild(svg_el);
            svg_el.appendChild(el);
            const svg_spy = vi.spyOn(svg_el, 'getBoundingClientRect');
            svg_spy.mockImplementation(
                () =>
                    ({ top: 0, left: 0, right: 100, bottom: 100, height: 100, width: 100 }) as any,
            );
            const el_spy = vi.spyOn(el, 'getBoundingClientRect');
            el_spy.mockImplementation(
                () => ({ top: 45, left: 45, right: 55, bottom: 55, height: 10, width: 10 }) as any,
            );
            const viewer = new Viewer({ element: parent_el });
            expect(relativeSizeOfElement(viewer, 'test')).toEqual({ w: 0.1, h: 0.1 });
            expect(
                relativeSizeOfElement(viewer, 'test', {
                    top: 0,
                    left: 0,
                    right: 80,
                    bottom: 80,
                    height: 80,
                    width: 80,
                } as any),
            ).toEqual({ w: 0.125, h: 0.125 });
        });
    });

    describe('distanceBetween', () => {
        test('should calculate the distance between two point', () => {
            expect(distanceBetween({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(Math.sqrt(2));
            expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
            expect(distanceBetween({ x: 1, y: 1 }, { x: 0, y: 0 })).toBe(Math.sqrt(2));
            expect(distanceBetween({ x: 3, y: 4 }, { x: 0, y: 0 })).toBe(5);
        });
    });

    describe('calculateCenterFromZoomOffset', () => {
        test('should calculate the correct new center when zooming in', () => {
            expect(transformPointTowards({ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 }, 3)).toEqual({
                x: 0.3,
                y: 0.3,
            });
            expect(transformPointTowards({ x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 }, 2)).toEqual({
                x: 0.375,
                y: 0.375,
            });
            expect(transformPointTowards({ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 }, 1.5)).toEqual({
                x: 0.4,
                y: 0.4,
            });
            expect(transformPointTowards({ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, 1.01)).toEqual({
                x: 0.495,
                y: 0.495,
            });
        });

        test('should calculate the correct new center when zooming out', () => {
            expect(transformPointTowards({ x: 0.2, y: 0.2 }, { x: 0.35, y: 0.35 }, 0.75)).toEqual({
                x: 0.4,
                y: 0.4,
            });
            expect(
                transformPointTowards({ x: 0.25, y: 0.25 }, { x: 0.375, y: 0.375 }, 0.5),
            ).toEqual({ x: 0.5, y: 0.5 });
            expect(transformPointTowards({ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }, 0.25)).toEqual({
                x: 0.6,
                y: 0.6,
            });
            expect(transformPointTowards({ x: 0, y: 0 }, { x: 0.99, y: 0.99 }, 0.99)).toEqual({
                x: 1,
                y: 1,
            });
        });
    });
});
