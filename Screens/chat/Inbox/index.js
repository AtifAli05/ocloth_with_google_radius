import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {Feather} from '@expo/vector-icons';

import Header from '../../../components/utils/Header';

import UserInbox from './UserInbox';
import DeliveryInbox from './DeliveryInbox';

import styles from './styles';

export default function MessagesScreen({navigation}) {
  const [displayType, setDisplayType] = useState('Sent');

  const isSent = displayType === 'Sent';
  const isReceived = displayType === 'Received';
  const isDelivery = displayType === 'delivery';

  return (
    <View style={styles.safeArea}>
      <Header title={'Chats'} subtitle={'View your conversations here.'} />

      <View style={styles.body}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isSent ? styles.activeTab : null,
              {borderRadius: 100},
            ]}
            onPress={() => setDisplayType('Sent')}>
            <Text
              style={[styles.tabText, isSent ? styles.activeTabText : null]}>
              Sent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, isReceived ? styles.activeTab : null]}
            onPress={() => setDisplayType('Received')}>
            <Text
              style={[
                styles.tabText,
                isReceived ? styles.activeTabText : null,
              ]}>
              Received
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isDelivery ? styles.activeTab : null,
              {borderRadius: 100},
            ]}
            onPress={() => setDisplayType('delivery')}>
            <Feather
              name="truck"
              size={20}
              color={isDelivery ? '#fff' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>

        {(isSent || isReceived) && (
          <UserInbox navigation={navigation} displayType={displayType} />
        )}
        {isDelivery && <DeliveryInbox navigation={navigation} />}
      </View>
    </View>
  );
}
