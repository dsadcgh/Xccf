import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import LoginPage from "@/pages/LoginPage";
import SelectAmbulatorioPage from "@/pages/SelectAmbulatorioPage";
import DashboardPage from "@/pages/DashboardPage";
import AgendaPage from "@/pages/AgendaPage";
import PazientiPage from "@/pages/PazientiPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import ModulisticaPage from "@/pages/ModulisticaPage";
import StatistichePage from "@/pages/StatistichePage";
import PrescrizioniPage from "@/pages/PrescrizioniPage";
import ImpiantiPage from "@/pages/ImpiantiPage";
import Layout from "@/components/Layout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Ambulatorio Context
const AmbulatorioContext = createContext(null);

export const useAmbulatorio = () => {
  const context = useContext(AmbulatorioContext);
  if (!context) {
    throw new Error("useAmbulatorio must be used within an AmbulatorioProvider");
  }
  return context;
};

// API client with auth
export const apiClient = axios.create({
  baseURL: API,
  timeout: 30000, // 30 second timeout to prevent hanging
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    // Log timeout errors for debugging
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Ambulatorio Required Route
const AmbulatorioRoute = ({ children }) => {
  const { ambulatorio } = useAmbulatorio();
  const { user } = useAuth();

  if (!ambulatorio) {
    if (user?.ambulatori?.length === 1) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/select-ambulatorio" replace />;
  }

  return children;
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ambulatorio, setAmbulatorio] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedAmbulatorio = localStorage.getItem("ambulatorio");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedAmbulatorio) {
          setAmbulatorio(savedAmbulatorio);
        }
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("ambulatorio");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Auto-select ambulatorio if user has only one
      if (userData.ambulatori.length === 1) {
        const amb = userData.ambulatori[0];
        localStorage.setItem("ambulatorio", amb);
        setAmbulatorio(amb);
      }

      toast.success(`Benvenuto, ${userData.username}!`);
      return userData;
    } catch (error) {
      const message = error.response?.data?.detail || "Errore durante il login";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("ambulatorio");
    setUser(null);
    setAmbulatorio(null);
    toast.success("Logout effettuato");
  };

  const selectAmbulatorio = (amb) => {
    localStorage.setItem("ambulatorio", amb);
    setAmbulatorio(amb);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <AmbulatorioContext.Provider value={{ ambulatorio, selectAmbulatorio }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/select-ambulatorio"
              element={
                <ProtectedRoute>
                  <SelectAmbulatorioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AmbulatorioRoute>
                    <Layout />
                  </AmbulatorioRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="impianti" element={<ImpiantiPage />} />
              <Route path="pazienti" element={<PazientiPage />} />
              <Route path="pazienti/:patientId" element={<PatientDetailPage />} />
              <Route path="prescrizioni" element={<PrescrizioniPage />} />
              <Route path="modulistica" element={<ModulisticaPage />} />
              <Route path="statistiche" element={<StatistichePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          expand={false}
          toastOptions={{
            style: { zIndex: 99999 }
          }}
        />
      </AmbulatorioContext.Provider>
    </AuthContext.Provider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
