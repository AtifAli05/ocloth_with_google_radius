import React, {useState, useEffect} from 'react';
const _ = require('lodash');
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import {firebase} from '../firebase';
import {Feather} from '@expo/vector-icons';

export default function Search({navigation}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [showFilters, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');

  useEffect(() => {
    let subscriber;
    if (searchQuery.length > 0) {
      subscriber = firebase
        .firestore()
        .collection('users')
        .where('name', '>=', searchQuery)
        .where('name', '<=', searchQuery + '\uf8ff')
        .onSnapshot(updateUsersFromSnapshot);
    } else {
      subscriber = firebase
        .firestore()
        .collection('users')
        .onSnapshot(updateUsersFromSnapshot);
    }

    return () => subscriber(); // Unsubscribe from Firestore on unmount
  }, [searchQuery]);

  const updateUsersFromSnapshot = querySnapshot => {
    const usersArray = [];
    querySnapshot.forEach(documentSnapshot => {
      const userData = documentSnapshot.data();
      usersArray.push({
        ...userData,
        photoCount: userData.photoCount || 0, // Default to 0 if photoCount doesn't exist
        key: documentSnapshot.id,
      });
    });

    // Sorting users by photoCount in descending order
    usersArray.sort((a, b) => b.photoCount - a.photoCount);

    setUsers(usersArray);
  };

  const filterText = [
    {name: 'Name', key: 'name'},
    {name: 'Post', key: 'photoCount'},
  ];

  const ItemRendrer = ({item, index}) => {
    const {key, profile_picture, name, photoCount} = item;
    return (
      <TouchableWithoutFeedback
        onPress={() => navigation.navigate('NonEditAccount', {ownerId: key})}>
        <View
          style={[
            styles.userContainer,
            searchQuery
              ? null
              : index === 0
              ? styles.gold
              : index === 1
              ? styles.silver
              : index === 2
              ? styles.bronze
              : null,
          ]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image source={{uri: profile_picture}} style={styles.userImage} />
            <Text style={styles.userName}>{name}</Text>
          </View>
          <Text style={styles.postCount}>Posts: {photoCount || 0}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  let List = _.sortBy(users, selectedFilter);
  if (selectedFilter === 'photoCount') {
    List = _.reverse(List);
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity>
            <Feather name={'search'} size={23} color={'#919191'} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Account"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="always"
          />
          <TouchableOpacity onPress={() => setShowFilter(!showFilters)}>
            <Feather name={'filter'} size={23} color={'#919191'} />
          </TouchableOpacity>
        </View>
      </View>
      {showFilters && (
        <View style={styles.filterContainer}>
          {filterText.map(({name, key}, index) => {
            return (
              <View key={index}>
                <TouchableOpacity
                  onPress={() => setSelectedFilter(key)}
                  key={index}>
                  <View
                    style={[
                      styles.filterBy,
                      selectedFilter === key ? styles.selectedFilter : null,
                    ]}>
                    <Text
                      style={[
                        styles.filtertext,
                        selectedFilter === key ? styles.selectedText : null,
                      ]}>
                      {name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
      <FlatList data={List} renderItem={ItemRendrer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    marginTop: StatusBar.currentHeight,
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 6,
  },
  searchInput: {
    flex: 1,
    borderRadius: 6,
    fontSize: 16,
  },
  userContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 10,
    marginHorizontal: 25,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 2, height: 2},
  },
  postCount: {
    flex: 1,
    textAlign: 'right',
  },
  gold: {
    borderColor: '#ffd700',
    borderWidth: 2,
    borderStyle: 'solid',
    shadowColor: '#ffd700',
    shadowOpacity: 0.7,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
  },
  silver: {
    borderColor: '#c0c0c0',
    borderWidth: 2,
    borderStyle: 'solid',
    shadowColor: '#c0c0c0',
    shadowOpacity: 1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
  },

  bronze: {
    borderColor: '#cd7f32',
    borderWidth: 2,
    borderStyle: 'solid',
    shadowColor: '#cd7f32',
    shadowOpacity: 0.7,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
  },
  userImage: {
    width: 35,
    height: 35,
    borderRadius: 25,
    marginRight: 8,
  },
  nameAndPostsContainer: {
    flexDirection: 'column',
  },
  photoCountText: {
    marginTop: 4,
    fontSize: 14,
    color: 'gray',
  },

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingBottom: 8,
    marginBottom: 12,
  },
  filterBy: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filtertext: {
    fontSize: 16,
    fontWeight: 600,
  },
  // Selected Styles
  selectedFilter: {
    backgroundColor: '#007BFF',
    borderRadius: 20,
  },
  selectedText: {
    color: '#fff',
  },
});
