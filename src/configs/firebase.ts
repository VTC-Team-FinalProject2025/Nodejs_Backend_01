import admin from 'firebase-admin';

import serviceAccount from "../../firebase_admin.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    storageBucket: 'note-app-384ec.appspot.com'
});

export const firebaseAdmin = admin;
export const bucket = admin.storage().bucket();