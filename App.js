import 'react-native-get-random-values'
import React, {useEffect, useState} from 'react';
import {StyleSheet, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {onAuthStateChanged} from 'firebase/auth';
import {Feather} from '@expo/vector-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthProvider} from './AuthContext';
import Account from './Screens/Account';
import {CardProvider} from './Screens/CardContext';

import DeleteAccountScreen from './Screens/DeleteAccountScreen';
import Home from './Screens/Home';
import LoginScreen from './Screens/LoginScreen';
import NonEditAccount from './Screens/NonEditAccount';
import RegisterScreen from './Screens/RegisterScreen';
import Search from './Screens/Search';
import MapScreen from './Screens/MapScreen'

import {InboxScreen, UserChats, DevliveryChat} from './Screens/chat';

import Delivery from './Screens/Delivery';
import Theme from './Theme';
import {auth} from './firebase';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

const SearchStack = createStackNavigator();

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{headerShown: false}}>
      <SearchStack.Screen name="Search" component={Search} />
      <SearchStack.Screen name="NonEditAccount" component={NonEditAccount} />
    </SearchStack.Navigator>
  );
}

function DeliveryStack(props) {
  return (
    <SearchStack.Navigator initialRouteName='' screenOptions={{headerShown: false}}>
      <SearchStack.Screen initialParams={{...props.route.params}} name="DeliveryScreen" component={Delivery} />
    </SearchStack.Navigator>
  );
}

//colors
const activeIconColor = '#000000';
const inactiveIconColor = '#7c7c7c';

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="HomeScreen" component={Home} />
      <HomeStack.Screen name="Chat" component={UserChats} />
      <HomeStack.Screen name="DevliveryChat" component={DevliveryChat} />
      <HomeStack.Screen name="NonEditAccount" component={NonEditAccount} />
      <HomeStack.Screen name="MapScreen" component={MapScreen} />
    </HomeStack.Navigator>
  );
}

const AuthStack = createStackNavigator();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </AuthStack.Navigator>
  );
}

const MessagesStack = createStackNavigator();

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={{headerShown: false}}>
      <MessagesStack.Screen name="MessagesScreen" component={InboxScreen} />
      <MessagesStack.Screen name="Chat" component={UserChats} />
    </MessagesStack.Navigator>
  );
}

const AccountStack = createStackNavigator();

function AccountStackScreen() {
  return (
    <AccountStack.Navigator screenOptions={{headerShown: false}}>
      <AccountStack.Screen name="AccountScreen" component={Account} />
      <AccountStack.Screen name="Chat" component={UserChats} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AccountStack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authUser => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <AuthProvider value={user}>
        <NavigationContainer>
          <CardProvider>
            {!user ? (
              <AuthStackScreen />
            ) : (
              <Tab.Navigator
                screenOptions={({route}) => ({
                  tabBarIcon: ({focused}) => {
                    const ICONS = {
                      Home: 'home',
                      Messages: 'message-circle',
                      Account: 'user',
                      Delivery: 'truck',
                      Search: 'search',
                    };

                    const iconColor = focused
                      ? activeIconColor
                      : inactiveIconColor;

                    return (
                      <Feather
                        name={ICONS[route.name] || 'home'}
                        size={24}
                        color={iconColor}
                      />
                    );
                  },
                  tabBarStyle: [styles.tabbarstyle],
                  tabBarActiveTintColor: Theme.primaryColor,
                  headerShown: false,
                  tabBarInactiveTintColor: '#7c7c7c',
                  tabBarLabel: () => {
                    null;
                  },
                })}>
                <Tab.Screen name="Home" component={HomeStackScreen} />
                <Tab.Screen name="Messages" component={MessagesStackScreen} />
                <Tab.Screen name="Search" component={SearchStackScreen} />
                <Tab.Screen name="Delivery" component={DeliveryStack} />
                <Tab.Screen name="Account" component={AccountStackScreen} />
              </Tab.Navigator>
            )}
          </CardProvider>
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabbarstyle: {
    height: Platform.OS === 'ios' ? 95 : 75,
    borderTopWidth: 0,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingVertical: Platform.OS === 'ios' ? 20 : 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
