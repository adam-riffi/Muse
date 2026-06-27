import type { CanvasElement, Viewport } from '@muse/shared';

// A structural subset of a tldraw shape — keeps this adapter decoupled from tldraw's exact types
// and trivially testable with plain objects.
export type TldrawShapeLike = {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  props?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positive(value: unknown, fallback = 1): number {
  return Math.max(1, num(value, fallback));
}

// Map a tldraw shape to our portable CanvasElement. Image mapping relies on our own meta convention
// (we set meta.candidateId when placing candidates) and is the reliable core for the kept-set.
// Returns null for shapes we don't model structurally — those are still captured in the board PNG.
export function mapTldrawShape(shape: TldrawShapeLike): CanvasElement | null {
  const base = { id: shape.id, x: num(shape.x), y: num(shape.y), rotation: num(shape.rotation) };
  const props = shape.props ?? {};
  const meta = shape.meta ?? {};

  if (shape.type === 'image' && typeof meta.candidateId === 'string') {
    return {
      ...base,
      type: 'image',
      candidateId: meta.candidateId,
      width: positive(props.w),
      height: positive(props.h),
    };
  }

  if (shape.type === 'geo' && (props.geo === 'rectangle' || props.geo === 'ellipse')) {
    return {
      ...base,
      type: props.geo === 'rectangle' ? 'rect' : 'ellipse',
      width: positive(props.w),
      height: positive(props.h),
      style: { stroke: '#e4e4e7', strokeWidth: 2 },
    };
  }

  return null;
}

export type TldrawCamera = { x: number; y: number; z: number };

export function cameraToViewport(camera: TldrawCamera): Viewport {
  return { x: num(camera.x), y: num(camera.y), zoom: positive(camera.z) };
}
