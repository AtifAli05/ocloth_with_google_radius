import {StyleSheet} from 'react-native';
import {StatusBar} from 'expo-status-bar';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    marginHorizontal: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    maxHeight: '70%',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    alignSelf: 'center',
  },
  searchBarContainer: {
    marginVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderColor: '#D1D1D1',
    borderWidth: 1,
    borderRadius: 50,
    width: '90%',
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    fontSize: 16,
  },
  // Rendrer Items Styles
  userContainer: {
    flexDirection: 'row',
    padding: 10, 
    marginHorizontal: 10,
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
  userImage: {
    width: 35,
    height: 35,
    borderRadius: 25,
    marginRight: 8,
  },
  postCount: {
    flex: 1,
    textAlign: 'right',
  },
});
