export interface Point {
    readonly x: number;
    readonly y: number;
}

export interface Rect extends Point {
    readonly w: number;
    readonly h: number;
}

export interface ViewerOptions {
    readonly disable_pan?: boolean;
    readonly disable_zoom?: boolean;
}

export interface ViewerLabel {
    /** String to populate the label with */
    readonly content: string;
    /** Element ID or Coordinates to display the text */
    readonly location: string | Point;
    /** Minimum zoom level at which to show the label */
    readonly zoom_level?: number;
    /** CSS classes to apply to the label element */
    readonly css_class?: string[];
    /** Z index to apply the the container element */
    readonly z_index?: string | number;
}

export interface ViewerFeature {
    readonly track_id?: string;
    /** Contents of the feature to render */
    readonly content?: HTMLElement | any;
    /** Whether contents should only show on hover of location */
    readonly hover?: boolean;
    /** Whether container element should be sized to match parent */
    readonly full_size?: boolean;
    /** Element ID or Coordinates to display the content */
    readonly location: string | Point;
    /** Z index to apply the the container element */
    readonly z_index?: string | number;
    /** Data associated with the feature */
    readonly data?: Record<string, unknown>;
}

export interface ViewerFocusFeature {
    /** Element ID or Coordinates to focus on */
    readonly location: string | Point;
    /** Zoom level to focus on */
    readonly zoom_level: number;
}

export type ViewActionTypes =
    | 'click'
    | 'mousedown'
    | 'mouseup'
    | 'touchstart'
    | 'touchend'
    | 'enter'
    | 'leave'
    | '*';

export interface ViewAction {
    /** ID of the element to listen for actions */
    readonly id: string;
    /** Action to listen for on the SVG */
    readonly action: ViewActionTypes | ViewActionTypes[];
    /** Whether an interaction area is needed for listening to */
    readonly zone?: boolean;
    /** Priority of the action */
    readonly priority?: number;
    /** Callback for event action */
    readonly callback: (e: Event, p?: Point) => void;
}

export interface ViewerStyles {
    [selector: string]: {
        [prop: string]: string | number;
    };
}
