import React, {useState} from 'react';
import {KeyboardAvoidingView, StyleSheet, View, Image} from 'react-native';
import {Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {getAuth} from 'firebase/auth';
import {getFirestore, doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
// <-- Import here
import {getStorage} from 'firebase/storage';
import {useNavigation} from '@react-navigation/native';
import assets from '../Assets/assets';
import Theme from '../Theme';
import FullButton from '../components/Buttons/FullButton';
// <-- Import here
import InputBox from '../components/utils/InputBox';
import Space from '../components/utils/Space';

// Add this to your imports at the top of your file

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const auth = getAuth();
  const db = getFirestore();
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState('');

  const handleSignUp = () => {
    if (displayName.trim() === '') {
      Alert.alert('Hold Up!', 'Display Name is required'); // <-- Alert if Display Name is empty
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const storage = getStorage();
    const defaultProfilePictureRef = ref(storage, 'default.png');
    let defaultProfilePicture = '';

    getDownloadURL(defaultProfilePictureRef)
      .then(url => {
        defaultProfilePicture = url;

        createUserWithEmailAndPassword(auth, email, password)
          .then(userCredentials => {
            const user = userCredentials.user;

            updateProfile(user, {
              displayName: displayName, // <-- Use displayName instead of defaultDisplayName
              photoURL: defaultProfilePicture,
            })
              .then(() => {
                addUserToFirestore(user, displayName, defaultProfilePicture) // <-- Pass displayName instead of defaultDisplayName
                  .then(() => {
                    navigation.navigate('Login');
                  })
                  .catch(error => {
                    console.error('Error adding user to Firestore: ', error);
                  });
              })
              .catch(error => {
                console.error('Error updating profile: ', error);
              });
          })
          .catch(error => alert(error.message));
      })
      .catch(error => {
        console.error('Error getting profile picture URL: ', error);
      });
  };

  const addUserToFirestore = async (user, displayName, profilePictureUrl) => {
    // <-- Update parameter name to displayName
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const data = {
      email: user.email,
      Vendor: false,
      swiped: [],
      chats: [],
      ...(displayName && {name: displayName}), // <-- Use displayName instead of accountName
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <View style={styles.backButton}>
          <Icon
            name="arrow-back"
            size={40}
            onPress={() => navigation.goBack()}
          />
        </View>
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
        <InputBox // <-- New InputBox for Display Name
          leftIcon={'user'}
          placeholder="Display Name"
          value={displayName}
          onChangeText={text => setDisplayName(text)}
        />
        <Space space={25} />
        <InputBox
          leftIcon={'lock'}
          placeholder="Password"
          value={password}
          onChangeText={text => setPassword(text)}
          secureTextEntry={true}
        />
        <InputBox
          leftIcon={'lock'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={text => setConfirmPassword(text)}
          secureTextEntry={true}
        />
        <Space space={55} />
        <FullButton
          label={'Signup'}
          btnColor={Theme.primaryColor}
          handlePress={handleSignUp}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

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
  logo: {
    width: 225,
    height: 125,
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 10,
  },
});

export default RegisterScreen;
