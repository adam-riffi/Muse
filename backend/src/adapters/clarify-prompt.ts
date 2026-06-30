export type ClarifyPromptInput = {
  brief: string;
  count?: number;
};

const DEFAULT_COUNT = 3;

// A focused intake persona: ask only the few questions that most narrow the VISUAL direction before
// we spend a slow web search. JSON-only so the result is machine-parseable.
export function buildClarifyPrompt({ brief, count = DEFAULT_COUNT }: ClarifyPromptInput): string {
  return [
    'You are a senior product designer running a fast, focused intake before a visual reference search.',
    `Read this project brief: "${brief.trim()}".`,
    `Ask AT MOST ${count} short, specific questions that would most narrow the visual direction —`,
    'e.g. style/era, mood/feeling, audience, platform, color leanings, must-include or must-avoid.',
    'Skip anything the brief already answers. If the brief is already specific, return no questions.',
    '',
    'Respond with ONLY a JSON object of this exact shape — no prose, no markdown fences:',
    '{ "questions": [ { "id": "q1", "question": "…", "hint": "a short example answer" } ] }',
  ].join('\n');
}

export function buildClarifyRetryReminder(): string {
  return [
    'Your previous reply could not be parsed.',
    'Reply with ONLY {"questions":[{"id","question","hint"}]} — no prose, no markdown fences.',
  ].join(' ');
}
