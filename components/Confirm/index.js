import React, {useState, useEffect} from 'react';
import {Feather} from '@expo/vector-icons';
import {firebase, db} from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Image,
  FlatList,
} from 'react-native';
import {styles} from './styles';

const _ = require('lodash');

const Confirm = ({modalVisible, setModalVisible, chatId}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, snapshots =>
      usersSnapshots(snapshots),
    );

    return () => unsubscribe();
  }, [chatId]);

  const usersSnapshots = async snapshots => {
    const ref = doc(db, 'delivery-chats', chatId);
    const snapDoc = await getDoc(ref);
    const chatUsers = snapDoc.data()?.users; // users that are already the part of the chat.

    let usersArray = [];
    snapshots?.forEach(snapDoc => {
      if (!chatUsers?.includes(snapDoc.id)) {
        // ignoring the users that are already the part of the chat.
        const userData = snapDoc.data();
        usersArray.push({
          ...userData,
          key: snapDoc.id,
        });
      }
    });
    usersArray = _.sortBy(usersArray, 'name');
    setUsers(usersArray);
  };

  const handleAdd = async item => {
    try {
      await updateDoc(doc(db, 'users', item.key), {
        'delivery-chats': firebase.firestore.FieldValue.arrayUnion(chatId),
      });

      await updateDoc(doc(db, 'delivery-chats', chatId), {
        users: firebase.firestore.FieldValue.arrayUnion(item.key),
        [item.key]: item,
      });
    } catch (error) {
      Alert.alert(JSON.stringify(error));
    }
    setModalVisible(false);
  };

  const UsersFilter = users?.filter(a =>
    a?.name?.includes(searchQuery?.toLowerCase()),
  );

  const ItemRendrer = ({item, index}) => {
    const {key, profile_picture, name} = item;
    return (
      <TouchableWithoutFeedback key={`key-${index}`}>
        <View style={styles.userContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image source={{uri: profile_picture}} style={styles.userImage} />
            <Text>{name}</Text>
          </View>
          <TouchableOpacity
            style={{backgroundColor: '#000', padding: 5, borderRadius: 30}}
            onPress={() => handleAdd(item)}>
            <Feather name={'plus'} size={15} color={'#fff'} />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.listContainer}>
          <Text>Add a friend to the chat</Text>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <TouchableOpacity>
                <Feather name={'search'} size={23} color={'#919191'} />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Account"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="always"
              />
            </View>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name={'x'} size={23} color={'#919191'} />
            </TouchableOpacity>
          </View>
          <FlatList data={UsersFilter} renderItem={ItemRendrer} />
        </View>
      </View>
    </Modal>
  );
};

export default Confirm;
