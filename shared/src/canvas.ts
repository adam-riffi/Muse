import { z } from 'zod';

const Vec2Schema = z.object({ x: z.number(), y: z.number() });

const StrokeStyleSchema = z.object({
  stroke: z.string(),
  strokeWidth: z.number().positive(),
  fill: z.string().optional(),
});

const baseFields = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
};

// Image element references a discovered candidate by id; it is what makes an image "kept".
const ImageElementSchema = z.object({
  ...baseFields,
  type: z.literal('image'),
  candidateId: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
});

const RectElementSchema = z.object({
  ...baseFields,
  type: z.literal('rect'),
  width: z.number().positive(),
  height: z.number().positive(),
  style: StrokeStyleSchema,
});

const EllipseElementSchema = z.object({
  ...baseFields,
  type: z.literal('ellipse'),
  width: z.number().positive(),
  height: z.number().positive(),
  style: StrokeStyleSchema,
});

const ArrowElementSchema = z.object({
  ...baseFields,
  type: z.literal('arrow'),
  points: z.array(Vec2Schema).min(2),
  style: StrokeStyleSchema,
});

const FreedrawElementSchema = z.object({
  ...baseFields,
  type: z.literal('freedraw'),
  points: z.array(Vec2Schema).min(2),
  style: StrokeStyleSchema,
});

const TextElementSchema = z.object({
  ...baseFields,
  type: z.literal('text'),
  text: z.string(),
  fontSize: z.number().positive(),
  color: z.string(),
});

export const CanvasElementSchema = z.discriminatedUnion('type', [
  ImageElementSchema,
  RectElementSchema,
  EllipseElementSchema,
  ArrowElementSchema,
  FreedrawElementSchema,
  TextElementSchema,
]);
export type CanvasElement = z.infer<typeof CanvasElementSchema>;

export const ViewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().positive().default(1),
});
export type Viewport = z.infer<typeof ViewportSchema>;

export const BoardStateSchema = z.object({
  elements: z.array(CanvasElementSchema),
  viewport: ViewportSchema,
});
export type BoardState = z.infer<typeof BoardStateSchema>;

// The kept set = candidate ids of image elements placed on the board, in order, de-duplicated.
// This is the curation gate: only kept images feed synthesis/export.
export function keptCandidateIds(board: BoardState): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const element of board.elements) {
    if (element.type === 'image' && !seen.has(element.candidateId)) {
      seen.add(element.candidateId);
      ids.push(element.candidateId);
    }
  }
  return ids;
}
