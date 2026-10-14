import { Redirect, useLocalSearchParams } from "expo-router";

export default function CheckupRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/test/${id}`} />;
}
