/**
 * @file firebaseConfig.js
 * @description Shared Firebase initialization for Smart-Megazen ecosystem.
 *
 * Both the Desktop (Electron) and Mobile (Expo) apps import from this file.
 * Replace the placeholder values below with your actual Firebase project credentials.
 */

import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL:       'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

/**
 * Singleton Firebase App — safe to call from multiple modules.
 * Prevents "duplicate app" errors in hot-reload environments (Expo, Webpack HMR).
 */
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export { firebaseApp };
export default firebaseApp;
