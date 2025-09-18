import { Poline } from 'poline';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'poline-picker': {
        ref?: React.RefObject<PolinePickerElement>;
        interactive?: boolean;
        'allow-add-points'?: boolean;
        style?: React.CSSProperties;
        id?: string;
      };
    }
  }

  interface HTMLElementEventMap {
    'poline-change': CustomEvent<{ poline: Poline }>;
  }
}

export interface PolinePickerElement extends HTMLElement {
  setPoline(poline: Poline): void;
  setAllowAddPoints(allow: boolean): void;
  addPointAtPosition(x: number, y: number): ColorPoint | null;
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

export interface ColorPoint {
  x: number;
  y: number;
  z: number;
  color: [number, number, number];
  position: [number, number, number];
  hsl: [number, number, number];
  hslCSS: string;
}