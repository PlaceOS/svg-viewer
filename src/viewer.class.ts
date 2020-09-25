import { Md5 } from 'ts-md5';

import { Feature, Label, Point, Styles, ViewAction } from './types';

const EMPTY_BOX = { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };

export interface Box {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
}

export class Viewer {
    /** Unique Identifier for the Viewer */
    public id: string;
    /** URL associated with the map data */
    public url: string;
    /** Element the SVG is attached */
    public readonly element: HTMLElement | null;
    /** Labels to render over the SVG */
    public readonly labels: Label[];
    /** Features to render over the SVG */
    public readonly features: Feature[];
    /** Actions to listen for on the SVG */
    public readonly actions: ViewAction[];
    /** Styles to apply the SVG */
    public readonly styles: Styles;
    /** Raw SVG data */
    public readonly svg_data: string;
    /** Zoom level of the SVG. Number from 1 - 10 */
    public readonly zoom: number;
    /** Center point of the SVG on the view */
    public readonly center: Point;
    /** Rotation angle of the SVG on the view */
    public readonly rotate: number;
    /** Ratio that the height to width of the SVG is */
    public readonly ratio: number;
    /** Box dimensions for the root element of the viewer */
    public readonly box: Box;

    constructor(_data: Partial<Viewer>) {
        this.id = _data.id || `map-${Math.floor(Math.random() * 999_999)}`;
        this.url = _data.url || `local-${Md5.hashAsciiStr(_data.svg_data || '')}`;
        this.element = _data.element || null;
        this.labels = _data.labels || [];
        this.features = _data.features || [];
        this.actions = _data.actions || [];
        this.styles = _data.styles || {};
        this.svg_data = _data.svg_data || '';
        this.svg_data = _data.svg_data || '';
        this.zoom = _data.zoom || 1;
        this.center = { x: (_data.center?.x || 0.5), y: (_data.center?.y || 0.5) };
        this.rotate = _data.rotate || 0;
        this.ratio = _data.ratio || 1;
        this.box = {
            top: (_data.box || EMPTY_BOX).top,
            left: (_data.box || EMPTY_BOX).left,
            height: (_data.box || EMPTY_BOX).height,
            width: (_data.box || EMPTY_BOX).width,
        };
    }
}
