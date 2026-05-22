#!/usr/bin/env python3
"""
Add direct YouTube trailer URLs to IMAN IN MOTION movie data using TMDB videos API.

Usage:
  set TMDB_API_KEY=your_key
  python scripts/add_trailer_urls.py --csv df_processed.csv --src src/data/movies.js --public public/js/movies.js

This script writes direct YouTube watch URLs, for example:
  https://www.youtube.com/watch?v=VIDEO_KEY
It never writes YouTube search URLs.
"""
import argparse
import csv
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

YOUTUBE_WATCH = "https://www.youtube.com/watch?v={}"
YOUTUBE_EMBED = "https://www.youtube.com/embed/{}"


def get_json(url, headers=None):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def tmdb_videos(tmdb_id, api_key, bearer_token):
    if not tmdb_id:
        return []
    if api_key:
        url = f"https://api.themoviedb.org/3/movie/{urllib.parse.quote(str(tmdb_id))}/videos?api_key={urllib.parse.quote(api_key)}"
        headers = {}
    else:
        url = f"https://api.themoviedb.org/3/movie/{urllib.parse.quote(str(tmdb_id))}/videos"
        headers = {"Authorization": f"Bearer {bearer_token}"}
    data = get_json(url, headers=headers)
    return data.get("results", []) if isinstance(data, dict) else []


def trailer_score(video):
    name = str(video.get("name") or "").lower()
    typ = str(video.get("type") or "").lower()
    score = 0
    if str(video.get("site") or "").lower() == "youtube":
        score += 100
    if typ == "trailer":
        score += 90
    if typ == "teaser":
        score += 35
    if video.get("official") is True:
        score += 25
    if "official" in name:
        score += 20
    if "trailer" in name:
        score += 20
    if "teaser" in name:
        score += 6
    return score


def pick_trailer(videos):
    youtube = [v for v in videos if str(v.get("site") or "").lower() == "youtube" and v.get("key")]
    if not youtube:
        return None
    return sorted(youtube, key=trailer_score, reverse=True)[0]


def read_csv_movies(path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows, reader.fieldnames or []


def write_csv_movies(path, rows, fieldnames):
    for field in ["trailer_url", "trailer_embed_url", "trailer_key", "trailer_name"]:
        if field not in fieldnames:
            fieldnames.append(field)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def load_js_array(path, prefix):
    text = Path(path).read_text(encoding="utf-8")
    text = text.strip()
    if prefix == "export":
        text = text.replace("export const movies = ", "").replace("export default movies;", "").strip().rstrip(";")
    elif prefix == "window":
        text = text.replace("window.MOVIES_DATA = ", "").strip().rstrip(";")
    return json.loads(text)


def write_js_array(path, data, prefix):
    if prefix == "export":
        content = "export const movies = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\nexport default movies;\n"
    else:
        content = "window.MOVIES_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    Path(path).write_text(content, encoding="utf-8")


def key_for(row):
    title = str(row.get("title_asli") or row.get("title") or row.get("title_en") or "").strip().lower()
    year = str(row.get("year") or "").strip()
    return (title, year)


def apply_to_js(path, prefix, by_key, by_tmdb):
    if not path or not Path(path).exists():
        return 0, 0
    data = load_js_array(path, prefix)
    total = 0
    with_url = 0
    for movie in data:
        tmdb = str(movie.get("tmdbId") or movie.get("tmdb_id") or movie.get("tmdb") or "").strip()
        info = by_tmdb.get(tmdb) if tmdb else None
        if not info:
            info = by_key.get(key_for(movie))
        if info:
            movie["tmdbId"] = info.get("tmdbId") or tmdb
            movie["trailer_url"] = info.get("trailer_url", "")
            movie["trailer_embed_url"] = info.get("trailer_embed_url", "")
            movie["trailer_key"] = info.get("trailer_key", "")
            movie["trailer_name"] = info.get("trailer_name", "")
            if movie["trailer_url"]:
                with_url += 1
        else:
            movie.setdefault("trailer_url", "")
        total += 1
    write_js_array(path, data, prefix)
    return total, with_url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="df_processed.csv")
    parser.add_argument("--src", default="src/data/movies.js")
    parser.add_argument("--public", default="public/js/movies.js")
    parser.add_argument("--sleep", type=float, default=0.12)
    args = parser.parse_args()

    api_key = os.getenv("TMDB_API_KEY", "").strip()
    bearer_token = os.getenv("TMDB_BEARER_TOKEN", "").strip() or os.getenv("TMDB_READ_TOKEN", "").strip()
    if not api_key and not bearer_token:
        raise SystemExit("Set TMDB_API_KEY, TMDB_BEARER_TOKEN, atau TMDB_READ_TOKEN dulu, biar bisa ambil direct trailer dari TMDB.")

    rows, fieldnames = read_csv_movies(args.csv)
    resolved = 0
    failed = 0
    for index, row in enumerate(rows, start=1):
        if row.get("trailer_url"):
            resolved += 1
            continue
        tmdb_id = str(row.get("tmdbId") or row.get("tmdb_id") or row.get("tmdb") or "").strip()
        if not tmdb_id:
            failed += 1
            continue
        try:
            trailer = pick_trailer(tmdb_videos(tmdb_id, api_key, bearer_token))
            if trailer:
                key = trailer["key"]
                row["trailer_url"] = YOUTUBE_WATCH.format(key)
                row["trailer_embed_url"] = YOUTUBE_EMBED.format(key)
                row["trailer_key"] = key
                row["trailer_name"] = trailer.get("name") or "Official Trailer"
                resolved += 1
            else:
                failed += 1
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            failed += 1
            print(f"[WARN] gagal {tmdb_id} {row.get('title_asli')}: {exc}")
        if index % 25 == 0:
            print(f"progress {index}/{len(rows)} | resolved={resolved} failed={failed}")
        time.sleep(args.sleep)

    write_csv_movies(args.csv, rows, fieldnames)
    by_key = {key_for(row): row for row in rows}
    by_tmdb = {str(row.get("tmdbId") or "").strip(): row for row in rows if row.get("tmdbId")}
    src_total, src_urls = apply_to_js(args.src, "export", by_key, by_tmdb)
    public_total, public_urls = apply_to_js(args.public, "window", by_key, by_tmdb)
    print(f"Done. CSV resolved={resolved}/{len(rows)} failed={failed}")
    print(f"src/data/movies.js trailer_url={src_urls}/{src_total}")
    print(f"public/js/movies.js trailer_url={public_urls}/{public_total}")


if __name__ == "__main__":
    main()
