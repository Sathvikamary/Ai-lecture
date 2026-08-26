import type { NoteContent, NoteStyle, QuizQuestion, ExamPrep } from './types';

// ---------------------------------------------------------------------------
// Heuristic "AI" note generator — runs entirely in the browser.
// Every output is derived strictly from the uploaded/recorded source text.
// No file-type metadata, no generic boilerplate, no hallucinated content.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'the','a','an','and','or','but','is','are','was','were','be','been','being',
  'to','of','in','on','at','by','for','with','about','as','into','through','from',
  'this','that','these','those','i','you','he','she','it','we','they','them','their',
  'his','her','its','our','your','my','me','him','us','do','does','did','will','would',
  'should','could','can','may','might','must','shall','if','then','than','so','because',
  'while','when','where','which','who','whom','whose','what','how','why','there','here',
  'just','also','very','really','more','most','some','any','all','no','not','only','own',
  'same','such','too','one','two','three','like','get','got','make','made','go','going',
  'know','think','say','said','see','seen','come','came','take','took','give','gave',
  'well','okay','ok','yeah','uh','um','actually','basically','literally','sort','kind',
  'right','now','still','even','much','thing','things','stuff','lot','bit','way','ways',
  'let','lets','want','wants','need','needs','look','looks','feel','feels',
  'again','back','out','up','down','off','over','under','around','per','via',
  'each','other','every','both','few','many','such','any','some',
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
}

function wordFreq(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const w of tokenize(text)) {
    if (STOPWORDS.has(w) || w.length < 3) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return freq;
}

function topKeywords(text: string, n: number): string[] {
  const freq = wordFreq(text);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

function topKeyphrases(text: string, n: number): string[] {
  // Extract 2-3 word noun-ish phrases via simple consecutive-capital / adjacency heuristic.
  const freq = new Map<string, number>();
  const words = tokenize(text);
  for (let i = 0; i < words.length - 1; i++) {
    if (STOPWORDS.has(words[i]) || STOPWORDS.has(words[i + 1])) continue;
    const phrase = `${words[i]} ${words[i + 1]}`;
    freq.set(phrase, (freq.get(phrase) ?? 0) + 1);
  }
  return [...freq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([p]) => p);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectTopic(text: string): string {
  const phrases = topKeyphrases(text, 3);
  if (phrases.length) return titleCase(phrases[0]);
  const kws = topKeywords(text, 1);
  return kws.length ? titleCase(kws[0]) : 'Lecture Notes';
}

// --- Scoring helpers -------------------------------------------------------

function sentenceScore(sentences: string[], freq: Map<string, number>) {
  return (s: string) => {
    const words = tokenize(s).filter((w) => !STOPWORDS.has(w));
    if (words.length === 0) return 0;
    const base = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
    const lengthPenalty = 1 / (1 + Math.abs(words.length - 15) * 0.05);
    return (base / Math.sqrt(words.length)) * lengthPenalty;
  };
}

function rankedSentences(text: string): { s: string; i: number; sc: number }[] {
  const sentences = splitSentences(text);
  const freq = wordFreq(text);
  const score = sentenceScore(sentences, freq);
  return sentences.map((s, i) => ({ s, i, sc: score(s) })).filter((x) => x.sc > 0);
}

function uniqueBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = keyFn(x).toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Section builders (all grounded in source text) ------------------------

function buildSummary(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';
  const freq = wordFreq(text);
  const sc = sentenceScore(sentences, freq);
  const ranked = [...sentences].sort((a, b) => sc(b) - sc(a));
  const count = Math.min(4, Math.max(2, Math.ceil(sentences.length / 8)));
  const top = ranked.slice(0, count);
  const order = top.sort((a, b) => sentences.indexOf(a) - sentences.indexOf(b));
  return order.join(' ');
}

function buildShortNotes(text: string): string[] {
  // 8–15 concise points — trimmed to their essence, no long paragraphs.
  const ranked = rankedSentences(text);
  const picked = ranked.slice(0, 15).sort((a, b) => a.i - b.i);
  return uniqueBy(
    picked.map((x) => {
      let s = x.s.replace(/[.!?]+$/, '').trim();
      // Condense: keep first clause if sentence is very long.
      if (s.length > 120) {
        const clause = s.split(/[,;:]/);
        s = clause[0];
      }
      return capitalize(s);
    }),
    (s) => s.slice(0, 40)
  ).slice(0, 15);
}

function buildBulletPoints(text: string): string[] {
  // One concept per bullet — extract keyword-anchored concepts.
  const sentences = splitSentences(text);
  const freq = wordFreq(text);
  const phrases = topKeyphrases(text, 8);
  const sc = sentenceScore(sentences, freq);
  const bullets: string[] = [];
  for (const phrase of phrases) {
    const related = sentences
      .filter((s) => s.toLowerCase().includes(phrase.split(' ')[0]))
      .sort((a, b) => sc(b) - sc(a))[0];
    if (related) {
      let b = related.replace(/[.!?]+$/, '').trim();
      if (b.length > 100) b = b.split(/[,;]/)[0];
      bullets.push(capitalize(b));
    }
  }
  // Fill from top sentences if not enough.
  if (bullets.length < 8) {
    for (const x of rankedSentences(text).sort((a, b) => b.sc - a.sc)) {
      if (bullets.length >= 10) break;
      let b = x.s.replace(/[.!?]+$/, '').trim();
      if (b.length > 100) b = b.split(/[,;]/)[0];
      const c = capitalize(b);
      if (!bullets.some((e) => e.slice(0, 30) === c.slice(0, 30))) bullets.push(c);
    }
  }
  return uniqueBy(bullets, (s) => s.slice(0, 35)).slice(0, 12);
}

function buildKeyPoints(text: string, style: NoteStyle): string[] {
  if (style === 'short') return buildShortNotes(text);
  if (style === 'bullets') return buildBulletPoints(text);
  const ranked = rankedSentences(text);
  const limit = style === 'exam' ? 12 : 10;
  return uniqueBy(
    ranked.slice(0, limit).sort((a, b) => a.i - b.i).map((x) => capitalize(x.s.replace(/[.!?]+$/, ''))),
    (s) => s.slice(0, 40)
  ).slice(0, limit);
}

function buildDetailedNotes(text: string): string {
  // Structured notes with headings/subheadings, covering the entire document.
  const paragraphs = splitParagraphs(text);
  const sentences = splitSentences(text);
  const parts: string[] = [];

  // Group sentences into thematic sections by top keywords.
  const themes = topKeyphrases(text, 6).concat(topKeywords(text, 8).slice(0, 4));
  const used = new Set<number>();
  let sectionNum = 0;

  for (const theme of themes) {
    if (sectionNum >= 8) break;
    const themeWords = theme.split(' ');
    const matching = sentences
      .map((s, i) => ({ s, i }))
      .filter((x) => themeWords.some((w) => x.s.toLowerCase().includes(w)) && !used.has(x.i));
    if (matching.length < 2) continue;
    matching.forEach((x) => used.add(x.i));
    const ordered = matching.sort((a, b) => a.i - b.i);
    sectionNum++;
    parts.push(`## ${sectionNum}. ${titleCase(theme)}\n`);
    for (const item of ordered) {
      parts.push(`- ${capitalize(item.s.replace(/[.!?]+$/, ''))}`);
    }
    parts.push('');
  }

  // Add any remaining high-scoring sentences.
  const remaining = rankedSentences(text)
    .filter((x) => !used.has(x.i))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 6);
  if (remaining.length > 0 && sectionNum < 8) {
    sectionNum++;
    parts.push(`## ${sectionNum}. Additional Key Concepts\n`);
    for (const x of remaining.sort((a, b) => a.i - b.i)) {
      parts.push(`- ${capitalize(x.s.replace(/[.!?]+$/, ''))}`);
    }
  }

  // If we couldn't theme anything, fall back to paragraph-based notes.
  if (parts.length === 0 && paragraphs.length > 0) {
    for (const p of paragraphs.slice(0, 10)) {
      parts.push(`- ${capitalize(p.replace(/[.!?]+$/, ''))}`);
    }
  }
  if (parts.length === 0) {
    parts.push(buildSummary(text));
  }
  return parts.join('\n');
}

function buildDefinitions(text: string): { term: string; definition: string }[] {
  const defs: { term: string; definition: string }[] = [];
  const patterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s+(?:is|are|refers to|means|is defined as|can be defined as|describes)\s+([^.]{15,140})/g,
    /\b(?:definition of|by definition)\s+([A-Za-z\s]+?)[,:]\s+([^.]{15,140})/gi,
    /\b([A-Z][a-z]+)\s*:\s+([^.]{15,140})/g,
  ];
  const seen = new Set<string>();
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) && defs.length < 12) {
      const term = m[1].trim();
      const definition = capitalize(m[2].trim().replace(/[.!?]+$/, ''));
      const key = term.toLowerCase();
      if (term.length > 2 && !seen.has(key) && !STOPWORDS.has(term.toLowerCase())) {
        seen.add(key);
        defs.push({ term: titleCase(term), definition });
      }
    }
  }
  return defs;
}

function buildFormulas(text: string): string[] {
  const matches = text.match(
    /(?:[A-Za-z][A-Za-z0-9]*\s*=\s*[A-Za-z0-9+\-*/^().\s]{2,40}|[fv]\s*=\s*ma|E\s*=\s*mc\^?2|F\s*=\s*G\s*m[12].*?\/r\^?2)/g
  ) ?? [];
  const formulas = matches.map((m) => m.trim().replace(/\s+/g, ' ')).filter((m) => m.length > 4);
  return [...new Set(formulas)].slice(0, 10);
}

function buildDates(text: string): { date: string; event: string }[] {
  const dates: { date: string; event: string }[] = [];
  const re =
    /(?:in\s+)?(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?|\b\d{4}\b)[,.]?\s+([^.]{10,100})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && dates.length < 10) {
    dates.push({ date: m[1].trim(), event: capitalize(m[2].trim().replace(/[.!?]+$/, '')) });
  }
  return dates;
}

function buildExamples(text: string): string[] {
  const examples: string[] = [];
  const re = /(?:for example|e\.g\.|example:|such as|for instance|illustrate|consider)[:\s]+([^.]{20,160})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && examples.length < 8) {
    examples.push(capitalize(m[1].trim().replace(/[.!?]+$/, '')));
  }
  return examples;
}

function buildFaqs(text: string, topic: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const direct = text.match(/[^.?!]+\?/g) ?? [];
  const sentences = splitSentences(text);
  const freq = wordFreq(text);

  for (const q of direct) {
    if (faqs.length >= 8) break;
    const qclean = q.trim();
    if (qclean.length < 15) continue;
    const kws = tokenize(qclean).filter((w) => !STOPWORDS.has(w));
    const best = sentences
      .map((s) => ({ s, sc: kws.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(tokenize(s).length || 1) }))
      .sort((a, b) => b.sc - a.sc)[0];
    if (best && best.sc > 0) {
      faqs.push({ question: capitalize(qclean), answer: capitalize(best.s.replace(/[.!?]+$/, '') + '.') });
    }
  }
  const summary = buildSummary(text);
  const synth = [`What is ${topic}?`, `Why is ${topic} important?`, `How does ${topic} work?`];
  for (const q of synth) {
    if (faqs.length >= 8) break;
    if (!faqs.some((f) => f.question.toLowerCase() === q.toLowerCase())) {
      faqs.push({ question: q, answer: summary || 'See the complete notes above for details.' });
    }
  }
  return faqs;
}

function buildFlashcards(text: string, topic: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  const defs = buildDefinitions(text);
  for (const d of defs) {
    if (cards.length >= 12) break;
    cards.push({ front: d.term, back: d.definition });
  }
  const kws = topKeywords(text, 15);
  const sentences = splitSentences(text);
  const freq = wordFreq(text);
  for (const kw of kws) {
    if (cards.length >= 12) break;
    if (cards.some((c) => c.front.toLowerCase() === kw)) continue;
    const best = sentences
      .filter((s) => s.toLowerCase().includes(kw))
      .sort((a, b) => {
        const sa = tokenize(a).reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
        const sb = tokenize(b).reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
        return sb - sa;
      })[0];
    if (best) cards.push({ front: capitalize(kw), back: capitalize(best.replace(/[.!?]+$/, '')) });
  }
  if (cards.length === 0) {
    cards.push({ front: `What is ${topic}?`, back: buildSummary(text) || 'See notes for details.' });
  }
  return cards.slice(0, 12);
}

function buildActionItems(text: string): string[] {
  const items: string[] = [];
  const re = /(?:you should|remember to|don't forget to|make sure to|need to|must|should|homework|assignment|read chapter|review|practice|study|complete|submit)\s+([^.]{10,120})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && items.length < 8) {
    items.push(capitalize(m[1].trim().replace(/[.!?]+$/, '')));
  }
  return items;
}

// --- Exam Prep -------------------------------------------------------------

function buildExamPrep(text: string, topic: string): ExamPrep {
  const sentences = splitSentences(text);
  const ranked = rankedSentences(text).sort((a, b) => b.sc - a.sc);
  const freq = wordFreq(text);
  const defs = buildDefinitions(text);
  const formulas = buildFormulas(text);
  const kws = topKeywords(text, 10);

  // 2-mark questions: short factual recall from key sentences.
  const twoMark = uniqueBy(
    ranked.slice(0, 10).map((x) => {
      const kw = tokenize(x.s).filter((w) => !STOPWORDS.has(w)).sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))[0];
      return `Define ${kw ? titleCase(kw) : topic}.`;
    }).concat(
      defs.slice(0, 4).map((d) => `Define ${d.term}.`)
    ),
    (q) => q.toLowerCase()
  ).slice(0, 8);

  // 5-mark questions: explain/describe topics.
  const fiveMark = uniqueBy(
    topKeyphrases(text, 8).slice(0, 5).map((p) => `Explain ${titleCase(p)} with examples.`)
      .concat(kws.slice(0, 5).map((k) => `Describe the role of ${k} in ${topic.toLowerCase()}.`))
      .concat(ranked.slice(0, 5).map((x) => `Discuss: ${capitalize(x.s.replace(/[.!?]+$/, ''))}`)),
    (q) => q.slice(0, 30).toLowerCase()
  ).slice(0, 8);

  // 10-mark questions: broad essay-style.
  const tenMark = uniqueBy(
    [
      `Provide a comprehensive overview of ${topic}.`,
      `Explain the key principles of ${topic} with suitable examples.`,
      `Discuss the significance and applications of ${topic}.`,
      `Compare and contrast the main concepts related to ${topic}.`,
    ]
      .concat(topKeyphrases(text, 5).map((p) => `Write a detailed note on ${titleCase(p)}.`))
      .concat(ranked.slice(0, 3).map((x) => `Elaborate on: "${capitalize(x.s.replace(/[.!?]+$/, ''))}"`)),
    (q) => q.slice(0, 30).toLowerCase()
  ).slice(0, 6);

  // Frequently asked theory questions.
  const theory = uniqueBy(
    sentences
      .filter((s) => /\b(because|therefore|thus|hence|due to|results? in|leads? to|causes?|affects?)\b/i.test(s))
      .slice(0, 8)
      .map((s) => `Why ${capitalize(s.replace(/[.!?]+$/, ''))}?`)
      .concat([
        `What are the main characteristics of ${topic}?`,
        `How does ${topic} relate to its underlying principles?`,
        `What are the practical implications of ${topic}?`,
      ]),
    (q) => q.slice(0, 30).toLowerCase()
  ).slice(0, 8);

  // Diagrams to practice — infer from keywords mentioning structure/process.
  const diagramKeywords = sentences
    .filter((s) => /\b(diagram|structure|process|flow|cycle|architecture|components?|layers?|system|model|framework)\b/i.test(s))
    .slice(0, 6)
    .map((s) => {
      const kw = tokenize(s).filter((w) => !STOPWORDS.has(w)).sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))[0];
      return kw ? `Draw and label the ${kw} ${/process|cycle|flow/.test(s) ? 'process flow' : 'structure'}.` : '';
    })
    .filter(Boolean);
  const diagrams = uniqueBy(diagramKeywords, (d) => d.slice(0, 25).toLowerCase()).slice(0, 5);

  // Last-minute revision tips — derived from key points.
  const tips = uniqueBy(
    ranked.slice(0, 6).map((x) => {
      const kw = tokenize(x.s).filter((w) => !STOPWORDS.has(w)).sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))[0];
      return kw ? `Review the concept of ${kw} — it appears frequently in this material.` : '';
    }).filter(Boolean)
      .concat([
        `Memorize all key definitions related to ${topic}.`,
        `Practice writing short answers for each 2-mark question above.`,
        `Revisit the formulas and their derivations.`,
      ]),
    (t) => t.slice(0, 30).toLowerCase()
  ).slice(0, 6);

  return {
    twoMark,
    fiveMark,
    tenMark,
    theory,
    definitions: defs.slice(0, 8),
    formulas,
    diagrams,
    tips,
  };
}

// --- Quiz: 10 MCQ + 5 T/F + 5 fill-blank + 5 short-answer + 5 scenario -----

function buildDistractors(pool: string[], correct: string, count: number): string[] {
  return shuffle(pool.filter((p) => p.toLowerCase() !== correct.toLowerCase())).slice(0, count);
}

function buildQuiz(text: string, topic: string): QuizQuestion[] {
  const quiz: QuizQuestion[] = [];
  const sentences = splitSentences(text);
  const freq = wordFreq(text);
  const defs = buildDefinitions(text);
  const dates = buildDates(text);
  const kws = topKeywords(text, 20);
  const ranked = rankedSentences(text);
  const usedQuestions = new Set<string>();

  const addIfNew = (q: QuizQuestion) => {
    const key = q.question.toLowerCase().slice(0, 40);
    if (!usedQuestions.has(key)) { usedQuestions.add(key); quiz.push(q); }
  };

  // --- 10 MCQs ---
  // 1. Definition-based MCQs
  for (const d of shuffle(defs).slice(0, 4)) {
    if (quiz.filter((q) => q.type === 'mcq').length >= 10) break;
    const distractorDefs = buildDistractors(defs.map((x) => x.definition), d.definition, 3);
    while (distractorDefs.length < 3) distractorDefs.push('None of the above');
    const options = shuffle([d.definition, ...distractorDefs]).slice(0, 4);
    addIfNew({
      type: 'mcq',
      question: `Which of the following best defines "${d.term}"?`,
      options,
      answer: options.indexOf(d.definition),
      explanation: d.definition,
    });
  }

  // 2. Keyword fill-in MCQs from strong sentences
  const strongSentences = ranked
    .filter((x) => x.s.split(/\s+/).length > 8)
    .sort((a, b) => b.sc - a.sc);
  for (const x of strongSentences) {
    if (quiz.filter((q) => q.type === 'mcq').length >= 10) break;
    const words = tokenize(x.s).filter((w) => !STOPWORDS.has(w) && w.length > 4);
    const key = words.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))[0];
    if (!key) continue;
    const blanked = capitalize(x.s.replace(new RegExp(`\\b${key}\\b`, 'i'), '_____'));
    const distractors = buildDistractors(kws, key, 3);
    while (distractors.length < 3) distractors.push('none of these');
    const options = shuffle([key, ...distractors]).slice(0, 4);
    addIfNew({
      type: 'mcq',
      question: `Fill in the blank: ${blanked}`,
      options,
      answer: options.indexOf(key),
      explanation: `The correct term is "${key}".`,
    });
  }

  // 3. Date-based MCQs
  for (const d of shuffle(dates).slice(0, 2)) {
    if (quiz.filter((q) => q.type === 'mcq').length >= 10) break;
    const distractorDates = buildDistractors(dates.map((x) => x.date), d.date, 3);
    while (distractorDates.length < 3) distractorDates.push('Not mentioned');
    const options = shuffle([d.date, ...distractorDates]).slice(0, 4);
    addIfNew({
      type: 'mcq',
      question: `What event is associated with ${d.date}?`,
      options: [d.event, ...buildDistractors(dates.map((x) => x.event), d.event, 3)].slice(0, 4)
        .sort(() => Math.random() - 0.5),
      answer: 0,
      explanation: d.event,
    });
    void options;
  }

  // --- 5 True/False ---
  const tfPool = ranked.sort((a, b) => b.sc - a.sc).slice(0, 10);
  for (const x of tfPool) {
    if (quiz.filter((q) => q.type === 'truefalse').length >= 5) break;
    const stmt = capitalize(x.s.replace(/[.!?]+$/, ''));
    addIfNew({ type: 'truefalse', question: `True or False: ${stmt}`, answer: true, explanation: stmt });
  }
  // Generate some false statements by swapping a keyword.
  for (const x of tfPool.slice(0, 5)) {
    if (quiz.filter((q) => q.type === 'truefalse').length >= 5) break;
    const words = tokenize(x.s).filter((w) => !STOPWORDS.has(w) && w.length > 4);
    const key = words[0];
    if (!key) continue;
    const replacement = kws.find((k) => k !== key);
    if (!replacement) continue;
    const altered = capitalize(x.s.replace(new RegExp(`\\b${key}\\b`, 'i'), replacement).replace(/[.!?]+$/, ''));
    addIfNew({ type: 'truefalse', question: `True or False: ${altered}`, answer: false, explanation: `The original statement mentions "${key}", not "${replacement}".` });
  }

  // --- 5 Fill in the blanks ---
  for (const x of ranked.sort((a, b) => b.sc - a.sc)) {
    if (quiz.filter((q) => q.type === 'fillblank').length >= 5) break;
    const words = tokenize(x.s).filter((w) => !STOPWORDS.has(w) && w.length > 4);
    const key = words.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))[0];
    if (!key) continue;
    const blanked = capitalize(x.s.replace(new RegExp(`\\b${key}\\b`, 'i'), '_____').replace(/[.!?]+$/, ''));
    addIfNew({ type: 'fillblank', question: blanked, answer: key, explanation: `Answer: ${key}` });
  }

  // --- 5 Short-answer questions ---
  const saPool = topKeyphrases(text, 8).concat(topKeywords(text, 10));
  for (const p of saPool) {
    if (quiz.filter((q) => q.type === 'shortanswer').length >= 5) break;
    const best = sentences.filter((s) => s.toLowerCase().includes(p.split(' ')[0])).sort((a, b) => {
      const scA = tokenize(a).reduce((s, w) => s + (freq.get(w) ?? 0), 0);
      const scB = tokenize(b).reduce((s, w) => s + (freq.get(w) ?? 0), 0);
      return scB - scA;
    })[0];
    if (best) {
      addIfNew({
        type: 'shortanswer',
        question: `Briefly explain: ${titleCase(p)}`,
        answer: capitalize(best.replace(/[.!?]+$/, '')),
      });
    }
  }

  // --- 5 Scenario / application-based ---
  const scenarioTemplates = [
    (k: string) => `Given a real-world scenario involving ${k}, how would you apply the concepts from this material?`,
    (k: string) => `If you encountered a problem related to ${k} in practice, what approach would you take based on what you learned?`,
    (k: string) => `How would you explain the importance of ${k} to someone unfamiliar with ${topic}?`,
    (k: string) => `Describe a situation where understanding ${k} would be critical, and justify your reasoning.`,
    (k: string) => `Using the principles from this material, propose a solution to a challenge involving ${k}.`,
  ];
  for (let i = 0; i < scenarioTemplates.length && quiz.filter((q) => q.type === 'scenario').length < 5; i++) {
    const kw = kws[i % kws.length];
    if (!kw) continue;
    const q = scenarioTemplates[i](kw);
    const best = sentences.filter((s) => s.toLowerCase().includes(kw)).sort((a, b) => {
      const scA = tokenize(a).reduce((s, w) => s + (freq.get(w) ?? 0), 0);
      const scB = tokenize(b).reduce((s, w) => s + (freq.get(w) ?? 0), 0);
      return scB - scA;
    })[0];
    addIfNew({
      type: 'scenario',
      question: q,
      answer: best ? capitalize(best.replace(/[.!?]+$/, '')) : 'Refer to the detailed notes for context.',
    });
  }

  return quiz;
}

// --- Complete notes assembler (style-specific) -----------------------------

function buildCompleteNotes(text: string, style: NoteStyle, sections: Omit<NoteContent, 'editorHtml'>, topic: string): string {
  const parts: string[] = [];

  if (style === 'short') {
    parts.push(`# ${topic} — Short Notes\n`);
    parts.push('## Summary');
    parts.push(sections.summary ?? '');
    parts.push('\n## Quick Points');
    parts.push(sections.keyPoints?.map((p) => `- ${p}`).join('\n') ?? '');
    return parts.join('\n');
  }

  if (style === 'bullets') {
    parts.push(`# ${topic} — Key Bullet Points\n`);
    parts.push(sections.keyPoints?.map((p) => `- ${p}`).join('\n') ?? '');
    if (sections.definitions?.length) {
      parts.push('\n## Key Definitions');
      parts.push(sections.definitions.map((d) => `- **${d.term}**: ${d.definition}`).join('\n'));
    }
    return parts.join('\n');
  }

  if (style === 'exam') {
    parts.push(`# ${topic} — Exam Preparation Notes\n`);
    const ep = sections.examPrep;
    if (ep) {
      parts.push('## Important 2-Mark Questions');
      parts.push(ep.twoMark.map((q) => `- ${q}`).join('\n'));
      parts.push('\n## Important 5-Mark Questions');
      parts.push(ep.fiveMark.map((q) => `- ${q}`).join('\n'));
      parts.push('\n## Important 10-Mark Questions');
      parts.push(ep.tenMark.map((q) => `- ${q}`).join('\n'));
      parts.push('\n## Frequently Asked Theory Questions');
      parts.push(ep.theory.map((q) => `- ${q}`).join('\n'));
      if (ep.definitions.length) {
        parts.push('\n## Important Definitions');
        parts.push(ep.definitions.map((d) => `- **${d.term}**: ${d.definition}`).join('\n'));
      }
      if (ep.formulas.length) {
        parts.push('\n## Formulae');
        parts.push(ep.formulas.map((f) => `- \`${f}\``).join('\n'));
      }
      if (ep.diagrams.length) {
        parts.push('\n## Diagrams to Practice');
        parts.push(ep.diagrams.map((d) => `- ${d}`).join('\n'));
      }
      if (ep.tips.length) {
        parts.push('\n## Last-Minute Revision Tips');
        parts.push(ep.tips.map((t) => `- ${t}`).join('\n'));
      }
    }
    return parts.join('\n');
  }

  // detailed
  parts.push(`# ${topic} — Detailed Notes\n`);
  parts.push(sections.completeNotes ?? buildDetailedNotes(text));
  if (sections.definitions?.length) {
    parts.push('\n## Definitions');
    parts.push(sections.definitions.map((d) => `- **${d.term}**: ${d.definition}`).join('\n'));
  }
  if (sections.formulas?.length) {
    parts.push('\n## Formulas');
    parts.push(sections.formulas.map((f) => `- \`${f}\``).join('\n'));
  }
  if (sections.dates?.length) {
    parts.push('\n## Important Dates');
    parts.push(sections.dates.map((d) => `- **${d.date}**: ${d.event}`).join('\n'));
  }
  if (sections.examples?.length) {
    parts.push('\n## Examples');
    parts.push(sections.examples.map((e) => `- ${e}`).join('\n'));
  }
  if (sections.actionItems?.length) {
    parts.push('\n## Action Items');
    parts.push(sections.actionItems.map((a) => `- [ ] ${a}`).join('\n'));
  }
  return parts.join('\n');
}

// --- Public API ------------------------------------------------------------

export interface GenerateOptions {
  text: string;
  style: NoteStyle;
  title?: string;
  subject?: string;
}

export interface GenerateResult extends NoteContent {
  title: string;
  subject: string;
  keywords: string[];
}

export function generateNotes(opts: GenerateOptions): GenerateResult {
  const { text, style, title, subject } = opts;
  const clean = text.replace(/\s+/g, ' ').trim();
  const topic = title || detectTopic(clean);

  const summary = buildSummary(clean);
  const keyPoints = buildKeyPoints(clean, style);
  const definitions = buildDefinitions(clean);
  const formulas = buildFormulas(clean);
  const dates = buildDates(clean);
  const examples = buildExamples(clean);
  const faqs = buildFaqs(clean, topic);
  const quiz = buildQuiz(clean, topic);
  const examPrep = style === 'exam' ? buildExamPrep(clean, topic) : undefined;
  const flashcards = buildFlashcards(clean, topic);
  const actionItems = buildActionItems(clean);
  const keywords = topKeywords(clean, 12);
  const detailedNotes = buildDetailedNotes(clean);

  const sections: Omit<NoteContent, 'editorHtml'> = {
    summary,
    keyPoints,
    definitions,
    formulas,
    dates,
    examples,
    faqs,
    quiz,
    examPrep,
    flashcards,
    actionItems,
    completeNotes: style === 'detailed' ? detailedNotes : undefined,
  };

  const completeNotes = buildCompleteNotes(clean, style, sections, topic);

  return {
    title: topic,
    subject: subject || 'General',
    keywords,
    completeNotes,
    ...sections,
  };
}

export { detectTopic };
