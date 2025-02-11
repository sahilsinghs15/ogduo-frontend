import { CustomTabBar } from '../../components/TabBar';

export default function Discover() {
  // ... other code

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