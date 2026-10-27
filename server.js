const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const sampleDreams = [
  {
    id: 'dream-1',
    title: 'Door to a new life',
    content: 'I was walking through a long corridor with many doors. Some were closed, some were open. I kept searching for the one that would let me breathe again. I felt fear and hope together.',
    privacy: 'public',
    mood: 'anxious',
    createdAt: '2026-10-10T09:15:00.000Z',
    comments: [
      { id: 'c-1', user: 'Mila', text: 'This feels like a transition moment. I had something similar when I was deciding to change jobs.' }
    ],
    analysis: {
      summary: 'A dream about searching for a way forward through uncertainty and transition.',
      emotions: ['fear', 'hope', 'uncertainty'],
      themes: ['door', 'transition', 'search'],
      symbols: ['corridor', 'door', 'choice'],
      lesson: 'You may be standing between a version of yourself that is ending and a future that needs courage.'
    }
  },
  {
    id: 'dream-2',
    title: 'The river remembered me',
    content: 'I was standing by a river at night. I could hear the water talking to me but I could not understand it. Then I let myself float and felt calm, even if I did not know where I was going.',
    privacy: 'public',
    mood: 'calm',
    createdAt: '2026-10-11T07:42:00.000Z',
    comments: [
      { id: 'c-2', user: 'Jules', text: 'Water dreams can mean emotional release. This one feels like surrender and trust.' }
    ],
    analysis: {
      summary: 'A night dream of surrender, emotional release, and quiet trust.',
      emotions: ['calm', 'curiosity', 'release'],
      themes: ['water', 'acceptance', 'trust'],
      symbols: ['river', 'night', 'floating'],
      lesson: 'You may be learning to let go of control and trust the flow of your own life.'
    }
  },
  {
    id: 'dream-3',
    title: 'I was late to my own life',
    content: 'I was running through a city while everyone moved around me. My shoes were heavy, my breath felt short, and I constantly realized I was late for something I could not name.',
    privacy: 'public',
    mood: 'stressed',
    createdAt: '2026-10-12T11:20:00.000Z',
    comments: [
      { id: 'c-3', user: 'Ari', text: 'This reminds me of pressure and fear of not meeting my own expectations.' }
    ],
    analysis: {
      summary: 'A dream of pressure, urgency, and the feeling of falling behind in life.',
      emotions: ['stress', 'panic', 'pressure'],
      themes: ['running', 'time', 'performance'],
      symbols: ['city', 'shoes', 'lateness'],
      lesson: 'You may be feeling the weight of expectations more than you realize.'
    }
  }
];

function normalizeText(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text = '') {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

function extractAnalysis(content) {
  const tokens = tokenize(content);

  const emotionMap = {
    fear: ['door', 'run', 'dark', 'hide', 'lost', 'night', 'storm', 'afraid', 'closed'],
    calm: ['water', 'soft', 'quiet', 'slow', 'forest', 'floating', 'sleep', 'still'],
    joy: ['sun', 'music', 'light', 'smile', 'friend', 'laugh', 'dance', 'flower'],
    stress: ['late', 'run', 'traffic', 'phone', 'clock', 'hurry', 'pressure'],
    curiosity: ['road', 'tower', 'forest', 'unknown', 'secret', 'mystery'],
    hope: ['light', 'future', 'window', 'open', 'door', 'new'],
    sadness: ['alone', 'empty', 'cry', 'rain', 'lost', 'forgotten']
  };

  const themeMap = {
    transition: ['door', 'road', 'bridge', 'window', 'stairs', 'train'],
    searching: ['lost', 'search', 'run', 'find', 'wait', 'door'],
    water: ['river', 'sea', 'ocean', 'lake', 'water', 'rain', 'flood'],
    house: ['home', 'room', 'hall', 'door', 'window', 'stair'],
    flight: ['fly', 'flight', 'sky', 'cloud', 'bird', 'wind'],
    time: ['late', 'clock', 'morning', 'night', 'timer']
  };

  const emotions = Object.entries(emotionMap)
    .filter(([_, words]) => words.some(word => tokens.includes(word)))
    .map(([emotion]) => emotion)
    .slice(0, 3);

  const themes = Object.entries(themeMap)
    .filter(([_, words]) => words.some(word => tokens.includes(word)))
    .map(([theme]) => theme)
    .slice(0, 3);

  const symbols = [...new Set(tokens.filter(word => word.length > 4))].slice(0, 5);
  const mood = emotions[0] || 'curious';

  const summary = `This dream seems to combine ${themes[0] || 'reflection'} with ${emotions[0] || 'emotion'}, suggesting a moment of inner transition and self-understanding.`;

  const lesson = (() => {
    if (themes.includes('transition')) return 'You may be moving through a transition where the future is uncertain but meaningful.';
    if (themes.includes('water')) return 'The dream suggests emotional release and trust in the flow of your inner life.';
    if (themes.includes('searching')) return 'There may be a search for clarity, belonging, or a sense of direction in your life.';
    if (themes.includes('time')) return 'The dream may reflect pressure, expectations, or a fear of falling behind.';
    return 'The dream invites reflection on what is changing quietly inside you.';
  })();

  return {
    summary,
    emotions: emotions.length ? emotions : ['reflection'],
    themes: themes.length ? themes : ['inner life'],
    symbols: symbols.length ? symbols : ['light', 'door'],
    lesson,
    mood
  };
}

function computeSimilarity(baseDream, otherDream) {
  const baseText = `${baseDream.analysis.summary} ${baseDream.analysis.themes.join(' ')} ${baseDream.analysis.emotions.join(' ')}`;
  const otherText = `${otherDream.analysis.summary} ${otherDream.analysis.themes.join(' ')} ${otherDream.analysis.emotions.join(' ')}`;
  const baseSet = new Set(normalizeText(baseText).split(/\s+/));
  const otherSet = new Set(normalizeText(otherText).split(/\s+/));
  const intersection = [...baseSet].filter(word => otherSet.has(word));
  const score = intersection.length / Math.max(1, Math.min(baseSet.size, otherSet.size));
  return Number((score * 100).toFixed(0));
}

function buildDreamPayload(entry) {
  return {
    id: randomUUID(),
    title: entry.title || 'Untitled dream',
    content: entry.content,
    privacy: entry.privacy || 'public',
    mood: entry.mood || 'curious',
    createdAt: new Date().toISOString(),
    comments: [],
    analysis: extractAnalysis(entry.content)
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'CDTV API is live' });
});

app.get('/api/dreams', (req, res) => {
  const dreams = [...sampleDreams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(dreams);
});

app.get('/api/insights', (req, res) => {
  const allThemes = sampleDreams.flatMap(d => d.analysis.themes);
  const counts = {};

  allThemes.forEach(theme => {
    counts[theme] = (counts[theme] || 0) + 1;
  });

  const topThemes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  res.json({
    communityMessage: 'The most recurring emotional themes are transition, water, and searching.',
    topThemes
  });
});

app.get('/api/dreams/:id/similar', (req, res) => {
  const dream = sampleDreams.find(item => item.id === req.params.id);
  if (!dream) return res.status(404).json({ error: 'Dream not found' });

  const similar = sampleDreams
    .filter(item => item.id !== dream.id)
    .map(item => ({ ...item, similarity: computeSimilarity(dream, item) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  res.json(similar);
});

app.post('/api/dreams', (req, res) => {
  const { title, content, privacy = 'public', mood } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Dream content is required' });
  }

  const dream = buildDreamPayload({ title, content, privacy, mood });
  sampleDreams.unshift(dream);

  res.status(201).json({ message: 'Dream shared successfully', dream });
});

app.post('/api/dreams/:id/comments', (req, res) => {
  const { user, text } = req.body || {};
  const dream = sampleDreams.find(item => item.id === req.params.id);

  if (!dream) {
    return res.status(404).json({ error: 'Dream not found' });
  }

  const comment = {
    id: randomUUID(),
    user: user || 'Community member',
    text: text || 'This feels meaningful.'
  };

  dream.comments.push(comment);
  res.status(201).json(comment);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CDTV server running on http://localhost:${PORT}`);
});
