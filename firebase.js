import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD6YukjDdJHYjI2V_0C7f15nNeffqdp-yk',
  authDomain: 'vyne-dcbfd.firebaseapp.com',
  projectId: 'vyne-dcbfd',
  storageBucket: 'vyne-dcbfd.appspot.com',
  messagingSenderId: '1001378411209',
  appId: '1:1001378411209:web:a4360419284eb56a791318',
  measurementId: 'G-122TYNVZ1P',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {firebase, auth, storage, db};
