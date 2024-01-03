import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { firebase, auth } from '../../../../firebase';
import CacheImage from '../../../CacheImage';
import ImageViewer from 'react-native-image-zoom-viewer';

import styles from './styles';

export default function UserInbox({ displayType = 'Sent' }) {
  const [chats, setChats] = useState([]);
  const navigation = useNavigation();
  const [user] = useAuthState(auth);
  const [visibleChats, setVisibleChats] = useState([]);
  const [hiddenChats, setHiddenChats] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("")

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const imageAspectRatio = 16 / 9; // Adjust this based on your image aspect ratio
  const imageWidth = screenWidth;
  const imageHeight = screenWidth / imageAspectRatio;


  useEffect(() => {
    setVisibleChats(chats.filter(chat => !hiddenChats.includes(chat.id)));
  }, [chats, hiddenChats]);

  useEffect(() => {
    const fetchUserChats = async () => {
      const userRef = firebase
        .firestore()
        .collection('users')
        .doc(auth.currentUser.uid);
      const userDoc = await userRef.get();
      const userChats = userDoc.data().chats || [];
      const chatDocs = await Promise.all(
        userChats.map(chatId =>
          firebase.firestore().collection('chats').doc(chatId).get(),
        ),
      );
      const chats = chatDocs.map(chatDoc => ({
        id: chatDoc.id,
        ...chatDoc.data(),
      }));
      setChats(chats);
      const userNewMessages = userDoc.data().newMessages || [];
      setNewMessages(
        userNewMessages.map(chatId => ({ chatId, newMessage: true })),
      );

      const hiddenChatsDoc = await firebase
        .firestore()
        .collection('hiddenChats')
        .doc(auth.currentUser.uid)
        .get();
      const hiddenChats = hiddenChatsDoc.exists
        ? hiddenChatsDoc.data().chats
        : [];
      setHiddenChats(hiddenChats);
      const chatListener = firebase
        .firestore()
        .collection('chats')
        .where('users', 'array-contains', auth.currentUser.uid)
        .onSnapshot(querySnapshot => {
          querySnapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              setHiddenChats(currentHiddenChats => {
                if (!currentHiddenChats.includes(change.doc.id)) {
                  setChats(prevChats => [
                    ...prevChats.filter(chat => chat.id !== change.doc.id),
                    { id: change.doc.id, ...change.doc.data() },
                  ]);
                  if (change.type === 'added') {
                    setNewMessages(prevNewMessages => [
                      ...prevNewMessages,
                      { chatId: change.doc.id, newMessage: true },
                    ]);
                  }
                }
                return currentHiddenChats;
              });
            }
          });
        });
      return () => chatListener();
    };

    if (auth.currentUser) {
      fetchUserChats();
    }
  }, []);

  const removeChat = async chatId => {
    try {
      const userRef = firebase
        .firestore()
        .collection('users')
        .doc(auth.currentUser.uid);

      // Remove chatId from user's chats array
      await userRef.update({
        chats: firebase.firestore.FieldValue.arrayRemove(chatId),
      });

      // Also, optionally, you might want to delete the actual chat from the 'chats' firebase.firestore().collection (if you intend to fully delete the chat record)
      await firebase.firestore().collection('chats').doc(chatId).delete();

      // Refresh local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error removing chat:', error);
      Alert.alert('Error', 'Failed to remove chat. Please try again.');
    }
  };


  const showSlider = () => {
    setModalVisible(true);
  };

  const renderChatItem = ({ item }) => {
    console.log("hgjg", item)
    if (!item || !item.users || item.users.length < 2) {
      return null;
    }

    const senderUid = item.users[0];
    const ownerUid = item.users[1];
    const currentUserIsLastMessageUser = user.uid === item.LastMessageUser;
    const images = [
      { url: item.imageUrl },
      // Add more images as needed
    ];

    if (
      (displayType === 'Sent' && user.uid !== senderUid) ||
      (displayType === 'Received' && user.uid !== ownerUid)
    ) {
      return null;
    }

    const displayName =
      user.uid === ownerUid ? item.senderName : item.ownerName;
    console.log("saj----------------------==>", item)
    // user.uid === ownerUid ? item.ownerProfilePicture : item.ownerProfilePicture;

    const userImage =
      user.uid === ownerUid ? item.senderProfile : item.ownerProfilePicture;
    // console.log("sajhfgjfgajfg====>", userImage)


    return (
      <View
        style={{ paddingHorizontal: 30, marginVertical: 5, elevation: 5, }}
      >
        <View style={styles.container}>
          <View style={styles.profileContainer}>
            <Modal
              visible={modalVisible}
              transparent={true}
              onRequestClose={() => {
                Alert.alert('Modal has been closed.');
                setModalVisible(!modalVisible);
              }}
            >
              <ImageViewer onClick={() => setModalVisible(!modalVisible)} imageUrls={[{
                url: selectedImage,
              }]} />
            </Modal>
            <TouchableOpacity onPress={() => {
              setSelectedImage(item.imageUrl)
              showSlider()
            }}>
              {/* Make sure to replace 'post.images[1].url' with the correct source for your Image component */}
              <CacheImage uri={item.imageUrl} style={styles.image} />
            </TouchableOpacity>
          </View>
          <View style={styles.messageContainer}>
            <View>
              <TouchableOpacity style={styles.trashBtn} onPress={() => removeChat(item.id)}>
                <Feather name="trash-2" size={20} color="black" />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.text}>{item.cat}</Text>
                <Text style={styles.text}>${item.priceProduct}</Text>
              </View>

              <Text style={styles.ownerName}>{displayName}</Text>
              <Text style={styles.subtext}>Product Size: {item.sizeProduct}</Text>
              <Text style={styles.subtext}>Delivery Options: </Text>
              <TouchableOpacity style={styles.selfPickupBtn}
                onPress={async () => {
                  navigation.navigate('Chat', {
                    chatId: item.id,
                    displayName,
                    userImage: item.imageUrl,
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
                  await userRef.update({ newMessages: userNewMessages });
                  setNewMessages(
                    userNewMessages.map(chatId => ({ chatId, newMessage: false })),
                  );

                  // Mark the last message as read if the last message wasn't sent by current user
                  if (!currentUserIsLastMessageUser) {
                    const chatRef = firebase
                      .firestore()
                      .collection('chats')
                      .doc(item.id);
                    await chatRef.update({ lastMessageRead: true });
                  }
                }}
              >
                <Text style={styles.Btntext}>Chat With {user.uid === ownerUid ? "Buyer" : "Seller"}</Text>
              </TouchableOpacity>

              <View style={styles.userInfoBox}>
                {/* {!currentUserIsLastMessageUser && !item.lastMessageRead && ( */}
                <>
                  <Image
                    source={{ uri: userImage }}
                    style={styles.userImage}
                  />
                  <Text style={styles.lastMessageText}>{item.lastMessage}</Text>
                </>
                {/* )} */}

              </View>


              <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
                <View style={{ flexDirection: "column" }}>
                  <TouchableOpacity style={styles.Btn} onPress={() => navigation.navigate('Delivery', { screen: "DeliveryScreen", type: "Dropbox" })}>
                    <Text style={styles.Btntext}>Post Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.IconBtn} onPress={() => navigation.navigate('Delivery', { screen: "DeliveryScreen", type: "Dropbox" })}>
                    <Entypo name="plus" size={30} color="black" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "column" }}>
                  <TouchableOpacity style={styles.Btn} onPress={() => navigation.navigate('Delivery', { screen: "DeliveryScreen", type: "Delivery" })}>
                    <Text style={styles.Btntext}>Delivery Driver</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.IconBtn} onPress={() => navigation.navigate('Delivery', { screen: "DeliveryScreen", type: "Delivery" })}>
                    <MaterialCommunityIcons name="truck-delivery" size={25} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={visibleChats}
      keyExtractor={item => item.id.toString()}
      renderItem={renderChatItem}
    />
  );
}
