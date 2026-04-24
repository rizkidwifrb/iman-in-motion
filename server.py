# server.py - IMAN IN MOTION v3.2 (GEMINI LIVE)
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import os, re, time
from functools import lru_cache

# === GEMINI SETUP ===
try:
    import google.generativeai as genai
    GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or "AIzaSyD3Q8XTmExVvEN_OQHPnrK99dmWRTqhqS0"
    genai.configure(api_key=GEMINI_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Gemini connected")
except:
    gemini_model = None
    print("⚠️ Gemini not available")

app = Flask(__name__, static_folder='.') # FIX: serve dari root
CORS(app, resources={r"/api/*": {"origins": "*"}})

print("🚀 Loading dataset...")
df = pd.read_csv('df_processed.csv')
for col in ['title_asli','year','genres','poster_url','overview','rating','mood']:
    if col not in df.columns: df[col] = ''
df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0)
df['year'] = df['year'].astype(str).str[:4]
print(f"✅ Loaded {len(df)} films")

DALIL = {
    "sedih": {"arab":"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا","arti":"Maka sesungguhnya bersama kesulitan ada kemudahan.","surah":"QS. Al-Insyirah 94:5-6"},
    "gelisah": {"arab":"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ","arti":"Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.","surah":"QS. Ar-Ra'd 13:28"},
    "hidayah": {"arab":"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ","arti":"Tunjukilah kami jalan yang lurus.","surah":"QS. Al-Fatihah 1:6"},
    "bahagia": {"arab":"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ","arti":"Jika kamu bersyukur, niscaya Aku tambah nikmat.","surah":"QS. Ibrahim 14:7"},
    "marah": {"arab":"وَالْكَاظِمِينَ الْغَيْظَ","arti":"Orang yang menahan amarah.","surah":"QS. Ali Imran 3:134"},
    "rindu": {"arab":"وَجَعَلَ بَيْنَكُم مَّوَدَّةً","arti":"Dijadikan di antara kamu rasa kasih sayang.","surah":"QS. Ar-Rum 30:21"},
}

MOOD_MAP = {"sedih":"tenang","gelisah":"tenang","cemas":"tenang","bahagia":"semangat","senang":"semangat","marah":"inspiratif","rindu":"inspiratif","hidayah":"inspiratif"}

def normalize_mood(raw):
    if not raw: return "gelisah"
    return re.sub(r'[^a-z]', '', raw.lower()) or "gelisah"

@lru_cache(maxsize=64)
def get_recommendations(mood_raw, top_n=12):
    mood = normalize_mood(mood_raw)
    key = MOOD_MAP.get(mood, "tenang")
    f = df[df['mood'].str.lower() == key]
    if f.empty: f = df
    top = f.sort_values('rating', ascending=False).head(30)
    recs = top.sample(min(top_n, len(top)), random_state=int(time.time())//3600)
    return recs.to_dict('records')

def format_films(records):
    return [{"title":r['title_asli'],"title_asli":r['title_asli'],"year":r['year'],"genres":r['genres'],"poster":r['poster_url'],"poster_url":r['poster_url'],"overview":r['overview'],"rating":float(r['rating'] or 0),"mood":r['mood']} for r in records]

@app.route('/api/health')
def health(): return jsonify({"status":"ok","films":len(df),"gemini":bool(gemini_model)})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    msg = (data.get('message') or '').strip()
    mood = normalize_mood(msg)
    base = next((k for k in DALIL if k in mood), "gelisah")
    d = DALIL[base]
    films = get_recommendations(mood, 2)

    if gemini_model:
        prompt = f"""Kamu Asisten IMAN. User lagi {base}. Pesan: "{msg}".
Jawab dengan: 1) Ayat {d['surah']} "{d['arti']}", 2) nasihat singkat 2 kalimat, 3) rekomendasi film {films[0]['title_asli']}.
Bahasa santai Indonesia."""
        try:
            reply = gemini_model.generate_content(prompt).text
        except Exception as e:
            reply = f"{d['arab']}\n\"{d['arti']}\" — {d['surah']}\n\nUntuk hati {base}, sabar ya. 🎬 {films[0]['title_asli']}"
    else:
        reply = f"{d['arab']}\n\"{d['arti']}\" — {d['surah']}\n\n🎬 {films[0]['title_asli']}"

    return jsonify({"response": reply, "reply": reply, "dalil": d, "mood": base, "films": format_films(films)})

@app.route('/api/mood')
def mood_api():
    m = request.args.get('mood','gelisah')
    base = next((k for k in DALIL if k in normalize_mood(m)), "gelisah")
    return jsonify({"dalil": DALIL[base], "films": format_films(get_recommendations(m,12)), "mood": base})

@app.route('/')
def index(): return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve(path):
    return send_from_directory('.', path) if os.path.exists(path) else send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3002))
    app.run(host="0.0.0.0", port=port, debug=False)