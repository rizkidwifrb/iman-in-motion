#include <algorithm>
#include <cmath>
#include <cctype>
#include <fstream>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

struct Film {
  std::string tmdbId, title, title_en, year, genres, cast, poster, overview;
  std::string rating_source, rating_updated_at, mood, trailer_url, reason;
  double rating = 0.0;
  double tmdb_vote_average = 0.0;
  double score = 0.0;
  int vote_count = 0;
};

static std::set<std::string> stopwords = {
  "aku","saya","yang","dan","atau","dari","ini","itu","untuk","buat","dengan","karena","dalam","pada",
  "the","and","for","with","from","that","this","into","about","after","before","their","there"
};

std::string lower_ascii(std::string value) {
  for (char &c : value) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
  return value;
}

std::string normalize(std::string value) {
  std::string out;
  out.reserve(value.size());
  for (char c : lower_ascii(value)) {
    unsigned char uc = static_cast<unsigned char>(c);
    out.push_back(std::isalnum(uc) ? c : ' ');
  }
  return out;
}

std::vector<std::string> tokens(const std::string &text) {
  std::stringstream ss(normalize(text));
  std::vector<std::string> result;
  std::string token;
  while (ss >> token) {
    if (token.size() > 2 && stopwords.find(token) == stopwords.end()) result.push_back(token);
  }
  return result;
}

double cosine(const std::vector<std::string> &aTokens, const std::vector<std::string> &bTokens) {
  std::unordered_map<std::string, double> a, b;
  for (const auto &t : aTokens) a[t] += 1.0;
  for (const auto &t : bTokens) b[t] += 1.0;
  double dot = 0.0, normA = 0.0, normB = 0.0;
  for (const auto &kv : a) {
    normA += kv.second * kv.second;
    auto it = b.find(kv.first);
    if (it != b.end()) dot += kv.second * it->second;
  }
  for (const auto &kv : b) normB += kv.second * kv.second;
  if (normA <= 0.0 || normB <= 0.0) return 0.0;
  return dot / (std::sqrt(normA) * std::sqrt(normB));
}

std::vector<std::string> parse_csv_line(const std::string &line) {
  std::vector<std::string> fields;
  std::string field;
  bool quoted = false;
  for (size_t i = 0; i < line.size(); ++i) {
    char c = line[i];
    if (quoted && c == '"' && i + 1 < line.size() && line[i + 1] == '"') {
      field.push_back('"');
      ++i;
    } else if (c == '"') {
      quoted = !quoted;
    } else if (c == ',' && !quoted) {
      fields.push_back(field);
      field.clear();
    } else {
      field.push_back(c);
    }
  }
  fields.push_back(field);
  return fields;
}

double to_double(const std::string &value) {
  try { return value.empty() ? 0.0 : std::stod(value); } catch (...) { return 0.0; }
}

int to_int(const std::string &value) {
  try { return value.empty() ? 0 : std::stoi(value); } catch (...) { return 0; }
}

std::string get_field(const std::map<std::string, int> &columns, const std::vector<std::string> &row, const std::vector<std::string> &names) {
  for (const auto &name : names) {
    auto it = columns.find(name);
    if (it != columns.end() && it->second >= 0 && static_cast<size_t>(it->second) < row.size()) return row[it->second];
  }
  return "";
}

std::vector<Film> load_films(const std::string &csvPath) {
  std::ifstream file(csvPath);
  std::vector<Film> films;
  if (!file.is_open()) return films;

  std::string line;
  if (!std::getline(file, line)) return films;
  auto header = parse_csv_line(line);
  std::map<std::string, int> columns;
  for (size_t i = 0; i < header.size(); ++i) columns[header[i]] = static_cast<int>(i);

  while (std::getline(file, line)) {
    auto row = parse_csv_line(line);
    Film f;
    f.tmdbId = get_field(columns, row, {"tmdbId", "tmdb_id", "tmdb"});
    f.title = get_field(columns, row, {"title_asli", "title", "title_en"});
    if (f.title.empty()) continue;
    f.title_en = get_field(columns, row, {"title_en"});
    f.year = get_field(columns, row, {"year"});
    f.genres = get_field(columns, row, {"genres", "genre"});
    f.cast = get_field(columns, row, {"cast", "caster"});
    f.poster = get_field(columns, row, {"poster_url", "poster"});
    f.overview = get_field(columns, row, {"overview", "description"});
    f.rating = to_double(get_field(columns, row, {"rating", "vote_average"}));
    f.vote_count = to_int(get_field(columns, row, {"vote_count", "voteCount"}));
    f.rating_source = get_field(columns, row, {"rating_source", "ratingSource"});
    f.rating_updated_at = get_field(columns, row, {"rating_updated_at"});
    f.tmdb_vote_average = to_double(get_field(columns, row, {"tmdb_vote_average", "vote_average"}));
    f.mood = lower_ascii(get_field(columns, row, {"mood"}));
    f.trailer_url = get_field(columns, row, {"trailer_url", "trailer"});
    f.reason = get_field(columns, row, {"reason"});
    if (f.reason.empty()) f.reason = "Film yang menenangkan hati";
    films.push_back(f);
  }
  return films;
}

std::vector<std::string> split_genres(const std::string &genres) {
  std::vector<std::string> result;
  std::string current;
  for (char c : lower_ascii(genres)) {
    if (c == '|' || c == ',') {
      if (!current.empty()) result.push_back(current);
      current.clear();
    } else if (!std::isspace(static_cast<unsigned char>(c)) || !current.empty()) {
      current.push_back(c);
    }
  }
  if (!current.empty()) result.push_back(current);
  for (auto &g : result) {
    while (!g.empty() && std::isspace(static_cast<unsigned char>(g.back()))) g.pop_back();
  }
  return result;
}

std::string json_escape(const std::string &value) {
  std::string out;
  for (char c : value) {
    switch (c) {
      case '\\': out += "\\\\"; break;
      case '"': out += "\\\""; break;
      case '\n': out += "\\n"; break;
      case '\r': break;
      case '\t': out += "\\t"; break;
      default: out.push_back(c);
    }
  }
  return out;
}

int main(int argc, char **argv) {
  std::string csvPath = "df_processed.csv";
  std::string mood = "hidayah";
  int limit = 3;
  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg == "--csv" && i + 1 < argc) csvPath = argv[++i];
    else if (arg == "--mood" && i + 1 < argc) mood = lower_ascii(argv[++i]);
    else if (arg == "--limit" && i + 1 < argc) limit = std::max(1, to_int(argv[++i]));
  }

  std::map<std::string, std::string> profiles = {
    {"sedih", "sad grief loss lonely healing patience hope sabar ikhlas keluarga"},
    {"gelisah", "anxiety fear panic overthinking calm peace tawakal aman zikir"},
    {"hidayah", "faith repentance redemption spiritual guidance prayer islam taubat hijrah"},
    {"bahagia", "joy gratitude family friendship comedy warm uplifting syukur"},
    {"marah", "anger conflict revenge justice forgiveness self control patience memaafkan"},
    {"rindu", "longing memory home romance family distance reunion love doa"},
    {"tenang", "calm peace family faith hope gratitude"}
  };
  std::map<std::string, std::map<std::string, double>> affinity = {
    {"sedih", {{"drama", 1.0}, {"family", .62}, {"romance", .42}, {"documentary", .34}}},
    {"gelisah", {{"drama", .78}, {"mystery", .5}, {"thriller", .35}, {"family", .28}}},
    {"hidayah", {{"drama", .88}, {"documentary", .62}, {"history", .52}, {"family", .46}}},
    {"bahagia", {{"comedy", .95}, {"family", .9}, {"animation", .68}, {"romance", .38}}},
    {"marah", {{"drama", .72}, {"crime", .68}, {"action", .42}, {"thriller", .38}}},
    {"rindu", {{"romance", .84}, {"family", .78}, {"drama", .7}, {"music", .28}}}
  };
  std::map<std::string, std::vector<std::string>> related = {
    {"sedih", {"sedih","hidayah","rindu"}},
    {"gelisah", {"gelisah","hidayah","sedih"}},
    {"hidayah", {"hidayah","sedih","gelisah"}},
    {"bahagia", {"bahagia","hidayah"}},
    {"marah", {"marah","hidayah","gelisah"}},
    {"rindu", {"rindu","sedih","hidayah"}},
    {"tenang", {"hidayah","bahagia","sedih"}}
  };

  auto films = load_films(csvPath);
  auto profileTokens = tokens(profiles.count(mood) ? profiles[mood] : profiles["tenang"]);
  for (auto &f : films) {
    double semantic = cosine(tokens(f.title + " " + f.genres + " " + f.overview + " " + f.cast + " " + f.reason), profileTokens);
    double genreScore = 0.0;
    auto genres = split_genres(f.genres);
    for (const auto &genre : genres) genreScore += affinity[mood][genre];
    if (!genres.empty()) genreScore /= genres.size();
    double moodScore = 0.0;
    for (const auto &m : related[mood]) if (f.mood.find(m) != std::string::npos) moodScore = std::max(moodScore, 3.0);
    if (f.mood.find(mood) != std::string::npos) moodScore = std::max(moodScore, 4.0);
    double rating = f.rating > 0 ? f.rating : f.tmdb_vote_average;
    double votes = std::max(0, f.vote_count);
    double bayesian = ((votes / (votes + 120.0)) * rating) + ((120.0 / (votes + 120.0)) * 6.7);
    double poster = f.poster.empty() ? -0.35 : 0.35;
    double overview = f.overview.empty() ? -0.15 : std::min(0.5, static_cast<double>(f.overview.size()) / 800.0);
    f.score = moodScore + semantic * 5.0 + genreScore * 2.2 + bayesian / 10.0 + poster + overview;
  }

  std::sort(films.begin(), films.end(), [](const Film &a, const Film &b) { return a.score > b.score; });
  std::cout << "[";
  int emitted = 0;
  for (const auto &f : films) {
    if (f.score <= 0.0) continue;
    if (emitted) std::cout << ",";
    std::cout << "{"
      << "\"title\":\"" << json_escape(f.title) << "\","
      << "\"title_en\":\"" << json_escape(f.title_en) << "\","
      << "\"year\":\"" << json_escape(f.year) << "\","
      << "\"genres\":\"" << json_escape(f.genres) << "\","
      << "\"cast\":\"" << json_escape(f.cast) << "\","
      << "\"poster\":\"" << json_escape(f.poster) << "\","
      << "\"overview\":\"" << json_escape(f.overview) << "\","
      << "\"rating\":" << f.rating << ","
      << "\"vote_count\":" << f.vote_count << ","
      << "\"rating_source\":\"" << json_escape(f.rating_source) << "\","
      << "\"rating_updated_at\":\"" << json_escape(f.rating_updated_at) << "\","
      << "\"tmdb_vote_average\":" << f.tmdb_vote_average << ","
      << "\"mood\":\"" << json_escape(f.mood) << "\","
      << "\"trailer_url\":\"" << json_escape(f.trailer_url) << "\","
      << "\"reason\":\"" << json_escape(f.reason) << "\","
      << "\"cpp_score\":" << f.score
      << "}";
    if (++emitted >= limit) break;
  }
  std::cout << "]";
  return 0;
}
