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

const DEFAULT_STYLE = { stroke: '#e4e4e7', strokeWidth: 2 };

type Point = { x: number; y: number };

function asPoint(value: unknown): Point | null {
  if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value) {
    const candidate = value as { x: unknown; y: unknown };
    if (typeof candidate.x === 'number' && typeof candidate.y === 'number') {
      return { x: candidate.x, y: candidate.y };
    }
  }
  return null;
}

function extractDrawPoints(segments: unknown): Point[] {
  if (!Array.isArray(segments)) {
    return [];
  }
  const points: Point[] = [];
  for (const segment of segments) {
    const segmentPoints = (segment as { points?: unknown }).points;
    if (Array.isArray(segmentPoints)) {
      for (const raw of segmentPoints) {
        const point = asPoint(raw);
        if (point !== null) {
          points.push(point);
        }
      }
    }
  }
  return points;
}

// Map a tldraw shape to our portable CanvasElement. Image mapping relies on our own meta convention
// (we set meta.candidateId when placing candidates) and is the reliable core for the kept-set.
// Annotations (text/arrow/freedraw) are mapped best-effort for board.json fidelity; the board PNG is
// the visual source of truth. Returns null for shapes we don't model.
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
      style: { ...DEFAULT_STYLE },
    };
  }

  if (shape.type === 'text') {
    const text =
      typeof props.text === 'string' ? props.text : typeof meta.text === 'string' ? meta.text : '';
    return {
      ...base,
      type: 'text',
      text,
      fontSize: 16,
      color: typeof props.color === 'string' ? props.color : '#e4e4e7',
    };
  }

  if (shape.type === 'arrow') {
    const start = asPoint(props.start) ?? { x: 0, y: 0 };
    const end = asPoint(props.end) ?? { x: positive(props.w), y: positive(props.h) };
    return { ...base, type: 'arrow', points: [start, end], style: { ...DEFAULT_STYLE } };
  }

  if (shape.type === 'draw') {
    const points = extractDrawPoints(props.segments);
    return {
      ...base,
      type: 'freedraw',
      points:
        points.length >= 2
          ? points
          : [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
      style: { ...DEFAULT_STYLE },
    };
  }

  return null;
}

export type TldrawCamera = { x: number; y: number; z: number };

export function cameraToViewport(camera: TldrawCamera): Viewport {
  return { x: num(camera.x), y: num(camera.y), zoom: positive(camera.z) };
}
