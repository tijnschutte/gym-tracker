import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { SessionScreen } from "@/components/SessionScreen";

function App() {
  const { user } = useAuth();

  return user ? <SessionScreen /> : <LoginScreen />;
}

export default App;
