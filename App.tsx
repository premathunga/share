import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackNavigationProp, createStackNavigator } from '@react-navigation/stack';
import ContactDetailsScreen from './ContactDetailsScreen';
// import SettingsScreen from './SettingsScreen';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import OneSignal from 'react-native-onesignal';

function MyComponent() {
  useEffect(() => {
    OneSignal.setLogLevel(6, 0);
    OneSignal.setAppId('16bc18f4-d0c0-4734-9423-a4dab550dd47');
    OneSignal.setRequiresUserPrivacyConsent(false);  
    OneSignal.promptForPushNotificationsWithUserResponse((response) => {   
      console.log('Prompt response:', response);   
    });

    OneSignal.setNotificationOpenedHandler((notification) => {
      console.log('Opened notification:', notification);
    });

    return () => {
      OneSignal.clearHandlers();
    };
  }, []);
}




const MyApp = () => {
  return (
    <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#0d0d0d" translucent={true} />
  );
};


const sheetUrl =
'https://sheets.googleapis.com/v4/spreadsheets/key/values/A2:G3000';
const apiKey = 'api-key';

export interface Contact {
  rank: string;
  name: string;
  mobile: string;
  office: string;
  office2: string;
  fax: string;
  mail: string;
}

type RootStackParamList = {
  Contacts: undefined;
  ContactDetails: { contact: Contact };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [filteredContactList, setFilteredContactList] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [offline, setOffline] = useState<boolean>(false);

  useEffect(() => {
    checkInternetConnection();
    retrieveData();
    fetchContacts();
  }, []);

  const checkInternetConnection = () => {
    NetInfo.fetch().then((state) => {
      setOffline(!state.isConnected);
    });
  };

  const retrieveData = async () => {
    try {
      const data = await AsyncStorage.getItem('contactList');
      if (data) {
        const contacts = JSON.parse(data) as Contact[];
        setContactList(contacts);
        setFilteredContactList(contacts);
      }
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
  };

  const saveData = async (contacts: Contact[]) => {
    try {
      const data = JSON.stringify(contacts);
      await AsyncStorage.setItem('contactList', data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('contactList');
      if (cachedData) {
        const contacts = JSON.parse(cachedData) as Contact[];
        setContactList(contacts);
        setFilteredContactList(contacts);
      }
      const response = await fetch(`${sheetUrl}?key=${apiKey}`);
      const data = await response.json();
      const contacts = data.values.map((contact: string[]) => ({
        rank: contact[0],
        name: contact[1],
        mobile: contact[2],
        office: contact[3],
        office2: contact[4],
        fax: contact[5],
        mail: contact[6],
      })) as Contact[];
      setContactList(contacts);
      setFilteredContactList(contacts);
      setLoading(false);
      setOffline(false);
      saveData(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
      setOffline(true);
    }
  };

  const onSearchInput = (text: string) => {
    setSearchQuery(text);
    filterContacts(text);
  };

  const filterContacts = (query: string) => {
    const filteredContacts = contactList.filter(
      (contact: Contact) =>
        contact.rank.toLowerCase().includes(query.toLowerCase()) ||
        contact.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContactList(filteredContacts);
  };

  // const clearSearch = () => {
  //   setSearchQuery('');
  // };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => goToContactDetails(item)}
    >
      <Image
        style={styles.avatar}
        source={require('./assets/avatar-placeholder.png')}
      />
      <View style={styles.contactDetails}>
        <Text style={styles.rank}>{item.rank}</Text>
        <Text style={styles.name}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const goToContactDetails = (contact: Contact) => {
    navigation.navigate('ContactDetails', { contact });
  };

  const handleRefresh = async () => {
    checkInternetConnection();
    if (offline) {
      Alert.alert('Offline', 'Please check your internet connection.');
    } else {
      setLoading(true);
      try {
        const response = await fetch(`${sheetUrl}?key=${apiKey}`);
        const data = await response.json();
        const contacts = data.values.map((contact: string[]) => ({
          rank: contact[0],
          name: contact[1],
          mobile: contact[2],
          office: contact[3],
          office2: contact[4],
          fax: contact[5],
          mail: contact[6],
        })) as Contact[];
        setContactList(contacts);
        setFilteredContactList(contacts);
        saveData(contacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        
      <View style={styles.searchBarContainer}>
      <Image source={require('./assets/search-outline.png')} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchBarContainer, styles.searchInput, { color: '#fff' }]} // Set the input text color
        placeholder="Search"
        placeholderTextColor="#999999"
        value={searchQuery}
        onChangeText={onSearchInput}
      />
            {/* {searchQuery !== '' && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Image source={require('./assets/close-circle-outline.png')} style={styles.clearIcon} />
          </TouchableOpacity>
        )} */}

    </View>
        <TouchableOpacity onPress={handleRefresh}>
          <Image
            style={styles.syncIcon}
            source={require('./assets/sync-outline.png')}
          />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator
        size="large"
        color="#3880ff" // Use "auto" to adapt the color based on platform's default styling
        style={styles.loadingIndicator}
      />

        </View>
      ) : offline ? (
        <View style={styles.content}>
          <Text style={styles.offlineMessage}>
            Offline. Please check your internet connection.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContactList}
          renderItem={renderContactItem}
          keyExtractor={(item) => `${item.rank}-${item.name}`}
          ListEmptyComponent={() => (
            <Text style={styles.emptyList}>No contacts found.</Text>
          )}
        />
      )}
    </View>
  );
};

const Stack = createStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator();



const ContactsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Contacts"
      screenOptions={{
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
                {
                  translateX: next
                    ? next.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -layouts.screen.width],
                      })
                    : 0,
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >

      
      <Stack.Screen
        name="Contacts"
        component={HomeScreen}
        options={{
          title: 'Contacts',
          headerShown: false, // hide contacts titel head
        }}
      />
      <Stack.Screen
        name="ContactDetails"
        component={ContactDetailsScreen}
        options={{
          title: 'Contact Details',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#0d0d0d', // Set the background color of the header
            // width: '20%', // Set the width of the header
          },
          headerTitleStyle: {
            color: '#ffffff', // Set the color of the header title
          },
          headerTintColor: '#ffffff', // Set the color of the back button
        }}
      />
    </Stack.Navigator>
  );
};



const SettingsScreen = () => {
  return (
    <View style={styles.settinsx}>
      <Text style={styles.settingsText}>This is the Settings screen.</Text>
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#0d0d0d', borderWidth: 3, borderColor: '#0d0d0d' },
        }}
      >
        <Tab.Screen
          name="Contacts"
          component={ContactsStack}
          options={{
            title: 'Contacts',
            headerShown: false, //show and hide header "contacts"
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require('./assets/people-circle-outline-b.png')
                    : require('./assets/people-circle-outline-w.png')
                }
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerShown: true, //show and hide header "contacts"
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#0d0d0d', // Set the background color of the header
              // width: '100%', // Set the width of the header
            },
            headerTitleStyle: {
              color: '#ffffff', // Set the color of the header title
            },
            
            
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require('./assets/settings-outline-b.png')
                    : require('./assets/settings-outline-w.png')
                }
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  // darkContainer: {
  //   backgroundColor: '#fff',
  // },

  settinsx: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
  },
  // searchBar: {
  //   flex: 1,
  //   height: 40,
  //   paddingHorizontal: 10,
  //   borderWidth: 1,
  //   // borderColor: '#ccc',
  //   borderRadius: 12,
  //   marginRight: 10,
  //   // color: '#0d0d0d',
  //   backgroundColor: '#1e1e1e',
  //   flexDirection: 'row',
  // },

  searchBarContainer: {
    flex: 1,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingLeft: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  searchInput: {
    // flex: 1,
    // height: 40,
    // flexDirection: 'row',
    // alignItems: 'center',
    // // backgroundColor: '#FFFFFF',
    // paddingLeft: 10,
    // borderRadius: 5,
    // marginRight: 10,
  },

  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  syncIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#3880ff',
    borderRadius: 12,
    marginRight: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  offlineMessage: {
    fontSize: 16,
    color: '#888',
  },
  emptyList: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    alignSelf: 'center',
  },
  contactItem: { //contacts list line colur
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
    backgroundColor: '#1e1e1e',
  },
  avatar: {
    width: 33,
    height: 33,
    borderRadius: 24,
  },
  contactDetails: {
    marginLeft: 16,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 14,
    color: '#888',
  },
  settingsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'center',
    marginVertical: 16,
  },

  //   clearButton: {
  //   // paddingHorizontal: 8,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // clearIcon: {
  //   width: 24,
  //   height: 24,
  //   backgroundColor: '#3880ff',
  //   borderRadius: 12,
  //   marginRight: 0,
  // },

});

export default App;
