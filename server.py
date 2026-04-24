# server.py - IMAN IN MOTION v3 (PRODUCTION READY)
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import os, re, time
from functools import lru_cache

app = Flask(__name__, static_folder='public')
CORS(app, resources={r"/api/*": {"origins": "*"}})

print("🚀 Loading dataset...")
DF_PATH = 'df_processed.csv'
df = pd.read_csv(DF_PATH)

# Pastikan kolom ada
for col in ['title_asli','year','genres','poster_url','overview','rating','mood']:
    if col not in df.columns:
        df[col] = ''

df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0)
df['year'] = df['year'].astype(str).str[:4]
print(f"✅ Loaded {len(df)} films")

# === DALIL DATABASE ===
DALIL = {
    "sedih": {"arab":"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا","arti":"Maka sesungguhnya bersama kesulitan ada kemudahan.","surah":"QS. Al-Insyirah 94:5-6"},
    "gelisah": {"arab":"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ","arti":"Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.","surah":"QS. Ar-Ra'd 13:28"},
    "hidayah": {"arab":"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ","arti":"Tunjukilah kami jalan yang lurus.","surah":"QS. Al-Fatihah 1:6"},
    "bahagia": {"arab":"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ","arti":"Sesungguhnya jika kamu bersyukur, niscaya Aku akan menambah nikmat kepadamu.","surah":"QS. Ibrahim 14:7"},
    "marah": {"arab":"وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ","arti":"Dan orang-orang yang menahan amarahnya dan memaafkan kesalahan orang lain.","surah":"QS. Ali Imran 3:134"},
    "rindu": {"arab":"وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً","arti":"Dan dijadikan di antara kamu rasa kasih dan sayang.","surah":"QS. Ar-Rum 30:21"},
}

MOOD_MAP = {
    "sedih":"tenang", "sedihbanget":"tenang", "down":"tenang", "galau":"tenang",
    "gelisah":"tenang", "cemas":"tenang", "anxiety":"tenang", "takut":"tenang", "waswas":"tenang", "hampa":"tenang",
    "tenang":"tenang",
    "bahagia":"semangat", "senang":"semangat", "syukur":"semangat", "happy":"semangat", "semangat":"semangat",
    "marah":"inspiratif", "kesal":"inspiratif", "emosi":"inspiratif",
    "rindu":"inspiratif", "kangen":"inspiratif", "cinta":"inspiratif",
    "hidayah":"inspiratif", "hijrah":"inspiratif", "tobat":"inspiratif", "mencarihidayah":"inspiratif", "islam":"inspiratif"
}

def normalize_mood(raw):
    if not raw: return "gelisah"
    m = raw.lower()
    m = re.sub(r'[^a-z]', '', m) # hapus spasi & simbol
    m = m.replace('mencari', '')
    return m if m else "gelisah"

@lru_cache(maxsize=64)
def get_recommendations(mood_raw, top_n=12):
    mood = normalize_mood(mood_raw)
    mood_key = MOOD_MAP.get(mood, "tenang")

    filtered = df[df['mood'].str.lower() == mood_key]
    if filtered.empty:
        filtered = df

    # Sort by rating, lalu randomize top 30 biar tidak monoton
    top = filtered.sort_values('rating', ascending=False).head(30)
    recs = top.sample(min(top_n, len(top)), random_state=int(time.time())//3600)

    return recs[['title_asli','year','genres','poster_url','overview','rating','mood']].fillna('').to_dict('records')

def format_films(records):
    out = []
    for r in records:
        out.append({
            "title": r['title_asli'],
            "title_asli": r['title_asli'],
            "year": r['year'],
            "genres": r['genres'],
            "poster": r['poster_url'],
            "poster_url": r['poster_url'],
            "overview": r['overview'],
            "rating": float(r['rating']) if r['rating'] else 0,
            "mood": r['mood']
        })
    return out

# === API ROUTES ===

@app.route('/api/health')
def health():
    return jsonify({"status":"ok", "films": len(df), "time": int(time.time())})

@app.route('/api/chat', methods=['POST'])
def chat():
    start = time.time()
    data = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()
    mood_raw = data.get('mood') or message

    mood = normalize_mood(mood_raw)
    base_mood = next((k for k in DALIL if k in mood), None)
    if not base_mood:
        # cari di MOOD_MAP
        for k in DALIL:
            if k in mood: base_mood = k; break
    base_mood = base_mood or "gelisah"

    d = DALIL[base_mood]
    films = get_recommendations(mood, 1)
    film = films[0] if films else {"title_asli":"Ayat-Ayat Cinta"}

    # Reply natural
    reply = f"{d['arab']}\n\"{d['arti']}\" — {d['surah']}\n\n💡 Untuk hati yang {base_mood}, ingatlah Allah selalu dekat.\n🎬 Rekomendasi: {film['title_asli']}"

    print(f"[CHAT] mood={mood} -> {base_mood} ({time.time()-start:.2f}s)")

    return jsonify({
        "reply": reply,
        "dalil": {
            "arab": d['arab'],
            "arti": d['arti'],
            "surah": d['surah'],
            "sumber": d['surah'] # untuk kompatibilitas frontend
        },
        "mood": base_mood,
        "film": film['title_asli'],
        "films": format_films(films)
    })

@app.route('/api/mood')
def mood_api():
    mood_raw = request.args.get('mood', 'gelisah')
    mood = normalize_mood(mood_raw)
    base = next((k for k in DALIL if k in mood), "gelisah")
    d = DALIL.get(base, DALIL['gelisah'])
    films = format_films(get_recommendations(mood, 12))

    return jsonify({
        "dalil": {**d, "sumber": d['surah']},
        "films": films,
        "mood": base,
        "count": len(films)
    })

@app.route('/api/search')
def search_api():
    q = request.args.get('q', '').lower()
    if not q or len(q) < 2:
        return jsonify({"films": []})

    mask = df['title_asli'].str.lower().str.contains(q, na=False) | df['overview'].str.lower().str.contains(q, na=False)
    res = df[mask].sort_values('rating', ascending=False).head(20)
    return jsonify({"films": format_films(res.to_dict('records')), "query": q})

@app.route('/api/movies')
def movies_api():
    mood = request.args.get('mood')
    limit = int(request.args.get('limit', 24))
    if mood:
        films = get_recommendations(mood, limit)
    else:
        films = df.sample(min(limit, len(df))).to_dict('records')
    return jsonify({"films": format_films(films)})

# === STATIC FILES ===
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        return jsonify({"error":"Not found"}), 404
    full = os.path.join(app.static_folder, path)
    if path and os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# === ERROR HANDLERS ===
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error":"Endpoint tidak ditemukan"}), 404

@app.errorhandler(500)
def server_error(e):
    print(f"ERROR: {e}")
    return jsonify({"error":"Server error"}), 500

if __name__ == '__main__':
    print("🌐 Server ready at http://0.0.0.0:3002")
    print("Endpoints: /api/chat, /api/mood, /api/search, /api/movies, /api/health")
    app.run(host="0.0.0.0", port=3002, debug=True, threaded=True)