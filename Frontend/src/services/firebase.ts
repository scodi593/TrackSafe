import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyDi7bc5vGaIvgkrfWVbSaoV5IQIcdryVIs',
  authDomain: 'tracksafe-adce7.firebaseapp.com',
  projectId: 'tracksafe-adce7',
  storageBucket: 'tracksafe-adce7.appspot.com',
  messagingSenderId: '779303402074',
  appId: '1:779303402074:web:0cee3e0e25abb9cdd03663',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      console.log('Notification permission granted. Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => resolve(payload));
  });
