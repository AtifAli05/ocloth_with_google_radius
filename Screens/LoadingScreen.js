import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

const LoadingScreen = () => (
  <View style={styles.container}>
    <Image
      style={styles.image}
      source={require('../Assets/dualball.gif')}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: 200,
    height: 200,
  },
});

export default LoadingScreen;
