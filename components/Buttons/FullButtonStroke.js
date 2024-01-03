import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Feather} from '@expo/vector-icons';
import Theme from '../../Theme';

function FullButtonStroke({label, handlePress, icon, btnColor}) {
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, {borderColor: btnColor, borderWidth: 1}]}>
      {icon ? (
        <Feather
          style={{marginRight: 10}}
          name={icon}
          size={20}
          color="white"
        />
      ) : null}
      <Text style={[styles.text, {color: btnColor}]}>{label}</Text>
    </TouchableOpacity>
  );
}
export default FullButtonStroke;

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
  },
  text: {
    fontSize: 17,
    color: '#FFF',
  },
});
