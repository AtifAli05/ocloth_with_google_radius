import React from 'react';
import {Text, StyleSheet} from 'react-native';
import Theme from '../../Theme';

const Typo = ({
  light,
  grey,
  children,
  xl,
  l,
  m,
  s,
  xs,
  fontFamily,
  style,
  ...props
}) => {
  const getFontSizeStyle = () => {
    if (xl) return {fontSize: 24};
    if (l) return {fontSize: 18};
    if (m) return {fontSize: 16};
    if (s) return {fontSize: 14};
    if (xs) return {fontSize: 12};
    return {fontSize: 16}; // Default font size
  };

  const fontStyles = {
    color: grey ? Theme.lightTextColor : Theme.textColor,
  };

  // Merge the font size styles, font family, and provided styles
  const mergedStyles = [getFontSizeStyle(), fontStyles, style];

  return (
    <Text style={mergedStyles} {...props}>
      {children}
    </Text>
  );
};

export default Typo;
