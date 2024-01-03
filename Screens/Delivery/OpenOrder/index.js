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
  Modal,
  TextInput,
} from 'react-native';
import {firebase, auth} from '../../../firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import useChat from '../../useHooks/useChat';

const db = firebase.firestore();

export default function DeliversList({navigation}) {
  const {initiateChat, chatPartiesInfo} = useChat();
  const [userInfo, setUserInfo] = useState({});
  const [orders, setOrders] = useState([]);
  const [orderInfo, setOrderInfo] = useState({});
  const [orderModal, setOrderModal] = useState(false);

  const isDelierer = userInfo?.deliverer || false;

  const getAuthInfo = async () => {
    const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const data = docSnap.data();
    setUserInfo(data);
  };

  useEffect(() => {
    getAuthInfo();
    const ordersRef = db.collection('open-orders').where('active', '==', true);
    const subscriber = ordersRef.onSnapshot(snapsList => {
      const ordersArray = [];
      snapsList.forEach(doc => {
        const docInfo = doc.data();
        ordersArray.push({...docInfo, key: doc.id});
      });
      setOrders(ordersArray);
    });
    return () => subscriber(); // Unsubscribe from Firestore on unmount
  }, []);

  const createOrder = async () => {
    try {
      const {pickup, dropoff, orderPrice} = orderInfo || {};
      if (pickup && dropoff && orderPrice) {
        // Add a new document to the 'open-orders' collection
        await db.collection('open-orders').add({
          ...orderInfo,
          user: auth.currentUser.uid,
          active: true,
          createdAt: new Date(),
          userInfo,
        });
        setOrderInfo({});
        setOrderModal(false);
      } else {
        Alert.alert('all fields are mendatory');
      }
    } catch (error) {
      Alert.alert('Error adding document: ', error.message);
    }
  };

  const removeOrder = async id => {
    const docRef = doc(db, 'open-orders', id);
    await updateDoc(docRef, {active: false}).catch(error => {
      Alert.alert('Error updating document: ', error);
    });

    setUserInfo(pre => ({...pre, deliverer: !isDelierer}));
  };

  const messagePress = async item => {
    const {user: deliveryUserId, key} = item || {};

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

  const OpenOrderRendrer = ({item, index}) => {
    const {orderPrice, pickup, dropoff} = item;
    return (
      <TouchableWithoutFeedback
        key={index}
        // onPress={() => navigation.navigate()}
      >
        <View style={styles.userContainer}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              // backgroundColor: 'red',
              paddingRight: 20,
              paddingVertical: 10,
              flex: 1,
            }}>
            <Text style={styles.normalText}>{`${pickup} to ${dropoff}`}</Text>

            <Text style={styles.normalText}>{`$${orderPrice}`}</Text>
          </View>
          <Feather
            onPress={() => messagePress(item)}
            name={'message-circle'}
            size={24}
            color={'#000'}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const MyOrderRendrer = ({item, index}) => {
    const {orderPrice, pickup, dropoff, key} = item;
    return (
      <TouchableWithoutFeedback
        key={index}
        // onPress={() => navigation.navigate()}
      >
        <View style={styles.userContainer}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              paddingRight: 20,
              paddingVertical: 10,
              flex: 1,
            }}>
            <Text style={styles.normalText}>{`${pickup} to ${dropoff}`}</Text>
            <Text style={styles.normalText}>{`$${orderPrice}`}</Text>
          </View>
          <Feather
            onPress={() => removeOrder(key)}
            name={'trash-2'}
            size={24}
            color={'#c70000'}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const myOrders = orders?.filter(order => order.user === auth.currentUser.uid);
  const AllOrders = orders?.filter(
    order => order.user !== auth.currentUser.uid,
  );

  return (
    <View style={styles.body}>
      <View style={styles.infoContainer}>
        <Text style={styles.text}>Open Orders</Text>
      </View>
      <FlatList data={AllOrders} renderItem={OpenOrderRendrer} />
      <View style={styles.infoContainer}>
        <Text style={styles.text}>My Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setOrderModal(true)}>
          <Feather name={'plus'} size={22} color={'#fff'} />
        </TouchableOpacity>
      </View>
      <FlatList data={myOrders} renderItem={MyOrderRendrer} />
      <Modal animationType="fade" transparent={true} visible={orderModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.inputContainer}
              onChangeText={text => setOrderInfo({...orderInfo, pickup: text})}
              value={orderInfo?.pickup}
              placeholder="Type Pickup location"
              placeholderTextColor={"gray"}
            />
            <TextInput
              style={styles.inputContainer}
              onChangeText={text => setOrderInfo({...orderInfo, dropoff: text})}
              value={orderInfo?.dropoff}
              placeholder="Type dropoff location"
              placeholderTextColor={"gray"}
            />
            <TextInput
              style={styles.inputContainer}
              onChangeText={text =>
                setOrderInfo({...orderInfo, orderPrice: text})
              }
              value={orderInfo?.orderPrice}
              placeholder="Type Delivery price"
              keyboardType="numeric"
              placeholderTextColor={"gray"}
            />
            <View style={{flexDirection: 'row', alignSelf: 'flex-end'}}>
              <TouchableOpacity
                onPress={() => setOrderModal(false)}
                style={{
                  ...styles.actionButton,
                  backgroundColor: 'red',
                  marginRight: 10,
                }}>
                <Text style={{...styles.buttonText}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createOrder}
                style={{...styles.actionButton, backgroundColor: 'green'}}>
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 30,
    height: 30,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },

  normalText: {
    fontSize: 16,
    fontWeight: 600,
  },

  // Modal
  modalContainer: {
    backgroundColor: '#00000030',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#f7f7f7',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 20,
  },
  inputContainer: {
    height: 40,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    color: '#000',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 2, height: 2},
  },
  actionButton: {
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
