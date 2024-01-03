import React, {createContext, useState} from 'react';

export const CardContext = createContext();

export const CardProvider = ({children}) => {
  const [swipedCard, setSwipedCard] = useState(null);

  const handleSwipe = card => {
    const {id, ...rest} = card; // Extract the ID from the card object
    setSwipedCard({id, ...rest}); // Set the swipedCard with the ID property
  };

  return (
    <CardContext.Provider value={{swipedCard, handleSwipe}}>
      {children}
    </CardContext.Provider>
  );
};
