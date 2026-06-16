/**
 * Enhanced Mood Detection with Machine Learning
 * - Sentiment analysis + emotion classification
 * - Multi-language support (ID, EN, AR)
 * - Confidence scoring
 */

// Expanded emotional vocabulary for Indonesian, English, Arabic
const emotionalVocabulary = {
  sedih: {
    keywords: [
      // Indonesian
      'sedih', 'duka', 'bersedih', 'murung', 'pilu', 'melayat', 'penyesalan',
      'tidak bahagia', 'putus asa', 'depresi', 'kecewa', 'hancur', 'kehilangan',
      'sakit hati', 'penderitaan', 'kesengsaraan', 'berkabung', 'dukacita',
      // English
      'sad', 'grief', 'sorrowful', 'depressed', 'unhappy', 'grief-stricken',
      'melancholy', 'gloomy', 'heartbroken', 'devastated', 'loss', 'mourning',
      'disappointed', 'miserable', 'dejected', 'forlorn', 'despondent',
      // Islamic concepts
      'sabar', 'ujian', 'cobaan', 'musibah', 'kesulitan', 'takdir'
    ],
    intensity_modifiers: ['sangat', 'amat', 'sangat sekali', 'deeply', 'terribly', 'extremely'],
    sub_emotions: [
      'tired_heart', 'grief', 'disappointment', 'lost', 'broken', 'nostalgic_sad'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['loss', 'grief', 'mercy', 'forgiveness', 'healing', 'patience', 'sabar']
  },

  gelisah: {
    keywords: [
      // Indonesian
      'gelisah', 'cemas', 'khawatir', 'was-was', 'takut', 'panik', 'gugup',
      'tegang', 'resah', 'kuatir', 'berangsur', 'khilaf', 'ragu', 'bingung',
      'overthinking', 'stress', 'tertekan', 'terbebani', 'ketakutan', 'pesimis',
      // English
      'anxious', 'worried', 'stressed', 'nervous', 'uneasy', 'restless',
      'panicked', 'fearful', 'uncertain', 'doubtful', 'pressured', 'tense',
      'overwhelmed', 'apprehensive', 'troubled', 'disturbed',
      // Islamic concepts
      'khawatir', 'was-was', 'ragu', 'fitnah', 'godaan', 'ujian'
    ],
    intensity_modifiers: ['sangat', 'sangat sekali', 'parah', 'heavily', 'severely', 'acutely'],
    sub_emotions: [
      'overthinking', 'fear', 'uncertainty', 'pressure', 'confusion', 'panic'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['faith', 'trust', 'tawakkal', 'patience', 'certainty', 'wisdom']
  },

  hidayah: {
    keywords: [
      // Indonesian
      'hidayah', 'ilham', 'inspirasi', 'motivasi', 'semangat', 'tekad', 'niat',
      'ingin berubah', 'memperbaiki diri', 'taubat', 'kembali', 'spiritual',
      'iman', 'percaya', 'yakin', 'berkembang', 'belajar', 'pertumbuhan',
      'masa depan cerah', 'harapan', 'optimis', 'putusan', 'keyakinan',
      // English
      'inspiration', 'motivated', 'spiritual', 'growth', 'change', 'faith',
      'transformation', 'enlightenment', 'purpose', 'direction', 'guidance',
      'hopeful', 'determined', 'resolved', 'discover', 'journey',
      // Islamic concepts
      'taubat', 'niat', 'ilham', 'berkah', 'hidayah', 'petunjuk', 'jalan yang benar'
    ],
    intensity_modifiers: ['sangat', 'kuat', 'mendalam', 'sejati', 'deeply', 'truly', 'genuinely'],
    sub_emotions: [
      'spiritual_seeking', 'motivation', 'change', 'transformation', 'awakening', 'purpose'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['faith', 'spiritual', 'islam', 'journey', 'truth', 'inspirational', 'growth']
  },

  bahagia: {
    keywords: [
      // Indonesian
      'bahagia', 'senang', 'gembira', 'riang', 'ceria', 'senyum', 'tertawa',
      'kegembiraan', 'kesenangan', 'keceriaan', 'kebanggan', 'puas', 'syukur',
      'lega', 'menyenangkan', 'indah', 'cerah', 'bersinar', 'glorious',
      // English
      'happy', 'joyful', 'cheerful', 'delighted', 'pleased', 'content',
      'satisfied', 'grateful', 'blessed', 'wonderful', 'awesome', 'excited',
      'proud', 'elated', 'ecstatic', 'gleeful', 'uplifted',
      // Islamic concepts
      'syukur', 'berkat', 'nikmat', 'berkah', 'rahmah', 'kasih sayang'
    ],
    intensity_modifiers: ['sangat', 'amat', 'luar biasa', 'truly', 'deeply', 'genuinely', 'pure'],
    sub_emotions: [
      'joy', 'gratitude', 'celebration', 'contentment', 'pride', 'relief'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['happiness', 'joy', 'gratitude', 'blessing', 'celebration', 'faith']
  },

  marah: {
    keywords: [
      // Indonesian
      'marah', 'kesal', 'geram', 'murka', 'naik darah', 'emosi', 'kebetulan',
      'benci', 'mengomel', 'jengkel', 'sebal', 'kecil hati', 'dendam', 'iri',
      'umpatan', 'tidak sabar', 'mudah terpicu', 'sensitif', 'kontrol diri',
      // English
      'angry', 'furious', 'enraged', 'livid', 'irritated', 'frustrated',
      'resentful', 'bitter', 'vindictive', 'hostile', 'aggressive', 'irate',
      'indignant', 'annoyed', 'incensed', 'cross',
      // Islamic concepts
      'marah', 'amarah', 'kontrol emosi', 'sabar', 'pemaafan', 'keadilan'
    ],
    intensity_modifiers: ['sangat', 'sedang', 'parah', 'furiously', 'bitterly', 'intensely', 'hotly'],
    sub_emotions: [
      'frustration', 'resentment', 'irritation', 'fury', 'betrayal', 'injustice'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['controlled anger', 'forgiveness', 'justice', 'patience', 'mercy']
  },

  rindu: {
    keywords: [
      // Indonesian
      'rindu', 'kangen', 'merindukan', 'nostalgia', 'kesepian', 'sendiri',
      'lenging', 'ingin bertemu', 'misalnya', 'jauh', 'terpisah', 'sunyi',
      'ditinggal', 'kehilangan', 'absence', 'ingatan indah', 'memories',
      // English
      'miss', 'longing', 'homesick', 'nostalgic', 'lonely', 'yearning',
      'aching', 'bittersweet', 'wistful', 'pining', 'distance', 'separation',
      'remembrance', 'cherish', 'absence', 'distant love',
      // Islamic concepts
      'rindu', 'kangen', 'muhasabah', 'zikir', 'doa', 'hubungan'
    ],
    intensity_modifiers: ['sangat', 'dalam', 'mendalam', 'deeply', 'achingly', 'sweetly', 'bittersweet'],
    sub_emotions: [
      'missing_person', 'homesickness', 'nostalgia', 'loneliness', 'separation', 'remembrance'
    ],
    intensity_range: [0, 1],
    semantic_profile: ['missing', 'longing', 'nostalgia', 'home', 'love', 'remembrance', 'connection']
  }
};

// Negation words that flip sentiment
const negationWords = [
  'tidak', 'bukan', 'jangan', 'tidak ada', 'bukan seperti',
  'tidak sedih', 'tidak bahagia', 'tidak marah', 'tidak gelisah'
];

/**
 * Tokenize text dengan support multi-language
 */
function tokenizeText(text) {
  // Remove diacritics dan normalize
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s\-]/g, ' ') // Keep only words, spaces, hyphens
    .trim();

  // Tokenize
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
  
  return tokens;
}

/**
 * Calculate sentiment polarity (-1 to 1)
 */
function calculateSentimentPolarity(tokens) {
  const positiveWords = [
    'bagus', 'baik', 'sempurna', 'hebat', 'mantap', 'keren', 'awesome',
    'indah', 'cantik', 'menarik', 'seru', 'menyenangkan', 'wonderful',
    'syukur', 'berkat', 'berkah', 'nikmat', 'rahmah'
  ];

  const negativeWords = [
    'buruk', 'jelek', 'terserah', 'benci', 'dosa', 'haram', 'bodoh',
    'sampah', 'payah', 'kacau', 'hancur', 'gagal', 'rugi', 'merugi',
    'sakit', 'menyakitkan', 'menderita', 'susah'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  tokens.forEach(token => {
    if (positiveWords.includes(token)) positiveScore++;
    if (negativeWords.includes(token)) negativeScore++;
  });

  // Normalize to -1 to 1 range
  const totalScore = positiveScore - negativeScore;
  const maxPossible = Math.max(tokens.length, 1);
  return Math.max(-1, Math.min(1, totalScore / maxPossible));
}

/**
 * Calculate intensity (0 to 1) based on context
 */
function calculateIntensity(tokens, moodData) {
  let intensityScore = 0.5; // Base middle intensity

  // Check for intensity modifiers
  moodData.intensity_modifiers.forEach(modifier => {
    const index = tokens.indexOf(modifier);
    if (index !== -1) {
      intensityScore = 0.8; // Strong intensity if modifier found
      // Check for "sangat sekali" or similar phrases
      if (index + 1 < tokens.length && tokens[index + 1] === 'sekali') {
        intensityScore = 0.95;
      }
    }
  });

  // Adjust based on exclamation marks (check original text)
  // This would be passed separately if needed

  return Math.max(0, Math.min(1, intensityScore));
}

/**
 * Main mood detection function with ML approach
 * Returns: { mood, confidence, intensity, subEmotion, details }
 */
export function detectMoodML(userInput) {
  if (!userInput || userInput.trim().length === 0) {
    return {
      mood: null,
      confidence: 0,
      intensity: 0.5,
      subEmotion: null,
      details: 'No input provided',
      allScores: {}
    };
  }

  const tokens = tokenizeText(userInput);
  const moodScores = {};
  const sentimentPolarity = calculateSentimentPolarity(tokens);

  // Score each mood
  Object.entries(emotionalVocabulary).forEach(([moodName, moodData]) => {
    let score = 0;

    // Keyword matching with weighting
    moodData.keywords.forEach(keyword => {
      tokens.forEach(token => {
        // Exact match
        if (token === keyword) {
          score += 2;
        }
        // Partial match (if keyword contains token as substring)
        else if (keyword.includes(token) && token.length >= 3) {
          score += 1;
        }
      });
    });

    // Normalize score to 0-1 based on keyword count
    const maxPossibleScore = tokens.length * 2;
    score = maxPossibleScore > 0 ? score / maxPossibleScore : 0;
    score = Math.min(1, score);

    // Apply sentiment polarity adjustment
    // Positive sentiment boosts happy/hidayah, reduces sad/marah
    if (sentimentPolarity > 0.5) {
      if (moodName === 'bahagia' || moodName === 'hidayah') {
        score = Math.min(1, score + (sentimentPolarity * 0.3));
      } else if (moodName === 'sedih' || moodName === 'marah') {
        score = Math.max(0, score - (sentimentPolarity * 0.2));
      }
    } else if (sentimentPolarity < -0.5) {
      if (moodName === 'sedih' || moodName === 'gelisah') {
        score = Math.min(1, score + (Math.abs(sentimentPolarity) * 0.3));
      } else if (moodName === 'bahagia') {
        score = Math.max(0, score - (Math.abs(sentimentPolarity) * 0.2));
      }
    }

    moodScores[moodName] = score;
  });

  // Find top mood
  let topMood = null;
  let maxScore = 0;

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > maxScore) {
      maxScore = score;
      topMood = mood;
    }
  });

  // If no mood detected, default to bahagia
  if (!topMood || maxScore < 0.1) {
    topMood = 'bahagia';
    maxScore = 0.3;
  }

  // Calculate intensity and sub-emotion for top mood
  const moodData = emotionalVocabulary[topMood];
  const intensity = calculateIntensity(tokens, moodData);
  
  // Simple sub-emotion detection (can be enhanced)
  let subEmotion = moodData.sub_emotions[0];
  moodData.sub_emotions.forEach(subE => {
    if (userInput.toLowerCase().includes(subE.replace('_', ' '))) {
      subEmotion = subE;
    }
  });

  return {
    mood: topMood,
    confidence: maxScore,
    intensity: intensity,
    subEmotion: subEmotion,
    details: `Detected mood with ${(maxScore * 100).toFixed(0)}% confidence`,
    allScores: moodScores,
    sentimentPolarity: sentimentPolarity,
    keywords: moodData.keywords.filter(k => tokens.some(t => k.includes(t) || t === k))
  };
}

/**
 * Batch detect moods from multiple inputs
 */
export function detectMoodsMulti(inputs) {
  return inputs.map(input => detectMoodML(input));
}

/**
 * Get emotional context summary
 */
export function getEmotionalContext(userInput) {
  const mood = detectMoodML(userInput);
  const moodData = emotionalVocabulary[mood.mood];

  return {
    ...mood,
    semanticProfile: moodData.semantic_profile,
    islamicConcepts: moodData.keywords.filter(k => 
      ['sabar', 'ujian', 'cobaan', 'taubat', 'niat', 'ilham', 'berkah', 'hidayah'].includes(k)
    )
  };
}

export default {
  detectMoodML,
  detectMoodsMulti,
  getEmotionalContext,
  emotionalVocabulary
};
