import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { EmailInputScreen } from "../screens/auth/EmailInputScreen";
import { VerifyCodeScreen } from "../screens/auth/VerifyCodeScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";

export type AuthStackParamList = {
  EmailInput: undefined;
  VerifyCode: { email: string };
  Welcome: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#FFF8F0" },
      }}
    >
      <Stack.Screen name="EmailInput" component={EmailInputScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
