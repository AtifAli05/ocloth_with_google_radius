import React, {useState} from 'react';
import {useAuthState} from 'react-firebase-hooks/auth';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import {auth} from '../../../firebase';

const Message = ({message}) => {
  const [user] = useAuthState(auth);
  const isUserMessage = message.uid === user.uid;
  const [modalVisible, setModalVisible] = useState(false);
  const images = [
    {
      url: message.image,
    },
  ];

  return (
    <View
      style={[styles.messageRow, isUserMessage ? styles.left : styles.right]}>
      <View
        style={[
          styles.chatBubble,
          isUserMessage ? styles.userBubble : styles.otherBubble,
        ]}>
        {message.text && (
          <Text
            style={[
              styles.text,
              isUserMessage ? styles.userText : styles.otherText,
            ]}>
            {message.text}
          </Text>
        )}
        {message.image && (
          <>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image source={{uri: message.image}} style={styles.image} />
            </TouchableOpacity>
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}>
              <ImageViewer
                imageUrls={images}
                enableSwipeDown={true}
                onSwipeDown={() => setModalVisible(false)}
              />
            </Modal>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  chatBubble: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    maxWidth: '70%',
    marginHorizontal: 5,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#007AFF',
  },
  left: {
    flexDirection: 'row-reverse',
    marginLeft: 15,
  },
  right: {
    flexDirection: 'row',
    marginRight: 15,
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: 'white',
  },
  otherText: {
    color: 'black',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
});

export default Message;
