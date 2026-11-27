# Switching BIM storage to Firebase (Cloud Firestore)

The app server already supports Firestore. It turns on as soon as one environment variable is set;
until then it keeps using Supabase.

1. **Create a Firebase project** at console.firebase.google.com (or use an existing one).
2. **Create the database**: Build → Firestore Database → Create database → *Production mode*,
   location **asia-southeast1 (Singapore)**.
3. **Lock it**: Firestore → Rules → paste `firestore.rules` from this repo → Publish
   (the server's service account bypasses rules; nobody else can read the data).
4. **Get a service-account key**: Project settings → Service accounts → *Generate new private key*
   → a `.json` file downloads. Keep it secret; never commit it.
5. **Vercel** → Project → Settings → Environment Variables → add (Production):
   `FIREBASE_SERVICE_ACCOUNT` = the whole content of that .json file. Then **Redeploy**.
6. **First load copies the data**: when Firestore is empty, the server reads the current Supabase
   data once and writes it into Firestore. Open the app once, then check
   `https://<site>/api/firebase/status` → `connected: true` and a `lastSavedAt` value.
7. After a week of normal use you can remove the Supabase variables and delete the Supabase project.

Layout: `bim_state/latest` (+ `latest_0…n` chunks of the JSON, because Firestore allows max 1 MiB per
document) and `bim_backups/<id>` for cloud-sync backups.
