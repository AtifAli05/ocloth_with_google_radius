import React, {createContext, useContext, useState} from 'react';
import {AuthContext} from './AuthContext';
import {db} from './firebase';

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
  const [data, setData] = useState(null);
  const {currentUser} = useContext(AuthContext);

  const handleSelectChat = async chatId => {
    const chatRef = db.collection('chats').doc(chatId);
    const chatData = await chatRef.get();
    setData({
      id: chatId,
      ...chatData.data(),
    });
  };

  return (
    <ChatContext.Provider value={{data, handleSelectChat}}>
      {children}
    </ChatContext.Provider>
  );
};
