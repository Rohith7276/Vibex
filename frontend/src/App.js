import React from "react";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();


  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div data-theme={theme}>
  
    </div>
  );
};
export default App;
