/**
 * Enhanced Mood Selector Component
 * - Interactive mood cards with depth
 * - Mood intensity slider
 * - Real-time mood detection from text input
 * - Beautiful Glassmorphism design
 */

import React, { useState, useRef, useEffect } from 'react';
import { detectMoodML, getEmotionalContext } from '../services/moodDetectionML';

const EnhancedMoodSelector = ({ 
  onMoodSelect, 
  onClose, 
  userInput = '',
  isLoading = false 
}) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(0.5);
  const [detectedMood, setDetectedMood] = useState(null);
  const [textInput, setTextInput] = useState(userInput);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef(null);
  const [subEmotionInput, setSubEmotionInput] = useState('');

  const moods = [
    {
      id: 'sedih',
      label: 'Sedih',
      icon: '💔',
      color: '#8B4789',
      color2: '#D8A5D8',
      gradient: 'from-purple-600 to-pink-500',
      description: 'Merasa duka, kehilangan, atau kecewa',
      islamicMsg: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَة',
      subEmotions: ['Hati yang lelah', 'Kesedihan', 'Kekecewaan', 'Merasa hilang', 'Patah hati', 'Nostalgia']
    },
    {
      id: 'gelisah',
      label: 'Gelisah',
      icon: '😰',
      color: '#E74C3C',
      color2: '#F5B7B1',
      gradient: 'from-red-500 to-orange-400',
      description: 'Cemas, khawatir, atau overthinking',
      islamicMsg: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      subEmotions: ['Overthinking', 'Takut', 'Ketidakpastian', 'Tekanan', 'Kebingungan', 'Panik']
    },
    {
      id: 'hidayah',
      label: 'Hidayah',
      icon: '✨',
      color: '#27AE60',
      color2: '#A9DFBF',
      gradient: 'from-green-500 to-emerald-400',
      description: 'Mencari inspirasi, ingin berubah, spiritual',
      islamicMsg: 'وَاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      subEmotions: ['Mencari makna', 'Motivasi', 'Perubahan', 'Transformasi', 'Kebangkitan', 'Tujuan hidup']
    },
    {
      id: 'bahagia',
      label: 'Bahagia',
      icon: '😊',
      color: '#F39C12',
      color2: '#F8D7A1',
      gradient: 'from-yellow-400 to-orange-300',
      description: 'Gembira, senang, atau bersyukur',
      islamicMsg: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      subEmotions: ['Kegembiraan', 'Syukuran', 'Perayaan', 'Kepuasan', 'Kebanggaan', 'Lega']
    },
    {
      id: 'marah',
      label: 'Marah',
      icon: '😠',
      color: '#C0392B',
      color2: '#F1948A',
      gradient: 'from-red-700 to-red-500',
      description: 'Kesal, geram, atau emosi tinggi',
      islamicMsg: 'لَا يَغْضَبُ إِلَّا لِلَّهِ',
      subEmotions: ['Frustasi', 'Dendam', 'Kebencian', 'Iritasi', 'Pengkhianatan', 'Ketidakadilan']
    },
    {
      id: 'rindu',
      label: 'Rindu',
      icon: '🌙',
      color: '#2C3E50',
      color2: '#A6B8C7',
      gradient: 'from-slate-700 to-slate-500',
      description: 'Kangen, nostalgia, atau kesepian',
      islamicMsg: 'يَا أَيُّهَا الْقَلْبُ لَا تَنْسَ',
      subEmotions: ['Merindu orang', 'Homesick', 'Nostalgia', 'Kesepian', 'Perpisahan', 'Mengingat']
    }
  ];

  // Real-time mood detection
  useEffect(() => {
    if (textInput.trim()) {
      const detected = detectMoodML(textInput);
      setDetectedMood(detected);
      
      // Auto-select detected mood if confidence is high
      if (detected.confidence > 0.6) {
        setSelectedMood(detected.mood);
        setIntensity(detected.intensity);
        setSubEmotionInput(detected.subEmotion || '');
      }
    }
  }, [textInput]);

  const handleMoodSelect = (moodId) => {
    setSelectedMood(moodId);
  };

  const handleSubmit = () => {
    if (!selectedMood) {
      alert('Pilih suasana hati terlebih dahulu');
      return;
    }

    const moodContext = {
      mood: selectedMood,
      intensity: intensity,
      subEmotion: subEmotionInput,
      userText: textInput,
      detectionConfidence: detectedMood?.confidence || 0
    };

    onMoodSelect(moodContext);
  };

  const selectedMoodData = moods.find(m => m.id === selectedMood);
  const autoDetectedMood = detectedMood?.mood;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Apa Suasana Hatimu?</h2>
              <p className="text-blue-100 mt-1">Jelaskan perasaanmu untuk rekomendasi terbaik</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Text Input with Real-time Detection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Ceritakan perasaanmu (opsional)
            </label>
            <textarea
              ref={inputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Misal: 'Aku merasa sedih karena kehilangan sesuatu yang berharga' atau 'Aku gelisah dan overthinking tentang masa depan'"
              className="w-full h-24 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition"
            />
            {detectedMood && detectedMood.confidence > 0.3 && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <span>✓</span>
                <span>
                  Terdeteksi: <strong>{moods.find(m => m.id === detectedMood.mood)?.label}</strong>
                  {' '}({(detectedMood.confidence * 100).toFixed(0)}% keyakinan)
                </span>
              </div>
            )}
          </div>

          {/* Mood Selection Grid */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Pilih Suasana Hati
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {moods.map((mood) => {
                const isSelected = selectedMood === mood.id;
                const autoDetected = autoDetectedMood === mood.id;

                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? `bg-gradient-to-br ${mood.gradient} text-white shadow-lg scale-105`
                        : 'bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-150 to-gray-100 border-2 border-gray-200'
                    }`}
                    style={{
                      border: autoDetected && !isSelected ? `2px dashed ${mood.color}` : undefined
                    }}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative z-10 text-center">
                      <div className="text-3xl mb-2">{mood.icon}</div>
                      <div className="font-bold text-sm">{mood.label}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                        {mood.description}
                      </div>

                      {/* Check mark for selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                          ✓
                        </div>
                      )}

                      {/* Auto-detected badge */}
                      {autoDetected && !isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-300 rounded-full flex items-center justify-center text-xs">
                          🎯
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          {selectedMood && (
            <div className="space-y-3 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Intensitas Perasaan
                </label>
                <div className="text-2xl">
                  {intensity < 0.33 ? '🙁' : intensity < 0.66 ? '😐' : '😔'}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #FCD34D 0%, 
                    #FB923C 50%, 
                    #EF4444 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Ringan</span>
                <span>Sedang</span>
                <span>Kuat</span>
              </div>
            </div>
          )}

          {/* Sub-emotion Selection */}
          {selectedMood && selectedMoodData && (
            <div className="space-y-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700">
                Jenis Perasaan Lebih Spesifik (opsional)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMoodData.subEmotions.map((subEmotion) => (
                  <button
                    key={subEmotion}
                    onClick={() => setSubEmotionInput(
                      subEmotionInput === subEmotion ? '' : subEmotion
                    )}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      subEmotionInput === subEmotion
                        ? `bg-gradient-to-r ${selectedMoodData.gradient} text-white`
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {subEmotion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Islamic Reference */}
          {selectedMood && selectedMoodData && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-l-4 border-amber-500">
              <p className="text-sm text-gray-600 mb-2">Pesan Islami:</p>
              <p className="text-lg text-amber-900 font-semibold italic mb-2">
                {selectedMoodData.islamicMsg}
              </p>
              <p className="text-xs text-gray-600">
                💡 Ingat selalu untuk bersabar, mempercayai rencana Allah, dan mencari hikmah dari setiap perasaan.
              </p>
            </div>
          )}

          {/* Detection Info */}
          {detectedMood && detectedMood.confidence > 0.3 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="flex items-center justify-between text-sm font-semibold text-blue-700">
                <span>Deteksi AI: Lihat detail analisis</span>
                <span>{showDetails ? '▼' : '▶'}</span>
              </div>
              {showDetails && (
                <div className="mt-3 space-y-2 text-xs text-gray-600">
                  <div>
                    Mood Terdeteksi: <strong>{moods.find(m => m.id === detectedMood.mood)?.label}</strong>
                  </div>
                  <div>
                    Keyakinan: <strong>{(detectedMood.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    Intensitas: <strong>{(detectedMood.intensity * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    Kata Kunci: <strong>{detectedMood.keywords?.slice(0, 3).join(', ') || 'N/A'}</strong>
                  </div>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Footer / Action Buttons */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-100 to-transparent p-6 flex gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition"
          >
            Batalkan
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMood || isLoading}
            className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition ${
              selectedMood && !isLoading
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Memproses...' : 'Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMoodSelector;
