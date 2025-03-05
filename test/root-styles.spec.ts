import { describe, expect, test } from 'vitest';
import * as Styles from '../src/root-styles';

describe('View Styles', () => {
    describe('applyGlobalStyles', () => {
        test('should add global styles for SVG viewers', () => {
            Styles.applyGlobalStyles();
            expect(document.querySelector('#svg-viewer-global')).toBeTruthy();
            Styles.applyGlobalStyles();
            expect(document.querySelectorAll('#svg-viewer-global').length).toBe(1);
        });
    });
});
