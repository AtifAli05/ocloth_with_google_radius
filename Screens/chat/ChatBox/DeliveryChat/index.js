import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  Text,
} from 'react-native';
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  limit,
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
import {Confirm} from '../../../../components';

const Chat = ({route}) => {
  const {chatId, displayName, userImage} = route.params;
  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const q = query(
      collection(db, 'delivery-chats', chatId, 'messages'),
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

    return () => {
      messagesUnsubscribe();
    };
  }, [chatId]);

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
          <View style={{maxWidth: '80%'}}>
            <Typo xl>
              {displayName.length > 20
                ? displayName.slice(0, 20) + '...'
                : displayName}
            </Typo>
            <Typo s grey>
              You are now chatting...
            </Typo>
          </View>
        </View>

        <TouchableOpacity
          style={{backgroundColor: '#007AFF', padding: 10, borderRadius: 100}}
          onPress={() => setModalVisible(true)}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Add Person</Text>
        </TouchableOpacity>
        <Confirm
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          title={'Add Deliveries'}
          chatId={chatId}
        />
      </View>

      <View style={styles.body}>
        <FlatList
          data={messages}
          renderItem={({item}) => (
            <Message key={item.id} message={item} isDelivery={true} />
          )}
          inverted
          keyExtractor={item => item.id}
        />
        <SendMessage chatId={chatId} isDelivery={true} />
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
