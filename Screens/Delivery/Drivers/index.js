import React, {useEffect, useState} from 'react';
import {Feather} from '@expo/vector-icons';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {firebase, auth} from '../../../firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import useChat from '../../useHooks/useChat';

const db = firebase.firestore();

export default function DeliversList({navigation}) {
  const {initiateChat, chatPartiesInfo} = useChat();
  const [userInfo, setUserInfo] = useState({});
  const [users, setUsers] = useState([]);

  const isDelierer = userInfo?.deliverer || false;

  const getAuthInfo = async () => {
    const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const data = docSnap.data();
    setUserInfo(data);
  };

  useEffect(() => {
    getAuthInfo();
    const userRef = db.collection('users').where('deliverer', '==', true);
    const subscriber = userRef.onSnapshot(updateUsersFromSnapshot);
    return () => subscriber(); // Unsubscribe from Firestore on unmount
  }, []);

  const updateUsersFromSnapshot = querySnapshot => {
    const usersArray = [];
    querySnapshot.forEach(documentSnapshot => {
      const userData = documentSnapshot.data();
      usersArray.push({...userData, key: documentSnapshot.id});
    });
    setUsers(usersArray);
  };

  const becomeDeliverer = async () => {
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, {deliverer: !isDelierer}).catch(error => {
      Alert.alert('Error updating document: ', error);
    });

    setUserInfo(pre => ({...pre, deliverer: !isDelierer}));
  };

  const onAddPress = () => {
    Alert.alert(
      'Are you sure!',
      isDelierer
        ? 'You want withdraw as a deliverer'
        : 'You want to ba a deliverer',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => becomeDeliverer()},
      ],
    );
  };

  const messagePress = async item => {
    const {key: deliveryUserId, key} = item || {};

    const res = await initiateChat(deliveryUserId, key);

    if (res?.success) {
      const chatInfo = res?.success[0];
      const chatParties = chatPartiesInfo(chatInfo);

      let name = '';
      let imagesList = [];
      chatParties.forEach(user => {
        name += `, ${user.name}`;
        imagesList.push(user.profile_picture);
      });

      name = name.replace(', ', '');

      navigation.navigate('DevliveryChat', {
        chatId: chatInfo.id,
        displayName: name,
        userImage: imagesList[0],
        chatParties,
        isDelivery: true,
      });
    } else {
      Alert.alert('Something went wrong', JSON.stringify(res.error), [
        {text: 'OK'},
      ]);
    }
  };

  const ItemRendrer = ({item, index}) => {
    const itself = auth.currentUser.uid === item.key;
    const {profile_picture, name} = item;
    return (
      <TouchableWithoutFeedback key={index}>
        <View style={styles.userContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image source={{uri: profile_picture}} style={styles.userImage} />
            <Text style={{fontSize: 14, fontWeight: '600'}}>{name}</Text>
          </View>
          {!itself ? (
            <Feather
              onPress={() => messagePress(item)}
              name={'message-circle'}
              size={24}
              color={'#000'}
            />
          ) : (
            <TouchableOpacity
              style={{backgroundColor: '#000', padding: 5, borderRadius: 30}}
              onPress={onAddPress}>
              <Feather name={'minus'} size={15} color={'#fff'} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const currentUser = users.filter(user => user.key === auth.currentUser.uid);
  const allUsers = users.filter(user => user.key !== auth.currentUser.uid);

  return (
    <View style={styles.body}>
      <View style={styles.infoContainer}>
        <Text style={styles.text}>All Listed Drivers</Text>
      </View>
      <FlatList data={[...currentUser, ...allUsers]} renderItem={ItemRendrer} />
      {!isDelierer && (
        <TouchableOpacity style={styles.AddWrapper} onPress={onAddPress}>
          <Feather
            name={isDelierer ? 'minus' : 'plus'}
            size={28}
            color={'#C5C5C5'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles remain the same ...

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 20,
  },

  infoContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 5,
  },

  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  addButton: {
    backgroundColor: '#000000',
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // item content
  userContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 10,
    marginHorizontal: 25,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 2, height: 2},
  },

  userImage: {
    width: 35,
    height: 35,
    borderRadius: 25,
    marginRight: 8,
  },

  AddWrapper: {
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    position: 'absolute',
    bottom: 10,
    right: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
});
