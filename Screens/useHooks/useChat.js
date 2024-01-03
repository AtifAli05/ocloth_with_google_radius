import {v4 as uuidv4} from 'uuid';
import {firebase, auth} from '../../firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';

const db = firebase.firestore();

const useHook = () => {
  const firebaseUser = async id => {
    const ref = doc(db, 'users', id);
    const snapDoc = await getDoc(ref);
    const data = snapDoc.data();
    return {ref, data};
  };

  const initiateChat = async (counterPartyId, key) => {
    try {
      const authUserId = auth.currentUser.uid;
      const chatId = uuidv4();

      const {ref: au_Ref, data: au_Data} = await firebaseUser(authUserId);
      const {ref: cp_Ref, data: cp_Data} = await firebaseUser(counterPartyId);

      const chatsListWithKey = await db
        .collection('delivery-chats')
        .where('uniqueId', '==', key)
        .where('users', 'array-contains', authUserId)
        .get();

      const chatList = chatsListWithKey.docs.map(chatDoc => {
        return {id: chatDoc.id, ...chatDoc.data()};
      });

      if (chatList.length > 0) {
        return {success: chatList};
      } else {
        //   const chatRef = await getDoc(doc(db, 'delivery-chats', chatId));
        const chatRef = db.collection('delivery-chats').doc(chatId);

        const chatData = {
          users: [authUserId, counterPartyId],
          LastMessageUser: authUserId,
          lastMessage: '',
          uniqueId: key,
          lastMessageRead: false,
          [authUserId]: au_Data,
          [counterPartyId]: cp_Data,
        };

        await chatRef.set(chatData);

        await chatRef.collection('messages').add({
          sender: authUserId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        const updateObj = {
          'delivery-chats': firebase.firestore.FieldValue.arrayUnion(chatId),
        };

        await updateDoc(au_Ref, updateObj);
        await updateDoc(cp_Ref, updateObj);
        return {success: [{id: chatId, ...chatData}]};
      }
    } catch (error) {
      return {error};
    }
  };

  const chatPartiesInfo = chatInfo => {
    const {users} = chatInfo;
    const chatParties = users.filter(id => id !== auth.currentUser.uid);
    return chatParties.map(partyKey => chatInfo[partyKey]);
  };

  return {
    initiateChat,
    chatPartiesInfo,
  };
};

export default useHook;
