/// <reference types="vite/client" />

declare module 'dictionary-of-colour-combinations' {
  const colors: Array<{
    name: string;
    combinations: number[];
    swatch: number;
    cmyk: [number, number, number, number];
    lab: [number, number, number];
    rgb: [number, number, number];
    hex: string;
  }>;

  export default colors;
}
