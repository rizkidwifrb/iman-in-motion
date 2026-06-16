# Enhanced Mood Engine with ML/DL - Documentation

## Overview

Kami telah upgrade Mood Engine dengan teknologi **Machine Learning & Deep Learning** yang lebih sophisticated untuk memberikan rekomendasi film yang lebih akurat dan personal. Sistem ini sekarang menggunakan:

- **Sentiment Analysis** untuk mood detection
- **Neural Network Embedding** untuk content understanding
- **Collaborative Filtering** untuk personalization
- **Emotion Intensity Analysis** untuk nuanced recommendations
- **Pattern Recognition** untuk understanding emotional trends

---

## 🎯 Key Features

### 1. **Enhanced Mood Detection (ML-Based)**
- **Multi-Language Support**: Detects moods in Indonesian, English, and Arabic
- **Emotional Vocabulary**: 100+ keywords per mood untuk accurate detection
- **Sentiment Analysis**: Analyzes positive/negative polarity of user input
- **Intensity Calculation**: Measures strength of emotion (0-1 scale)
- **Sub-Emotion Classification**: Breaks down emotions into specific types

**File**: `src/services/moodDetectionML.js`

**Example**:
```javascript
import { detectMoodML } from '../services/moodDetectionML';

const result = detectMoodML('Aku merasa sedih karena kehilangan seseorang');
// Output: 
// {
//   mood: 'sedih',
//   confidence: 0.92,
//   intensity: 0.75,
//   subEmotion: 'missing_person',
//   keywords: ['sedih', 'kehilangan'],
//   sentimentPolarity: -0.85
// }
```

### 2. **Neural Recommendation Engine**

#### Movie Embeddings (32-dimensional)
Setiap movie direpresentasikan sebagai vector dengan 8 feature groups:
- **Mood Embedding** (4D): Mood + Intensity + Confidence + Sub-emotion
- **Genre Embedding** (8D): TF-IDF weighted genre vectors
- **Rating Embedding** (2D): Rating + Confidence
- **Year/Recency** (4D): Temporal features + trend
- **Keyword/Theme** (8D): Semantic understanding dari overview
- **Popularity** (4D): Log-scale popularity metrics

#### Hybrid Recommendation Strategy
Menggabungkan 4 approach berbeda:

1. **Mood-Based Filtering** (40% weight)
   - Direct mood match
   - Intensity-aware filtering
   - Sub-emotion consideration

2. **Content-Based Filtering** (25% weight)
   - Cosine similarity antara movie embeddings
   - Genre & theme matching
   - User history consideration

3. **Collaborative Filtering** (15% weight)
   - User-movie interaction matrix
   - Similar user recommendations
   - Implicit feedback learning

4. **Personalization** (15% weight)
   - User mood preferences
   - Historical mood patterns
   - Top mood boosting

5. **Diversity** (5% weight)
   - Genre variety
   - Prevents oversaturation

**File**: `src/services/neuralRecommendationEngine.js`

### 3. **Enhanced UI/UX**

#### EnhancedMoodSelector Component
Modal interaktif untuk mood selection dengan:
- Real-time mood detection saat user typing
- Interactive mood cards dengan visual feedback
- Intensity slider dengan visual representation
- Sub-emotion selection buttons
- Islamic references untuk setiap mood
- AI confidence display
- Detection details panel

**File**: `src/components/EnhancedMoodSelector.jsx`

#### Enhanced Mood Page
Halaman recommendations dengan:
- Beautiful glassmorphism design
- Real-time suggestions
- Genre filtering
- Smart sorting options
- Pagination dengan 18 items per page
- Recommendation reason explanation
- User mood statistics
- Mood history tracking

**File**: `src/pages/EnhancedMoodPage.jsx`

### 4. **Mood Analytics & Personalization**

Hook untuk tracking emotional patterns:
- Mood frequency analysis
- Intensity trends
- Emotional cycles detection
- Volatility calculation
- Pattern-based insights
- Personalized recommendations

**File**: `src/hooks/useMoodAnalytics.js`

**Features**:
- Tracks last 500 mood entries
- Detects mood transitions
- Identifies emotional cycles
- Generates actionable insights
- Calculates volatility score

---

## 🚀 Getting Started

### Usage di Home Page
Tambahkan button di home untuk quick access ke Enhanced Mood page:

```jsx
import EnhancedMoodSelector from '../components/EnhancedMoodSelector';

// Dalam Home.jsx
const [showMoodSelector, setShowMoodSelector] = useState(false);

<button onClick={() => setShowMoodSelector(true)}>
  🎭 Mulai Mood Journey (Enhanced)
</button>

{showMoodSelector && (
  <EnhancedMoodSelector
    onMoodSelect={(moodContext) => {
      // Handle mood selection
      navigate('/mood-enhanced');
    }}
    onClose={() => setShowMoodSelector(false)}
  />
)}
```

### Direct Navigation
Users bisa langsung akses via:
- `/mood-pro` - Enhanced Mood Page
- `/mood-enhanced` - Same as above

---

## 📊 Mood Categories (Enhanced)

Setiap mood memiliki:
- Multiple sub-emotions
- Islamic references (Qur'anic verses)
- Semantic profiles
- Genre affinities
- Keyword mappings

### 1. **SEDIH** (Sad - 💔)
- Sub-emotions: Tired heart, Grief, Disappointment, Lost, Broken, Nostalgic sad
- Islamic concept: Sabar (patience), Ujian (trial)
- Keywords: grief, loss, mercy, forgiveness, healing

### 2. **GELISAH** (Anxious - 😰)
- Sub-emotions: Overthinking, Fear, Uncertainty, Pressure, Confusion, Panic
- Islamic concept: Tawakkal (trust in Allah)
- Keywords: faith, trust, certainty, wisdom, calm

### 3. **HIDAYAH** (Guidance - ✨)
- Sub-emotions: Spiritual seeking, Motivation, Change, Transformation, Awakening, Purpose
- Islamic concept: Taubat (repentance), Ilham (inspiration)
- Keywords: faith, spiritual, islam, journey, truth, growth

### 4. **BAHAGIA** (Happy - 😊)
- Sub-emotions: Joy, Gratitude, Celebration, Contentment, Pride, Relief
- Islamic concept: Syukur (gratitude)
- Keywords: happiness, gratitude, blessing, celebration

### 5. **MARAH** (Angry - 😠)
- Sub-emotions: Frustration, Resentment, Irritation, Fury, Betrayal, Injustice
- Islamic concept: Kontrol emosi (emotion control), Pemaafan (forgiveness)
- Keywords: controlled anger, forgiveness, justice, patience

### 6. **RINDU** (Longing - 🌙)
- Sub-emotions: Missing person, Homesickness, Nostalgia, Loneliness, Separation, Remembrance
- Islamic concept: Muhasabah (reflection)
- Keywords: missing, longing, home, love, remembrance

---

## 🔬 Technical Architecture

### ML Model Pipeline

```
User Input Text
    ↓
[Tokenization & Normalization]
    ↓
[Sentiment Polarity Analysis]
    ↓
[Emotional Vocabulary Matching]
    ↓
[Intensity & Sub-emotion Detection]
    ↓
Mood Context Output
    ↓
[Neural Recommender Engine]
    ↓
[Movie Embedding Generation]
    ↓
[Hybrid Scoring (4 strategies)]
    ↓
[Ranking & Personalization]
    ↓
Ranked Recommendations
```

### Data Flow

```
Home Page
    ↓
[User clicks mood button]
    ↓
EnhancedMoodSelector Modal Opens
    ↓
[Real-time ML mood detection]
    ↓
[User selects mood/intensity/sub-emotion]
    ↓
Navigate to /mood-pro
    ↓
EnhancedMoodPage Loads
    ↓
NeuralRecommender.recommendMovies()
    ↓
[Generate embeddings for all movies]
    ↓
[Calculate hybrid scores]
    ↓
[Apply filters & sorting]
    ↓
Display Recommendations with Explanations
    ↓
[Track user interaction in history]
    ↓
[Update mood analytics]
```

---

## 🎨 UX Improvements

### 1. **Real-time Mood Detection**
- Saat user typing, sistem automatically detects mood
- Shows confidence score dan detected mood
- Auto-selects jika confidence tinggi

### 2. **Visual Feedback**
- Glassmorphism design untuk modern look
- Gradient animations pada hover
- Smooth transitions
- Clear visual hierarchy

### 3. **Intensity Slider**
- Visual representation dari emotion strength
- 3-level emoji indicators (ringan/sedang/kuat)
- Color gradient untuk intensity visualization

### 4. **Sub-emotion Buttons**
- Quick selection untuk specific emotion type
- Visual feedback when selected
- Helps refine recommendations

### 5. **Recommendation Explanations**
- Setiap film punya "reason" untuk recommendation
- Shows which algorithm recommended it
- Builds trust dengan transparency

### 6. **Mood History Dashboard**
- Visual stats tentang mood patterns
- Percentage breakdown per mood
- Helps user understand emotional trends

---

## 📈 Personalization Benefits

### User Profile Learning
1. **Mood Preferences**: Learns which moods user frequently experiences
2. **Genre Preferences**: Tracks genre preferences per mood
3. **Emotional Patterns**: Detects cycles dan trends
4. **Volatility Insights**: Identifies emotional stability

### Smart Recommendations
1. **Boots favorite moods**: Prioritizes genres user likes for their top mood
2. **Avoids repeats**: Filters movies already watched
3. **Diverse selections**: Balances variety dalam recommendations
4. **Context-aware**: Considers time-based patterns

---

## 💾 Data Persistence

### Local Storage Keys
- `mood_history_{userId}`: Stores up to 500 mood entries
- `iim_mood_stats_{userId}`: User mood statistics (legacy)

### Data Structure
```javascript
// Mood Entry
{
  mood: 'sedih',
  intensity: 0.75,           // 0-1 scale
  subEmotion: 'missing_person',
  timestamp: '2024-06-15T10:30:00Z'
}
```

---

## 🔌 Integration Points

### With Existing Systems

1. **Recommendation Service** (`src/services/recommendationService.js`)
   - Legacy system tetap berjalan
   - Enhanced engine complementary

2. **FilmCard Component**
   - Shows recommendation score
   - Displays reason untuk recommendation

3. **User Profile**
   - Integrates with Firestore user data
   - Tracks user history

4. **Analytics**
   - Logs mood selections
   - Tracks recommendation effectiveness

---

## 🎓 Example Usage Scenarios

### Scenario 1: User Merasa Sedih
```
1. User navigates to home
2. Clicks "🎭 Mulai Mood Journey"
3. Types: "Aku merasa sedih karena orang terdekatku jauh"
4. System detects:
   - Mood: sedih
   - Confidence: 94%
   - Intensity: 0.82
   - Sub-emotion: missing_person
5. User confirms selection
6. Gets 18 films cocok untuk sedih dengan sub-emotion "missing person"
7. Each film explained: "Mirip dengan film yang kamu suka" atau 
   "Sesuai dengan suasana hati mu"
```

### Scenario 2: User Mencari Inspirasi
```
1. User clicks mood selector
2. Types: "Aku ingin berubah jadi lebih baik dan lebih dekat dengan Allah"
3. System detects:
   - Mood: hidayah
   - Confidence: 88%
   - Intensity: 0.9
   - Sub-emotion: transformation
4. User selects intensity (kuat) + sub-emotion
5. Gets recommendations focused on:
   - Spiritual transformation
   - Islamic values
   - Inspirational stories
```

---

## 🚀 Future Enhancements

1. **Deep Learning Models**
   - LSTM untuk mood prediction
   - Transformer models untuk better NLP
   - Recommendation NN dengan multiple layers

2. **Advanced Analytics**
   - Emotion prediction models
   - Mood forecasting
   - Personalized wellness insights

3. **Social Features**
   - Similar users recommendations
   - Mood-based communities
   - Shared recommendations

4. **Real-time Adaptations**
   - A/B testing untuk scoring weights
   - Online learning dari user feedback
   - Dynamic adjustment

---

## 🐛 Troubleshooting

### Mood Detection Accuracy
- Ensure user input is clear
- System works best dengan full sentences
- Arabic keywords supported for Islamic terms

### Slow Recommendations
- First load might be slower due to embedding generation
- Subsequent recommendations cached
- Consider reducing movie corpus for testing

### Missing Moods
- Each movie harus punya `mood` field di data
- Run data validation sebelum production

---

## 📝 Files Created/Modified

### New Files:
1. `src/services/moodDetectionML.js` - ML mood detection
2. `src/services/neuralRecommendationEngine.js` - Neural recommendations
3. `src/components/EnhancedMoodSelector.jsx` - Enhanced UI modal
4. `src/pages/EnhancedMoodPage.jsx` - Enhanced mood page
5. `src/hooks/useMoodAnalytics.js` - Analytics hook

### Modified Files:
1. `src/main.jsx` - Added routes for enhanced mood

---

## 📞 Support

For issues or questions:
1. Check mood detection output via console
2. Verify movie data structure
3. Check Firestore connectivity
4. Review localStorage quota

---

**Version**: 1.0.0 Enhanced  
**Last Updated**: June 2024  
**Created for**: IIM React Application
