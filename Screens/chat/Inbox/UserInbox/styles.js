import {StyleSheet} from 'react-native';

export default styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  ownerName: {
    color: 'gray',
    fontSize: 14,
    marginHorizontal: 5,
    marginVertical: 2,
  },
  lastMessageText: {
    color: 'gray',
    fontSize: 14,
    marginHorizontal: 5,
    marginVertical: 2,
    // textDecorationLine: "underline",
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  profileContainer: {
    marginRight: 10,
  },
  image: {
    width: 130,
    height: 200,
    borderRadius: 15,
  },
  userInfoBox: {
    // padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // change this to adjust transparency
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: "center",
    marginVertical: 2
  },
  userImage: {
    width: 30, // Updated this
    height: 30, // Updated this
    borderRadius: 12.5, // Updated this
    marginRight: 5, // Updated this
  },
  messageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  match: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
     fontSize: 16,
     fontWeight: "700",
     marginHorizontal: 5
  },
  subtext: {
    fontSize: 12,
    color: '#7c7c7c',
    fontWeight: "bold",
    marginHorizontal: 7,
    marginVertical: 1
  },
  trashBtn: {
    top: 5, 
    bottom: 0,
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
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#007BFF',
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
  selfPickupBtn: {
    width: 105,
    padding: 2,
    flexDirection: "row",
    // borderBottomWidth: 1, // Add underline
    // borderBottomColor: 'black', // Set the underline color
    marginVertical: 2,
    marginHorizontal: 5,
  },
  Btn: {
    padding: 2,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    marginVertical: 2,
    // borderBottomWidth: 1, // Add underline
    // borderBottomColor: 'black', // Set the underline color
  },
  IconBtn: {
    width: 70,
    height: 30,
    flexDirection: "row",
    backgroundColor: "rgb(193 193 193)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    elevation: 2,
    borderRadius: 3,
    marginVertical: 5
  },
  trashBtn: {
    flexDirection: "row",
    justifyContent: "flex-end",
    bottom: 15,
    marginVertical: 5
  },
  Btntext: {
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 2,
  },
  userImage: {
    width: 22, // Updated this
    height: 22, // Updated this
    borderRadius: 12.5, // Updated this
    marginRight: 5, // Updated this
    marginHorizontal: 5
  },
  
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    elevation: 5,
  },
  Modalimage: {
    flex: 1,
    borderRadius: 5,
    marginLeft: 10,
  },
  
});
