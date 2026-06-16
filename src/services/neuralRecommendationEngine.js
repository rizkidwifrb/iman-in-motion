/**
 * Neural Network Recommendation Engine with Collaborative Filtering
 * - User-Movie interaction matrix
 * - Content-based filtering with embeddings
 * - Mood-aware collaborative filtering
 * - Personalization based on user history
 */

/**
 * Movie Embedding Vector Generator
 * Creates semantic vectors for movies based on multi-dimensional features
 */
class MovieEmbedding {
  constructor() {
    this.dimensionality = 32; // 32-dimensional embeddings
    this.features = [
      'mood', 'genres', 'year', 'rating', 'keywords', 'language', 'theme'
    ];
  }

  /**
   * Generate embedding for a movie
   * Combines multiple feature vectors
   */
  generateMovieEmbedding(movie, moodContext, allMovies) {
    const embedding = new Array(this.dimensionality).fill(0);
    
    // 1. Mood embedding (4 dimensions)
    const moodVector = this.encodeMoodVector(movie.mood, moodContext);
    embedding.splice(0, 4, ...moodVector);

    // 2. Genre embedding (8 dimensions) 
    const genreVector = this.encodeGenreVector(movie.genres, allMovies);
    embedding.splice(4, 8, ...genreVector);

    // 3. Rating embedding (2 dimensions)
    const ratingVector = this.encodeRatingVector(movie.rating, allMovies);
    embedding.splice(12, 2, ...ratingVector);

    // 4. Year/Recency embedding (4 dimensions)
    const yearVector = this.encodeYearVector(movie.year);
    embedding.splice(14, 4, ...yearVector);

    // 5. Keyword thematic embedding (8 dimensions)
    const keywordVector = this.encodeKeywordVector(movie.overview, allMovies);
    embedding.splice(18, 8, ...keywordVector);

    // 6. Popularity embedding (4 dimensions)
    const popularityVector = this.encodePopularityVector(movie.popularity || 0);
    embedding.splice(26, 4, ...popularityVector);

    return embedding;
  }

  /**
   * Encode mood as vector (one-hot + intensity)
   */
  encodeMoodVector(mood, moodContext) {
    const moods = ['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'];
    const vector = [0, 0, 0, 0];

    const moodIndex = moods.indexOf(mood);
    if (moodIndex !== -1) {
      // One-hot encoding
      vector[0] = moodIndex / moods.length; // Normalized mood index

      // Add intensity if available
      if (moodContext && moodContext.intensity) {
        vector[1] = moodContext.intensity;
      }

      // Add confidence
      if (moodContext && moodContext.confidence) {
        vector[2] = moodContext.confidence;
      }

      // Add sub-emotion influence
      if (moodContext && moodContext.subEmotion) {
        vector[3] = 0.8; // Higher weight if sub-emotion is specified
      }
    }

    return vector;
  }

  /**
   * Encode genres using TF-IDF-like weighting
   */
  encodeGenreVector(genresStr, allMovies) {
    const vector = new Array(8).fill(0);
    if (!genresStr) return vector;

    const genres = genresStr.split('|').map(g => g.trim());
    const genreFreq = {};

    // Calculate genre frequencies in corpus
    allMovies.forEach(m => {
      if (m.genres) {
        m.genres.split('|').forEach(g => {
          const genre = g.trim();
          genreFreq[genre] = (genreFreq[genre] || 0) + 1;
        });
      }
    });

    const totalMovies = allMovies.length;

    // Encode top 8 genres
    let genreIndex = 0;
    Object.entries(genreFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([genre, freq]) => {
        const score = genres.includes(genre) ? 1 - (Math.log(freq) / Math.log(totalMovies)) : 0;
        vector[genreIndex] = score;
        genreIndex++;
      });

    return vector;
  }

  /**
   * Encode rating as normalized vector
   */
  encodeRatingVector(rating, allMovies) {
    const minRating = allMovies.reduce((min, m) => Math.min(min, m.rating || 0), 10);
    const maxRating = allMovies.reduce((max, m) => Math.max(max, m.rating || 0), 0);

    const normalizedRating = (rating - minRating) / (maxRating - minRating || 1);
    const ratingConfidence = Math.min(rating / 10, 1); // Confidence based on rating value

    return [normalizedRating, ratingConfidence];
  }

  /**
   * Encode year/recency as vector
   */
  encodeYearVector(year) {
    const currentYear = new Date().getFullYear();
    const ageInYears = currentYear - year;
    
    // Recency score: recent movies get higher scores
    const recencyScore = 1 / (1 + Math.log(ageInYears + 1));
    
    // Decade encoding
    const decade = Math.floor(year / 10) * 10;
    const decadeNormalized = (decade - 1900) / 120;

    // Trend: movies older than 30 years get different treatment
    const isClassic = ageInYears > 30 ? 1 : 0;
    
    // Modern movies (last 10 years)
    const isModern = ageInYears <= 10 ? 1 : 0;

    return [recencyScore, decadeNormalized, isClassic, isModern];
  }

  /**
   * Extract keywords from overview and encode
   */
  encodeKeywordVector(overview, allMovies) {
    const vector = new Array(8).fill(0);
    if (!overview) return vector;

    // Simple keyword extraction
    const stopwords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'yang', 'dan', 'atau', 'ini', 'itu', 'di', 'ke', 'dari', 'dengan'
    ];

    const words = overview.toLowerCase().split(/\s+/);
    const keywordFreq = {};

    words
      .filter(w => w.length > 3 && !stopwords.includes(w))
      .forEach(word => {
        keywordFreq[word] = (keywordFreq[word] || 0) + 1;
      });

    // Get top keywords
    Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([keyword, freq], index) => {
        vector[index] = freq / words.length;
      });

    return vector;
  }

  /**
   * Encode popularity metric
   */
  encodePopularityVector(popularity) {
    // Log scale for popularity
    const logPopularity = Math.log(popularity + 1) / Math.log(1000);
    
    // Normalize to 0-1
    const normalizedPopularity = Math.min(1, logPopularity);
    
    // Trending indicator
    const isTrending = popularity > 100 ? 1 : 0;
    
    // Viral factor
    const viralFactor = Math.min(1, popularity / 500);

    return [normalizedPopularity, isTrending, viralFactor, 0];
  }
}

/**
 * Collaborative Filtering with User Preference Learning
 */
class CollaborativeFiltering {
  constructor(allMovies) {
    this.allMovies = allMovies;
    this.userProfiles = new Map(); // userId -> preference vector
    this.movieEmbedding = new MovieEmbedding();
  }

  /**
   * Update user profile based on interaction history
   */
  updateUserProfile(userId, interactions) {
    const userVector = new Array(32).fill(0);

    if (!interactions || interactions.length === 0) {
      this.userProfiles.set(userId, userVector);
      return;
    }

    // Weight recent interactions more heavily
    interactions.forEach((interaction, index) => {
      const recency = 1 - (index / Math.max(interactions.length, 1));
      const weight = recency * (interaction.rating || 3) / 10;

      // Get movie embedding
      const movieEmbed = this.movieEmbedding.generateMovieEmbedding(
        interaction.movie,
        interaction.moodContext,
        this.allMovies
      );

      // Add weighted movie embedding to user vector
      movieEmbed.forEach((val, i) => {
        userVector[i] += val * weight;
      });
    });

    // Normalize user vector
    const magnitude = Math.sqrt(userVector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      userVector.forEach((val, i) => {
        userVector[i] = val / magnitude;
      });
    }

    this.userProfiles.set(userId, userVector);
  }

  /**
   * Calculate similarity between two vectors (cosine similarity)
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Find similar users (for user-user collaborative filtering)
   */
  findSimilarUsers(userId, topK = 5) {
    const userVector = this.userProfiles.get(userId);
    if (!userVector) return [];

    const similarities = [];
    this.userProfiles.forEach((otherVector, otherUserId) => {
      if (otherUserId !== userId) {
        const sim = this.cosineSimilarity(userVector, otherVector);
        similarities.push({ userId: otherUserId, similarity: sim });
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Calculate item-item similarity for content-based recommendation
   */
  calculateItemSimilarity(movieId1, movieId2, moodContext) {
    const movie1 = this.allMovies.find(m => m.id === movieId1);
    const movie2 = this.allMovies.find(m => m.id === movieId2);

    if (!movie1 || !movie2) return 0;

    const embed1 = this.movieEmbedding.generateMovieEmbedding(movie1, moodContext, this.allMovies);
    const embed2 = this.movieEmbedding.generateMovieEmbedding(movie2, moodContext, this.allMovies);

    return this.cosineSimilarity(embed1, embed2);
  }
}

/**
 * Neural Network Recommender System
 */
class NeuralRecommender {
  constructor(allMovies) {
    this.allMovies = allMovies;
    this.collaborativeFiltering = new CollaborativeFiltering(allMovies);
    this.movieEmbedding = new MovieEmbedding();
  }

  /**
   * Hybrid recommendation combining multiple strategies
   */
  recommendMovies(userId, moodContext, userHistory = [], topK = 12) {
    const candidates = [];
    const seen = new Set(userHistory.map(m => m.id));

    // Strategy 1: Direct mood matching with intensity consideration
    const moodMatches = this.getMoodFilteredMovies(moodContext);
    candidates.push(
      ...moodMatches.map(movie => ({
        movie,
        scores: {
          mood_match: this.calculateMoodMatchScore(movie, moodContext),
          content: 0,
          collaborative: 0,
          personalized: 0,
          diversity: 0
        }
      }))
    );

    // Strategy 2: Content-based using embeddings
    const contentRecs = this.getContentBasedRecommendations(moodContext, userHistory, 5);
    contentRecs.forEach(({ movie, similarity }) => {
      const existing = candidates.find(c => c.movie.id === movie.id);
      if (existing) {
        existing.scores.content = similarity;
      } else {
        candidates.push({
          movie,
          scores: {
            mood_match: 0,
            content: similarity,
            collaborative: 0,
            personalized: 0,
            diversity: 0
          }
        });
      }
    });

    // Strategy 3: Collaborative filtering
    this.collaborativeFiltering.updateUserProfile(userId, userHistory);
    const collabRecs = this.getCollaborativeRecommendations(userId, 5);
    collabRecs.forEach(({ movie, score }) => {
      const existing = candidates.find(c => c.movie.id === movie.id);
      if (existing) {
        existing.scores.collaborative = score;
      } else {
        candidates.push({
          movie,
          scores: {
            mood_match: 0,
            content: 0,
            collaborative: score,
            personalized: 0,
            diversity: 0
          }
        });
      }
    });

    // Filter out already seen movies
    const filtered = candidates.filter(c => !seen.has(c.movie.id));

    // Add diversity score (genre variety)
    const selectedGenres = new Set();
    filtered.forEach(item => {
      item.scores.diversity = this.calculateDiversityScore(item.movie, selectedGenres);
    });

    // Add personalization bonus if user has strong mood preferences
    const userMoodPreferences = this.getUserMoodPreferences(userHistory);
    filtered.forEach(item => {
      if (userMoodPreferences[item.movie.mood]) {
        item.scores.personalized = userMoodPreferences[item.movie.mood];
      }
    });

    // Combine scores with weighted fusion
    filtered.forEach(item => {
      item.finalScore = (
        item.scores.mood_match * 0.40 +      // Mood match: 40%
        item.scores.content * 0.25 +          // Content similarity: 25%
        item.scores.collaborative * 0.15 +    // Collaborative: 15%
        item.scores.personalized * 0.15 +     // Personalization: 15%
        item.scores.diversity * 0.05           // Diversity: 5%
      );
    });

    // Sort by combined score and return top K
    return filtered
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK)
      .map(item => ({
        ...item.movie,
        recommendationScore: item.finalScore,
        scores: item.scores,
        reason: this.generateRecommendationReason(item, moodContext)
      }));
  }

  /**
   * Filter movies by mood with intensity consideration
   */
  getMoodFilteredMovies(moodContext) {
    if (!moodContext || !moodContext.mood) {
      return this.allMovies;
    }

    return this.allMovies.filter(movie => {
      // Direct mood match
      if (movie.mood === moodContext.mood) return true;

      // Allow similar moods if intensity is moderate
      if (moodContext.intensity > 0.7) {
        // For strong emotions, stick to exact mood
        return false;
      }

      // Allow some mood flexibility for low intensity
      const relatedMoods = {
        'sedih': ['rindu'],
        'gelisah': ['marah'],
        'hidayah': ['bahagia'],
        'bahagia': ['hidayah'],
        'marah': ['gelisah'],
        'rindu': ['sedih']
      };

      return relatedMoods[moodContext.mood]?.includes(movie.mood) || false;
    });
  }

  /**
   * Calculate mood match score with intensity
   */
  calculateMoodMatchScore(movie, moodContext) {
    if (!moodContext || !moodContext.mood) return 0.5;

    let score = 0;

    if (movie.mood === moodContext.mood) {
      score = 0.9; // Perfect match

      // Boost based on confidence
      score += (moodContext.confidence || 0) * 0.1;
      score = Math.min(1, score);
    } else if (moodContext.intensity < 0.5) {
      // For low intensity, allow slight mood variations
      const relatedMoods = {
        'sedih': ['rindu', 'gelisah'],
        'gelisah': ['sedih', 'marah'],
        'hidayah': ['bahagia'],
        'bahagia': ['hidayah'],
        'marah': ['gelisah', 'rindu'],
        'rindu': ['sedih', 'bahagia']
      };

      if (relatedMoods[moodContext.mood]?.includes(movie.mood)) {
        score = 0.6;
      }
    }

    return score;
  }

  /**
   * Content-based recommendations using embeddings
   */
  getContentBasedRecommendations(moodContext, userHistory, limit = 5) {
    if (userHistory.length === 0) {
      return this.allMovies.slice(0, limit).map(movie => ({
        movie,
        similarity: 0.5
      }));
    }

    // Create user preference embedding from history
    const userEmbedding = new Array(32).fill(0);
    userHistory.forEach(movie => {
      const movieEmbed = this.movieEmbedding.generateMovieEmbedding(
        movie,
        { mood: movie.mood },
        this.allMovies
      );
      movieEmbed.forEach((val, i) => {
        userEmbedding[i] += val;
      });
    });

    // Normalize
    const magnitude = Math.sqrt(userEmbedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      userEmbedding.forEach((val, i) => {
        userEmbedding[i] = val / magnitude;
      });
    }

    // Score all movies
    const scored = this.allMovies.map(movie => {
      const movieEmbed = this.movieEmbedding.generateMovieEmbedding(
        movie,
        moodContext,
        this.allMovies
      );
      const similarity = this.collaborativeFiltering.cosineSimilarity(
        userEmbedding,
        movieEmbed
      );

      return { movie, similarity };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Collaborative filtering recommendations
   */
  getCollaborativeRecommendations(userId, limit = 5) {
    const userVector = this.collaborativeFiltering.userProfiles.get(userId);
    if (!userVector) {
      return [];
    }

    const scored = this.allMovies.map(movie => {
      const movieEmbed = this.movieEmbedding.generateMovieEmbedding(
        movie,
        {},
        this.allMovies
      );
      const score = this.collaborativeFiltering.cosineSimilarity(userVector, movieEmbed);
      return { movie, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate diversity score to avoid genre saturation
   */
  calculateDiversityScore(movie, selectedGenres) {
    const genres = movie.genres.split('|').map(g => g.trim());
    let diversityScore = 1;

    genres.forEach(genre => {
      if (selectedGenres.has(genre)) {
        diversityScore *= 0.7; // Reduce diversity if genre already selected
      } else {
        selectedGenres.add(genre);
      }
    });

    return diversityScore;
  }

  /**
   * Extract user mood preferences from history
   */
  getUserMoodPreferences(userHistory) {
    const moodCounts = {};
    const moods = ['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'];

    moods.forEach(mood => {
      moodCounts[mood] = userHistory.filter(m => m.mood === mood).length;
    });

    const total = Math.max(userHistory.length, 1);
    const preferences = {};

    moods.forEach(mood => {
      preferences[mood] = moodCounts[mood] / total;
    });

    return preferences;
  }

  /**
   * Generate human-readable recommendation reason
   */
  generateRecommendationReason(item, moodContext) {
    const scores = item.scores;
    let reason = '';

    if (scores.mood_match > 0.7) {
      reason = `Sesuai dengan suasana hati mu (${moodContext.mood})`;
    } else if (scores.content > 0.7) {
      reason = `Mirip dengan film-film yang kamu suka`;
    } else if (scores.collaborative > 0.7) {
      reason = `Dinonton banyak orang dengan suasana hati serupa`;
    } else if (scores.personalized > 0.5) {
      reason = `Sesuai dengan preferensi mood mu`;
    } else {
      reason = `Rekomendasi terpilih untuk mu`;
    }

    return reason;
  }
}

export { NeuralRecommender, MovieEmbedding, CollaborativeFiltering };
export default NeuralRecommender;
