import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import type {
  User,
  AuthState,
  LoginPayload,
  SignupPayload,
  UserRole,
} from "@/types";
import { toast } from "sonner";


type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; accessToken: string } }
  | { type: "AUTH_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "SET_LOADING"; payload: boolean };


const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};


function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true };
    case "AUTH_SUCCESS":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case "AUTH_FAILURE":
      return { ...initialState, isLoading: false };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}


interface AuthContextType extends AuthState {
  login: (data: LoginPayload) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Dashboard path based on role
  const getDashboardPath = useCallback((): string => {
    if (!state.user) return "/login";
    const paths: Record<UserRole, string> = {
      candidate: "/candidate/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/",
    };
    return paths[state.user.role] || "/login";
  }, [state.user]);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");

      if (!token) {
        dispatch({ type: "AUTH_FAILURE" });
        return;
      }

      // Optimistic: show saved user immediately
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user, accessToken: token },
          });
        } catch {
          // invalid JSON, ignore
        }
      }

      // Verify with backend
      try {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: response.data.user, accessToken: token },
          });
          
          // Check for welcome message from OAuth callback
          const welcomeMessage = localStorage.getItem("welcomeMessage");
          if (welcomeMessage) {
            toast.success(welcomeMessage);
            localStorage.removeItem("welcomeMessage");
          }
        } else {
          throw new Error("Invalid response");
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        dispatch({ type: "AUTH_FAILURE" });
      }
    };

    initAuth();
  }, []);

  // Login
  const login = async (data: LoginPayload) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const response = await authApi.login(data);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken } });

        toast.success(`Welcome back, ${user.full_name}!`);

        const paths: Record<UserRole, string> = {
          candidate: "/candidate/dashboard",
          recruiter: "/recruiter/dashboard",
          admin: "/",
        };
        navigate(paths[user.role]);
      }
    } catch (error: any) {
      dispatch({ type: "AUTH_FAILURE" });
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
      throw error;
    }
  };

  // Signup
  const signup = async (data: SignupPayload) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const response = await authApi.signup(data);
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken } });

        toast.success(`Welcome to AI Recruit, ${user.full_name}!`);

        const paths: Record<UserRole, string> = {
          candidate: "/candidate/dashboard",
          recruiter: "/recruiter/dashboard",
          admin: "/",
        };
        navigate(paths[user.role]);
      }
    } catch (error: any) {
      dispatch({ type: "AUTH_FAILURE" });
      const message =
        error.response?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore API error on logout
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      dispatch({ type: "LOGOUT" });
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  // Update user
  const updateUser = (data: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: data });
    if (state.user) {
      localStorage.setItem("user", JSON.stringify({ ...state.user, ...data }));
    }
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, updateUser, getDashboardPath }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}