# Firestore Migration Notes - IMAN IN MOTION

Fitur akun sekarang memakai Firestore sebagai source utama, dengan localStorage sebagai cache/offline fallback.

## Path data

Data tiap user disimpan di:

```txt
users/{uid}/accountData/iim_profile
users/{uid}/accountData/iim_favorites
users/{uid}/accountData/iim_mood_stats
users/{uid}/accountData/iim_activity
```

Setiap dokumen memakai bentuk:

```js
{
  value: ...,
  updatedAt: serverTimestamp(),
  userId: uid,
  schemaVersion: 1
}
```

## Migrasi otomatis

Saat user login, app menjalankan `migrateLocalAccountDataToFirestore()` untuk menyalin data lama dari localStorage ke Firestore. Setelah itu, hook akun akan membaca data dari Firestore dan menulis balik ke Firestore.

localStorage tetap dipakai sebagai cache supaya UI tetap responsif dan masih aman jika koneksi Firestore gagal sementara.

## Firestore Security Rules rekomendasi

Gunakan rules ini di Firebase Console > Firestore Database > Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/accountData/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Kalau nanti ingin menyimpan public content seperti movies/articles ke Firestore juga, pisahkan path public agar rules-nya tidak tercampur dengan data akun user.

## Catatan

- Favorite, mood stats, activity, dan profile sekarang cloud-sync per UID Firebase.
- Password tetap lewat Firebase Auth, bukan Firestore.
- Profile image saat ini masih Data URL yang disimpan di Firestore. Untuk produksi lebih serius, sebaiknya pindahkan image ke Firebase Storage lalu simpan URL-nya di Firestore.
