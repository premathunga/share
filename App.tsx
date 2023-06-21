
import OneSignal from 'react-native-onesignal';

function MyComponent() {
  useEffect(() => {
    OneSignal.setLogLevel(6, 0);
    OneSignal.setAppId('16bc18f4-d0c0-4734-9423-a4dab550xx47');
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


