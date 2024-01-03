import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {Alert} from 'react-native';
import Swiper from 'react-native-deck-swiper';
// Replace this with the actual path to your CacheImage component
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import {Feather} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import Theme from '../Theme';
import Header from '../components/utils/Header';
import {firebase, auth} from '../firebase';
import CacheImage from './CacheImage';
import {CardContext} from './CardContext';
import LoadingScreen from './LoadingScreen';
import mainLogoIcon from '../Assets/mainlogo.png';
import backArrowIcon from '../Assets/logout.png';
import mapIcon from '../Assets/icon.png';
import * as Location from 'expo-location'; // Make sure to install expo-location

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const cardWidth = windowWidth / 1.1;
const cardHeight = windowHeight / 1.8;

const db = firebase.firestore();

export default function Home() {
  console.log('dasLLLLLss');
  const [data, setData] = useState([]);
  const {handleSwipe} = useContext(CardContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [allCardsSwiped, setAllCardsSwiped] = useState(false);
  const swiperRef = useRef(null);
  const navigation = useNavigation();
  const lottieRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.uid) {
        fetchData(user.uid, selectedCategory);
      } else {
        setData([]);
        console.log('No clothes data available.');
      }
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  useEffect(() => {
    (async () => {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Get the current location
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;

    const userRef = db.collection('users').doc(auth.currentUser.uid);
    await userRef.update({
      expoPushToken: token,
    });
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // swap elements using destructuring
    }
    return array;
  }

  const fetchData = async (userId, category) => {
    setLoading(true);
    if (lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }

    const clothesData = [];
    const userSnapshot = await db.collection('users').doc(userId).get();
    const swipedIds = userSnapshot.data().swiped || [];

    // Fetch the list of blocked users for the current user
    const blockedDoc = await db
      .collection('total_blocked')
      .doc(auth.currentUser.uid)
      .get();
    const blockedUsers = blockedDoc.exists
      ? blockedDoc.data().blockedUsers || []
      : [];

    let users = [];

    if (category === 'Friends') {
      const friendsDoc = await db.collection('total_friends').doc(userId).get();
      if (friendsDoc.exists) {
        users = friendsDoc.data().friends || [];
      }
    } else {
      const usersSnapshot = await db.collection('users').get();
      users = usersSnapshot.docs.map(doc => doc.id);
    }

    // Use Promise.all to make simultaneous database calls
    const clothesPromises = users
      .filter(
        userId =>
          userId !== auth.currentUser.uid && !blockedUsers.includes(userId),
      )
      .map(async userId => {
        const query =
          category !== 'All' && category !== 'Friends'
            ? db
                .collection('users')
                .doc(userId)
                .collection('clothes')
                .where('category', '==', category)
            : db.collection('users').doc(userId).collection('clothes');
        const clothesSnapshot = await query.get();

        // Get the user's name and profile picture
        const userSnapshot = await db.collection('users').doc(userId).get();
        const userName = userSnapshot.data().name;
        const userProfilePicture = userSnapshot.data().profile_picture;
        console.log(
          '////////////////////////.........///////...',
          userProfilePicture,
        );

        const userClothesData = [];
        clothesSnapshot.forEach(clothesDoc => {
          if (!swipedIds.includes(clothesDoc.id)) {
            userClothesData.push({
              id: clothesDoc.id,
              ...clothesDoc.data(),
              currImageIndex: 0,
              ownerName: userName,
              ownerProfilePicture: userProfilePicture,
              ownerId: userId,
            });
          }
        });
        return userClothesData;
      });

    // Resolve all the promises and concatenate the results into clothesData
    const allClothesData = await Promise.all(clothesPromises);
    for (const data of allClothesData) {
      clothesData.push(...data);
    }

    // Shuffle the clothes data array before setting it
    setData(shuffleArray(clothesData));
    setLoading(false);
    setAllCardsSwiped(false);
  };

  function onSwipedAll() {
    setData([]);
    setAllCardsSwiped(true);
  }

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

  const onSwiped = async (index, direction) => {
    const swipedCard = data[index];
    const currentUserId = auth.currentUser.uid;
    const userRef = db.collection('users').doc(currentUserId);
    await userRef.update({
      swiped: firebase.firestore.FieldValue.arrayUnion(swipedCard.id),
    });

    if (direction === 'right') {
      handleSwipe(swipedCard);
      const imageDoc = await db.collection('images').doc(swipedCard.id).get();

      if (!imageDoc.exists) {
        console.error(`No image document found with id: ${swipedCard.id}`);
        return;
      }

      const ownerId = imageDoc.data().userId;
      const imageUrl = imageDoc.data().imageUrl;

      if (!ownerId) {
        console.error(
          `No userId field in the image document with id: ${swipedCard.id}`,
        );
        return;
      }

      const chatId = [currentUserId, ownerId, swipedCard.id].sort().join('-');

      const chatsWithImageAndCurrentUser = await db
        .collection('chats')
        .where('imageId', '==', swipedCard.id)
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

      const chatRef = db.collection('chats').doc(chatId);
      const currentUser = await db.collection('users').doc(currentUserId).get();
      const currentUserData = currentUser.data();
      console.log(
        '==========currentUsercurrentUser==========>',
        currentUserData.profile_picture,
      );
      const currentUserDisplayName = currentUserData.name || 'Unknown';

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
      const userProfilePicture = currentUser.profile_picture;

      // console.log("============jkhjkhk=====>",userProfilePicture)
      await chatRef.set({
        users: [currentUserId, ownerId],
        imageId: swipedCard.id,
        ownerName: imageOwnerDisplayName,
        imageUrl: imageUrl,
        senderName: currentUserDisplayName,
        senderProfile: currentUserData?.profile_picture
          ? currentUserData.profile_picture
          : 'unknown',
        LastMessageUser: currentUserId,
        lastMessage: '',
        lastMessageRead: false,
        cat: swipedCard.category,
        priceProduct: swipedCard.price,
        sizeProduct: swipedCard.size,
        ownerProfilePicture: swipedCard.ownerProfilePicture,
      });

      await chatRef.collection('messages').add({
        sender: currentUserId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await userRef.update({
        chats: firebase.firestore.FieldValue.arrayUnion(chatId),
      });
    }
  };

  const onCategorySelect = category => {
    setSelectedCategory(category);
    setMenuVisible(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const navigateToOwnerAccount = (ownerId, chatId) => {
    console.log('OWNERID', ownerId);
    navigation.navigate('NonEditAccount', {ownerId, chatId});
  };
  console.log('fgfggggggggggggggggggg');
  console.log(region, 'origin');

  return (
    <View style={styles.container}>
      <Header
        title={'Home'}
        subtitle={'Welcome User! Happy shopping.'}
        mainLogoIcon={mainLogoIcon}
        backArrowIcon={backArrowIcon}
        mapIcon={mapIcon}
        // rightIcon={'menu'}
        // rightHandlePress={() => setMenuVisible(!menuVisible)}
      />
      <View style={styles.body}>
        {
          <View
            style={styles.dismissMenuArea}
            // onPress={() => setMenuVisible(false)}
          >
            {/* <View style={styles.dropdownMenu}> */}
            {/* <Text style={[styles.menuItem, styles.menuItemTitle]}>
                Browse
              </Text> */}
            {/* <View style={styles.divider} /> */}
            <View>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
              >
                {[
                  // 'All',
                  "Men's Shirt",
                  "Men's Short",
                  "Men's Pant",
                  "Women's Shirt",
                  "Women's Short",
                  "Women's Pant",
                  '   Shoes   ',
                  '   Hats    ',
                  '  Friends  ',
                ].map(category => (
                  <TouchableOpacity
                    onPress={() => onCategorySelect(category)}
                    style={
                      selectedCategory === category
                        ? styles.lastMenuItem
                        : styles.dropdownMenuBtn
                    }
                    key={category}
                  >
                    <Text
                      style={
                        selectedCategory === category
                          ? styles.lastMenuItemTxt
                          : styles.menuItem
                      }
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* </View> */}
          </View>
        }

        {data.length > 0 && !allCardsSwiped ? (
          <>
            <Swiper
              key={selectedCategory}
              cards={data}
              ref={swiperRef}
              containerStyle={{backgroundColor: '#f7f7f7', marginTop: null}}
              renderCard={(card, cardIndex) => {
                if (!card || !card.images || card.images.length === 0)
                  return null;
                return (
                  <View style={styles.cardContainer}>
                    {card.isLoading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="large"
                          color="#0000ff"
                          style={{transform: [{scale: 2}]}}
                        />
                      </View>
                    )}

                    <View style={styles.userOverlay}>
                      <TouchableOpacity
                        onPress={() => navigateToOwnerAccount(card.ownerId)}
                      >
                        <View style={styles.userInfoBox}>
                          <Image
                            source={{uri: card.ownerProfilePicture}}
                            style={styles.userImage}
                          />
                          <Text style={styles.userName}>{card.ownerName}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.iconTextContainer}>
                      <Feather
                        name="dollar-sign"
                        size={20}
                        color="white"
                        style={styles.iconMargin}
                      />
                      <Text style={styles.cardText}>
                        {card.price || 'Unknown'}
                      </Text>
                    </View>

                    <View style={styles.clothesImageContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setData(prevData =>
                            prevData.map((item, idx) => {
                              if (idx === cardIndex) {
                                return {
                                  ...item,
                                  currImageIndex:
                                    (item.currImageIndex + 1) %
                                    item.images.length,
                                };
                              } else {
                                return item;
                              }
                            }),
                          );
                        }}
                      >
                        <CacheImage
                          style={styles.clothesImage}
                          uri={card.images[card.currImageIndex]}
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,1)']}
                          style={styles.gradientOverlay}
                        >
                          <View style={[Theme.align, {marginVertical: 3}]}>
                            <Feather name="grid" size={12} color="white" />
                            <Text style={styles.cardTextSub}>
                              {card.category || 'Unknown'}
                            </Text>
                          </View>
                          <View style={[Theme.align, {marginVertical: 3}]}>
                            <Feather
                              name="maximize-2"
                              size={12}
                              color="white"
                            />
                            <Text style={styles.cardTextSub}>
                              {card.size || 'Unknown'}
                            </Text>
                          </View>
                        </LinearGradient>
                        <View style={styles.imageIndicatorContainer}>
                          {card.images.map((_, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.imageIndicator,
                                idx === card.currImageIndex
                                  ? styles.imageIndicatorActive
                                  : styles.imageIndicatorInactive,
                              ]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.thumbsUpButton,
                          {backgroundColor: 'white'},
                        ]}
                        onPress={() => swiperRef.current.swipeRight()}
                      >
                        <Feather name="thumbs-up" size={20} color="green" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.button,
                          {backgroundColor: 'white', marginTop: 10},
                        ]}
                        onPress={() => swiperRef.current.swipeLeft()}
                      >
                        <Feather name="thumbs-down" size={20} color="red" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          {backgroundColor: 'white', marginTop: 10},
                        ]}
                        onPress={() => {
                          Alert.alert(
                            'Report Item',
                            'Are you sure you want to report this item?',
                            [
                              {
                                text: 'Cancel',
                                style: 'cancel',
                              },
                              {
                                text: 'Confirm',
                                onPress: () => {
                                  db.collection('Report').add({
                                    imageUrl: card.images[card.currImageIndex],
                                    reportedBy: auth.currentUser.uid,
                                    timestamp:
                                      firebase.firestore.FieldValue.serverTimestamp(),
                                  });
                                  swiperRef.current.swipeLeft();
                                },
                              },
                            ],
                            {cancelable: false},
                          );
                        }}
                      >
                        <MaterialIcons name="flag" size={20} color="orange" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              onSwipedLeft={index => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSwiped(index, 'left');
              }}
              onSwipedRight={index => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onSwiped(index, 'right');
              }}
              onSwipedAll={onSwipedAll}
              stackSize={3}
              stackSeparation={15}
              overlayLabels={{
                left: {
                  title: 'NOPE',
                  style: {
                    label: {
                      backgroundColor: 'red',
                      color: 'white',
                      fontSize: 24,
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      marginTop: 20,
                      marginLeft: -20,
                    },
                  },
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: {
                      backgroundColor: 'green',
                      color: 'white',
                      fontSize: 24,
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      marginTop: 20,
                      marginLeft: 20,
                    },
                  },
                },
              }}
              animateOverlayLabelsOpacity
              animateCardOpacity
            />
          </>
        ) : (
          <View style={styles.noMoreItemsContainer}>
            <Text style={styles.noMoreItemsText}>
              No more items, please check back soon!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconTextContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    zIndex: 10,
    overflow: 'visible',
  },
  iconMargin: {
    marginRight: -5, // Adjust this value to bring them closer or farther apart.
  },

  clothesImageContainer: {
    position: 'relative',
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomLeftRadius: 15, // Add this
    borderBottomRightRadius: 15, // Add this
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: '3.25%',
    right: '2%',
    alignItems: 'center', // Ensures vertical centering of child elements
  },

  thumbsUpButton: {
    backgroundColor: 'white',
    borderRadius: 100,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    marginRight: 10,
    marginTop: 9, // Adjust this value as needed to align the thumbs-up icon
  },

  cardText: {
    fontSize: 20,
    paddingVertical: 1, // Reduce this value
    marginLeft: 8,
    color: 'white',
  },
  cardTextSub: {
    fontSize: 17,
    paddingVertical: 1, // Reduce this value
    marginLeft: 8,
    color: 'white',
  },

  scrollView: {
    maxHeight: 30, // Set a maximum height for the ScrollView
  },
  userInfoBox: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // change this to adjust transparency
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  userOverlay: {
    position: 'absolute',
    top: 5, // Adjust as needed
    left: 5, // Adjust as needed
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2, // Ensure the overlay is above the other elements
  },

  userImage: {
    width: 30, // Updated this
    height: 30, // Updated this
    borderRadius: 12.5, // Updated this
    marginRight: 5, // Updated this
  },

  userName: {
    fontSize: 13, // Updated this
  },
  imageIndicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
  },
  body: {
    flex: 1,
  },
  imageIndicator: {
    width: 30,
    height: 5,
    borderRadius: 5,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  imageIndicatorActive: {
    backgroundColor: 'white',
  },
  imageIndicatorInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
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

  menuButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 2,
    fontWeight: 'bold',
  },
  dismissMenuArea: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // width: '86%',
    zIndex: 1,
    marginHorizontal: 20,
    bottom: 10,
  },
  dropdownMenuBtn: {
    fontSize: 16,
    borderColor: '#808080',
    borderWidth: 2,
    borderRadius: 15,
    padding: 7,
    elevation: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  menuItem: {
    fontSize: 14,
    borderBottomWidth: 1,
    color: 'black',
  },
  lastMenuItem: {
    fontSize: 16,
    backgroundColor: '#808080',
    borderRadius: 15,
    padding: 9,
    elevation: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  lastMenuItemTxt: {
    fontSize: 14,
    borderBottomWidth: 1,
    color: 'white',
  },
  menuItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'gray',
    marginVertical: 5,
  },
  cardContainer: {
    position: 'relative',
    width: cardWidth,
    height: cardHeight,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFEFE',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
  },
  clothesImage: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 15, // Ensure this is rounded
    overflow: 'hidden', // This will make sure child elements do not overflow
  },

  noMoreItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMoreItemsText: {
    fontSize: 20,
    color: '#333',
  },

  button: {
    backgroundColor: 'white',
    borderRadius: 100,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    marginRight: 10,
  },
});
