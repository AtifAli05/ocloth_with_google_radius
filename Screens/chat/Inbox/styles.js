import {StyleSheet} from 'react-native';

export default styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  lastMessageText: {
    color: 'gray',
    fontSize: 14,
    marginTop: 4,
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
  profileContainer: {
    marginRight: 10,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  match: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  divider: {
    backgroundColor: 'white',
    top: 20,
  },
  separator: {
    height: 1,
    marginVertical: 10,
    backgroundColor: 'gray',
  },
  buttonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    marginHorizontal: 20,
    marginVertical: 10,
    overflow: 'hidden',
  },
  newMessageDot: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'blue',
  },
  button: {
    top: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  removeButton: {
    color: 'red',
  },
  body: {
    flex: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#007BFF',
    elevation: 2,
    borderRadius: 100
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    color: '#007BFF',
  },
  activeTabText: {
    color: '#fff',
  },
});
