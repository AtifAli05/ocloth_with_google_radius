import React, {useState,useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import Header from '../../components/utils/Header';
import DriversTab from './Drivers';
import OpenOrder from './OpenOrder';
import { useRoute } from '@react-navigation/native';


export default function Delivery({navigation, route}) {
  const [displayType, setDisplayType] = useState("");
  const isDelivery = displayType === 'Delivery';
  const isDropbox = displayType === 'Dropbox';
  useEffect(()=>{
    setDisplayType(route.params.type)

  },[route.params.type])

  return (
    <View style={styles.safeArea}>
      <Header title={'Delivery & Dropboxs'} />
      <View style={styles.body}>
        {/* Header Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isDelivery ? styles.activeTab : null,
              {borderTopLeftRadius: 5, borderBottomLeftRadius: 5},
            ]}
            onPress={() => setDisplayType('Delivery')}>
            <Text
              style={[styles.tabText, isDelivery ? styles.activeTabText : null]}>
              Delivery Drivers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isDropbox ? styles.activeTab : null,
              {borderTopRightRadius: 5, borderBottomRightRadius: 5},
            ]}
            onPress={() => setDisplayType('Dropbox')}>
            <Text
              style={[styles.tabText, isDropbox ? styles.activeTabText : null]}>
              Open Orders
            </Text>
          </TouchableOpacity>
        </View>
        {displayType === "Delivery" ? (
          <DriversTab navigation={navigation} />
        ) : (
          <OpenOrder navigation={navigation} />
        )}
      </View>
    </View>
  );
}

// Styles remain the same ...

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  infoContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  buttonsContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },

  button: {
    top: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  body: {
    flex: 1,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007BFF',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#858585',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: '500',
  },

  // item content
  userContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
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
});
