import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAmbulatorio, apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Filter,
  ChevronRight,
  ChevronDown,
  Activity,
  User,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const MESI = [
  { value: null, label: "Tutti i mesi" },
  { value: 1, label: "Gennaio" },
  { value: 2, label: "Febbraio" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Aprile" },
  { value: 5, label: "Maggio" },
  { value: 6, label: "Giugno" },
  { value: 7, label: "Luglio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Settembre" },
  { value: 10, label: "Ottobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Dicembre" },
];

const TIPI_FILTRO = [
  { value: "tutti", label: "Tutti i tipi" },
  { value: "picc", label: "PICC" },
  { value: "picc_port", label: "PICC Port" },
  { value: "midline", label: "Midline" },
  { value: "espianto_picc", label: "Espianto PICC" },
  { value: "espianto_picc_port", label: "Espianto PICC Port" },
  { value: "espianto_midline", label: "Espianto Midline" },
];

// Simple custom select component
const SimpleSelect = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={selectedOption ? "" : "text-muted-foreground"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value ?? 'null'}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                value === option.value ? 'bg-accent/50' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ImpiantiPage() {
  const { ambulatorio } = useAmbulatorio();
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]); // Combined impianti + espianti
  const [loading, setLoading] = useState(true);
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState("tutti");

  // Generate year options (last 5 years + current + next)
  const currentYear = new Date().getFullYear();
  const anniOptions = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    anniOptions.push({ value: y, label: y.toString() });
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ambulatorio };
      if (anno) params.anno = anno;
      if (mese) params.mese = mese;

      // Fetch both impianti and espianti
      const [impiantiRes, espiantiRes] = await Promise.all([
        apiClient.get("/impianti", { params }),
        apiClient.get("/espianti", { params }).catch(() => ({ data: { espianti: [] } }))
      ]);

      // Combine and normalize data
      const impianti = (impiantiRes.data.impianti || []).map(imp => ({
        ...imp,
        itemType: "impianto",
        data: imp.data_impianto_parsed || imp.data_impianto,
        tipo: imp.tipo_impianto,
        displayTipo: getTipoLabel(imp.tipo_impianto)
      }));

      const espianti = (espiantiRes.data.espianti || []).map(esp => ({
        ...esp,
        itemType: "espianto",
        data: esp.data_espianto,
        tipo: esp.tipo_espianto,
        displayTipo: getEspiantoLabel(esp.tipo_espianto)
      }));

      // Combine all
      const combined = [...impianti, ...espianti];

      // Sort by date chronologically
      combined.sort((a, b) => {
        const dateA = parseDate(a.data);
        const dateB = parseDate(b.data);
        return dateA - dateB;
      });

      setAllItems(combined);
    } catch (error) {
      console.error("Error fetching impianti data:", error);
      // Only show error for network issues, not for empty data
      if (error.response?.status === 401) {
        // Token expired - will be handled by interceptor
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Errore di connessione al server");
      }
      // Silently handle other errors - data will just be empty
    } finally {
      setLoading(false);
    }
  }, [ambulatorio, anno, mese]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Parse date helper
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    try {
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          return new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
      }
      return new Date(dateStr);
    } catch {
      return new Date(0);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/D";
    if (dateStr.includes("/")) return dateStr;
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      }
    } catch {
      return dateStr;
    }
    return dateStr;
  };

  const getTipoLabel = (tipo) => {
    const tipoLower = tipo?.toLowerCase() || "";
    if (tipoLower.includes("picc_port") || tipoLower.includes("picc port")) {
      return "PICC Port";
    }
    if (tipoLower === "picc") {
      return "PICC";
    }
    if (tipoLower.includes("midline")) {
      return "Midline";
    }
    return tipo || "N/D";
  };

  const getEspiantoLabel = (tipo) => {
    const labels = {
      "espianto_picc": "Espianto PICC",
      "espianto_picc_port": "Espianto PICC Port",
      "espianto_midline": "Espianto Midline"
    };
    return labels[tipo] || tipo || "N/D";
  };

  const getTipoColor = (item) => {
    if (item.itemType === "espianto") {
      return "bg-red-100 text-red-700 border-red-200";
    }
    const tipo = item.tipo?.toLowerCase() || "";
    if (tipo.includes("picc_port") || tipo.includes("picc port")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    if (tipo.includes("picc")) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (tipo.includes("midline")) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getInitials = (nome, cognome) => {
    return `${cognome?.charAt(0) || ""}${nome?.charAt(0) || ""}`.toUpperCase();
  };

  // Filter items based on selected tipo
  const filteredItems = allItems.filter(item => {
    if (tipoFiltro === "tutti") return true;
    
    if (tipoFiltro.startsWith("espianto_")) {
      return item.tipo === tipoFiltro;
    }
    
    const tipo = item.tipo?.toLowerCase() || "";
    if (tipoFiltro === "picc") {
      return tipo === "picc" && item.itemType === "impianto";
    }
    if (tipoFiltro === "picc_port") {
      return (tipo.includes("picc_port") || tipo.includes("picc port")) && item.itemType === "impianto";
    }
    if (tipoFiltro === "midline") {
      return tipo.includes("midline") && item.itemType === "impianto";
    }
    return true;
  });

  // Group by month
  const groupedItems = filteredItems.reduce((acc, item) => {
    let monthKey = "Altro";
    try {
      const dateObj = parseDate(item.data);
      if (dateObj && !isNaN(dateObj)) {
        const monthName = MESI.find(m => m.value === dateObj.getMonth() + 1)?.label || "Altro";
        monthKey = `${monthName} ${dateObj.getFullYear()}`;
      }
    } catch {
      // Keep "Altro"
    }
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(item);
    return acc;
  }, {});

  // Count statistics
  const counts = allItems.reduce((acc, item) => {
    if (item.itemType === "espianto") {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1;
      acc.totaleEspianti = (acc.totaleEspianti || 0) + 1;
    } else {
      const tipo = item.tipo?.toLowerCase() || "";
      if (tipo.includes("picc_port") || tipo.includes("picc port")) {
        acc.picc_port = (acc.picc_port || 0) + 1;
      } else if (tipo === "picc") {
        acc.picc = (acc.picc || 0) + 1;
      } else if (tipo.includes("midline")) {
        acc.midline = (acc.midline || 0) + 1;
      }
      acc.totaleImpianti = (acc.totaleImpianti || 0) + 1;
    }
    return acc;
  }, { totaleImpianti: 0, totaleEspianti: 0, picc: 0, picc_port: 0, midline: 0, espianto_picc: 0, espianto_picc_port: 0, espianto_midline: 0 });

  return (
    <div className="animate-fade-in" data-testid="impianti-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Impianti ed Espianti
          </h1>
          <p className="text-muted-foreground text-sm">
            Elenco cronologico di tutti gli impianti e espianti
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <SimpleSelect
                value={anno}
                onChange={setAnno}
                options={anniOptions}
                placeholder="Anno"
                className="w-[120px]"
              />
            </div>
            <SimpleSelect
              value={mese}
              onChange={setMese}
              options={MESI}
              placeholder="Mese"
              className="w-[150px]"
            />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SimpleSelect
                value={tipoFiltro}
                onChange={setTipoFiltro}
                options={TIPI_FILTRO}
                placeholder="Tipo"
                className="w-[180px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Impianti */}
      <h3 className="text-sm font-semibold text-gray-600 mb-2">IMPIANTI</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card 
          className={`cursor-pointer transition-all ${tipoFiltro === "tutti" ? "ring-2 ring-gray-400" : "hover:bg-gray-50"}`}
          onClick={() => setTipoFiltro("tutti")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-gray-700">{counts.totaleImpianti}</div>
            <p className="text-xs text-gray-500">Totale Impianti</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-emerald-200 ${tipoFiltro === "picc" ? "bg-emerald-100 ring-2 ring-emerald-500" : "bg-emerald-50/50 hover:bg-emerald-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "picc" ? "tutti" : "picc")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-emerald-700">{counts.picc}</div>
            <p className="text-xs text-emerald-600">PICC</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-blue-200 ${tipoFiltro === "picc_port" ? "bg-blue-100 ring-2 ring-blue-500" : "bg-blue-50/50 hover:bg-blue-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "picc_port" ? "tutti" : "picc_port")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-blue-700">{counts.picc_port}</div>
            <p className="text-xs text-blue-600">PICC Port</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-purple-200 ${tipoFiltro === "midline" ? "bg-purple-100 ring-2 ring-purple-500" : "bg-purple-50/50 hover:bg-purple-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "midline" ? "tutti" : "midline")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-purple-700">{counts.midline}</div>
            <p className="text-xs text-purple-600">Midline</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Espianti */}
      <h3 className="text-sm font-semibold text-gray-600 mb-2">ESPIANTI</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card 
          className="cursor-pointer transition-all hover:bg-gray-50"
          onClick={() => setTipoFiltro("tutti")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-red-700">{counts.totaleEspianti}</div>
            <p className="text-xs text-red-500">Totale Espianti</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-red-200 ${tipoFiltro === "espianto_picc" ? "bg-red-100 ring-2 ring-red-500" : "bg-red-50/50 hover:bg-red-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "espianto_picc" ? "tutti" : "espianto_picc")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-red-700">{counts.espianto_picc}</div>
            <p className="text-xs text-red-600">Espianto PICC</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-red-200 ${tipoFiltro === "espianto_picc_port" ? "bg-red-100 ring-2 ring-red-500" : "bg-red-50/50 hover:bg-red-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "espianto_picc_port" ? "tutti" : "espianto_picc_port")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-red-700">{counts.espianto_picc_port}</div>
            <p className="text-xs text-red-600">Espianto PICC Port</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all border-red-200 ${tipoFiltro === "espianto_midline" ? "bg-red-100 ring-2 ring-red-500" : "bg-red-50/50 hover:bg-red-100/50"}`}
          onClick={() => setTipoFiltro(tipoFiltro === "espianto_midline" ? "tutti" : "espianto_midline")}
        >
          <CardContent className="pt-3 pb-2 px-3">
            <div className="text-xl font-bold text-red-700">{counts.espianto_midline}</div>
            <p className="text-xs text-red-600">Espianto Midline</p>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun dato trovato per i filtri selezionati</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prova a modificare i filtri o selezionare un altro periodo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([monthKey, items]) => (
            <div key={monthKey}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {monthKey}
                <Badge variant="secondary" className="ml-2">{items.length}</Badge>
              </h3>
              <div className="grid gap-2">
                {items.map((item, idx) => (
                  <Card
                    key={`${item.itemType}-${item.scheda_id || item.appointment_id}-${idx}`}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                    onClick={() => navigate(`/pazienti/${item.patient_id}`)}
                    data-testid={`item-card-${idx}`}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          item.itemType === "espianto" 
                            ? "bg-gradient-to-br from-red-400 to-red-600"
                            : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                        }`}>
                          {getInitials(item.patient_nome, item.patient_cognome)}
                        </div>
                        
                        {/* Patient Name */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.patient_cognome} {item.patient_nome}
                          </p>
                        </div>
                        
                        {/* Type Badge */}
                        <Badge className={getTipoColor(item)}>
                          {item.displayTipo}
                        </Badge>
                        
                        {/* Date */}
                        <div className="text-sm text-gray-500 font-medium min-w-[80px] text-right">
                          {formatDate(item.data)}
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
