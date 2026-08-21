/**
 * POST /api/triage
 *
 * Two modes:
 *   { mode: 'triage',    text, energy }  -> { tasks: [...] }
 *   { mode: 'breakdown', task, energy }  -> { firstStep, steps: [...] }
 *
 * Requires ANTHROPIC_API_KEY in the environment (Vercel project settings).
 * The key never reaches the browser — that's the whole reason this file exists.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

const client = new Anthropic();

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The task, rewritten as a clear concrete action starting with a verb. Max 12 words.',
          },
          minutes: {
            type: 'integer',
            description: 'Realistic focused minutes. Be honest but generous — ADHD time blindness means people underestimate.',
          },
          energy: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Mental effort required. Admin and errands are low. Anything creative, social, or decision-heavy is high.',
          },
          urgency: {
            type: 'integer',
            description: '1 = whenever, 3 = this week, 5 = a real deadline or consequence is near.',
          },
          firstStep: {
            type: 'string',
            description: 'A single physical action under 2 minutes that starts this task. Must be so small it feels stupid to refuse. No planning steps.',
          },
          category: { type: 'string', description: 'One word: admin, work, health, home, social, money, or errand.' },
        },
        required: ['title', 'minutes', 'energy', 'urgency', 'firstStep', 'category'],
        additionalProperties: false,
      },
    },
  },
  required: ['tasks'],
  additionalProperties: false,
};

const BREAKDOWN_SCHEMA = {
  type: 'object',
  properties: {
    firstStep: {
      type: 'string',
      description: 'A single physical action under 2 minutes that starts this task.',
    },
    steps: {
      type: 'array',
      description: '3 to 6 sequential steps. Each one a concrete action, not a phase or a category.',
      items: { type: 'string' },
    },
  },
  required: ['firstStep', 'steps'],
  additionalProperties: false,
};

const SYSTEM = `You are the triage engine inside my.adhd, a productivity app for people with ADHD.

You receive an unfiltered brain dump: fragments, run-ons, half-thoughts, worries, and real tasks all mixed together.

Rules:
- Extract only ACTIONABLE items. Drop pure worries, feelings, and commentary that have no action behind them.
- Merge duplicates and near-duplicates into one task.
- Split anything containing two genuinely separate actions.
- Rewrite each task in plain, concrete language. Never moralize, never add encouragement, never add emoji.
- Every firstStep must be a physical action the person could do in the next 2 minutes without deciding anything: "open the email app", "put the laundry in the dryer", "find the insurance renewal letter". Never "think about", "plan", "decide", or "review".
- Cap at 20 tasks. If the dump is longer, keep the 20 that matter most.
- If the dump contains no actionable items at all, return an empty tasks array.`;

const BREAKDOWN_SYSTEM = `You break one overwhelming task into steps for someone with ADHD.

Rules:
- 3 to 6 steps, in order. Fewer is better.
- Each step is one concrete physical action, not a phase. "Open the doc and write the three section headings" — not "draft the report".
- The first step must take under 2 minutes and require no decisions.
- Plain language. No encouragement, no emoji, no preamble.`;

/** Pull the JSON text block out of a response that may also contain thinking blocks. */
function extractJSON(message) {
  const block = message.content.find((b) => b.type === 'text');
  if (!block) throw new Error('no text block in response');
  return JSON.parse(block.text);
}

async function ask({ system, prompt, schema }) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    messages: [{ role: 'user', content: prompt }],
    // Triage is a fast, well-specified extraction — low effort keeps latency
    // low, which matters more here than squeezing out marginal quality.
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema },
    },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });

  if (message.stop_reason === 'refusal') {
    throw new Error('refused: ' + (message.stop_details?.category ?? 'unknown'));
  }
  return extractJSON(message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { mode, energy = 'medium' } = body;

    if (mode === 'breakdown') {
      const task = String(body.task || '').slice(0, 300);
      if (!task) return res.status(400).json({ error: 'task is required' });

      const out = await ask({
        system: BREAKDOWN_SYSTEM,
        prompt: `Task: ${task}\nTheir energy right now: ${energy}.`,
        schema: BREAKDOWN_SCHEMA,
      });
      return res.status(200).json(out);
    }

    const text = String(body.text || '').slice(0, 8000);
    if (!text.trim()) return res.status(400).json({ error: 'text is required' });

    const out = await ask({
      system: SYSTEM,
      prompt: `Their energy right now: ${energy}.\n\nBrain dump:\n"""\n${text}\n"""`,
      schema: TASK_SCHEMA,
    });
    return res.status(200).json(out);
  } catch (err) {
    console.error('[triage]', err);
    return res.status(502).json({ error: 'triage failed' });
  }
}
