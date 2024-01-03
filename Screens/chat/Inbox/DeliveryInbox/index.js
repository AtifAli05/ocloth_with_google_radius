import React, {useEffect, useState} from 'react';
import {useAuthState} from 'react-firebase-hooks/auth';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import CacheImage from '../../../CacheImage';
import styles from './styles';
import useChat from '../../../useHooks/useChat';
import {firebase, db, auth} from '../../../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

export default function Messages() {
  const {chatPartiesInfo} = useChat();
  const [chats, setChats] = useState([]);
  const navigation = useNavigation();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (auth.currentUser) {
        fetchUserChats();
      }
    });
    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserChats();
    }
  }, []);

  const fetchUserChats = async () => {
    const userRef = firebase
      .firestore()
      .collection('users')
      .doc(auth.currentUser.uid);

    const userDoc = await userRef.get();
    const userChats = userDoc.data()?.['delivery-chats'] || [];
    const chatDocs = await Promise.all(
      userChats.map(chatId =>
        firebase.firestore().collection('delivery-chats').doc(chatId).get(),
      ),
    );
    const chats = chatDocs.map(chatDoc => ({
      id: chatDoc.id,
      ...chatDoc.data(),
    }));
    setChats(chats);
  };

  const removeChat = async chatId => {
    try {
      const authUser = auth.currentUser.uid;
      const fb_fieldValue = firebase.firestore.FieldValue;

      await updateDoc(doc(db, 'users', authUser), {
        'delivery-chats': fb_fieldValue.arrayRemove(chatId),
      });

      await updateDoc(doc(db, 'delivery-chats', chatId), {
        users: fb_fieldValue.arrayRemove(authUser),
        [authUser]: 'left',
        leavedUsers: fb_fieldValue.arrayUnion(authUser),
      });

      // Refresh local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error removing chat:', error);
      Alert.alert('Error', 'Failed to remove chat. Please try again.');
    }
  };

  const renderChatItem = ({item}) => {
    const {lastMessage, id: chatID, lastMessageRead, LastMessageUser} = item;

    const chatParties = chatPartiesInfo(item);

    let displayName = '';
    let imagesList = [];
    chatParties.forEach(user => {
      displayName += `, ${user.name}`;
      imagesList.push(user.profile_picture);
    });

    displayName = displayName.replace(', ', '');

    displayName =
      displayName.length > 25 ? displayName.slice(0, 25) + '...' : displayName;

    let imageUrl = imagesList[0];

    const currentUserIsLastMessageUser = user.uid === LastMessageUser;

    return (
      <TouchableOpacity
        style={{paddingHorizontal: 20, marginVertical: 5}}
        onPress={async () => {
          navigation.navigate('DevliveryChat', {
            chatId: item.id,
            displayName,
            userImage: imageUrl,
            isDelivery: true,
          });

          const userRef = firebase
            .firestore()
            .collection('users')
            .doc(auth.currentUser.uid);
          const userDoc = await userRef.get();
          let userNewMessages = userDoc.data().newMessages || [];
          userNewMessages = userNewMessages.filter(
            chatId => chatId !== item.id,
          );
          await userRef.update({newMessages: userNewMessages});

          // Mark the last message as read if the last message wasn't sent by current user
          if (!currentUserIsLastMessageUser) {
            const chatRef = firebase
              .firestore()
              .collection('delivery-chats')
              .doc(item.id);
            await chatRef.update({lastMessageRead: true});
          }
        }}>
        <View style={styles.container}>
          <View style={styles.profileContainer}>
            <CacheImage uri={imageUrl} style={styles.image} />
          </View>
          <View style={styles.messageContainer}>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {!currentUserIsLastMessageUser && !lastMessageRead && (
                  <View
                    style={{
                      marginRight: 5,
                      height: 10,
                      width: 10,
                      borderRadius: 5,
                      backgroundColor: 'blue',
                    }}
                  />
                )}
                <Text style={styles.text}>{displayName}</Text>
              </View>
              <Text style={styles.lastMessageText}>{lastMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => removeChat(chatID)}>
              <Feather name="trash-2" size={20} color="red" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={chats}
      keyExtractor={item => item.id.toString()}
      renderItem={renderChatItem}
    />
  );
}
