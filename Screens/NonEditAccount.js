import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {ScrollView} from 'react-native';
import {Alert} from 'react-native';
import Swiper from 'react-native-swiper';
import {doc, setDoc, getDoc, onSnapshot, collection} from 'firebase/firestore';
import {arrayUnion, arrayRemove} from 'firebase/firestore';
import {Feather} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import Theme from '../Theme';
import FullButton from '../components/Buttons/FullButton';
import Header from '../components/utils/Header';
import Space from '../components/utils/Space';
import {firebase} from '../firebase';
import CacheImage from './CacheImage';

const NonEditAccount = ({route}) => {
  const ownerId = route.params.ownerId;
  const db = firebase.firestore();

  const [profileImage, setProfileImage] = useState('');
  const [clothesImages, setClothesImages] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Add this state variable to track which image is selected
  const [isImageClicked, setIsImageClicked] = useState(false);
  const [isImageDetailsVisible, setIsImageDetailsVisible] = useState(false);
  const auth = firebase.auth();
  const navigation = useNavigation();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoadingBlockStatus, setIsLoadingBlockStatus] = useState(false);

  useEffect(() => {
    // Fetch single user data (I'm assuming this is what fetchSingle does)
    fetchSingle(ownerId);

    // Fetch clothes images and get the unsubscribe function
    const unsubscribeClothesImages = fetchClothesImages(ownerId);

    // Return a cleanup function
    return () => {
      // Cleanup for fetchClothesImages
      unsubscribeClothesImages();
    };
  }, [ownerId]);

  const fetchClothesImages = ownerId => {
    const clothesRef = collection(db, 'users', ownerId, 'clothes');
    const unsubscribe = onSnapshot(clothesRef, snapshot => {
      let clothesList = [];
      snapshot.docs.forEach(doc => {
        const clothesData = doc.data();
        if (clothesData) {
          clothesList.push({
            id: doc.id,
            images: clothesData.images,
            category: clothesData.category,
            size: clothesData.size,
            price: clothesData.price,
            name: clothesData.name,
          });
        }
      });
      setClothesImages(clothesList);
    });

    return unsubscribe; // Return the unsubscribe function
  };

  async function fetchSingle(ownerId) {
    const docRef = doc(db, 'users', ownerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setAccountName(docSnap.data().name || '');
      setProfileImage(docSnap.data().profile_picture || '');
    } else {
      // console.log("No such document!");
    }
  }

  const toggleImageDetails = index => {
    if (index !== null) {
      setSelectedImageIndex(index);
      setIsImageDetailsVisible(true);
    } else {
      setSelectedImageIndex(null);
      setIsImageDetailsVisible(false);
    }
  };

  const sendPushNotification = async (expoPushToken, title, body) => {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {someData: 'goes here'},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Failed to send push notification: ${response.status}`);
      }

      const responseData = await response.json();

      // Capture the ticket ID for future use like fetching the receipt
      const ticketId = responseData.data.id;

      // Fetch the receipt for further verification if necessary
      const receiptResponse = await fetch(
        'https://exp.host/--/api/v2/push/getReceipts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ids: [ticketId]}),
        },
      );

      const receiptData = await receiptResponse.json();

      // Check the receipt status and handle accordingly
      if (
        receiptData.data &&
        receiptData.data[ticketId] &&
        receiptData.data[ticketId].status !== 'ok'
      ) {
        throw new Error(`Failed to send notification: ${ticketId}`);
      }
    } catch (error) {
      // Handle the error appropriately, you may want to alert the user or log it to an error tracking service
    }
  };

  const handleMessageButtonClick = async imageId => {
    try {
      const imageDoc = await db.collection('images').doc(imageId).get();
      console.log('IMAGEID:', imageId);

      if (!imageDoc.exists) {
        console.error(`No image document found with id: ${imageId}`);
        return;
      }

      const ownerId = imageDoc.data().userId;
      const imageUrl = imageDoc.data().imageUrl;

      if (!ownerId) {
        console.error(
          `No userId field in the image document with id: ${imageId}`,
        );
        return;
      }

      const currentUserId = auth.currentUser.uid;
      const chatId = [currentUserId, ownerId, imageId].sort().join('-');

      const chatsWithImageAndCurrentUser = await db
        .collection('chats')
        .where('imageId', '==', imageId)
        .where('users', 'array-contains', currentUserId)
        .get();

      let chatExists = false;

      chatsWithImageAndCurrentUser.forEach(chatDoc => {
        if (chatDoc.data().users.includes(ownerId)) {
          chatExists = true;
        }
      });

      if (chatExists) {
        Alert.alert('Wait!', 'A chat for this item has already been created.');
        return;
      }

      const userRef = db.collection('users').doc(currentUserId);
      const userDoc = await userRef.get();
      const userChats = userDoc.data().chats || [];

      if (userChats.includes(chatId)) {
        Alert.alert('Error', 'Chat already exists.');
        return;
      }

      const currentUserDisplayName = userDoc.data().name || 'Unknown';

      const imageOwnerUser = await db.collection('users').doc(ownerId).get();
      const imageOwnerUserData = imageOwnerUser.data();
      const imageOwnerDisplayName = imageOwnerUserData.name || 'Unknown';
      const imageOwnerExpoPushToken = imageOwnerUserData.expoPushToken;

      // Send a push notification
      if (imageOwnerExpoPushToken) {
        await sendPushNotification(
          imageOwnerExpoPushToken,
          'Someone Swiped Right!',
          'Someone is interested in your image.',
        );
      }

      const chatData = {
        users: [currentUserId, ownerId],
        imageId: imageId,
        ownerName: imageOwnerDisplayName,
        imageUrl: imageUrl,
        senderName: currentUserDisplayName,
        LastMessageUser: currentUserId,
        lastMessage: '',
        lastMessageRead: false,
      };

      await db.collection('chats').doc(chatId).set(chatData);

      await db.collection('chats').doc(chatId).collection('messages').add({
        sender: currentUserId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await userRef.update({
        chats: firebase.firestore.FieldValue.arrayUnion(chatId),
      });

      console.log('Chat successfully created:', chatId);
      setIsImageDetailsVisible(false);
      navigation.navigate('Messages', {chatId: chatId});
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Confirmation',
      'Would you like to block this person?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            // Add friendId to current user's blocked list in 'total_blocked' collection
            await setDoc(
              doc(db, 'total_blocked', auth.currentUser.uid),
              {
                blockedUsers: arrayUnion(ownerId),
              },
              {merge: true},
            );
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleUnblockUser = async () => {
    Alert.alert(
      'Confirmation',
      'Would you like to unblock this person?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            // Remove friendId from current user's blocked list in 'total_blocked' collection
            await setDoc(
              doc(db, 'total_blocked', auth.currentUser.uid),
              {
                blockedUsers: arrayRemove(ownerId),
              },
              {merge: true},
            );
          },
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'total_blocked', auth.currentUser.uid),
      docSnap => {
        setIsLoadingBlockStatus(true);
        if (docSnap.exists()) {
          const blocked = docSnap.data().blockedUsers.includes(ownerId);
          setIsBlocked(blocked);
        } else {
          setIsBlocked(false);
        }
        setIsLoadingBlockStatus(false);
      },
    );

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Header title={'Account'} subtitle={'View Products Here.'} />

      <View style={styles.body}>
        <View style={styles.header}>
          <CacheImage uri={profileImage} style={styles.profileImage} />
          <Text style={styles.accountNameText}>{accountName}</Text>
          {/* Block/Unblock button placed here */}
          {!isLoadingBlockStatus && (
            <TouchableOpacity
              onPress={isBlocked ? handleUnblockUser : handleBlockUser}
              style={styles.blockButton}>
              <Text style={{textDecorationLine: 'underline', color: '#000000'}}>
                {isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView contentContainerStyle={styles.imageContainer}>
          <View style={{flexWrap: 'wrap', flexDirection: 'row', gap: 0}}>
            {clothesImages.map((item, index) => (
              <View style={styles.oneThirdbox} key={index}>
                <TouchableOpacity onPress={() => toggleImageDetails(index)}>
                  <CacheImage
                    uri={item.images[0]}
                    imageId={item.imageId}
                    style={[
                      styles.clothesImage,
                      isImageClicked && selectedImageIndex === index
                        ? styles.imageClicked
                        : {},
                    ]}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isImageDetailsVisible}>
        <View style={styles.modalContainerSwiperImage}>
          {selectedImageIndex !== null && clothesImages[selectedImageIndex] && (
            <>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {clothesImages[selectedImageIndex].images && (
                  <Swiper
                    index={0}
                    loop={false}
                    showsPagination={false}
                    showsButtons={true}
                    containerStyle={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {clothesImages[selectedImageIndex].images.map(
                      (image, index) => (
                        <CacheImage
                          key={index}
                          uri={image}
                          style={styles.swiperImage}
                        />
                      ),
                    )}
                  </Swiper>
                )}

                <View style={{width: '100%', paddingTop: 20}}>
                  <View
                    style={{
                      borderBottomColor: '#e5e5e5',
                      borderBottomWidth: 1,
                    }}>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: 'bold',
                        paddingBottom: 10,
                      }}>
                      Product Details
                    </Text>
                  </View>

                  <View style={[Theme.align, {marginVertical: 15}]}>
                    <Feather name="grid" size={18} color="black" />
                    <Text style={styles.imageDetailText}>
                      {clothesImages[selectedImageIndex].category}
                    </Text>
                  </View>

                  <View style={[Theme.align, {marginVertical: 15}]}>
                    <Feather name="maximize-2" size={18} color="black" />
                    <Text style={styles.imageDetailText}>
                      {clothesImages[selectedImageIndex].size}
                    </Text>
                  </View>

                  <View style={[Theme.align, {marginVertical: 15}]}>
                    <Feather name="dollar-sign" size={18} color="black" />
                    <Text style={styles.imageDetailText}>
                      {clothesImages[selectedImageIndex].price}
                    </Text>
                  </View>

                  <Space space={15} />

                  <FullButton
                    label={'Message'}
                    btnColor={'black'}
                    handlePress={() => {
                      console.log(
                        'Image Id before function call:',
                        clothesImages[selectedImageIndex],
                      );
                      handleMessageButtonClick(
                        clothesImages[selectedImageIndex].id,
                      );
                    }}
                  />
                </View>
              </View>
            </>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => toggleImageDetails(null)}>
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  blockButton: {
    marginTop: 0, // or any value to give some space
  },
  swiperImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  imageDetailText: {
    fontSize: 16,
    color: '#7c7c7c',
    fontWeight: '600',
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  oneThirdbox: {
    width: '33%',
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#e5e5e5',
    padding: 10,
    borderRadius: 10,
  },
  profileContainer: {
    marginRight: 20,
  },
  profilePictureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 20,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 40,
    marginRight: 10,
  },
  profileImagePlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
    textAlign: 'center',
  },
  accountNameText: {
    // Add your styling for the text here
    flex: 1,
    fontSize: 20,
  },
  divider: {
    height: 2,
    backgroundColor: 'gray',
    marginVertical: 30, // Adjust the vertical margin as needed
  },
  imageContainer: {},
  clothesImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },

  clothesPriceInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 20,
  },

  modalContainerSwiperImage: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 45,
  },
  modalTitle: {
    top: 190,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryButton: {
    top: 200,
    backgroundColor: 'blue',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonSetSize: {
    top: 180,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  cancelButtonSetPrice: {
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  imageClicked: {
    opacity: 0.7,
  },
  cancelButtonCategory: {
    top: 180,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    minWidth: 300,
  },
  priceInput: {
    height: 30,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  priceInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  doneButton: {
    backgroundColor: 'green',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default NonEditAccount;
