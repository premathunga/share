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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { StackNavigationProp, createStackNavigator } from '@react-navigation/stack';
import ContactDetailsScreen from './ContactDetailsScreen';

const sheetUrl =
'https://sheets.googleapis.com/v4/spreadsheets/KEY/values/A2:G3000';
const apiKey = 'KEY';

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
  Home: undefined;
  ContactDetails: { contact: Contact };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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

  const handleRefresh = () => {
    checkInternetConnection();
    if (offline) {
      Alert.alert('Offline', 'Please check your internet connection.');
    } else {
      setLoading(true);
      fetchContacts();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          value={searchQuery}
          onChangeText={onSearchInput}
        />
        <TouchableOpacity onPress={handleRefresh}>
          <Image
            style={styles.syncIcon}
            source={require('./assets/sync-outline.png')}
          />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" style={styles.loadingIndicator} />
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

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="ContactDetails"
          component={ContactDetailsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  searchBar: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  syncIcon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  offlineMessage: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    color: '#666',
  },
});

export default App;
