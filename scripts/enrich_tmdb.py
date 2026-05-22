#!/usr/bin/env python3
"""
Enrich IMAN IN MOTION movie data from TMDB using tmdbId.

Updates:
- rating from TMDB vote_average
- vote_count from TMDB vote_count
- rating_source = TMDB when valid
- rating_updated_at = current date
- keeps fallback/original rating when TMDB has no useful rating
- can also keep existing trailer fields intact

Usage Windows PowerShell:
  $env:TMDB_API_KEY="your_key"
  python scripts/enrich_tmdb.py --csv df_processed.csv --src src/data/movies.js --public public/js/movies.js

Usage CMD:
  set TMDB_API_KEY=your_key
  npm run ratings

Railway:
  Add TMDB_API_KEY or TMDB_READ_TOKEN/TMDB_BEARER_TOKEN to Variables.
"""
import argparse
import csv
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

DETAIL_FIELDS = [
    "rating",
    "vote_count",
    "rating_source",
    "rating_updated_at",
    "tmdb_vote_average",
    "tmdb_popularity",
    "tmdb_status",
]


def get_json(url, headers=None):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def tmdb_detail(tmdb_id, api_key, bearer_token):
    if not tmdb_id:
        return None
    if api_key:
        url = f"https://api.themoviedb.org/3/movie/{urllib.parse.quote(str(tmdb_id))}?api_key={urllib.parse.quote(api_key)}&language=en-US"
        headers = {}
    else:
        url = f"https://api.themoviedb.org/3/movie/{urllib.parse.quote(str(tmdb_id))}?language=en-US"
        headers = {"Authorization": f"Bearer {bearer_token}", "accept": "application/json"}
    data = get_json(url, headers=headers)
    return data if isinstance(data, dict) else None


def read_csv_movies(path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows, list(reader.fieldnames or [])


def write_csv_movies(path, rows, fieldnames):
    for field in DETAIL_FIELDS:
        if field not in fieldnames:
            fieldnames.append(field)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def load_js_array(path, prefix):
    text = Path(path).read_text(encoding="utf-8").strip()
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


def to_number(value, fallback=0.0):
    try:
        if value in (None, ""):
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def to_int(value, fallback=0):
    try:
        if value in (None, ""):
            return fallback
        return int(float(value))
    except (TypeError, ValueError):
        return fallback


def apply_rating(row, detail, today):
    old_rating = to_number(row.get("rating"), 0.0)
    if not detail:
        row.setdefault("rating_source", "fallback")
        return False

    vote_average = round(to_number(detail.get("vote_average"), 0.0), 1)
    vote_count = to_int(detail.get("vote_count"), 0)

    row["tmdb_vote_average"] = str(vote_average) if vote_average else ""
    row["tmdb_popularity"] = str(round(to_number(detail.get("popularity"), 0.0), 3)) if detail.get("popularity") is not None else ""
    row["tmdb_status"] = str(detail.get("status") or "")
    row["vote_count"] = str(vote_count)
    row["rating_updated_at"] = today

    # TMDB can return 0.0 for unrated titles. Do not overwrite a non-zero fallback with zero.
    if vote_average > 0:
        row["rating"] = str(vote_average)
        row["rating_source"] = "TMDB"
        return True

    row["rating"] = str(old_rating) if old_rating else "0"
    row["rating_source"] = "fallback" if old_rating else "unrated"
    return False


def apply_to_js(path, prefix, by_key, by_tmdb):
    if not path or not Path(path).exists():
        return 0, 0
    data = load_js_array(path, prefix)
    total = 0
    updated = 0
    for movie in data:
        tmdb = str(movie.get("tmdbId") or movie.get("tmdb_id") or movie.get("tmdb") or "").strip()
        info = by_tmdb.get(tmdb) if tmdb else None
        if not info:
            info = by_key.get(key_for(movie))
        if info:
            movie["tmdbId"] = info.get("tmdbId") or info.get("tmdb_id") or movie.get("tmdbId") or ""
            for field in DETAIL_FIELDS:
                value = info.get(field)
                if value not in (None, ""):
                    if field in {"rating", "tmdb_vote_average", "tmdb_popularity"}:
                        movie[field] = to_number(value)
                    elif field == "vote_count":
                        movie[field] = to_int(value)
                    else:
                        movie[field] = value
            if str(info.get("rating_source") or "").upper() == "TMDB":
                updated += 1
        total += 1
    write_js_array(path, data, prefix)
    return total, updated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="df_processed.csv")
    parser.add_argument("--src", default="src/data/movies.js")
    parser.add_argument("--public", default="public/js/movies.js")
    parser.add_argument("--sleep", type=float, default=0.12)
    parser.add_argument("--force", action="store_true", help="refresh even if rating_source is already TMDB")
    args = parser.parse_args()

    api_key = os.getenv("TMDB_API_KEY", "").strip()
    bearer_token = os.getenv("TMDB_BEARER_TOKEN", "").strip() or os.getenv("TMDB_READ_TOKEN", "").strip()
    if not api_key and not bearer_token:
        raise SystemExit("Set TMDB_API_KEY, TMDB_BEARER_TOKEN, atau TMDB_READ_TOKEN dulu, biar rating bisa diambil dari TMDB.")

    rows, fieldnames = read_csv_movies(args.csv)
    today = date.today().isoformat()
    updated = 0
    skipped = 0
    failed = 0

    for index, row in enumerate(rows, start=1):
        tmdb_id = str(row.get("tmdbId") or row.get("tmdb_id") or row.get("tmdb") or "").strip()
        if not tmdb_id:
            failed += 1
            continue
        if not args.force and str(row.get("rating_source") or "").upper() == "TMDB" and row.get("vote_count"):
            skipped += 1
            continue
        try:
            detail = tmdb_detail(tmdb_id, api_key, bearer_token)
            if apply_rating(row, detail, today):
                updated += 1
            else:
                failed += 1
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            failed += 1
            print(f"[WARN] gagal rating TMDB {tmdb_id} {row.get('title_asli')}: {exc}")
        if index % 25 == 0:
            print(f"progress {index}/{len(rows)} | updated={updated} skipped={skipped} failed={failed}")
        time.sleep(args.sleep)

    write_csv_movies(args.csv, rows, fieldnames)
    by_key = {key_for(row): row for row in rows}
    by_tmdb = {str(row.get("tmdbId") or row.get("tmdb_id") or row.get("tmdb") or "").strip(): row for row in rows if row.get("tmdbId") or row.get("tmdb_id") or row.get("tmdb")}
    src_total, src_updated = apply_to_js(args.src, "export", by_key, by_tmdb)
    public_total, public_updated = apply_to_js(args.public, "window", by_key, by_tmdb)

    print(f"Done. CSV TMDB rating updated={updated}/{len(rows)} skipped={skipped} failed_or_unrated={failed}")
    print(f"src/data/movies.js rating_source=TMDB {src_updated}/{src_total}")
    print(f"public/js/movies.js rating_source=TMDB {public_updated}/{public_total}")


if __name__ == "__main__":
    main()
