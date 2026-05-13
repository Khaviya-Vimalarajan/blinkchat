import { Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { authUser, login, isLoggedIn } = useAuthStore();

  console.log("auth user:", authUser);
  console.log("isLoggedIn:", isLoggedIn);

  return (
    // Darker green theme alternative
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4ade801a_1px,transparent_1px),linear-gradient(to_bottom,#4ade801a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute top-0 -left-4 size-96 bg-green-400 opacity-20 blur-[100px]" />
        <div className="absolute bottom-0 -right-4 size-96 bg-emerald-500 opacity-20 blur-[100px]" />
  

      <button onClick={login} className="z-10">
       
      </button>

      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </div>
  );
}

export default App;