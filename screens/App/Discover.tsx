import { TabView } from 'react-native-tab-view';
import { CustomTabBar } from '../../components/TabBar';
import { useState } from 'react';

export default function Discover() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'First' },
    { key: 'second', title: 'Second' },
  ]);

  const renderScene = ({ route }: { route: any }) => {
    return (
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => <CustomTabBar {...props} />}
        // ... other props
      />
    );
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      renderTabBar={props => <CustomTabBar {...props} />}
      // ... other props
    />
  );
}
  
