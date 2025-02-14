import React from 'react';
import { TabBar } from 'react-native-tab-view';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

export const CustomTabBar = (props: any) => {
  return (
    <TabBar
      {...props}
      renderTabBarItem={({key, ...itemProps}) => (
        <Pressable 
          key={key}
          onPress={itemProps.onPress}
          style={[{ padding: 16 }, itemProps.style]}
        >
          <Animated.Text style={{
            color: itemProps.navigationState.index === itemProps.navigationState.routes.indexOf(itemProps.route)
              ? itemProps.activeColor 
              : itemProps.inactiveColor
          }}>
            {itemProps.route.title}
          </Animated.Text>
        </Pressable>
      )}
    />
  );
}; 