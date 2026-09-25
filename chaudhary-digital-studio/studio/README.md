# Chaudhary Digital Studio — Website

This package contains a complete, ready-to-deploy website:

- **index.html** — public homepage (showcase gallery, about, contact form)
- **admin.html** + **js/admin.js** — admin panel: login, category management, photo upload, QR code generation, homepage showcase selection, contact queries
- **category.html** — the page a customer lands on after scanning a QR code (no login or password required)
- **css/style.css**, **js/*.js** — styling and logic

The backend is **Firebase** (Google's free-tier platform for authentication, database and file storage) — this means you don't need to run or maintain your own server. You just create a Firebase project and paste its keys into one file.

---

## Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, give it a name (e.g. `chaudhary-digital-studio`), and continue through the setup.
3. Inside the project:
   - **Build → Authentication** → Get started → **Sign-in method** tab → enable **Email/Password**.
   - **Build → Firestore Database** → Create database → **Production mode** → choose the region nearest you (e.g. `asia-south1`).
   - **Build → Storage** → Get started → Production mode.

## Step 2 — Create an admin login

1. Go to **Authentication → Users** → **Add user**.
2. Enter an email and password — this is what you'll use to log into `admin.html`. Add one user per staff member who needs access.

## Step 3 — Connect the website to your Firebase project

1. In the Firebase console, click the gear icon (⚙️) → **Project settings** → scroll to **Your apps** → click the **Web (`</>`)** icon to register a web app.
2. Copy the `firebaseConfig` object shown there.
3. Open `js/firebase-config.js` in this package and replace the placeholder values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) with your own.
4. Save the file — the website is now connected to your database.

## Step 4 — Set security rules (important)

Without these, anyone could read or modify your data from outside the app.

**Firestore Database → Rules** tab — paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{catId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /photos/{photoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /queries/{queryId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

**Storage → Rules** tab — paste this:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This means: anyone can view photos and submit the contact form, but only a logged-in admin can upload, delete, or manage categories and photos. Remember to click **Publish** after pasting each set of rules.

## Step 5 — Host the website

The simplest option is **Firebase Hosting** (free):

1. Install [Node.js](https://nodejs.org) on your computer.
2. In a terminal: `npm install -g firebase-tools`
3. Open a terminal inside this folder and run `firebase login`, then `firebase init hosting` (when asked for the public directory, enter `.`; when asked if it's a single-page app, choose No).
4. Then run: `firebase deploy`
5. You'll get a live link (e.g. `https://chaudhary-digital-studio.web.app`) that works on both mobile and desktop.

Alternatively, since this is plain HTML/CSS/JS, you can upload these files directly to any standard web host (Hostinger, GoDaddy, cPanel, etc.) — no special server setup required.

## Using the admin panel

- **Create a category**: `admin.html` → log in → Categories tab → enter a name → "Create category".
- **Upload photos**: Upload Photos tab → choose a category → select your photos.
- **QR codes**: on the Categories tab, click "QR code" next to any category to download a PNG you can share on WhatsApp or print. Scanning it opens only that category's photos — no password required.
- **Homepage showcase**: on the Homepage Showcase tab, pick a category and tick the photos you want featured on the public homepage gallery.
- **Contact queries**: every message submitted through the homepage contact form appears under the Contact Queries tab.

## Notes

- Until real keys are added to `js/firebase-config.js`, the site shows a clear "setup in progress" message rather than a blank or broken page.
- Every error (network failure, missing photo, broken link) shows the visitor a plain-language message instead of a raw technical error.
- The layout is mobile-first and adapts automatically down to small phone screens, including a proper slide-in menu, larger tap targets, and a horizontally scrollable admin navigation on narrow screens.

---

## To finish personalising the site, please share:

- **Phone number** and **email address** for the studio
- **Full address / area** to display in the footer and contact section
- **List of services** you offer (the current placeholder list is: Wedding Photography, Engagement Shoot, Candid Photography, Event Videography, Photo Album Design)
- **A short tagline or description** of the studio, if you'd like something more specific than the current copy
- **Social media links** (Instagram/Facebook), if you'd like them added to the header or footer
- **Year founded** or years of experience, if you'd like that mentioned in the About section

Once you send these, the placeholder text throughout the site can be swapped for your real details.
