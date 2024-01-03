import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Feather} from '@expo/vector-icons';
import Theme from '../../Theme';

function FullButton({label, handlePress, icon, btnColor, loading}) {
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, {backgroundColor: btnColor}]}>
      {loading ? (
        <ActivityIndicator color="white" size={'small'} />
      ) : (
        <>
          {icon ? (
            <Feather
              style={{marginRight: 10}}
              name={icon}
              size={20}
              color="white"
            />
          ) : null}
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
export default FullButton;

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
