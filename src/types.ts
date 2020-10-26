export interface HashMap<T = any> {
    [key: string]: T;
}

export interface Point {
    readonly x: number;
    readonly y: number;
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
}

export interface ViewerFeature {
    /** Contents of the feature to render */
    readonly content: HTMLElement;
    /** Whether contents should only show on hover of location */
    readonly hover?: boolean;
    /** Element ID or Coordinates to display the content */
    readonly location: string | Point;
}

export interface ViewerFocusFeature {
    /** Element ID or Coordinates to focus on */
    readonly location: string | Point;
    /** Zoom level to focus on */
    readonly zoom_level: number;
}

export interface ViewAction {
    /** ID of the element to listen for actions */
    readonly id: string;
    /** Action to listen for on the SVG */
    readonly action: 'click' | 'mousedown' | 'mouseup' | 'enter' | 'leave' | '*';
    /** Callback for event action */
    readonly callback: (e: Event, p?: Point) => void;
}

export interface ViewerStyles {
    [selector: string]: {
        [prop: string]: string | number;
    };
}
