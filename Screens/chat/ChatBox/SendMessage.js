import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {Ionicons} from '@expo/vector-icons';
import {firebase, auth} from '../../../firebase';

const SendMessage = ({chatId, isDelivery}) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const db = firebase.firestore();
  const charRef = isDelivery ? 'delivery-chats' : 'chats';
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const {status} =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const sendChatNotification = async (recipientUid, senderName) => {
    console.log('Starting chat notification...');

    try {
      // Fetch recipient's push token from Firestore
      const userDoc = await db.collection('users').doc(recipientUid).get();

      if (!userDoc.exists) {
        throw new Error(`User document for ${recipientUid} does not exist`);
      }

      const expoPushToken = userDoc.data().expoPushToken;

      if (!expoPushToken) {
        throw new Error(`No expo push token for user ${recipientUid}`);
      }

      console.log('Sending push notification...');

      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'New Message 💬',
        body: `Someone messaged you on Vyne`,
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
      const ticketId = responseData.data.id;

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

      if (
        receiptData.data &&
        receiptData.data[ticketId] &&
        receiptData.data[ticketId].status !== 'ok'
      ) {
        throw new Error(`Failed to send notification: ${ticketId}`);
      }

      console.log('Notification sent successfully.');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const sendMessage = async () => {
    Keyboard.dismiss();

    if (message.trim() === '' && image === null) {
      alert('Enter valid message or select an image');
      return;
    }

    const {uid, displayName, photoURL} = auth.currentUser;

    // Upload the image to Firebase Storage and get the download URL
    let imageUrl = '';
    if (image !== null) {
      const response = await fetch(image);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `${charRef}/${chatId}/${Date.now().toString()}`,
      );
      const uploadTask = uploadBytesResumable(storageRef, blob);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          error => {
            console.log('Error in uploading image: ', error);
            reject(error);
          },
          async () => {
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          },
        );
      });
    }

    // Send the message with the image URL
    await addDoc(collection(db, charRef, chatId, 'messages'), {
      text: message,
      image: imageUrl,
      name: displayName,
      avatar: photoURL,
      createdAt: serverTimestamp(),
      uid,
    });

    // Update the "lastMessage" and "LastMessageUser" fields
    await updateDoc(doc(db, charRef, chatId), {
      lastMessage: message,
      LastMessageUser: uid,
      lastMessageRead: false,
    });
    // Get the chat document to find the other user
    try {
      const chatDoc = await db.collection(charRef).doc(chatId).get();

      if (chatDoc.exists) {
        const {users} = chatDoc.data();

        // Find the other user's UID
        const recipientUid = users.find(userId => userId !== uid);

        // Send the notification
        // await sendChatNotification(recipientUid, displayName);
      } else {
        console.error('Document with chatId does not exist');
      }
    } catch (error) {
      console.error('Error fetching chat document:', error);
    }

    // Reset state
    setMessage('');
    setImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#8E8E93"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={{paddingRight: 5}} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {image && <Image source={{uri: image}} style={styles.imagePreview} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 10,
  },
  pickImageButton: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    color: '#000000',
    fontSize: 16,
    paddingBottom: 5,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default SendMessage;
