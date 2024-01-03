import React, {useState, useEffect} from 'react';
import {Image, ActivityIndicator} from 'react-native';
import * as FileSystem from 'expo-file-system';

const CacheImage = ({uri, style, placeholderSource, imageId}) => {
  const [source, setSource] = useState(placeholderSource);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const path = `${FileSystem.cacheDirectory}${filename}`;

      const image = await FileSystem.getInfoAsync(path);
      if (image.exists) {
        setSource({uri: image.uri});
        setIsLoading(false);
        return;
      }

      const newImage = await FileSystem.downloadAsync(uri, path);
      setSource({uri: newImage.uri});
      setIsLoading(false);
    })();
  }, [uri]);

  return (
    <>
      {isLoading ? (
        <ActivityIndicator style={style} />
      ) : (
        <Image style={style} source={source} />
      )}
    </>
  );
};

export default CacheImage;
