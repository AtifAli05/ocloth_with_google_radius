import React, {useState} from 'react';
import {View, FlatList, StatusBar, StyleSheet} from 'react-native';
import {ListItem, Avatar, SearchBar} from 'react-native-elements';

const listData = [];

const AllUser = () => {
  const [search, setSearch] = useState('');

  const renderItem = ({item}) => (
    <ListItem bottomDivider containerStyle={styles.listItemContainer}>
      <Avatar
        source={{uri: item.avatar_url}}
        rounded
        title={item.name}
        size="medium"
      />
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle}>
          {item.name}
        </ListItem.Title>
        <ListItem.Subtitle style={styles.listItemSubtitle} numberOfLines={1}>
          {item.subtitle}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SearchBar
        placeholder="Search by name..."
        onChangeText={val => setSearch(val)}
        value={search}
        containerStyle={styles.searchContainer}
        inputStyle={styles.searchInput}
      />
      <FlatList
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        data={listData}
        renderItem={renderItem}
      />
    </View>
  );
};

export default AllUser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    elevation: 2,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
  },
  searchInput: {
    fontSize: 15,
    fontFamily: FONTS.Regular,
    color: COLORS.black,
    opacity: 0.7,
  },
  listItemContainer: {
    paddingVertical: 7,
    marginVertical: 2,
  },
  listItemTitle: {
    fontFamily: FONTS.Medium,
    fontSize: 14,
  },
  listItemSubtitle: {
    fontFamily: FONTS.Regular,
    fontSize: 12,
  },
});
