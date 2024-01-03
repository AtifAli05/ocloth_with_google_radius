import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import {sendPasswordResetEmail} from 'firebase/auth';
import {getFirestore, doc, setDoc, updateDoc, getDoc} from 'firebase/firestore';

import {useNavigation} from '@react-navigation/native';
import assets from '../Assets/assets';
import Theme from '../Theme';
import FullButton from '../components/Buttons/FullButton';
import FullButtonStroke from '../components/Buttons/FullButtonStroke';
import InputBox from '../components/utils/InputBox';
import Space from '../components/utils/Space';
import LoadingScreen from './LoadingScreen';

const LoginScreen = () => {
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

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredentials => {
        const user = userCredentials.user;
        setUser(user);

        // Save email in SecureStore
        SecureStore.setItemAsync('email', email);
        SecureStore.setItemAsync('password', password);
      })
      .catch(error => alert(error.message));
  };

  // Load credentials when component mounts
  useEffect(() => {
    const loadEmail = async () => {
      const savedEmail = await SecureStore.getItemAsync('email');
      const savedPassword = await SecureStore.getItemAsync('password');

      if (savedPassword) {
        setPassword(savedPassword);
      }

      if (savedEmail) {
        setEmail(savedEmail);
      }
    };

    loadEmail();
  }, []);

  if (initializing) {
    return <LoadingScreen />; // Show the LoadingScreen while Firebase auth state is restoring
  }

  const handleForgotPassword = () => {
    if (!email) {
      alert('Please input your email.');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert(
          'Password reset link sent! Check your email for further instructions.',
        );
      })
      .catch(error => {
        alert(error.message);
      });
  };

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
        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate('DeleteAccount')}>
          <Text style={styles.forgotPasswordText}>Delete Account</Text>
        </TouchableOpacity>

        <Space space={55} />
        <FullButton
          label={'Login'}
          btnColor={Theme.primaryColor}
          handlePress={handleLogin}
        />
        <Space space={15} />
        <FullButtonStroke
          label={'Signup'} //brings the user to the register screen
          btnColor={Theme.primaryColor}
          handlePress={handleSignUp}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
