import { calculateCenterFromZoomOffset } from '../src/helpers';

describe('calculateCenterFromZoomOffset', () => {

    it('should calculate the correct new center when zooming in', () => {
        expect(calculateCenterFromZoomOffset(3, { x: 0.20, y: 0.20 }, { x: 0.5, y: 0.5 })).toEqual({
            x: 0.3,
            y: 0.3,
        });
        expect(calculateCenterFromZoomOffset(2, { x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 })).toEqual({
            x: 0.375,
            y: 0.375,
        });
        expect(calculateCenterFromZoomOffset(1.5, { x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 })).toEqual({
            x: 0.4,
            y: 0.4,
        });
        expect(calculateCenterFromZoomOffset(1.01, { x: 0, y: 0 }, { x: 0.5, y: 0.5 })).toEqual({
            x: 0.495,
            y: 0.495,
        });
    });

    it('should calculate the correct new center when zooming out', () => {
        expect(
            calculateCenterFromZoomOffset(0.75, { x: 0.20, y: 0.20 }, { x: 0.35, y: 0.35 })
        ).toEqual({ x: 0.4, y: 0.4 });
        expect(
            calculateCenterFromZoomOffset(0.5, { x: 0.25, y: 0.25 }, { x: 0.375, y: 0.375 })
        ).toEqual({ x: 0.5, y: 0.5 });
        expect(
            calculateCenterFromZoomOffset(0.25, { x: 0.20, y: 0.20 }, { x: 0.30, y: 0.30 })
        ).toEqual({ x: 0.6, y: 0.6 });
        expect(
            calculateCenterFromZoomOffset(0.99, { x: 0, y: 0 }, { x: 0.99, y: 0.99 })
        ).toEqual({ x: 1, y: 1 });
    });
});
