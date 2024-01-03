import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import {MaterialIcons, Feather} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import { Entypo, AntDesign } from '@expo/vector-icons';

function Header({
  title,
  hasBackIcon,
  rightHandlePress,
  rightIcon,
  subtitle,
  leftImage,
  handleImgPress,
  leftIconImage, // New prop
  leftHandlePress, // New prop
  mainLogoIcon, // New prop
  backArrowIcon,
  mapIcon
}) {
  const navigation = useNavigation();
  return (
    <SafeAreaView>
      <View style={styles.container}>
        
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          {hasBackIcon ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather
                style={{marginRight: 15}}
                name="chevron-left"
                size={28}
                color="black"
              />
            </TouchableOpacity>
          ) : null}
          {leftImage ? (
            <TouchableOpacity onPress={handleImgPress} style={styles.circle}>
              {leftImage ? (
                <Image source={{uri: leftImage}} style={styles.profileImage} />
              ) : null}
            </TouchableOpacity>
          ) : null}
            {mainLogoIcon ? (
              <View style={{flexDirection: 'row', display:'flex', justifyContent:'space-between', width:'100%' }}>
               <TouchableOpacity style={styles.IconBtn} onPress={() => navigation.navigate('MapScreen')}>
                    <AntDesign name="back" size={30} color="black" />
                </TouchableOpacity>
                <View> 
                   <Image source={mainLogoIcon} style={{width: 100, height: 100 }}/> 
                </View>
                <TouchableOpacity style={styles.IconBtn} onPress={() => navigation.navigate('MapScreen')}>
                    <Entypo name="location-pin" size={30} color="black" />
                </TouchableOpacity>
              </View>
            ) : 
              <View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            }
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {leftIconImage ? (
            <TouchableOpacity onPress={leftHandlePress}>
              <Image
                source={leftIconImage}
                style={{width: 24, height: 24, marginRight: 16}}
              />
            </TouchableOpacity>
          ) : null}
          {rightIcon ? (
            <TouchableOpacity onPress={rightHandlePress}>
              <MaterialIcons name={rightIcon} size={24} color="black" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
export default Header;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 25 : 25,
    paddingBottom: Platform.OS === 'android' ? 15 : 25,
  },
  title: {
    fontSize: 23,
    textTransform: 'capitalize',
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    textTransform: 'capitalize',
    opacity: 0.6,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#e5e5e5',
    marginRight: 15,
    marginTop: 5,
  },
  IconBtn: {
    width: 70,
    height: 30,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    elevation: 2,
    borderRadius: 3,
    marginVertical: 5
  },
});
