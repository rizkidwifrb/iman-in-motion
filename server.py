# ============================================================================
# IMAN IN MOTION - server.py v3.3
# Fitur: Gemini AI + Google Login (Firebase) + Film Recommender
# Author: Uwi Berani Project
# ============================================================================
from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
import pandas as pd
import os
import re
import time
import logging
from functools import lru_cache
from datetime import datetime

# ----------------------------------------------------------------------------
# 1. SETUP LOGGING
# ----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# 2. GEMINI AI SETUP
# ----------------------------------------------------------------------------
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.environ.get(
        "GEMINI_API_KEY",
        "AIzaSyCitLVg9NYEzdDRHB6F8bE-8OLqbJaph2M" # key dari lu
    )
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        generation_config={
            "temperature": 0.7,
            "top_p": 0.9,
            "max_output_tokens": 800,
        }
    )
    log.info("✅ Gemini connected (gemini-1.5-flash)")
except Exception as e:
    gemini_model = None
    log.error(f"⚠️ Gemini not available: {e}")

# ----------------------------------------------------------------------------
# 3. FIREBASE AUTH VERIFY
# ----------------------------------------------------------------------------
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as grequests
    FIREBASE_PROJECT_ID = "uwiberani-project"
    log.info("✅ Firebase verifier ready")
except Exception as e:
    id_token = None
    log.warning(f"Firebase verify disabled: {e}")

def verify_firebase_user():
    """
    Verifikasi Bearer token dari frontend.
    Return dict user info atau None.
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    if not id_token:
        return {"uid": "demo", "name": "Tamu", "email": ""}
    try:
        decoded = id_token.verify_firebase_token(
            token, grequests.Request()
        )
        if decoded.get('aud')!= FIREBASE_PROJECT_ID:
            return None
        return {
            "uid": decoded.get('user_id'),
            "name": decoded.get('name', 'Sahabat'),
            "email": decoded.get('email', ''),
            "picture": decoded.get('picture', '')
        }
    except Exception as e:
        log.warning(f"Token invalid: {e}")
        return None

# ----------------------------------------------------------------------------
# 4. FLASK APP
# ----------------------------------------------------------------------------
app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ----------------------------------------------------------------------------
# 5. LOAD DATASET
# ----------------------------------------------------------------------------
log.info("🚀 Loading dataset...")
required_cols = ['title_asli','year','genres','poster_url','overview','rating','mood']
try:
    df = pd.read_csv('df_processed.csv')
    # Pastikan kolom ada
    for col in required_cols:
        if col not in df.columns:
            df[col] = ''
    # Clean data
    df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0.0)
    df['year'] = df['year'].astype(str).str.extract(r'(\d{4})')[0].fillna('2020')
    df['mood'] = df['mood'].fillna('tenang').str.lower()
    df['genres'] = df['genres'].fillna('Drama')
    df['overview'] = df['overview'].fillna('Film Islami pilihan.')
    df['poster_url'] = df['poster_url'].fillna('')
    log.info(f"✅ Loaded {len(df)} films")
except Exception as e:
    log.error(f"Failed load CSV: {e}")
    df = pd.DataFrame(columns=required_cols)

# ----------------------------------------------------------------------------
# 6. DALIL & MOOD MAPPING
# ----------------------------------------------------------------------------
DALIL = {
    "sedih": {
        "arab": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
        "arti": "Maka sesungguhnya bersama kesulitan ada kemudahan.",
        "surah": "QS. Al-Insyirah 94:5-6",
        "nasihat": "Kesedihan adalah tanda hati masih hidup. Allah tidak pernah meninggalkanmu."
    },
    "gelisah": {
        "arab": "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        "arti": "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
        "surah": "QS. Ar-Ra'd 13:28",
        "nasihat": "Gelisah itu wajar. Tarik napas, sebut nama-Nya."
    },
    "hidayah": {
        "arab": "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        "arti": "Tunjukilah kami jalan yang lurus.",
        "surah": "QS. Al-Fatihah 1:6",
        "nasihat": "Hidayah dicari, bukan ditunggu. Satu langkahmu, Allah sambut."
    },
    "bahagia": {
        "arab": "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
        "arti": "Jika kamu bersyukur, niscaya Aku tambah nikmatmu.",
        "surah": "QS. Ibrahim 14:7",
        "nasihat": "Bahagia itu syukur yang diucapkan."
    },
    "marah": {
        "arab": "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ",
        "arti": "Dan orang-orang yang menahan amarah dan memaafkan manusia.",
        "surah": "QS. Ali Imran 3:134",
        "nasihat": "Marah 1 menit, rugi 60 detik tenang."
    },
    "rindu": {
        "arab": "وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
        "arti": "Dan Dia jadikan di antaramu rasa kasih dan sayang.",
        "surah": "QS. Ar-Rum 30:21",
        "nasihat": "Rindu yang baik diarahkan pada Allah dulu."
    },
}

MOOD_MAP = {
    "sedih": "tenang", "galau": "tenang", "gelisah": "tenang",
    "cemas": "tenang", "takut": "tenang", "stress": "tenang",
    "bahagia": "semangat", "senang": "semangat", "syukur": "semangat",
    "marah": "inspiratif", "kesal": "inspiratif",
    "rindu": "inspiratif", "kangen": "inspiratif",
    "hidayah": "inspiratif", "hijrah": "inspiratif", "taubat": "inspiratif"
}

def normalize_mood(text):
    if not text:
        return "gelisah"
    t = re.sub(r'[^a-z ]', '', text.lower())
    for key in MOOD_MAP:
        if key in t:
            return key
    return "gelisah"

# ----------------------------------------------------------------------------
# 7. RECOMMENDATION ENGINE
# ----------------------------------------------------------------------------
@lru_cache(maxsize=128)
def get_recommendations(mood_raw, top_n=12):
    mood_key = normalize_mood(mood_raw)
    target = MOOD_MAP.get(mood_key, "tenang")
    filtered = df[df['mood'] == target]
    if len(filtered) < top_n:
        filtered = df
    # random per jam biar tidak monoton
    seed = int(time.time() // 3600)
    sampled = filtered.sample(
        n=min(top_n, len(filtered)),
        random_state=seed
    ).sort_values('rating', ascending=False)
    return sampled.to_dict('records')

def format_films(records):
    out = []
    for r in records:
        out.append({
            "title": r.get('title_asli', ''),
            "title_asli": r.get('title_asli', ''),
            "year": str(r.get('year', '')),
            "genres": r.get('genres', ''),
            "poster": r.get('poster_url', ''),
            "poster_url": r.get('poster_url', ''),
            "overview": r.get('overview', ''),
            "rating": float(r.get('rating', 0)),
            "mood": r.get('mood', '')
        })
    return out

# ----------------------------------------------------------------------------
# 8. API ROUTES
# ----------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "films": len(df),
        "gemini": bool(gemini_model),
        "firebase": bool(id_token),
        "version": "3.3"
    })

@app.route('/api/login', methods=['POST'])
def api_login():
    """Frontend kirim idToken, kita verifikasi"""
    user = verify_firebase_user()
    if not user:
        return jsonify({"error": "Invalid token"}), 401
    log.info(f"[LOGIN] {user['email']}")
    return jsonify({"ok": True, "user": user})

@app.route('/api/chat', methods=['POST'])
def api_chat():
    start = time.time()
    user = verify_firebase_user()
    data = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()[:500]
    if not message:
        return jsonify({"error": "Pesan kosong"}), 400

    mood_raw = normalize_mood(message)
    base_mood = mood_raw if mood_raw in DALIL else "gelisah"
    dalil = DALIL[base_mood]
    films = get_recommendations(mood_raw, 2)
    user_name = user['name'] if user else "sahabat"

    # Prompt Gemini
    if gemini_model:
        system_prompt = f"""
Kamu adalah Asisten IMAN IN MOTION, sahabat Islami yang hangat.
User: {user_name}
Mood terdeteksi: {base_mood}
Pesan user: "{message}"

Tugas:
1. Sapa dengan nama.
2. Kutip dalil: {dalil['arab']} - "{dalil['arti']}" ({dalil['surah']})
3. Beri nasihat 2-3 kalimat sesuai mood, pakai bahasa Indonesia santai.
4. Rekomendasikan film: {films[0]['title_asli']} ({films[0]['year']}) - {films[0]['overview'][:120]}...
5. Tutup dengan doa singkat.

Jangan bertele-tele, maksimal 150 kata.
"""
        try:
            resp = gemini_model.generate_content(system_prompt)
            reply_text = resp.text.strip()
        except Exception as e:
            log.error(f"Gemini error: {e}")
            reply_text = f"{dalil['arab']}\n\"{dalil['arti']}\" — {dalil['surah']}\n\n{dalil['nasihat']}"
    else:
        reply_text = f"{dalil['arab']}\n\"{dalil['arti']}\" — {dalil['surah']}"

    duration = round(time.time() - start, 2)
    log.info(f"[CHAT] user={user_name} mood={base_mood} ({duration}s)")

    return jsonify({
        "response": reply_text,
        "reply": reply_text, # backward compatibility
        "dalil": dalil,
        "mood": base_mood,
        "films": format_films(films),
        "user": user,
        "took": duration
    })

@app.route('/api/mood', methods=['GET'])
def api_mood():
    mood_q = request.args.get('mood', 'gelisah')
    base = normalize_mood(mood_q)
    dalil = DALIL.get(base, DALIL['gelisah'])
    films = get_recommendations(mood_q, 12)
    return jsonify({
        "mood": base,
        "dalil": dalil,
        "films": format_films(films)
    })

@app.route('/api/films', methods=['GET'])
def api_films():
    mood_q = request.args.get('mood')
    limit = int(request.args.get('limit', 20))
    if mood_q:
        films = get_recommendations(mood_q, limit)
    else:
        films = df.sample(min(limit, len(df))).to_dict('records')
    return jsonify({"films": format_films(films), "total": len(films)})

# ----------------------------------------------------------------------------
# 9. STATIC FILES (Frontend)
# ----------------------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        abort(404)
    file_path = os.path.join('public', path)
    if os.path.isfile(file_path):
        return send_from_directory('public', path)
    return send_from_directory('public', 'index.html')

# ----------------------------------------------------------------------------
# 10. ERROR HANDLERS
# ----------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Endpoint tidak ditemukan"}), 404
    return serve_index()

@app.errorhandler(500)
def server_error(e):
    log.exception("Internal error")
    return jsonify({"error": "Server error"}), 500

# ----------------------------------------------------------------------------
# 11. RUN
# ----------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3002))
    log.info(f"🌐 Server ready at http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)