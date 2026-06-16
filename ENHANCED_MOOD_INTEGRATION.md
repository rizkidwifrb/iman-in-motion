# Quick Integration Guide - Enhanced Mood Engine

## 🚀 Getting Started

### Step 1: Access the Enhanced Mood Page
Navigate to: `/#/mood-pro` atau `/#/mood-enhanced`

Atau dari home page, add button yang links ke enhanced mood page.

### Step 2: Integration Points

#### Option A: Add to Home Page (Recommended)
```jsx
// In src/pages/Home.jsx

import EnhancedMoodSelector from '../components/EnhancedMoodSelector';

// Inside component
const [showMoodSelector, setShowMoodSelector] = useState(false);

// Add button
<button 
  onClick={() => setShowMoodSelector(true)}
  className="btn-primary"
>
  🎭 Start Enhanced Mood Journey
</button>

// Add modal
{showMoodSelector && (
  <EnhancedMoodSelector
    onMoodSelect={(moodContext) => {
      console.log('Selected mood:', moodContext);
      navigate('/mood-pro');
    }}
    onClose={() => setShowMoodSelector(false)}
  />
)}
```

#### Option B: Add Analytics to Account Page
```jsx
// In src/pages/Account.jsx

import MoodAnalyticsDashboard from '../components/MoodAnalyticsDashboard';

// Inside component
<section>
  <MoodAnalyticsDashboard />
</section>
```

#### Option C: Use ML Mood Detection Standalone
```jsx
// In any component

import { detectMoodML } from '../services/moodDetectionML';

const handleUserInput = (text) => {
  const mood = detectMoodML(text);
  console.log(`Detected mood: ${mood.mood} (${mood.confidence}% confidence)`);
  console.log(`Intensity: ${mood.intensity}`);
  console.log(`Sub-emotion: ${mood.subEmotion}`);
};
```

#### Option D: Use Neural Recommender
```jsx
// In any component

import { NeuralRecommender } from '../services/neuralRecommendationEngine';
import allMovies from '../data/movies';

const recommender = new NeuralRecommender(allMovies);

const getRecommendations = (moodContext, userHistory) => {
  const recommendations = recommender.recommendMovies(
    userId,
    moodContext,
    userHistory,
    12 // top K
  );
  
  recommendations.forEach(movie => {
    console.log(`${movie.title}: ${movie.recommendationScore}`);
    console.log(`Reason: ${movie.reason}`);
  });
};
```

## 📊 Data Flow Examples

### Example 1: Complete Mood Journey Flow
```javascript
// 1. User navigates to enhanced mood page
navigate('/mood-pro');

// 2. User enters mood selector
// "Aku sedih karena merasa sendirian"

// 3. ML Detection happens automatically
detectMoodML("Aku sedih karena merasa sendirian")
// Returns:
// {
//   mood: "sedih",
//   confidence: 0.88,
//   intensity: 0.72,
//   subEmotion: "kesepian",
//   sentimentPolarity: -0.8
// }

// 4. User confirms mood (atau auto-selects if confidence > 0.6)
// 5. Neural recommender generates embeddings for all movies
// 6. Scores movies using hybrid approach
// 7. Returns top 18 recommendations with reasons

// 8. User clicks on film
// 9. Mood is recorded to localStorage

// 10. Next time user visits:
// - Analytics shows mood trends
// - Recommendations consider history
// - Patterns are detected
```

### Example 2: Direct Recommendation
```javascript
import { NeuralRecommender } from '../services/neuralRecommendationEngine';
import allMovies from '../data/movies';

const recommender = new NeuralRecommender(allMovies);

const moodContext = {
  mood: 'hidayah',
  intensity: 0.9,
  subEmotion: 'transformation',
  confidence: 0.85
};

const userHistory = [
  { id: 1, title: 'Film A', mood: 'hidayah' },
  { id: 2, title: 'Film B', mood: 'bahagia' }
];

const recs = recommender.recommendMovies(
  'user123',
  moodContext,
  userHistory,
  12
);

// Each recommendation includes:
// - movie data
// - recommendationScore (0-1)
// - scores breakdown
// - reason explanation
```

### Example 3: Analytics Integration
```javascript
import { useMoodAnalytics } from '../hooks/useMoodAnalytics';
import { useAuthUser } from '../hooks/useAuthUser';

const MyComponent = () => {
  const { user } = useAuthUser();
  const { moodStats, recordMood, getRecommendations } = 
    useMoodAnalytics(user?.uid);

  // Record new mood
  const handleMood = (moodData) => {
    recordMood({
      mood: 'gelisah',
      intensity: 0.65,
      subEmotion: 'overthinking'
    });
  };

  // Get insights
  const insights = getRecommendations();
  insights.forEach(insight => {
    console.log(insight.title);
    console.log(insight.description);
  });

  // Show stats
  console.log(`Total moods: ${moodStats.totalMoods}`);
  console.log(`Top mood: ${moodStats.topMood}`);
  console.log(`Distribution:`, moodStats.moods);
};
```

## 🎨 Styling & Customization

### Color Schemes by Mood
```javascript
const moodColors = {
  sedih: 'from-purple-600 to-pink-500',
  gelisah: 'from-red-500 to-orange-400',
  hidayah: 'from-green-500 to-emerald-400',
  bahagia: 'from-yellow-400 to-orange-300',
  marah: 'from-red-700 to-red-500',
  rindu: 'from-slate-700 to-slate-500'
};

// Use in your components:
<div className={`bg-gradient-to-r ${moodColors[mood]}`}>
  {/* content */}
</div>
```

### Glassmorphism Effect (Used Throughout)
```css
/* Tailwind classes used */
.glass-effect {
  @apply bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl;
}
```

## 📱 Mobile Considerations

All components are fully responsive:
- Grid layouts use responsive columns
- Touch-friendly button sizes
- Scrollable modals on mobile
- Optimized for landscape and portrait

## ⚡ Performance Tips

1. **First Load**: Embeddings generated on demand (500-1000ms)
2. **Caching**: Embeddings reused across session
3. **Batch Processing**: Can process multiple moods at once
4. **LocalStorage**: Stores up to 500 mood entries per user

## 🔧 Configuration

### Adjust Recommendation Weights
Edit `neuralRecommendationEngine.js`, method `recommendMovies()`:
```javascript
finalScore = (
  item.scores.mood_match * 0.40 +      // Change weight here
  item.scores.content * 0.25 +
  item.scores.collaborative * 0.15 +
  item.scores.personalized * 0.15 +
  item.scores.diversity * 0.05
);
```

### Adjust Detection Sensitivity
Edit `moodDetectionML.js`, method `detectMoodML()`:
```javascript
const minConfidence = 0.1; // Change this threshold
if (!topMood || maxScore < minConfidence) {
  topMood = 'bahagia';
}
```

## 🐛 Debugging

### Check Mood Detection
```javascript
// In browser console
const { detectMoodML } = await import('./services/moodDetectionML.js');
const result = detectMoodML('your test input');
console.log(result);
```

### Check Embeddings
```javascript
const { MovieEmbedding } = await import('./services/neuralRecommendationEngine.js');
const embedder = new MovieEmbedding();
const embedding = embedder.generateMovieEmbedding(movie, {}, allMovies);
console.log('Embedding length:', embedding.length); // Should be 32
```

### Check Recommendations
```javascript
const { NeuralRecommender } = await import('./services/neuralRecommendationEngine.js');
const recommender = new NeuralRecommender(allMovies);
const recs = recommender.recommendMovies('test-user', 
  { mood: 'sedih', intensity: 0.5 }, [], 5);
console.log(recs);
```

## 📚 File Structure Reference

```
src/
├── services/
│   ├── moodDetectionML.js          # ML mood detection
│   └── neuralRecommendationEngine.js # Neural recommendations
├── components/
│   ├── EnhancedMoodSelector.jsx     # Mood selection modal
│   └── MoodAnalyticsDashboard.jsx   # Analytics dashboard
├── pages/
│   └── EnhancedMoodPage.jsx         # Main mood page
├── hooks/
│   └── useMoodAnalytics.js          # Analytics hook
└── main.jsx                         # Routes (updated)
```

## ✅ Testing Checklist

- [ ] Mood detection works with various inputs
- [ ] Recommendations load without errors
- [ ] Analytics accumulate correctly
- [ ] LocalStorage persists data
- [ ] Mobile UI responsive
- [ ] Gradients render correctly
- [ ] Transitions smooth
- [ ] Performance acceptable

## 🎯 Common Use Cases

### Use Case 1: Quick Mood Check
```
User clicks home button
→ EnhancedMoodSelector opens
→ Types feeling
→ Gets 1 recommendation
→ Watches film
→ Done
```

### Use Case 2: Deep Exploration
```
User navigates to /mood-pro
→ Fills mood selector
→ Gets 18 recommendations
→ Filters by genre
→ Sorts by rating
→ Browses through pages
→ Adds to favorites
→ Watches analytics
```

### Use Case 3: Trend Analysis
```
User opens Account page
→ Views MoodAnalyticsDashboard
→ Sees mood distribution
→ Checks trends
→ Gets AI insights
→ Continues journey for recommendations
```

## 📞 API Reference

### detectMoodML(userInput)
```javascript
Input: string
Output: {
  mood: string,
  confidence: number,
  intensity: number,
  subEmotion: string,
  details: string,
  allScores: object,
  sentimentPolarity: number,
  keywords: array
}
```

### NeuralRecommender.recommendMovies(userId, moodContext, userHistory, topK)
```javascript
Input:
- userId: string
- moodContext: { mood, intensity, subEmotion, confidence }
- userHistory: array of previous movies
- topK: number (default 12)

Output: array of movies with:
- movie data
- recommendationScore
- scores breakdown
- reason string
```

### useMoodAnalytics(userId)
```javascript
Returns: {
  moodStats: { totalMoods, moods, trends, topMood, lastMood },
  emotionalPattern: { topTransitions, emotionalCycles, volatility },
  personalizationData: array of insights,
  recordMood(moodData): boolean,
  getMoodStats(): object,
  getRecommendations(): array
}
```

---

**For detailed documentation, see: ENHANCED_MOOD_ENGINE.md**
