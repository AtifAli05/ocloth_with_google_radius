import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {AsyncStorage} from 'react-native';
import {Alert} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import {updateProfile} from 'firebase/auth';
import {sendPasswordResetEmail} from 'firebase/auth';
import {EmailAuthProvider, delete as firebaseDelete} from 'firebase/auth';
import {getFirestore, doc, setDoc, updateDoc, getDoc} from 'firebase/firestore';
import {deleteDoc} from 'firebase/firestore';
import {getStorage, ref, getDownloadURL} from 'firebase/storage';
import {uploadBytesResumable} from 'firebase/storage';
import {useNavigation} from '@react-navigation/native';
import assets from '../Assets/assets';
import AuthContext from '../AuthContext';
import Theme from '../Theme';
import FullButton from '../components/Buttons/FullButton';
import FullButtonStroke from '../components/Buttons/FullButtonStroke';
import InputBox from '../components/utils/InputBox';
import Space from '../components/utils/Space';
import {auth} from '../firebase';
import LoadingScreen from './LoadingScreen';

const DeleteAccountScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();

  const db = getFirestore();

  const onAuthStateRestored = user => {
    if (user) {
      setUser(user);
      navigation.navigate('Home', {screen: 'HomeScreen'});
    }

    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onAuthStateRestored);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      setAccountName(user.name || '');
      setProfilePictureUrl(user.profile_picture || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && accountName && profilePictureUrl) {
      addUserToFirestore(user, accountName, profilePictureUrl);
    }
  }, [accountName, profilePictureUrl]);

  const addUserToFirestore = async (user, accountName, profilePictureUrl) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const data = {
      email: user.email,
      ...(accountName && {name: accountName}),
      ...(profilePictureUrl && {profile_picture: profilePictureUrl}),
    };

    try {
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, data);
      } else {
        await setDoc(userDocRef, data);
      }
    } catch (error) {
      console.error('Error writing user to Firestore: ', error);
    }
  };

  const handleDeleteAccount = () => {
    // Check if email or password fields are empty
    if (!email || !password) {
      Alert.alert(
        'Error',
        'Please enter account information.',
        [{text: 'OK'}], // This will provide an "OK" button that simply dismisses the alert
      );
      return;
    }

    // Use React Native's Alert for confirmation
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Authenticate the user first
              const userCredentials = await signInWithEmailAndPassword(
                auth,
                email,
                password,
              );
              const user = userCredentials.user;

              // Delete user data from Firestore
              const userDocRef = doc(db, 'users', user.uid);
              await deleteDoc(userDocRef);

              // Delete any additional data here...

              // Delete the user's account from Authentication
              await user.delete();

              // Navigate back to the login or welcome screen
              navigation.navigate('Login'); // or whatever your login screen's route name is
            } catch (error) {
              console.error('Error deleting account:', error.message);
              Alert.alert('Error', 'Wrong credentials, please try again');
            }
          },
        },
      ],
      {cancelable: false},
    );
  };
  if (initializing) {
    return <LoadingScreen />; // Show the LoadingScreen while Firebase auth state is restoring
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Image style={styles.logo} source={assets.blackLogo} />
      </View>
      <View style={styles.body}>
        <InputBox
          leftIcon={'mail'}
          placeholder="Email"
          value={email}
          onChangeText={text => setEmail(text)}
        />
        <Space space={25} />
        <InputBox
          leftIcon={'lock'}
          placeholder="Password"
          value={password}
          onChangeText={text => setPassword(text)}
          secureTextEntry={true}
        />

        <Space space={55} />
        <FullButton
          label={'Delete Account'}
          btnColor={Theme.primaryColor}
          handlePress={handleDeleteAccount}
        />
        <Space space={15} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default DeleteAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1.5,
  },
  input: {
    backgroundColor: 'grey',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
  logo: {
    width: 225,
    height: 125,
    resizeMode: 'contain',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: Theme.primaryColor,
    textDecorationLine: 'underline',
  },
});
