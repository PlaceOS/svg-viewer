
export interface HashMap<T = any> {
    [key: string]: T;
}

export interface Point {
    readonly x: number;
    readonly y: number;
}

export interface ViewerOptions {
    /** URL of the SVG to load */
    url?: string;
    /** Raw SVG data to render */
    svg_data?: string;
    /** Element the SVG is attached */
    element: HTMLElement;
    /** Labels to add to the  */
    labels: Label[];
    /** Labels to add to the  */
    features: Feature[];
    /** Styles to apply the  */
    styles: Styles;
}

export interface Label {
    /** String to populate the label with */
    readonly content: string;
    /** Element ID or Coordinates to display the text */
    readonly location: string | Point;
    /** Minimum zoom level at which to show the label */
    readonly zoom_level?: number;
}

export interface Feature {
    /** Contents of the feature to render */
    readonly content: HTMLElement;
    /** Whether contents should only show on hover of location */
    readonly hover?: boolean;
    /** Element ID or Coordinates to display the content */
    readonly location: string | Point;
}

export interface FocusFeature {
    /** Element ID or Coordinates to focus on */
    readonly location: string | Point;
    /** Zoom level to focus on */
    readonly zoom_level: number;
}

export interface ViewAction {
    /** ID of the element to listen for actions */
    readonly id: string;
    /** Action to listen for on the SVG */
    readonly action: 'click' | 'enter' | 'leave';
    /** Callback for event action */
    readonly callback: (e: Event) => void;
}

export interface Styles {
    [selector: string]: {
        [prop: string]: string | number;
    }
}
