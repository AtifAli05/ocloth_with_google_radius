import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, TextInput, StyleSheet, Text, View, Image } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location'; // Make sure to install expo-location
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import assets from '../Assets/assets';

const MapScreen = () => {
  const navigation = useNavigation();
  const [defaultRadius] = useState(5); 
  const [searchQuery, setSearchQuery] = useState('');
  const [userSelectedRadius, setUserSelectedRadius] = useState(defaultRadius);
  const [region, setRegion] = useState({
    latitude: 37.78825, 
    longitude: -122.4324, 
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
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
  }, []); // Run only once when the component mounts

  const handleBackButton = () => {
    // Navigate back to the home screen
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={{paddingTop:7, paddingHorizontal:5}}>
              <AntDesign name="back" size={30} color="black" />
        </TouchableOpacity>
        <View>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Account"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="always"
          />
        </View>
        </View>
      </View>
      <View style={styles.main}>
        <MapView style={styles.map} region={region}>
          {/* Marker for current location */}
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
            <Image source={assets.pinIcon} style={{ width: 40, height: 40 }} />
          </Marker>

          {/* Circle for selected radius */}
          <Circle
            center={{ latitude: region.latitude, longitude: region.longitude }}
            radius={userSelectedRadius * 1609.34} // Convert miles to meters
            strokeColor="transparent"
            fillColor="rgba(0, 0, 255, 0.3)" // Blue with transparency
          />
        </MapView>
      </View>
      <View style={styles.footer}>
        <Text style={styles.text_footer}>Map Screen</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12
  },
  backButton: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
  logo: {
    width: 50,
    height: 50,
  },
  searchBar: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#D1D1D1',
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    borderRadius: 6,
    fontSize: 16,
  },
  main: {
    flex: 8,
    backgroundColor: 'red',
  },
  map: {
    flex: 1,
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
  },
  text_footer: {
    color: 'white',
    fontSize: 18,
  },
});

export default MapScreen;
