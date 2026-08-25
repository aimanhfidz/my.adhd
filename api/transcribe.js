/**
 * POST /api/transcribe
 *
 *   { audio, mimeType, seconds, vocab } -> { text, lang, speech }
 *
 * `audio` is base64 WAV built in the browser by voice.js: 16 kHz, mono,
 * 16-bit. Everything about that shape is chosen to keep this body small.
 *
 * Requires GEMINI_API_KEY in the environment (Vercel project settings).
 * The key never reaches the browser — that's the whole reason this file
 * exists, same as api/triage.js.
 *
 * Why Gemini here and Claude next door: this is the one job in the app
 * where the input is sound rather than text, and the thing that makes a
 * dump usable is hearing that "vista come on well" was a place and that
 * the sentence changed language halfway through. Triage stays where it
 * is — this hands it a clean transcript and nothing more. Deciding what
 * is a task is a separate question, asked of a model that already knows
 * the answer, on text the person has had a chance to read and fix.
 */

const MODEL = 'gemini-3.7-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/* 90 seconds of 16 kHz mono WAV is about 2.9 MB, which is 3.8 MB of
   base64. Vercel gives this function a 4.5 MB body, so anything much
   past the cap voice.js enforces is a bug or somebody poking at it. */
const MAX_BASE64 = 4_200_000;

const ALLOWED_MIME = new Set(['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac']);

const SCHEMA = {
  type: 'object',
  properties: {
    speech: {
      type: 'boolean',
      description: 'true if there is intelligible speech in the recording. false for silence, background noise, a pocket, or a room with nobody talking in it.',
    },
    text: {
      type: 'string',
      description: 'The transcript. Empty string when speech is false.',
    },
    lang: {
      type: 'string',
      description: 'What was actually spoken: "English", "Malay", "English and Malay", or the language name if it was something else.',
    },
  },
  required: ['speech', 'text', 'lang'],
};

const SYSTEM = `You transcribe voice notes for my.adhd, an app where people speak an unfiltered brain dump — errands, worries, half-remembered admin — and it gets turned into a task list.

You are transcribing, not summarising and not interpreting. Another model does that afterwards, and it can only work with what you hand it.

WHAT THE RECORDING IS LIKE
- One person, talking to themselves, usually holding a phone. Expect background noise, trailing off, restarts, and long pauses mid-thought.
- It is a list, not a narrative. Items arrive in no order and often without connecting words.
- It stops when they let go of a button, so the last sentence may be cut off. Transcribe the part you have; never complete it for them.

LANGUAGE
- Most speakers here are Malaysian and code-switch mid-sentence, usually English and Malay, sometimes with Mandarin, Hokkien, Cantonese or Tamil words in. This is normal speech, not an error to be tidied up.
- Write each word in the language it was said in. Do not translate in either direction. A sentence that starts in Malay and ends in English gets written down that way.
- Keep discourse particles that carry meaning or tone — "lah", "kan", "je", "kot" — where a speaker of that variety would write them.

NAMES
- Proper nouns are the thing that matters most and the thing most easily lost: apartment blocks, roads, LRT stations, clinics, banks, government offices, schools, shops, brands, people. Get these right in preference to anything else in the sentence.
- Spell them the way they are conventionally spelled, not phonetically.
- If a name is genuinely unclear, write your best single guess. Do not write alternatives, do not add "(unclear)", do not leave a blank.

WHAT TO DROP AND WHAT TO KEEP
- Drop pure filler: "uh", "um", "erm", "like", "you know", "macam" and "kind of" when used as hesitation, false starts, and repeated words from a stutter.
- Keep every piece of content, including the vague and the half-formed. "the thing with the car, whatever it was" stays. It is not your job to decide it is not a task.
- Keep numbers, dates, times, amounts and names exactly as spoken. "half nine" stays "half nine". Do not convert or normalise them — the next model resolves those against today's date and needs the original words.

HOW TO WRITE IT
- Plain sentences with ordinary punctuation and capitalisation. No timestamps, no speaker labels, no markdown, no bullet points, no headings.
- Start a new sentence where the speaker moved to a new thought. Long pauses are usually that.
- Do not add anything that was not said. No summary line, no interpretation, no encouragement, no emoji.

NOTHING THERE
- If the recording is silence, noise, or a stray sound with no speech in it, set speech to false and return an empty string. Never invent content to fill it. Never describe the noise.`;

/* The names this person already uses, taken from the tasks they have kept.
   A transcriber that has never heard of the road you live on will pick
   whatever it rhymed with; a transcriber that has seen it spelled once
   usually will not. */
function vocabNote(vocab) {
  const known = (Array.isArray(vocab) ? vocab : [])
    .filter((w) => typeof w === 'string' && w.trim())
    .map((w) => w.trim().slice(0, 60))
    .slice(0, 40);
  if (!known.length) return '';
  return `\n\nNames from this person's own task list, spelled the way they use them. When something in the recording sounds like one of these, it almost certainly is one — prefer these spellings over anything phonetically close:\n${known.map((w) => `- ${w}`).join('\n')}`;
}

/* thinkingLevel is the newest thing in this request and the only field
   that is model-specific, which makes it the one most likely to be
   renamed or dropped from under us. An unknown field is a 400, and a 400
   here is the microphone not working at all — so a rejected request gets
   one more go without it. Slower and slightly worse beats gone. */
async function callGemini(body) {
  try {
    return await post(body);
  } catch (err) {
    if (!/gemini 400/.test(err.message) || !body.generationConfig.thinkingLevel) throw err;
    console.warn('[transcribe] retrying without thinkingLevel —', err.message);
    const { thinkingLevel, ...rest } = body.generationConfig;
    return post({ ...body, generationConfig: rest });
  }
}

async function post(body) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      /* The header form, not ?key= — a key in a query string ends up in
         every access log between here and Google. */
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    /* Gemini's own message is the only useful thing when a field name or
       a model id goes stale, and it is worth having in the log rather
       than a bare status. It stays out of the response to the browser. */
    const why = data?.error?.message || res.statusText;
    throw new Error(`gemini ${res.status}: ${why}`);
  }

  if (data?.promptFeedback?.blockReason) {
    throw new Error('blocked: ' + data.promptFeedback.blockReason);
  }

  const cand = data?.candidates?.[0];
  if (!cand) throw new Error('no candidate in response');
  if (cand.finishReason && cand.finishReason !== 'STOP') {
    throw new Error('finished as ' + cand.finishReason);
  }

  const text = (cand.content?.parts || []).map((p) => p.text).filter(Boolean).join('');
  if (!text) throw new Error('empty response');
  return JSON.parse(text);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const audio = String(body.audio || '');
    if (!audio) return res.status(400).json({ error: 'audio is required' });
    if (audio.length > MAX_BASE64) return res.status(413).json({ error: 'recording is too long' });

    const mimeType = ALLOWED_MIME.has(body.mimeType) ? body.mimeType : 'audio/wav';
    const seconds = Number.isFinite(body.seconds) ? Math.round(body.seconds) : null;

    const out = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM + vocabNote(body.vocab) }] },
      contents: [{
        role: 'user',
        parts: [
          {
            text: seconds
              ? `Transcribe this voice note. It is about ${seconds} seconds long.`
              : 'Transcribe this voice note.',
          },
          { inlineData: { mimeType, data: audio } },
        ],
      }],
      generationConfig: {
        /* Transcription is recognition, not reasoning. Anything above low
           spends time and tokens second-guessing words it already heard,
           and the person is standing there waiting for the box to fill. */
        thinkingLevel: 'low',
        /* No creativity wanted anywhere in this. Every degree of freedom
           here shows up as a word nobody said. */
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
        maxOutputTokens: 4000,
      },
      /* The prompt already forbids inventing content, and the failure mode
         of a safety block here is a lost thought rather than a saved one.
         A brain dump is private speech and routinely contains medical,
         financial and family detail that reads as sensitive out of context. */
      safetySettings: [
        'HARM_CATEGORY_HARASSMENT',
        'HARM_CATEGORY_HATE_SPEECH',
        'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'HARM_CATEGORY_DANGEROUS_CONTENT',
      ].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    });

    const text = out.speech === false ? '' : String(out.text || '').trim();
    return res.status(200).json({
      text,
      lang: String(out.lang || '').slice(0, 40) || null,
      speech: !!text,
    });
  } catch (err) {
    console.error('[transcribe]', err);
    return res.status(502).json({ error: 'transcription failed' });
  }
}
