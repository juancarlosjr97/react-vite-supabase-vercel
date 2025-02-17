import { createContext, useContext, memo } from "react";

const AuthContext = memo(createContext({
  loading: true,
  session: null,
  user: null,
}));

const useAuth = () => {
  return useContext(AuthContext);
};

export { useAuth, AuthContext };
