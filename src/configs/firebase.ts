import admin from 'firebase-admin';

import serviceAccount from "../../firebase_admin.json";
import { DB_FIREBASE } from '../constants';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: DB_FIREBASE,
    storageBucket: 'note-app-384ec.appspot.com'
});

export const firebaseAdmin = admin;
export const bucket = admin.storage().bucket();
export const db = admin.database();