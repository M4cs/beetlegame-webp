// canvas.d.ts
import "canvas";

declare module "canvas" {
  // Augment the existing CanvasRenderingContext2D interface
  interface CanvasRenderingContext2D {
    /**
     * Provides filter effects such as blurring or color shifting on
     * an element before it is displayed.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter
     */
    filter: string;
  }
}
