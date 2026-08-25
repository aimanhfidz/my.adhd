/**
 * POST /api/transcribe
 *
 *   body:   the WAV itself, raw
 *   header: X-Voice-Meta, base64 JSON { seconds, vocab }
 *   ->      { text, lang, speech }
 *
 * The body is a WAV built in the browser by voice.js: 16 kHz, mono,
 * 16-bit, and sent as bytes rather than base64 in JSON. Everything about
 * that shape is chosen to keep this body small, because the length of a
 * hold is Vercel's 4.5 MB divided by 32 KB a second and nothing else.
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

/* Both verified against this project's key on real audio, because the
   model list is not a list of models that answer: gemini-3.7-flash is in
   it and generateContent on it never returns at all — no error, no 404,
   just silence until the function times out. So the model here is one
   that has been heard from, and there is a second one for when the first
   goes the way of the last.

   3.5-flash over the lites on one observed behaviour: handed a list of
   names the speaker uses, the smaller models will drop one into a
   sentence that did not contain it — "call the clinic" came back as
   "call the Klinik Kesihatan". Recognition is the whole job here, so the
   extra second is worth it. */
const MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

const endpoint = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/* The body is the WAV itself, raw. It arrived as base64 inside JSON to
   begin with, which was simpler and cost a third of the request budget in
   padding — at 32 KB a second that third is forty seconds of someone's
   thinking. Vercel gives this function 4.5 MB, voice.js caps a hold at
   130 seconds, and 130 seconds is 4.16 MB, so this sits just under with
   room for the headers. Anything past it is a bug or somebody poking. */
const MAX_BYTES = 4_400_000;

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
  return `\n\nNames from this person's own task list, spelled the way they use them. These are a SPELLING aid and nothing more: when a word in the recording sounds like one of these, spell it this way instead of phonetically.

Do not put one of these into a sentence that did not contain it. An ordinary word stays an ordinary word — if they said "the clinic", write "the clinic", even when a clinic's name is on this list. Substituting a name for a word they actually said is the worst thing you can do here, because it reads as correct and is not.

${known.map((w) => `- ${w}`).join('\n')}`;
}

/* A model can stop serving without being withdrawn from the model list,
   and when it does the request simply never comes back. That is the worst
   shape of failure to have here, because it costs the caller the full
   function timeout before they learn the mic did nothing. So a failure of
   any kind gets one attempt on a different model before giving up.

   Not a retry of the same model: the failure that prompted this was not
   transient, and asking the silent one twice just doubles the wait. */
async function callGemini(body) {
  try {
    return await post(body, MODEL);
  } catch (err) {
    console.warn(`[transcribe] ${MODEL} failed (${err.message}) — trying ${FALLBACK_MODEL}`);
    return post(body, FALLBACK_MODEL);
  }
}

async function post(body, model) {
  /* An upstream that never answers must not become sixty seconds of
     function time and a platform 504 — that reads to the browser as a
     dead endpoint rather than a slow one, and voice.js can fall back to
     the rough transcript far sooner than that. */
  const res = await fetch(endpoint(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      /* The header form, not ?key= — a key in a query string ends up in
         every access log between here and Google. Trimmed because a key
         pasted into a dashboard field very often arrives with a newline
         on the end, and a header value containing one throws. */
      'x-goog-api-key': (process.env.GEMINI_API_KEY || '').trim(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    /* Gemini's own message is the only useful thing when a field name or
       a model id goes stale, and it is worth having in the log rather
       than a bare status. It stays out of the response to the browser. */
    const why = data?.error?.message || res.statusText;
    throw new Error(`gemini ${res.status} on ${model}: ${why}`);
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

/* Vercel parses a body it recognises and leaves the rest alone, and which
   of those happened is not worth guessing at from in here — so take the
   Buffer if there is one and read the stream if there is not. Never a
   string: a WAV decoded as text is a corrupted WAV, and it would arrive
   looking fine and transcribe as silence. */
async function readAudio(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body instanceof ArrayBuffer) return Buffer.from(req.body);

  const parts = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw new Error('recording is too long');
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

/* Everything that is not audio rides in one header, base64 so that a name
   with a tittle or a tone mark on it survives the trip — those names are
   the entire reason the vocabulary is sent at all. */
function readMeta(req) {
  const raw = req.headers['x-voice-meta'];
  if (!raw) return { seconds: null, vocab: [] };
  try {
    const meta = JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8'));
    return {
      seconds: Number.isFinite(meta.seconds) ? Math.round(meta.seconds) : null,
      vocab: Array.isArray(meta.vocab) ? meta.vocab : [],
    };
  } catch (_) {
    return { seconds: null, vocab: [] };   // a mangled header is not worth failing the dump over
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  try {
    const wav = await readAudio(req);
    if (!wav.length) return res.status(400).json({ error: 'audio is required' });
    if (wav.length > MAX_BYTES) return res.status(413).json({ error: 'recording is too long' });

    const { seconds, vocab } = readMeta(req);

    const out = await callGemini(buildBody({
      audio: wav.toString('base64'), mimeType: 'audio/wav', seconds, vocab,
    }));
    const text = out.speech === false ? '' : String(out.text || '').trim();
    return res.status(200).json({
      text,
      lang: String(out.lang || '').slice(0, 40) || null,
      speech: !!text,
    });
  } catch (err) {
    console.error('[transcribe]', err);
    if (/too long/.test(err.message)) return res.status(413).json({ error: 'recording is too long' });
    return res.status(502).json({ error: 'transcription failed' });
  }
}

function buildBody({ audio, mimeType, seconds, vocab }) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM + vocabNote(vocab) }] },
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
        /* No thinking config here on purpose. v1beta rejects thinkingLevel
           at the top of generationConfig on every model that answers, and
           nesting it under thinkingConfig buys nothing this needs —
           transcription is recognition, not reasoning. Omitting it is both
           the working request and the fast one.

           No creativity wanted anywhere in this either. Every degree of
           freedom here shows up as a word nobody said. */
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
  };
}
