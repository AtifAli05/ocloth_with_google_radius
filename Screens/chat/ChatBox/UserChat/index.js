import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import {Alert} from 'react-native';
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  limit,
  addDoc,
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import {Ionicons, FontAwesome} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import Typo from '../../../../components/Typography/Typo';

import {db, auth} from '../../../../firebase';
import Message from '../Message';
import SendMessage from '../SendMessage';

// Make sure to import Alert

const Chat = ({route}) => {
  const {chatId, displayName, userImage} = route.params;
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friendId, setFriendId] = useState(null);
  const [isFriend, setIsFriend] = useState(false);

  const navigation = useNavigation();

  const handleAddFriend = async () => {
    Alert.alert(
      'Confirmation',
      'Would you like to add this person as a friend?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            if (!isFriend && friendId !== currentUserId) {
              // Add friendId to current user's friend list
              await setDoc(
                doc(db, 'total_friends', currentUserId),
                {
                  friends: arrayUnion(friendId),
                },
                {merge: true},
              );
              setIsFriend(true);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleRemoveFriend = async () => {
    Alert.alert(
      'Confirmation',
      'Would you like to remove this person from your friends list?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Remove friendId from current user's friend list
              await setDoc(
                doc(db, 'total_friends', currentUserId),
                {friends: arrayRemove(friendId)},
                {merge: true},
              );
              setIsFriend(false);
            } catch (error) {
              console.log('Error removing friend: ', error);
            }
          },
        },
      ],
    );
  };

  const checkFriendStatus = async () => {
    const docSnap = await getDoc(doc(db, 'total_friends', currentUserId));

    if (docSnap.exists()) {
      setIsFriend(docSnap.data().friends.includes(friendId));
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const messagesUnsubscribe = onSnapshot(q, querySnapshot => {
      let messages = [];
      querySnapshot.forEach(doc => {
        messages.push({...doc.data(), id: doc.id});
      });
      setMessages(messages);
    });

    setCurrentUserId(auth.currentUser.uid);

    const chatDoc = doc(db, 'chats', chatId);

    const chatUnsubscribe = onSnapshot(chatDoc, doc => {
      if (doc.exists()) {
        const data = doc.data();
        const users = data.users;

        // Determine friendId
        let friend = users.find(id => id !== auth.currentUser.uid);
        if (friend) {
          setFriendId(friend);
        }
      }
    });

    return () => {
      messagesUnsubscribe();
      chatUnsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (currentUserId && friendId) {
      checkFriendStatus();
    }
  }, [currentUserId, friendId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled={Platform.OS === 'ios' ? true : false}
      style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MessagesScreen')}>
            <Ionicons name="ios-arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <Image source={{uri: userImage}} style={styles.img} />
          <View>
            <Typo xl>{displayName}</Typo>
            <Typo s grey>
              You are now chatting...
            </Typo>
          </View>
        </View>

        <TouchableOpacity
          onPress={isFriend ? handleRemoveFriend : handleAddFriend}>
          <FontAwesome
            name={isFriend ? 'check' : 'user-plus'}
            size={24}
            color="black"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <FlatList
          data={messages}
          renderItem={({item}) => <Message key={item.id} message={item} />}
          inverted
          keyExtractor={item => item.id}
        />
        <SendMessage chatId={chatId} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  body: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 25 : 65,
    paddingBottom: Platform.OS === 'android' ? 15 : 25,
    backgroundColor: '#FFF',
  },
  img: {
    height: 45,
    width: 45,
    borderRadius: 100,
    marginHorizontal: 10,
    backgroundColor: '#e5e5e5',
  },
});

export default Chat;
