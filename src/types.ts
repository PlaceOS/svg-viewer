
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
    readonly content: HTMLElement;
    readonly location: string | Point;
}

export interface Styles {
    [selector: string]: {
        [prop: string]: string | number;
    }
}
