import { useState, useEffect, useCallback, useRef } from "react";
import { useAmbulatorio, apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  ClipboardList,
  Calendar,
  User,
  ChevronDown,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Circle,
  Stethoscope,
  Activity,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, differenceInDays, addMonths, parseISO } from "date-fns";
import { it } from "date-fns/locale";

// Simple custom select component without portal issues
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
              key={option.value}
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

const DURATA_OPTIONS = [
  { value: 1, label: "1 Mese" },
  { value: 2, label: "2 Mesi" },
  { value: 3, label: "3 Mesi" },
];

// Calculate prescription status
const getPrescriptionStatus = (prescrizione) => {
  if (!prescrizione || !prescrizione.data_inizio) {
    return { status: "never", label: "Mai fatta", color: "bg-gray-300", icon: Circle };
  }
  
  const dataInizio = parseISO(prescrizione.data_inizio);
  const dataScadenza = addMonths(dataInizio, prescrizione.durata_mesi || 1);
  const oggi = new Date();
  const giorniRimanenti = differenceInDays(dataScadenza, oggi);
  
  if (giorniRimanenti < 0) {
    return { 
      status: "expired", 
      label: `Scaduta da ${Math.abs(giorniRimanenti)} giorni`, 
      color: "bg-red-500", 
      icon: XCircle,
      giorniRimanenti
    };
  } else if (giorniRimanenti <= 5) {
    return { 
      status: "expiring", 
      label: `Scade tra ${giorniRimanenti} giorni`, 
      color: "bg-yellow-500", 
      icon: AlertCircle,
      giorniRimanenti
    };
  } else {
    return { 
      status: "active", 
      label: `In corso - ${giorniRimanenti} giorni rimanenti`, 
      color: "bg-green-500", 
      icon: CheckCircle,
      giorniRimanenti
    };
  }
};

// Status indicator component
const StatusIndicator = ({ status }) => {
  const StatusIcon = status.icon;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${status.color}`} />
      <span className={`text-sm ${
        status.status === "expired" ? "text-red-600" :
        status.status === "expiring" ? "text-yellow-600" :
        status.status === "active" ? "text-green-600" :
        "text-gray-500"
      }`}>
        {status.label}
      </span>
    </div>
  );
};

export default function PrescrizioniPage() {
  const { ambulatorio } = useAmbulatorio();
  const [patients, setPatients] = useState([]);
  const [prescrizioni, setPrescrizioni] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("picc"); // "picc" or "med"
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    data_inizio: format(new Date(), "yyyy-MM-dd"),
    durata_mesi: 1,
  });

  const filterOptions = [
    { value: "all", label: "Tutti" },
    { value: "never", label: "Mai fatta (⚪)" },
    { value: "active", label: "In corso (🟢)" },
    { value: "expiring", label: "In scadenza (🟡)" },
    { value: "expired", label: "Scaduta (🔴)" },
  ];

  // Fetch patients and prescriptions
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch patients
      const patientsRes = await apiClient.get("/patients", {
        params: { ambulatorio, status: "in_cura" },
      });
      setPatients(patientsRes.data);

      // Fetch prescriptions for each patient
      const prescrizioniRes = await apiClient.get("/prescrizioni", {
        params: { ambulatorio },
      });
      
      // Create a map of patient_id -> prescrizione
      const prescrizioniMap = {};
      prescrizioniRes.data.forEach(p => {
        prescrizioniMap[p.patient_id] = p;
      });
      setPrescrizioni(prescrizioniMap);
    } catch (error) {
      console.error("Error fetching prescrizioni data:", error);
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
  }, [ambulatorio]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter patients by type (PICC or MED) and other filters
  const getFilteredPatientsByType = (type) => {
    return patients.filter(patient => {
      // Filter by type
      if (type === "picc") {
        if (patient.tipo !== "PICC" && patient.tipo !== "PICC_MED") return false;
      } else if (type === "med") {
        if (patient.tipo !== "MED" && patient.tipo !== "PICC_MED") return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!patient.nome?.toLowerCase().includes(query) && 
            !patient.cognome?.toLowerCase().includes(query) &&
            !patient.codice_fiscale?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (filterStatus !== "all") {
        const prescrizione = prescrizioni[patient.id];
        const status = getPrescriptionStatus(prescrizione);
        if (status.status !== filterStatus) {
          return false;
        }
      }
      
      return true;
    });
  };

  const piccPatients = getFilteredPatientsByType("picc");
  const medPatients = getFilteredPatientsByType("med");

  // Filter patients (legacy - for counts)
  const filteredPatients = patients.filter(patient => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!patient.nome?.toLowerCase().includes(query) && 
          !patient.cognome?.toLowerCase().includes(query) &&
          !patient.codice_fiscale?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Status filter
    if (filterStatus !== "all") {
      const prescrizione = prescrizioni[patient.id];
      const status = getPrescriptionStatus(prescrizione);
      if (status.status !== filterStatus) {
        return false;
      }
    }
    
    return true;
  });

  // Open dialog to add/edit prescription
  const openPrescriptionDialog = (patient) => {
    setSelectedPatient(patient);
    const existingPrescription = prescrizioni[patient.id];
    if (existingPrescription) {
      setFormData({
        data_inizio: existingPrescription.data_inizio || format(new Date(), "yyyy-MM-dd"),
        durata_mesi: existingPrescription.durata_mesi || 1,
      });
    } else {
      setFormData({
        data_inizio: format(new Date(), "yyyy-MM-dd"),
        durata_mesi: 1,
      });
    }
    setDialogOpen(true);
  };

  // Save prescription
  const handleSavePrescription = async () => {
    if (!selectedPatient) return;

    try {
      await apiClient.post("/prescrizioni", {
        patient_id: selectedPatient.id,
        ambulatorio,
        data_inizio: formData.data_inizio,
        durata_mesi: formData.durata_mesi,
      });
      
      toast.success("Prescrizione salvata");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  // Delete prescription
  const handleDeletePrescription = async (patientId) => {
    try {
      await apiClient.delete(`/prescrizioni/${patientId}`, {
        params: { ambulatorio },
      });
      toast.success("Prescrizione eliminata");
      fetchData();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  // Count by status (for current tab)
  const getCounts = (patientsList) => {
    const counts = { never: 0, active: 0, expiring: 0, expired: 0 };
    patientsList.forEach(patient => {
      const status = getPrescriptionStatus(prescrizioni[patient.id]);
      counts[status.status]++;
    });
    return counts;
  };

  const piccCounts = getCounts(patients.filter(p => p.tipo === "PICC" || p.tipo === "PICC_MED"));
  const medCounts = getCounts(patients.filter(p => p.tipo === "MED" || p.tipo === "PICC_MED"));
  const currentCounts = activeTab === "picc" ? piccCounts : medCounts;
  const currentPatients = activeTab === "picc" ? piccPatients : medPatients;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="prescrizioni-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescrizioni</h1>
          <p className="text-muted-foreground text-sm">
            Gestione prescrizioni infermieristiche dei pazienti
          </p>
        </div>
      </div>

      {/* Tabs for PICC and MED */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="picc" className="gap-2">
            <Activity className="w-4 h-4" />
            PICC ({patients.filter(p => p.tipo === "PICC" || p.tipo === "PICC_MED").length})
          </TabsTrigger>
          <TabsTrigger value="med" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            MED ({patients.filter(p => p.tipo === "MED" || p.tipo === "PICC_MED").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "never" ? "ring-2 ring-gray-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "never" ? "all" : "never")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-300" />
              <div>
                <div className="text-2xl font-bold">{currentCounts.never}</div>
                <p className="text-xs text-muted-foreground">Mai fatta</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "active" ? "ring-2 ring-green-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "active" ? "all" : "active")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{currentCounts.active}</div>
                <p className="text-xs text-muted-foreground">In corso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "expiring" ? "ring-2 ring-yellow-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "expiring" ? "all" : "expiring")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{currentCounts.expiring}</div>
                <p className="text-xs text-muted-foreground">In scadenza</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "expired" ? "ring-2 ring-red-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "expired" ? "all" : "expired")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{currentCounts.expired}</div>
                <p className="text-xs text-muted-foreground">Scadute</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, cognome o codice fiscale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <SimpleSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={filterOptions}
          placeholder="Filtra per stato"
          className="w-[200px]"
        />
      </div>

      {/* Patients List */}
      {currentPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nessun paziente {activeTab === "picc" ? "PICC" : "MED"} trovato
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentPatients.map((patient) => {
            const prescrizione = prescrizioni[patient.id];
            const status = getPrescriptionStatus(prescrizione);
            
            return (
              <Card key={patient.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status Indicator */}
                      <div className={`w-5 h-5 rounded-full ${status.color} flex-shrink-0`} 
                           title={status.label} />
                      
                      {/* Patient Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {patient.cognome} {patient.nome}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {patient.tipo === "PICC_MED" ? "PICC + MED" : patient.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {patient.codice_fiscale && (
                            <span className="font-mono">{patient.codice_fiscale}</span>
                          )}
                          {prescrizione && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(prescrizione.data_inizio), "dd/MM/yyyy")} 
                              ({prescrizione.durata_mesi} {prescrizione.durata_mesi === 1 ? "mese" : "mesi"})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={status} />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openPrescriptionDialog(patient)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        {prescrizione ? "Modifica" : "Aggiungi"}
                      </Button>
                      {prescrizione && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePrescription(patient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Legenda Stati Prescrizione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-300" />
              <span>Mai fatta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>In corso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span>In scadenza (≤5 giorni)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span>Scaduta</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {prescrizioni[selectedPatient?.id] ? "Modifica Prescrizione" : "Nuova Prescrizione"}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient && `${selectedPatient.cognome} ${selectedPatient.nome}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Inizio Prescrizione</Label>
              <Input
                type="date"
                value={formData.data_inizio}
                onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Durata</Label>
              <SimpleSelect
                value={formData.durata_mesi}
                onChange={(value) => setFormData({ ...formData, durata_mesi: value })}
                options={DURATA_OPTIONS}
                placeholder="Seleziona durata"
              />
            </div>

            {formData.data_inizio && formData.durata_mesi && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Scadenza:</strong>{" "}
                  {format(
                    addMonths(parseISO(formData.data_inizio), formData.durata_mesi),
                    "d MMMM yyyy",
                    { locale: it }
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSavePrescription}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
