import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import {Feather} from '@expo/vector-icons';
import Theme from '../../Theme';
import Typo from '../Typography/Typo';

function InputBox({
  secureTextEntry,
  multiline,
  placeholder,
  leftIcon,
  keyboardType,
  maxLength,
  onChangeText,
  value,
  hasBtn,
  btnPlaceholder,
  handleButtonPress,
  error,
}) {
  return (
    <View>
      <View
        style={[
          styles.container,
          ,
          {
            height: multiline ? 80 : 50,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}>
        <View style={Theme.align}>
          {leftIcon ? (
            <Feather
              style={{marginRight: 10}}
              name={leftIcon}
              size={20}
              color={'black'}
            />
          ) : null}
          <TextInput
            secureTextEntry={secureTextEntry ? secureTextEntry : false}
            value={value}
            multiline={multiline ? multiline : false}
            onChangeText={onChangeText}
            maxLength={maxLength}
            keyboardType={keyboardType}
            placeholderTextColor={Theme.lightTextColor}
            style={[styles.input]}
            placeholder={placeholder}
            autoCapitalize="none"
          />
        </View>
        {hasBtn ? (
          <TouchableOpacity
            onPress={handleButtonPress}
            style={styles.roundedbtn}>
            <Typo xs>{btnPlaceholder}</Typo>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Typo xs style={{color: 'red', marginTop: 5}}>
          {error}
        </Typo>
      ) : null}
    </View>
  );
}
export default InputBox;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 15,
    flexDirection: 'row',
    paddingVertical: 7,
    borderColor: '#e5e5e5',
    justifyContent: 'space-between',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  input: {
    fontSize: 15,
    maxWidth: '100%',
    flex: 1,
  },
  roundedbtn: {
    borderRadius: 100,
    backgroundColor: 'black',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
