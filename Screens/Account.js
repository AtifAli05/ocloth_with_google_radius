import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Modal,
} from 'react-native';
import {ScrollView} from 'react-native';
import {ActivityIndicator} from 'react-native';
import {Alert} from 'react-native';
import {Dimensions} from 'react-native';
import Swiper from 'react-native-swiper';
// Replace this with the actual path to your CacheImage component
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {onAuthStateChanged} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  collection,
  orderBy,
} from 'firebase/firestore';
import {deleteDoc} from 'firebase/firestore';
import {serverTimestamp} from 'firebase/firestore';
import {Feather} from '@expo/vector-icons';
import {signOut} from '@firebase/auth';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import logout from '../Assets/logout.png';
import Theme from '../Theme';
import FullButton from '../components/Buttons/FullButton';
import Header from '../components/utils/Header';
import Space from '../components/utils/Space';
import {firebase} from '../firebase';
import CacheImage from './CacheImage';

const Account = () => {
  const [profileImage, setProfileImage] = useState('');
  const [clothesImages, setClothesImages] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal control
  const categories = [
    "Men's Shirt",
    "Men's Short",
    "Men's Pant",
    "Women's Shirt",
    "Women's Short",
    "Women's Pant",
    'Hats',
    'Shoes',
  ];
  const [clothingCategory, setClothingCategory] = useState(null);
  const [clothingPrice, setClothingPrice] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [clothingFileRef, setClothingFileRef] = useState(null);
  const [clothingSize, setClothingSize] = useState(null); // Size state
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false); // Size modal control
  const db = getFirestore();
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Add this state variable to track which image is selected
  const [imageArray, setImageArray] = useState([]);
  const [isImageDetailsVisible, setIsImageDetailsVisible] = useState(false);
  const [photoCount, setPhotoCount] = useState(1); // add this state to control photo number to upload
  const auth = firebase.auth();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]); // Default to the first category

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth(), user => {
      if (user) {
        fetchSingle(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  let unsubscribeClothesImages;

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Stop listening for changes before navigating to Login
        if (unsubscribeClothesImages) {
          unsubscribeClothesImages();
        }
        // Navigate to login
        navigation.navigate('Login');
      })
      .catch(error => {
        console.error('Failed to sign out:', error);
      });
  };

  const fetchClothesImages = async () => {
    const userId = firebase.auth().currentUser.uid;
    const clothesRef = collection(db, 'users', userId, 'clothes');
    const q = query(clothesRef, orderBy('timestamp', 'desc'));
    unsubscribeClothesImages = onSnapshot(q, snapshot => {
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
            timestamp: clothesData.timestamp,
          });
        }
      });
      setClothesImages(clothesList);
    });
  };

  useEffect(() => {
    fetchClothesImages();
  }, []);

  useEffect(() => {
    const userId = firebase.auth().currentUser.uid;

    if (accountName) {
      const docRef = doc(db, 'users', userId);
      updateDoc(docRef, {name: accountName})
        .then(() => {
          // console.log("Document successfully updated!");
        })
        .catch(error => {
          // console.error("Error updating document: ", error);
        });
    }
  }, [accountName, db]);

  useEffect(() => {
    const userId = firebase.auth().currentUser.uid;

    if (profileImage) {
      const docRef = doc(db, 'users', userId);
      updateDoc(docRef, {profile_picture: profileImage})
        .then(() => {
          // console.log("Document successfully updated!");
        })
        .catch(error => {
          // console.error("Error updating document: ", error);
        });
    }
  }, [profileImage, db]);

  const handleSelectCategory = async category => {
    setIsLoadingImage(false); // Set loading state back to false -- stop the loading circle
    setClothingCategory(category);
    setIsModalOpen(false);
    setClothingPrice(null); // reset the clothingPrice
    setIsPriceModalOpen(true); // open the price input modal
  };

  const handleSetPrice = async price => {
    price = Number(price) || 0;
    setClothingPrice(price);
    setIsPriceModalOpen(false); // close the price input modal

    const userId = firebase.auth().currentUser.uid;
    try {
      console.log('clothingFileRef(DOC ID):,', clothingFileRef.name);
      const clothesRef = doc(
        db,
        'users',
        userId,
        'clothes',
        clothingFileRef.name,
      ); // Use the name of the first image as the document name
      console.log('PUSHIN TO FIREBASE->imageArray', imageArray);
      await setDoc(clothesRef, {
        images: imageArray, // Store the array of image URLs
        category: clothingCategory,
        price: clothingPrice,
        userId: userId,
        name: accountName,
        timestamp: serverTimestamp(), // Add this line
      });
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      let currentPhotoCount = userSnapshot.data().photoCount || 0;

      // Increment photoCount by 1 and update in the database
      await updateDoc(userRef, {
        photoCount: currentPhotoCount + 1,
      });

      // New code for pushing to the 'images' collection
      if (imageArray.length > 0) {
        const imageUrl = imageArray[0]; // Get the first image URL
        const imageName = imageUrl.split('/').pop().split('?')[0]; // Extract image file name from URL
        const imageRef = doc(db, 'images', imageName); // Use the image name as the document name
        console.log('IMAGE NAME:', imageName);

        await setDoc(imageRef, {
          imageUrl: imageUrl,
          userId: userId,
        });
      }

      setImageArray([]); // Reset the array for next use
    } catch (error) {
      console.error('Error writing clothes to Firestore: ', error);
    }

    setIsSizeModalOpen(true);
    // console.log('Clothes Image uploaded successfully.');
  };

  const handleSetSize = async () => {
    if (!clothingSize) {
      Alert.alert(
        'Input Required',
        'Please enter a size or description before confirming.',
        [{text: 'OK'}],
      );
      return; // Stay in the modal if there's no input
    }

    // Close the modal once a valid input is given
    setIsSizeModalOpen(false);

    // Get the current user's ID from Firebase
    const userId = firebase.auth().currentUser.uid;

    try {
      console.log('CLOTHINGFILEREF!!!:', clothingFileRef);
      const clothesRef = doc(
        db,
        'users',
        userId,
        'clothes',
        clothingFileRef.name,
      );

      // Update the Firestore document with the size from our state
      await updateDoc(clothesRef, {
        size: clothingSize,
      });

      // Optionally reset the clothingSize state to empty if desired
      setClothingSize(null);
    } catch (error) {
      console.error('Error writing clothes to Firestore: ', error);
    }
  };

  const deleteClothesImage = async id => {
    const userId = firebase.auth().currentUser.uid;
    const clothesRef = doc(db, 'users', userId, 'clothes', id);

    try {
      await deleteDoc(clothesRef);
      console.log('Clothes Image deleted successfully.');
      setIsImageDetailsVisible(false); // close the image details modal
      fetchClothesImages(); // re-fetch the images

      // Fetch current photoCount for the user
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      let currentPhotoCount = userSnapshot.data().photoCount || 0;

      // Ensure the photoCount doesn't go below 0
      let updatedPhotoCount = Math.max(currentPhotoCount - 1, 0);

      // Decrement photoCount by 1 and update in the database
      await updateDoc(userRef, {
        photoCount: updatedPhotoCount,
      });
    } catch (error) {
      console.error('Error in deleteClothesImage function: ', error);
    }
  };

  async function fetchSingle(uid) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setAccountName(docSnap.data().name || '');
      setProfileImage(docSnap.data().profile_picture || '');
      // console.log("Document data:", docSnap.data());
    } else {
      // console.log("No such document!");
    }
  }

  const pickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.cancelled) {
      setProfileImage(result.uri); // save the URI as a string, not an object

      // Upload profile image to Firebase Storage and get the download URL
      try {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const filename = result.uri.substring(result.uri.lastIndexOf('/') + 1);
        const ref = firebase.storage().ref().child(filename);
        await ref.put(blob);
        const downloadURL = await ref.getDownloadURL();
        setProfileImage(downloadURL);

        // Save the download URL to Firestore user document
        const userId = firebase.auth().currentUser.uid; // Assuming you are using Firebase Auth and user is signed in

        // Fetch existing data
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // If there's existing data, update it
          updateDoc(doc(db, 'users', userId), {
            name: docSnap.data().name || accountName,
            profile_picture: downloadURL,
          });
        } else {
          // If there's no existing data, set it
          await setDoc(doc(db, 'users', userId), {
            name: accountName,
            profile_picture: downloadURL,
          });
        }
      } catch (error) {
        console.error('Error during the image upload', error);
      }
    }
  };

  const annotateImage = async base64Image => {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=AIzaSyATLXUKHr0sdUXFxmZ0QFnRcYSkbSM81IY`;

    const body = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'FACE_DETECTION',
              maxResults: 5,
            },
          ],
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    console.log('Response from Google Cloud Vision API:', json.responses);

    if (json.responses && json.responses.length > 0) {
      console.log(json.responses[0]);

      if (
        json.responses[0].faceAnnotations &&
        json.responses[0].faceAnnotations.length > 0
      ) {
        // If any faces are detected, reject the image
        Alert.alert(
          'Error',
          'Image contains human characteristics, please upload a different image',
        );
        setIsLoadingImage(false); // Reset loading state
        return false;
      }

      // If no faces are detected, you can add any additional logic here.
      // Currently, I'm just returning true, indicating the image passed the check.
      return true;
    } else {
      console.error(
        'Google Cloud Vision API did not return any valid response.',
      );
      throw new Error(
        'Google Cloud Vision API did not return any valid response.',
      );
    }
  };

  const pickClothesImage = async () => {
    const userChoice = await new Promise((resolve, reject) => {
      Alert.alert(
        'Upload Photos',
        'Do you want to upload one or two photos for your Clothing Item?',
        [
          {text: 'Front', onPress: () => resolve(1)},
          {text: 'Front and Back', onPress: () => resolve(2)},
          {
            text: 'Cancel',
            onPress: () => reject('User cancelled'),
            style: 'cancel',
          },
        ],
      );
    });

    setPhotoCount(userChoice);
    setIsLoadingImage(true);

    let newImageArray = [...imageArray];

    // Fetch the current user's data
    const currentUser = firebase.auth().currentUser;
    const userRef = firebase
      .firestore()
      .collection('users')
      .doc(currentUser.uid);
    const userData = await userRef.get();
    const isVendor = userData.data().Vendor;

    for (let i = 0; i < userChoice; i++) {
      const userAction = await new Promise(resolve => {
        Alert.alert(
          'Select Image',
          'Would you like to open the camera or use an image from the library?',
          [
            {text: 'Camera', onPress: () => resolve('camera')},
            {text: 'Library', onPress: () => resolve('library')},
            {text: 'Cancel', onPress: () => resolve('cancel'), style: 'cancel'},
          ],
        );
      });

      let result;

      if (userAction === 'camera') {
        const {status} = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'We need camera permissions to make this work!',
          );
          setIsLoadingImage(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
        });
      } else if (userAction === 'library') {
        const {status} =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'We need library access permissions to make this work!',
          );
          setIsLoadingImage(false);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
        });
      } else {
        setIsLoadingImage(false);
        return;
      }

      if (!result.cancelled) {
        const source = {uri: result.uri};

        // Resize the image
        const resizedImage = await ImageManipulator.manipulateAsync(
          source.uri,
          [{resize: {width: 800}}],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );
        let base64Image = resizedImage.base64;

        // Only annotate the image if the user is not a vendor
        if (!isVendor) {
          const hasFace = await annotateImage(base64Image);
          if (!hasFace) {
            // This means there's a face in the image
            setIsLoadingImage(false);
            return;
          }
        }

        const response = await fetch(resizedImage.uri);
        const blob = await response.blob();
        const filename = resizedImage.uri.substring(
          resizedImage.uri.lastIndexOf('/') + 1,
        );
        const ref = firebase.storage().ref().child(filename);
        await ref.put(blob);
        const downloadURL = await ref.getDownloadURL();
        if (i == 0) {
          setClothingFileRef(ref);
        }

        newImageArray.push(downloadURL);
      } else {
        setIsLoadingImage(false);
        return;
      }
    }

    setImageArray(newImageArray);
    setIsLoadingImage(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    console.log('PHOTOCOUNT:', photoCount);
  }, [photoCount]);

  const toggleImageDetails = index => {
    if (index !== null) {
      setSelectedImageIndex(index);
      setIsImageDetailsVisible(true);
    } else {
      setSelectedImageIndex(null);
      setIsImageDetailsVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={'Account'}
        subtitle={'View your Products Here.'}
        rightIcon={'add'}
        rightHandlePress={pickClothesImage}
        leftIconImage={logout} // Pass the imported logout image here
        leftHandlePress={handleLogout} // Your handleLogout function
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickProfileImage}>
            <CacheImage uri={profileImage} style={styles.profileImage} />
          </TouchableOpacity>
          <TextInput
            style={styles.accountNameInput}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Enter Name"
          />
        </View>

        <ScrollView contentContainerStyle={styles.imageContainer}>
          <View style={{flexWrap: 'wrap', flexDirection: 'row', gap: 0}}>
            {clothesImages.map((item, index) => (
              <View style={styles.oneThirdbox} key={index}>
                <TouchableOpacity onPress={() => toggleImageDetails(index)}>
                  <CacheImage
                    uri={item.images[0]}
                    style={styles.clothesImage}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="slide" transparent={false} visible={isModalOpen}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Category:</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={itemValue => setSelectedCategory(itemValue)}
            style={{height: 50, width: '100%'}}>
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
          <TouchableOpacity
            style={styles.okButton}
            onPress={() => {
              handleSelectCategory(selectedCategory); // Use the selected category from state
              setIsModalOpen(false);
            }}>
            <Text style={styles.okButtonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButtonCategory}
            onPress={() => setIsModalOpen(false)}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isSizeModalOpen}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Size/Description:</Text>
            <Text style={styles.exampleText}>
              Example: "M, Nike / 10, Adidas / 12, Lulu"
            </Text>
            <TextInput
              style={styles.inputBox}
              maxLength={15}
              value={clothingSize}
              onChangeText={setClothingSize}
              placeholder="Enter size"
            />
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={handleSetSize}>
              <Text style={styles.categoryButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isPriceModalOpen}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.priceInput}
              onChangeText={text => setClothingPrice(text)}
              value={clothingPrice}
              placeholder="Enter clothing price"
              keyboardType="numeric"
            />
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity
                style={styles.cancelButtonSetPrice}
                onPress={() => setIsPriceModalOpen(false)}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  if (
                    clothingPrice === '' ||
                    clothingPrice === undefined ||
                    clothingPrice == null
                  ) {
                    // You could show an alert, or set some state that causes an error message to display
                    alert('Please enter a price before setting.');
                  } else {
                    handleSetPrice();
                  }
                }}>
                <Text style={styles.doneButtonText}>Set Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {isLoadingImage && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{transform: [{scale: 2}]}}
          />
        </View>
      )}
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
                    label={'Delete'}
                    btnColor={'black'}
                    handlePress={() =>
                      deleteClothesImage(clothesImages[selectedImageIndex].id)
                    }
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

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  okButton: {
    backgroundColor: 'green',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 170,
    alignItems: 'center',
  },

  okButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  inputBox: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    padding: 10,
    width: '100%', // Makes the textbox take the full width minus the padding
    marginBottom: 20,
  },
  exampleText: {
    color: 'grey',
    marginBottom: 10, // Space between the text and the input box
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
  accountNameInput: {
    flex: 1,
    fontSize: 20,
  },
  divider: {
    height: 2,
    backgroundColor: 'gray',
    marginVertical: 30, // Adjust the vertical margin as needed
  },

  clothesImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  plusButton: {
    width: 40,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute', // Add this line to enable positioning
    top: -115, // Adjust the top position as needed
    right: 20, // Adjust the right position as needed
  },
  plusButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  clothesPriceInput: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: screenWidth * 0.05, // 5% of screen width
    justifyContent: 'center', // Center the content vertically
  },
  modalContainerSwiperImage: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 45,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: 'green',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10, // Space between buttons
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonSetSize: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20, // Use marginTop for spacing
    alignItems: 'center',
  },

  cancelButtonSetPrice: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20, // Use marginTop for spacing
    alignItems: 'center',
  },
  imageClicked: {
    opacity: 0.7,
  },
  cancelButtonCategory: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20, // Adjusted to have consistent spacing
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
    borderColor: 'black',
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
export default Account;
