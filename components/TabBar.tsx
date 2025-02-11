import React from 'react';
import { TabBar } from 'react-native-tab-view';
import { Pressable, Text } from 'react-native';
import type { Route } from 'react-native-tab-view';

type TabItemProps = {
  route: Route;
  navigationState: { index: number; routes: Route[] };
  position: number;
  activeColor?: string;
  inactiveColor?: string;
  onPress?: () => void;
};

export const CustomTabBar = (props: any) => {
  return (
    <TabBar
      {...props}
      renderTabBarItem={({ key, ...tabProps }: TabItemProps & { key: string }) => (
        <Pressable key={key} onPress={tabProps.onPress}>
          <Text style={[
            { padding: 16 },
            { color: tabProps.navigationState.index === props.navigationState.routes.indexOf(tabProps.route) 
              ? tabProps.activeColor 
              : tabProps.inactiveColor 
            }
          ]}>
            {tabProps.route.title}
          </Text>
        </Pressable>
      )}
    />
  );
}; 