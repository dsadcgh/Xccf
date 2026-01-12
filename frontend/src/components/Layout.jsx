import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useAmbulatorio } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  Home,
  LogOut,
  Menu,
  Building2,
  ChevronDown,
  Stethoscope,
  Settings,
  Maximize,
  Minimize,
  RotateCw,
  Monitor,
  Smartphone,
  ClipboardList,
  ZoomIn,
  ZoomOut,
  Type,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import AIAssistant from "@/components/AIAssistant";

// Bottom navigation items (main navigation)
const BOTTOM_NAV_ITEMS = [
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/pazienti", label: "Pazienti", icon: Users },
  { path: "/prescrizioni", label: "Prescrizioni", icon: ClipboardList },
  { path: "/modulistica", label: "Modulistica", icon: FileText },
  { path: "/statistiche", label: "Statistiche", icon: BarChart3 },
];

// All nav items for sidebar (includes impianti as it's on dashboard)
const ALL_NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home },
  ...BOTTOM_NAV_ITEMS,
];

const AMBULATORI_NAMES = {
  pta_centro: "PTA Centro",
  villa_ginestre: "Villa delle Ginestre",
};

const AMBULATORI_SHORT = {
  pta_centro: "PTA",
  villa_ginestre: "Villa",
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const { ambulatorio, selectAmbulatorio } = useAmbulatorio();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState("auto");
  const [textZoom, setTextZoom] = useState(() => {
    // Load saved zoom level from localStorage, default to 150%
    const saved = localStorage.getItem("textZoom");
    return saved ? parseInt(saved, 10) : 150;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (orientation === "landscape") {
      root.style.setProperty("--app-rotation", "0deg");
      root.classList.remove("portrait-mode");
      root.classList.add("landscape-mode");
    } else if (orientation === "portrait") {
      root.classList.remove("landscape-mode");
      root.classList.add("portrait-mode");
    } else {
      root.classList.remove("landscape-mode", "portrait-mode");
    }
    return () => {
      root.classList.remove("landscape-mode", "portrait-mode");
    };
  }, [orientation]);

  // Apply text zoom effect
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${textZoom}%`;
    localStorage.setItem("textZoom", textZoom.toString());
    return () => {
      root.style.fontSize = "100%";
    };
  }, [textZoom]);

  const increaseZoom = () => {
    setTextZoom(prev => Math.min(prev + 10, 150));
  };

  const decreaseZoom = () => {
    setTextZoom(prev => Math.max(prev - 10, 70));
  };

  const resetZoom = () => {
    setTextZoom(100);
  };

  const handleAmbulatorioChange = (amb) => {
    selectAmbulatorio(amb);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const renderSettingsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Impostazioni Display</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Text Zoom Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
          <Type className="w-3 h-3" />
          Dimensione Testo ({textZoom}%)
        </DropdownMenuLabel>
        <div className="flex items-center justify-between px-2 py-1.5">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={decreaseZoom}
            disabled={textZoom <= 70}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium w-12 text-center">{textZoom}%</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2"
              onClick={resetZoom}
            >
              Reset
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={increaseZoom}
            disabled={textZoom >= 150}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <Minimize className="w-4 h-4 mr-2" />
              Esci da Schermo Intero
            </>
          ) : (
            <>
              <Maximize className="w-4 h-4 mr-2" />
              Schermo Intero
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Orientamento</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setOrientation("auto")} className={orientation === "auto" ? "bg-primary/10" : ""}>
          <RotateCw className="w-4 h-4 mr-2" />
          Auto
          {orientation === "auto" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOrientation("landscape")} className={orientation === "landscape" ? "bg-primary/10" : ""}>
          <Monitor className="w-4 h-4 mr-2" />
          Orizzontale
          {orientation === "landscape" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOrientation("portrait")} className={orientation === "portrait" ? "bg-primary/10" : ""}>
          <Smartphone className="w-4 h-4 mr-2" />
          Verticale
          {orientation === "portrait" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTopRightMenu = (isMobile = false) => (
    <div className="flex items-center gap-2">
      {renderSettingsMenu()}

      {user?.ambulatori?.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span className={isMobile ? "text-xs" : "text-sm"}>
                {isMobile ? AMBULATORI_SHORT[ambulatorio] : AMBULATORI_NAMES[ambulatorio]}
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Cambia Ambulatorio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.ambulatori?.map((amb) => (
              <DropdownMenuItem
                key={amb}
                onClick={() => handleAmbulatorioChange(amb)}
                className={ambulatorio === amb ? "bg-primary/10" : ""}
              >
                <Building2 className="w-4 h-4 mr-2" />
                {AMBULATORI_NAMES[amb]}
                {ambulatorio === amb && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={isMobile ? "sm" : "default"} className="gap-2">
            <Stethoscope className="w-4 h-4" />
            <span className={isMobile ? "text-xs hidden sm:inline" : "text-sm"}>{user?.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderNavItems = () => (
    <>
      {ALL_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? "active" : ""}`
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 border-r bg-card">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-primary text-sm">Ambulatorio</h1>
              <p className="text-[10px] text-muted-foreground">Infermieristico</p>
            </div>
          </div>
        </div>

        {/* Current Ambulatorio Badge */}
        <div className="px-4 py-3 border-b bg-primary/5">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Building2 className="w-4 h-4" />
            {AMBULATORI_NAMES[ambulatorio]}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {renderNavItems()}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Home Button - Larger */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center justify-center w-12 h-12 rounded-xl ${
                isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`
            }
          >
            <Home className="w-7 h-7" />
          </NavLink>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary text-base">Ambulatorio</span>
          </div>
        </div>
        {renderTopRightMenu(true)}
      </header>

      {/* Desktop Top Header */}
      <header className="hidden lg:flex lg:fixed lg:top-0 lg:left-64 lg:right-0 lg:z-40 h-16 border-b bg-card items-center justify-end px-6">
        {renderTopRightMenu()}
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-16 pb-24 lg:pb-0">
        <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem-6rem)] lg:min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar - Larger Icons */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-20 border-t bg-card flex items-center justify-around px-2 safe-area-bottom">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors min-w-0 ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon className="w-7 h-7 mb-1" />
              <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistant Chat */}
      <AIAssistant />
    </div>
  );
};

export default Layout;
