import { Md5 } from 'ts-md5';

import {
    ViewerFeature,
    ViewerFocusFeature,
    ViewerLabel,
    Point,
    ViewerStyles,
    ViewAction,
    ViewerOptions,
    HashMap,
    Rect,
} from './types';

/**
 * @hidden
 */
export const EMPTY_BOX = { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };

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
    public readonly labels: ViewerLabel[];
    /** Features to render over the SVG */
    public readonly features: ViewerFeature[];
    /** Actions to listen for on the SVG */
    public readonly actions: ViewAction[];
    /** Point or Element to focus on in the viewer */
    public readonly focus: ViewerFocusFeature | null;
    /** Styles to apply the SVG */
    public readonly styles: ViewerStyles;
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
    /** Ratio that the height to width of the SVG is */
    public readonly svg_ratio: number;
    /** Box dimensions for the root element of the viewer */
    public readonly box: Box;
    /** Zoom level of the SVG. Number from 1 - 10 */
    public readonly desired_zoom: number;
    /** Center point of the SVG on the view */
    public readonly desired_center: Point;
    /** Whether zoom and center still need updating */
    public readonly needs_update: boolean;
    /**  */
    public readonly options: ViewerOptions;
    /** Max resolution for the render iframe image */
    public readonly max_resolution: number;
    /**  */
    public readonly updated_count: number;
    /** Mapping of element positions to their IDs */
    public readonly mappings: HashMap<Rect>;
    /** Whether to use GPU for rendering map view changes */
    public readonly use_gpu: boolean;
    /** Ratio of the map rendered to the container element */
    public readonly content_ratio: Point;

    public contains(el_id: string) {
        this.svg_data.includes(`id="${el_id}"`);
    }

    constructor(_data: Partial<Viewer>) {
        this.id = _data.id || `map-${Math.floor(Math.random() * 999_999)}`;
        this.url = _data.url || `local-${Md5.hashAsciiStr(_data.svg_data || '')}`;
        this.element = _data.element || null;
        this.labels = _data.labels || [];
        this.features = _data.features || [];
        this.actions = _data.actions || [];
        this.styles = _data.styles || {};
        this.svg_data = _data.svg_data || '';
        this.content_ratio = _data.content_ratio || { x: 1, y: 1 };
        this.zoom = _data.zoom || 1;
        this.center = { x: _data.center?.x ?? 0.5, y: _data.center?.y ?? 0.5 };
        this.rotate = _data.rotate || 0;
        this.ratio = _data.ratio || 1;
        this.svg_ratio = _data.svg_ratio || 1;
        this.max_resolution = _data.max_resolution || window.innerWidth * window.innerHeight * 10;
        this.focus = _data.focus || null;
        this.options = _data.options || {};
        this.mappings = _data.mappings || {};
        this.box = {
            top: (_data.box || EMPTY_BOX).top,
            left: (_data.box || EMPTY_BOX).left,
            height: (_data.box || EMPTY_BOX).height,
            width: (_data.box || EMPTY_BOX).width,
        };
        this.desired_zoom = _data.desired_zoom || _data.zoom || this.zoom;
        this.desired_center = {
            x: _data.desired_center?.x || this.center.x,
            y: _data.desired_center?.y || this.center.y,
        };
        this.updated_count = (_data.updated_count || 0) + 1;
        if (this.zoom !== this.desired_zoom) {
            const direction = this.desired_zoom - this.zoom >= 0 ? 1 : -1;
            const change = Math.min(0.05, Math.abs(this.desired_zoom - this.zoom));
            const ratio =
                Math.round((change / Math.abs(this.desired_zoom - this.zoom)) * 1000) / 1000;
            this.zoom = change === 0.05 ? this.zoom + direction * change : this.desired_zoom;
            this.center = {
                x: this.center.x + (this.desired_center.x - this.center.x) * ratio,
                y: this.center.y + (this.desired_center.y - this.center.y) * ratio,
            };
        } else if (
            this.desired_center.x !== this.center.x ||
            this.desired_center.y !== this.center.y
        ) {
            const x_direction = this.desired_center.x - this.center.x >= 0 ? 1 : -1;
            const y_direction = this.desired_center.y - this.center.y >= 0 ? 1 : -1;
            const x_change = Math.min(0.01, Math.abs(this.desired_center.x - this.center.x));
            const ratio = x_change / Math.abs(this.desired_center.x - this.center.x);
            const y_change = ratio * Math.abs(this.desired_center.y - this.center.y);
            this.center = {
                x: this.center.x + x_direction * x_change,
                y: this.center.y + y_direction * y_change,
            };
        }
        this.needs_update =
            this.desired_zoom !== this.zoom ||
            this.desired_center.x !== this.center.x ||
            this.desired_center.y !== this.center.y;
        this.use_gpu = _data?.use_gpu ?? true;
    }
}
