import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAmbulatorio, apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, addDays, subDays, isWeekend } from "date-fns";
import { it } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  Search,
  X,
  Syringe,
  Bandage,
  Droplets,
  CircleDot,
  UserPlus,
  ExternalLink,
  Lock,
  AlertTriangle,
  Unlock,
  Ban,
  RefreshCw,
  FileSpreadsheet,
  UserCheck,
  Database,
  RotateCcw,
  Trash2,
  History,
  UserCog,
  Replace,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const TIME_SLOTS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

// Funzione per ottenere classe colore in base allo stato
const getStatoColorClass = (stato) => {
  switch (stato) {
    case "effettuato":
      return "bg-green-500 text-white border-green-600";
    case "non_presentato":
      return "bg-red-500 text-white border-red-600";
    default: // da_fare
      return "bg-slate-800 text-white border-slate-900";
  }
};

const PRESTAZIONI_PICC = [
  { id: "medicazione_semplice", label: "Medicazione semplice", icon: Bandage },
  { id: "irrigazione_catetere", label: "Irrigazione catetere", icon: Droplets },
  { id: "espianto_picc", label: "Espianto PICC", icon: CircleDot, isEspianto: true },
  { id: "espianto_picc_port", label: "Espianto PICC Port", icon: CircleDot, isEspianto: true },
  { id: "espianto_midline", label: "Espianto Midline", icon: CircleDot, isEspianto: true },
];

const PRESTAZIONI_MED = [
  { id: "medicazione_semplice", label: "Medicazione semplice", icon: Bandage },
  { id: "fasciatura_semplice", label: "Fasciatura semplice", icon: CircleDot },
  { id: "iniezione_terapeutica", label: "Iniezione terapeutica", icon: Syringe },
  { id: "catetere_vescicale", label: "Catetere vescicale", icon: Droplets },
];

const getNextWorkingDay = (date, holidayList = []) => {
  let d = new Date(date);
  const dateStr = format(d, "yyyy-MM-dd");
  // Skip weekends and holidays
  while (isWeekend(d) || holidayList.includes(format(d, "yyyy-MM-dd"))) {
    d = addDays(d, 1);
  }
  return d;
};

export default function AgendaPage() {
  const { ambulatorio } = useAmbulatorio();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createPatientDialogOpen, setCreatePatientDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPrestazioni, setSelectedPrestazioni] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Edit appointment dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editPrestazioni, setEditPrestazioni] = useState([]);
  
  // Closed slots state
  const [closedSlots, setClosedSlots] = useState([]);
  const [closeAgendaDialogOpen, setCloseAgendaDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [closeMode, setCloseMode] = useState("slot"); // "slot" o "day"
  const [closeSlotOre, setCloseSlotOre] = useState([]); // Array di orari selezionati
  const [closeSlotTipo, setCloseSlotTipo] = useState("both"); // "PICC", "MED", "both"
  const [closeMotivo, setCloseMotivo] = useState("");
  
  // Timer per gestire click singolo vs doppio click
  const clickTimerRef = useRef(null);
  
  // New patient form state
  const [newPatientNome, setNewPatientNome] = useState("");
  const [newPatientCognome, setNewPatientCognome] = useState("");
  
  // Google Sheets sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncAnalyzing, setSyncAnalyzing] = useState(false);
  const [syncConflicts, setSyncConflicts] = useState([]);
  const [syncConflictChoices, setSyncConflictChoices] = useState({});
  const [syncStep, setSyncStep] = useState("initial"); // initial, conflicts, syncing
  const [pendingIgnoredNames, setPendingIgnoredNames] = useState([]); // Nomi da ignorare (salvati solo dopo conferma)
  const [nameAssociations, setNameAssociations] = useState({}); // Associazioni: nome_errato -> nome_corretto
  const [wrongAssociations, setWrongAssociations] = useState({}); // Accostamenti errati: {conflictId_name: {action: 'keep'|'new'|'replace', replaceWith: patientId}}
  
  // Database scelte (nomi ignorati)
  const [ignoredNamesDialogOpen, setIgnoredNamesDialogOpen] = useState(false);
  const [ignoredNamesList, setIgnoredNamesList] = useState([]);
  const [loadingIgnoredNames, setLoadingIgnoredNames] = useState(false);
  
  // Backup e rollback
  const [backupInfo, setBackupInfo] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);
  
  // Ricerca pazienti per "Sostituisci con"
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [allPatients, setAllPatients] = useState([]);

  const isVillaGinestre = ambulatorio === "villa_ginestre";

  // Carica info backup
  const loadBackupInfo = async () => {
    try {
      const response = await apiClient.get(`/sync/backup/${ambulatorio}`);
      setBackupInfo(response.data);
    } catch (error) {
      console.error("Error loading backup info:", error);
    }
  };

  // Annulla ultima sincronizzazione
  const handleRollback = async () => {
    if (!window.confirm("Sei sicuro di voler annullare l'ultima sincronizzazione? Tutti i dati verranno ripristinati allo stato precedente.")) {
      return;
    }
    
    setLoadingBackup(true);
    try {
      const response = await apiClient.post(`/sync/rollback/${ambulatorio}`);
      toast.success(`Ripristinati ${response.data.restored_patients} pazienti e ${response.data.restored_appointments} appuntamenti`);
      setBackupInfo(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nel ripristino");
    } finally {
      setLoadingBackup(false);
    }
  };

  // Svuota database scelte
  const handleClearIgnoredNames = async () => {
    if (!window.confirm("Sei sicuro di voler eliminare tutte le scelte salvate?")) {
      return;
    }
    
    try {
      const response = await apiClient.delete(`/sync/ignored-names/clear/${ambulatorio}`);
      toast.success(`Eliminate ${response.data.deleted_count} scelte`);
      setIgnoredNamesList([]);
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  // Carica tutti i pazienti per la ricerca
  const loadAllPatients = async () => {
    try {
      const response = await apiClient.get(`/patients?ambulatorio=${ambulatorio}`);
      setAllPatients(response.data || []);
    } catch (error) {
      console.error("Error loading patients:", error);
    }
  };

  // Filtra pazienti per ricerca
  const filteredPatients = patientSearchQuery
    ? allPatients.filter(p => 
        `${p.cognome} ${p.nome}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
      )
    : allPatients;

  // Analizza prima di sincronizzare
  const handleAnalyzeSync = async () => {
    setSyncAnalyzing(true);
    loadAllPatients(); // Carica pazienti per la ricerca
    setSyncStep("analyzing");
    try {
      const response = await apiClient.post("/sync/google-sheets/analyze", {
        ambulatorio,
        year: currentDate.getFullYear()
      });
      
      if (response.data.success) {
        if (response.data.has_conflicts) {
          // Ci sono conflitti da risolvere
          setSyncConflicts(response.data.conflicts);
          // Inizializza le scelte: pre-seleziona pazienti esistenti nel DB
          const initialChoices = {};
          response.data.conflicts.forEach(conflict => {
            // Pre-seleziona tutti i pazienti che esistono già nel database
            const existingPatients = conflict.options
              .filter(opt => opt.exists_in_db)
              .map(opt => opt.name);
            
            // Se nessun paziente esiste nel DB, seleziona il primo suggerito
            if (existingPatients.length > 0) {
              initialChoices[conflict.id] = existingPatients;
            } else {
              initialChoices[conflict.id] = [conflict.suggested || conflict.options[0]?.name].filter(Boolean);
            }
          });
          setSyncConflictChoices(initialChoices);
          setSyncStep("conflicts");
        } else {
          // Nessun conflitto, procedi con la sincronizzazione
          await handleGoogleSheetsSync({});
        }
      }
    } catch (error) {
      console.error("Analyze error:", error);
      toast.error(error.response?.data?.detail || "Errore nell'analisi");
      setSyncStep("initial");
    } finally {
      setSyncAnalyzing(false);
    }
  };

  // Sincronizza con Google Sheets
  const handleGoogleSheetsSync = async (corrections = null) => {
    setSyncLoading(true);
    setSyncStep("syncing");
    try {
      // Costruisci le correzioni dai conflitti risolti
      let nameCorrections = corrections;
      if (!nameCorrections && Object.keys(syncConflictChoices).length > 0) {
        nameCorrections = {};
        syncConflicts.forEach(conflict => {
          const chosenNames = syncConflictChoices[conflict.id] || [];
          
          console.log(`Conflitto ${conflict.id}:`, {
            opzioni: conflict.options.map(o => o.name),
            selezionati: chosenNames
          });
          
          // Se sono selezionati tutti, non serve nessuna correzione (ogni nome rimane separato)
          if (chosenNames.length === conflict.options.length) {
            console.log("Tutti selezionati, skip correzioni");
            return;
          }
          
          // Mappa i nomi NON selezionati usando le associazioni specifiche o il primo selezionato
          conflict.options.forEach(option => {
            if (!chosenNames.includes(option.name)) {
              // Usa l'associazione specifica se definita, altrimenti il primo selezionato
              const associationKey = `${conflict.id}_${option.name}`;
              const targetName = nameAssociations[associationKey] || chosenNames[0];
              if (targetName) {
                nameCorrections[option.name] = targetName;
                console.log(`Correzione: "${option.name}" -> "${targetName}"`);
              }
            }
          });
        });
      }
      
      console.log("Correzioni finali inviate:", nameCorrections);
      
      const response = await apiClient.post("/sync/google-sheets", {
        ambulatorio,
        year: currentDate.getFullYear(),
        name_corrections: nameCorrections
      });
      
      if (response.data.success) {
        // Salva i nomi "non chiedere più" nel database SOLO dopo conferma
        if (pendingIgnoredNames.length > 0) {
          try {
            for (const ignored of pendingIgnoredNames) {
              await apiClient.post("/sync/ignored-names", {
                ambulatorio,
                name: ignored.name,
                dates: ignored.dates
              });
            }
            console.log(`Salvati ${pendingIgnoredNames.length} nomi ignorati`);
          } catch (err) {
            console.error("Errore nel salvare nomi ignorati:", err);
          }
        }
        
        toast.success(
          `Sincronizzazione completata!\n` +
          `${response.data.created_patients} nuovi pazienti\n` +
          `${response.data.created_appointments} nuovi appuntamenti`
        );
        // Ricarica i dati e resetta tutto
        fetchData();
        setSyncDialogOpen(false);
        setSyncStep("initial");
        setSyncConflicts([]);
        setSyncConflictChoices({});
        setPendingIgnoredNames([]); // Reset nomi pending
        setNameAssociations({}); // Reset associazioni
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error.response?.data?.detail || "Errore nella sincronizzazione");
    } finally {
      setSyncLoading(false);
    }
  };

  // Funzione per toggle "non chiedere più" (salvato solo dopo conferma sync)
  const handleToggleIgnoreName = (name, dates) => {
    setPendingIgnoredNames(prev => {
      const isAlreadyIgnored = prev.some(p => p.name === name);
      if (isAlreadyIgnored) {
        // Rimuovi dalla lista pending
        toast.info(`"${name}" tornerà nelle scelte`);
        return prev.filter(p => p.name !== name);
      } else {
        // Aggiungi alla lista pending
        toast.success(`"${name}" verrà ignorato dopo la conferma`);
        return [...prev, { name, dates: dates || [] }];
      }
    });
  };

  // Verifica se un nome è nella lista pending ignore
  const isNamePendingIgnore = (name) => {
    return pendingIgnoredNames.some(p => p.name === name);
  };

  // Carica i nomi ignorati dal database
  const loadIgnoredNames = async () => {
    setLoadingIgnoredNames(true);
    try {
      const response = await apiClient.get(`/sync/ignored-names/${ambulatorio}`);
      setIgnoredNamesList(response.data.ignored_names || []);
    } catch (error) {
      console.error("Error loading ignored names:", error);
      toast.error("Errore nel caricamento delle scelte salvate");
    } finally {
      setLoadingIgnoredNames(false);
    }
  };

  // Rimuove un nome dalla lista degli ignorati (lo riabilita)
  const handleRestoreIgnoredName = async (ignoredId, name) => {
    try {
      await apiClient.delete(`/sync/ignored-names/${ignoredId}`);
      setIgnoredNamesList(prev => prev.filter(item => item.id !== ignoredId));
      toast.success(`"${name}" tornerà nelle scelte della sincronizzazione`);
    } catch (error) {
      console.error("Error restoring name:", error);
      toast.error("Errore nel ripristino del nome");
    }
  };

  // Apre il dialog del database scelte
  const openIgnoredNamesDialog = () => {
    setIgnoredNamesDialogOpen(true);
    loadIgnoredNames();
  };

  // Naviga alla cartella clinica del paziente
  const goToPatientFolder = (patientId) => {
    navigate(`/pazienti/${patientId}`);
  };

  // Gestisce click sul chip paziente con distinzione singolo/doppio click
  const handlePatientChipClick = (e, apt) => {
    e.stopPropagation();
    
    if (clickTimerRef.current) {
      // Doppio click: cancella timer e vai alla cartella
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      goToPatientFolder(apt.patient_id);
    } else {
      // Primo click: imposta timer per aprire popup
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleOpenEditDialog(e, apt);
      }, 250); // 250ms per distinguere doppio click
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const [appointmentsRes, patientsRes, holidaysRes, closedSlotsRes] = await Promise.all([
        apiClient.get("/appointments", {
          params: { ambulatorio, data: dateStr },
        }),
        apiClient.get("/patients", {
          params: { ambulatorio, status: "in_cura" },
        }),
        apiClient.get("/calendar/holidays", {
          params: { anno: currentDate.getFullYear() },
        }),
        apiClient.get("/closed-slots", {
          params: { ambulatorio, data: dateStr },
        }),
      ]);

      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setHolidays(holidaysRes.data);
      setClosedSlots(closedSlotsRes.data || []);
      
      // Set initial working day after holidays are loaded
      if (!initialLoadDone) {
        const workingDay = getNextWorkingDay(new Date(), holidaysRes.data);
        if (format(workingDay, "yyyy-MM-dd") !== format(currentDate, "yyyy-MM-dd")) {
          setCurrentDate(workingDay);
        }
        setInitialLoadDone(true);
      }
    } catch (error) {
      console.error("Error fetching agenda data:", error);
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
  }, [ambulatorio, currentDate, initialLoadDone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchQuery.length >= 1 && selectedSlot) {
      const tipo = selectedSlot.tipo;
      const filtered = patients.filter((p) => {
        const matchesSearch =
          p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cognome.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTipo =
          p.tipo === tipo || p.tipo === "PICC_MED";
        return matchesSearch && matchesTipo;
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [searchQuery, patients, selectedSlot]);

  const goToToday = () => setCurrentDate(getNextWorkingDay(new Date(), holidays));
  const goToPrevDay = () => {
    let newDate = subDays(currentDate, 1);
    while (isWeekend(newDate) || holidays.includes(format(newDate, "yyyy-MM-dd"))) {
      newDate = subDays(newDate, 1);
    }
    setCurrentDate(new Date(newDate));
  };
  const goToNextDay = () => {
    let newDate = addDays(currentDate, 1);
    while (isWeekend(newDate) || holidays.includes(format(newDate, "yyyy-MM-dd"))) {
      newDate = addDays(newDate, 1);
    }
    setCurrentDate(new Date(newDate));
  };

  const isHoliday = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return isWeekend(date) || holidays.includes(dateStr);
  };

  const getAppointmentsForSlot = (ora, tipo) => {
    return appointments.filter((a) => a.ora === ora && a.tipo === tipo);
  };

  // Verifica se uno slot è chiuso
  const isSlotClosed = (ora, tipo) => {
    return closedSlots.some(cs => {
      // Giornata intera chiusa
      if (!cs.ora && !cs.tipo) return true;
      // Giornata intera per un tipo
      if (!cs.ora && cs.tipo === tipo) return true;
      // Slot specifico per entrambi i tipi
      if (cs.ora === ora && !cs.tipo) return true;
      // Slot specifico per un tipo
      if (cs.ora === ora && cs.tipo === tipo) return true;
      return false;
    });
  };

  // Ottiene info sullo slot chiuso
  const getClosedSlotInfo = (ora, tipo) => {
    return closedSlots.find(cs => {
      if (!cs.ora && !cs.tipo) return true;
      if (!cs.ora && cs.tipo === tipo) return true;
      if (cs.ora === ora && !cs.tipo) return true;
      if (cs.ora === ora && cs.tipo === tipo) return true;
      return false;
    });
  };

  // Verifica se tutta la giornata è chiusa
  const isDayClosed = () => {
    return closedSlots.some(cs => !cs.ora && !cs.tipo);
  };

  // Chiudi slot o giornata
  const handleCloseAgenda = async () => {
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const payload = {
        data: dateStr,
        ambulatorio,
        motivo: closeMotivo || "Chiuso"
      };

      if (closeMode === "day") {
        // Chiudi tutta la giornata
        payload.ora = null;
        payload.tipo = null;
      } else {
        // Chiudi slot specifici (può essere multiplo)
        if (closeSlotOre.length === 0) {
          toast.error("Seleziona almeno un orario");
          return;
        }
        payload.ora = closeSlotOre.length === 1 ? closeSlotOre[0] : closeSlotOre;
        payload.tipo = closeSlotTipo === "both" ? null : closeSlotTipo;
      }

      const response = await apiClient.post("/closed-slots", payload);
      const count = response.data.created || 1;
      toast.success(closeMode === "day" ? "Giornata chiusa" : `${count} slot chiusi`);
      setCloseAgendaDialogOpen(false);
      resetCloseForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella chiusura");
    }
  };

  // Riapri uno slot
  const handleReopenSlot = async (slotId) => {
    try {
      await apiClient.delete(`/closed-slots/${slotId}`);
      toast.success("Slot riaperto");
      fetchData();
    } catch (error) {
      toast.error("Errore nella riapertura");
    }
  };

  // Riapri tutta la giornata
  const handleReopenDay = async () => {
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      await apiClient.post("/closed-slots/reopen-day", {
        ambulatorio,
        data: dateStr
      });
      toast.success("Giornata riaperta");
      setReopenDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Errore nella riapertura");
    }
  };

  // Toggle selezione orario
  const toggleSlotOra = (ora) => {
    setCloseSlotOre(prev => 
      prev.includes(ora) 
        ? prev.filter(o => o !== ora)
        : [...prev, ora]
    );
  };

  const resetCloseForm = () => {
    setCloseMode("slot");
    setCloseSlotOre([]);
    setCloseSlotTipo("both");
    setCloseMotivo("");
  };

  const handleSlotClick = (ora, tipo) => {
    if (isHoliday(currentDate)) return;
    
    // Verifica se lo slot è chiuso
    if (isSlotClosed(ora, tipo)) {
      // Apri il dialog per gestire le chiusure
      setReopenDialogOpen(true);
      return;
    }
    
    const existing = getAppointmentsForSlot(ora, tipo);
    if (existing.length >= 2) {
      toast.error("Slot pieno (max 2 pazienti)");
      return;
    }
    setSelectedSlot({ ora, tipo });
    setSearchQuery("");
    setSelectedPatient(null);
    setSelectedPrestazioni([]);
    setDialogOpen(true);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(`${patient.cognome} ${patient.nome}`);
    setFilteredPatients([]);
    
    // Auto-seleziona prestazioni in base al tipo di slot
    if (selectedSlot?.tipo === "PICC" && (patient.tipo === "PICC" || patient.tipo === "PICC_MED")) {
      // PICC: medicazione + irrigazione
      setSelectedPrestazioni(["medicazione_semplice", "irrigazione_catetere"]);
    } else if (selectedSlot?.tipo === "MED" && (patient.tipo === "MED" || patient.tipo === "PICC_MED")) {
      // MED: medicazione + fasciatura semplice
      setSelectedPrestazioni(["medicazione_semplice", "fasciatura_semplice"]);
    }
  };

  const handlePrestazioneToggle = (prestazioneId) => {
    setSelectedPrestazioni((prev) =>
      prev.includes(prestazioneId)
        ? prev.filter((p) => p !== prestazioneId)
        : [...prev, prestazioneId]
    );
  };

  const handleAddAppointment = async () => {
    if (!selectedPatient) {
      toast.error("Seleziona un paziente");
      return;
    }
    if (selectedPrestazioni.length === 0) {
      toast.error("Seleziona almeno una prestazione");
      return;
    }

    try {
      await apiClient.post("/appointments", {
        patient_id: selectedPatient.id,
        ambulatorio,
        data: format(currentDate, "yyyy-MM-dd"),
        ora: selectedSlot.ora,
        tipo: selectedSlot.tipo,
        prestazioni: selectedPrestazioni,
      });

      toast.success("Appuntamento aggiunto");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nell'aggiunta");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await apiClient.delete(`/appointments/${appointmentId}`);
      toast.success("Appuntamento rimosso");
      setEditDialogOpen(false);
      setEditingAppointment(null);
      fetchData();
    } catch (error) {
      toast.error("Errore nella rimozione");
    }
  };

  // Apre dialog di modifica appuntamento
  const handleOpenEditDialog = (e, appointment) => {
    e.stopPropagation();
    setEditingAppointment(appointment);
    setEditPrestazioni(appointment.prestazioni || []);
    setEditDialogOpen(true);
  };

  // Cambia stato appuntamento (con possibilità di deselezionare)
  const handleChangeStato = async (newStato) => {
    if (!editingAppointment) return;
    try {
      // Se lo stato è già quello selezionato, torna a "da_fare"
      const statoToSet = editingAppointment.stato === newStato ? "da_fare" : newStato;
      await apiClient.put(`/appointments/${editingAppointment.id}`, { stato: statoToSet });
      
      if (statoToSet === "da_fare") {
        toast.success("Stato resettato");
      } else if (statoToSet === "effettuato") {
        toast.success("Segnato come effettuato");
      } else {
        toast.success("Segnato come non presentato");
      }
      
      setEditDialogOpen(false);
      setEditingAppointment(null);
      fetchData();
    } catch (error) {
      toast.error("Errore nel cambio stato");
    }
  };

  // Salva modifiche prestazioni
  const handleSavePrestazioni = async () => {
    if (!editingAppointment || editPrestazioni.length === 0) {
      toast.error("Seleziona almeno una prestazione");
      return;
    }
    try {
      await apiClient.put(`/appointments/${editingAppointment.id}`, { prestazioni: editPrestazioni });
      toast.success("Prestazioni aggiornate");
      setEditDialogOpen(false);
      setEditingAppointment(null);
      fetchData();
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleEditPrestazioneToggle = (prestazioneId) => {
    setEditPrestazioni((prev) =>
      prev.includes(prestazioneId)
        ? prev.filter((p) => p !== prestazioneId)
        : [...prev, prestazioneId]
    );
  };

  const handleCreatePatient = async () => {
    if (!newPatientNome || !newPatientCognome) {
      toast.error("Inserisci nome e cognome");
      return;
    }

    try {
      const response = await apiClient.post("/patients", {
        nome: newPatientNome,
        cognome: newPatientCognome,
        tipo: selectedSlot?.tipo || "PICC",
        ambulatorio,
      });

      toast.success("Paziente creato");
      setCreatePatientDialogOpen(false);
      setNewPatientNome("");
      setNewPatientCognome("");
      
      // Refresh patients and select the new one
      await fetchData();
      setSelectedPatient(response.data);
      setSearchQuery(`${response.data.cognome} ${response.data.nome}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione");
    }
  };

  const prestazioni = selectedSlot?.tipo === "PICC" ? PRESTAZIONI_PICC : PRESTAZIONI_MED;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const holidayToday = isHoliday(currentDate);

  return (
    <div className="animate-fade-in" data-testid="agenda-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm">
            Gestione appuntamenti giornalieri
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevDay}
            data-testid="agenda-prev-day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[220px] justify-start font-medium"
                data-testid="agenda-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "EEEE d MMMM yyyy", { locale: it })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                    setCalendarOpen(false);
                  }
                }}
                locale={it}
                disabled={(date) => isWeekend(date)}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            data-testid="agenda-next-day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button variant="secondary" size="sm" onClick={goToToday}>
            Oggi
          </Button>

          {/* Pulsante Chiudi Agenda */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCloseAgendaDialogOpen(true)}
            className="ml-4 text-red-600 border-red-300 hover:bg-red-50"
          >
            <Lock className="w-4 h-4 mr-2" />
            Chiudi Agenda
          </Button>

          {/* Pulsante Gestisci Chiusure (solo se ci sono slot chiusi) */}
          {closedSlots.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setReopenDialogOpen(true)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Gestisci Chiusure ({closedSlots.length})
            </Button>
          )}

          {/* Pulsante Sincronizza Google Sheets */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSyncDialogOpen(true)}
            className="ml-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            data-testid="sync-google-sheets-btn"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Sincronizza Sheets
          </Button>
          <Button
            variant="outline" 
            size="sm" 
            onClick={openIgnoredNamesDialog}
            className="ml-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            data-testid="ignored-names-btn"
          >
            <Database className="w-4 h-4 mr-2" />
            Database Scelte
          </Button>
        </div>
      </div>

      {/* Holiday notice */}
      {holidayToday && (
        <div className="mb-4 p-4 bg-slate-100 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600 font-medium">
            Giorno non lavorativo - Prenotazioni non disponibili
          </p>
        </div>
      )}

      {/* Agenda Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div 
              className="grid gap-px bg-border"
              style={{ 
                gridTemplateColumns: isVillaGinestre 
                  ? "80px 1fr" 
                  : "80px 1fr 1fr",
                minWidth: isVillaGinestre ? "400px" : "600px"
              }}
            >
              {/* Headers */}
              <div className="bg-primary text-primary-foreground font-semibold p-3 text-center text-sm">
                Ora
              </div>
              <div className="bg-emerald-600 text-white font-semibold p-3 text-center text-sm">
                PICC
              </div>
              {!isVillaGinestre && (
                <div className="bg-primary text-primary-foreground font-semibold p-3 text-center text-sm">
                  MED
                </div>
              )}

              {/* Time slots */}
              {TIME_SLOTS.map((ora) => (
                <>
                  <div key={`time-${ora}`} className="bg-muted font-medium text-sm p-2 flex items-center justify-center">
                    {ora}
                  </div>

                  {/* PICC Column */}
                  <div
                    key={`picc-${ora}`}
                    className={`bg-card min-h-[70px] p-2 ${
                      holidayToday 
                        ? "bg-muted cursor-not-allowed" 
                        : isSlotClosed(ora, "PICC")
                          ? "bg-red-50 cursor-pointer border-l-4 border-red-400"
                          : "cursor-pointer hover:bg-emerald-50"
                    }`}
                    onClick={() => !holidayToday && handleSlotClick(ora, "PICC")}
                    data-testid={`agenda-slot-${ora}-picc`}
                  >
                    {isSlotClosed(ora, "PICC") ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center gap-2 text-red-500">
                          <Ban className="w-4 h-4" />
                          <span className="text-sm font-medium">Chiuso</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {getAppointmentsForSlot(ora, "PICC").map((apt) => (
                            <div
                              key={apt.id}
                              className={`relative px-4 py-2 rounded-lg border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${getStatoColorClass(apt.stato || "da_fare")}`}
                              title={`Click: gestisci | Doppio click: vai alla cartella`}
                              onClick={(e) => handlePatientChipClick(e, apt)}
                            >
                              <span className="font-bold text-base block">{apt.patient_cognome} {apt.patient_nome?.charAt(0)}.</span>
                            </div>
                          ))}
                        </div>
                        {!holidayToday && getAppointmentsForSlot(ora, "PICC").length < 2 && (
                          <div className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center mt-1">
                            <Plus className="w-3 h-3 mr-1" /> Aggiungi
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* MED Column (only for PTA Centro) */}
                  {!isVillaGinestre && (
                    <div
                      key={`med-${ora}`}
                      className={`bg-card min-h-[70px] p-2 ${
                        holidayToday 
                          ? "bg-muted cursor-not-allowed" 
                          : isSlotClosed(ora, "MED")
                            ? "bg-red-50 cursor-pointer border-l-4 border-red-400"
                            : "cursor-pointer hover:bg-blue-50"
                      }`}
                      onClick={() => !holidayToday && handleSlotClick(ora, "MED")}
                      data-testid={`agenda-slot-${ora}-med`}
                    >
                      {isSlotClosed(ora, "MED") ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex items-center gap-2 text-red-500">
                            <Ban className="w-4 h-4" />
                            <span className="text-sm font-medium">Chiuso</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {getAppointmentsForSlot(ora, "MED").map((apt) => (
                              <div
                                key={apt.id}
                                className={`relative px-4 py-2 rounded-lg border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${getStatoColorClass(apt.stato || "da_fare")}`}
                                title={`Click: gestisci | Doppio click: vai alla cartella`}
                                onClick={(e) => handlePatientChipClick(e, apt)}
                              >
                                <span className="font-bold text-base block">{apt.patient_cognome} {apt.patient_nome?.charAt(0)}.</span>
                              </div>
                            ))}
                          </div>
                          {!holidayToday && getAppointmentsForSlot(ora, "MED").length < 2 && (
                            <div className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center mt-1">
                              <Plus className="w-3 h-3 mr-1" /> Aggiungi
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Appuntamento</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {format(currentDate, "d MMMM yyyy", { locale: it })} alle {selectedSlot.ora} - {selectedSlot.tipo}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Search */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Paziente</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatePatientDialogOpen(true)}
                  className="h-7 text-xs"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Nuovo paziente
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="agenda-patient-search"
                  placeholder="Cerca per nome o cognome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredPatients.length > 0 && (
                <ScrollArea className="h-40 border rounded-md">
                  <div className="p-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        data-testid={`agenda-patient-option-${patient.id}`}
                        className="p-2 hover:bg-accent rounded cursor-pointer flex items-center justify-between"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <span className="font-medium">
                          {patient.cognome} {patient.nome}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          patient.tipo === "PICC" ? "bg-emerald-100 text-emerald-700" :
                          patient.tipo === "MED" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {patient.tipo}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {selectedPatient && (
                <div className="p-2 bg-accent rounded-md flex items-center justify-between">
                  <span>
                    <strong>{selectedPatient.cognome} {selectedPatient.nome}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchQuery("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Prestazioni */}
            <div className="space-y-2">
              <Label>Prestazioni (seleziona una o più)</Label>
              <div className="grid gap-2">
                {prestazioni.map((prest) => (
                  <div
                    key={prest.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPrestazioni.includes(prest.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handlePrestazioneToggle(prest.id)}
                    data-testid={`agenda-prestazione-${prest.id}`}
                  >
                    <Checkbox
                      checked={selectedPrestazioni.includes(prest.id)}
                      onCheckedChange={() => handlePrestazioneToggle(prest.id)}
                    />
                    <prest.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{prest.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleAddAppointment}
                disabled={!selectedPatient || selectedPrestazioni.length === 0}
                data-testid="agenda-add-appointment-btn"
              >
                Aggiungi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Patient Dialog */}
      <Dialog open={createPatientDialogOpen} onOpenChange={setCreatePatientDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuovo Paziente Rapido</DialogTitle>
            <DialogDescription>
              Crea un nuovo paziente {selectedSlot?.tipo || "PICC"} per aggiungerlo subito in agenda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cognome *</Label>
              <Input
                value={newPatientCognome}
                onChange={(e) => setNewPatientCognome(e.target.value)}
                placeholder="Cognome"
                data-testid="quick-patient-cognome"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newPatientNome}
                onChange={(e) => setNewPatientNome(e.target.value)}
                placeholder="Nome"
                data-testid="quick-patient-nome"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreatePatientDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreatePatient} data-testid="quick-patient-create-btn">
                Crea e Seleziona
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gestisci Appuntamento</DialogTitle>
            <DialogDescription>
              {editingAppointment && (
                <>
                  {editingAppointment.patient_cognome} {editingAppointment.patient_nome} - {editingAppointment.ora} ({editingAppointment.tipo})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stato */}
            <div className="space-y-2">
              <Label>Stato Appuntamento</Label>
              <p className="text-xs text-gray-500 mb-1">Clicca di nuovo sullo stesso stato per resettare</p>
              <div className="flex gap-2">
                <Button
                  variant={editingAppointment?.stato === "effettuato" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChangeStato("effettuato")}
                  className={`flex-1 ${editingAppointment?.stato === "effettuato" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"}`}
                >
                  ✓ Effettuato {editingAppointment?.stato === "effettuato" && "(clicca per resettare)"}
                </Button>
                <Button
                  variant={editingAppointment?.stato === "non_presentato" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleChangeStato("non_presentato")}
                  className={`flex-1 ${editingAppointment?.stato !== "non_presentato" ? "hover:bg-red-50 hover:text-red-700 hover:border-red-300" : ""}`}
                >
                  ✗ Non Presentato {editingAppointment?.stato === "non_presentato" && "(clicca per resettare)"}
                </Button>
              </div>
            </div>

            {/* Prestazioni */}
            <div className="space-y-2">
              <Label>Prestazioni</Label>
              <div className="grid gap-2">
                {(editingAppointment?.tipo === "PICC" ? PRESTAZIONI_PICC : PRESTAZIONI_MED).map((prest) => (
                  <div
                    key={prest.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      editPrestazioni.includes(prest.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleEditPrestazioneToggle(prest.id)}
                  >
                    <Checkbox
                      checked={editPrestazioni.includes(prest.id)}
                      onCheckedChange={() => handleEditPrestazioneToggle(prest.id)}
                    />
                    <prest.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{prest.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAppointment(editingAppointment?.id)}
                >
                  Elimina
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    goToPatientFolder(editingAppointment?.patient_id);
                  }}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Apri Cartella
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSavePrestazioni}>
                  Salva Prestazioni
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Chiudi Agenda */}
      <Dialog open={closeAgendaDialogOpen} onOpenChange={setCloseAgendaDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              Chiudi Agenda
            </DialogTitle>
            <DialogDescription>
              Chiudi uno o più slot o l'intera giornata del {format(currentDate, "d MMMM yyyy", { locale: it })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selezione modalità */}
            <div className="space-y-2">
              <Label>Cosa vuoi chiudere?</Label>
              <div className="flex gap-2">
                <Button
                  variant={closeMode === "slot" ? "default" : "outline"}
                  onClick={() => setCloseMode("slot")}
                  className="flex-1"
                >
                  Slot Specifici
                </Button>
                <Button
                  variant={closeMode === "day" ? "default" : "outline"}
                  onClick={() => setCloseMode("day")}
                  className="flex-1"
                >
                  Tutta la Giornata
                </Button>
              </div>
            </div>

            {/* Opzioni per slot specifici */}
            {closeMode === "slot" && (
              <>
                <div className="space-y-2">
                  <Label>Seleziona orari (click per selezionare/deselezionare)</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {TIME_SLOTS.map((ora) => {
                      const isSelected = closeSlotOre.includes(ora);
                      const isClosed = isSlotClosed(ora, closeSlotTipo === "both" ? "PICC" : closeSlotTipo);
                      return (
                        <Button
                          key={ora}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSlotOra(ora)}
                          disabled={isClosed}
                          className={`${isSelected ? "bg-red-500 hover:bg-red-600" : ""} ${isClosed ? "opacity-50" : ""}`}
                        >
                          {ora}
                        </Button>
                      );
                    })}
                  </div>
                  {closeSlotOre.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {closeSlotOre.length} orari selezionati: {closeSlotOre.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={closeSlotTipo} onValueChange={setCloseSlotTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Entrambi (PICC e MED)</SelectItem>
                      <SelectItem value="PICC">Solo PICC</SelectItem>
                      {!isVillaGinestre && <SelectItem value="MED">Solo MED</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo (opzionale)</Label>
              <Input
                placeholder="Es: Ferie, Formazione, Manutenzione..."
                value={closeMotivo}
                onChange={(e) => setCloseMotivo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setCloseAgendaDialogOpen(false);
              resetCloseForm();
            }}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCloseAgenda}
              disabled={closeMode === "slot" && closeSlotOre.length === 0}
            >
              <Lock className="w-4 h-4 mr-2" />
              {closeMode === "day" ? "Chiudi Giornata" : `Chiudi ${closeSlotOre.length} Slot`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestisci Chiusure */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-500" />
              Gestisci Chiusure
            </DialogTitle>
            <DialogDescription>
              Slot chiusi per il {format(currentDate, "d MMMM yyyy", { locale: it })}. Clicca su uno slot per riaprirlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {closedSlots.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nessuno slot chiuso</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {closedSlots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Ban className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium">
                          {slot.ora ? `Ore ${slot.ora}` : "Tutta la giornata"}
                          {slot.tipo && ` - Solo ${slot.tipo}`}
                        </p>
                        {slot.motivo && (
                          <p className="text-sm text-muted-foreground">{slot.motivo}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReopenSlot(slot.id)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      Riapri
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleReopenDay}
              className="text-green-600"
              disabled={closedSlots.length === 0}
            >
              <Unlock className="w-4 h-4 mr-2" />
              Riapri Tutto
            </Button>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Sincronizza Google Sheets */}
      <Dialog open={syncDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSyncStep("initial");
          setSyncConflicts([]);
          setSyncConflictChoices({});
        }
        setSyncDialogOpen(open);
      }}>
        <DialogContent className={syncStep === "conflicts" ? "sm:max-w-2xl max-h-[80vh]" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              {syncStep === "conflicts" ? "Risolvi Conflitti Nomi" : "Sincronizza con Google Sheets"}
            </DialogTitle>
            <DialogDescription>
              {syncStep === "conflicts" 
                ? "Abbiamo trovato nomi simili che potrebbero essere errori di battitura. Scegli quale nome tenere per ogni gruppo."
                : "Importa appuntamenti dal foglio Google collegato. I pazienti e gli appuntamenti mancanti verranno creati automaticamente."}
            </DialogDescription>
          </DialogHeader>

          {syncStep === "initial" && (
            <>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Cosa verrà importato:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Nuovi pazienti non presenti nel sistema</li>
                    <li>• Appuntamenti PICC e MED da tutti i fogli</li>
                    <li>• <strong>Rilevamento automatico errori di battitura</strong></li>
                    <li>• Gli appuntamenti esistenti non verranno duplicati</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Assicurati che il foglio Google sia <strong>pubblico in lettura</strong>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setSyncDialogOpen(false); setPendingIgnoredNames([]); }}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleAnalyzeSync}
                  disabled={syncAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {syncAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analizza e Sincronizza
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {syncStep === "conflicts" && (
            <>
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-4 py-2">
                  {syncConflicts.map((conflict, idx) => (
                    <div key={conflict.id} className={`p-4 rounded-lg border ${
                      conflict.has_existing_patient 
                        ? "bg-green-50 border-green-200" 
                        : "bg-amber-50 border-amber-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {conflict.has_existing_patient ? (
                          <UserCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                        <span className={`font-medium ${
                          conflict.has_existing_patient ? "text-green-800" : "text-amber-800"
                        }`}>
                          Conflitto #{idx + 1}: {conflict.reason}
                        </span>
                      </div>
                      
                      {conflict.has_existing_patient && (
                        <p className="text-sm text-green-700 mb-3 bg-green-100 p-2 rounded">
                          ⭐ I pazienti già nel sistema sono pre-selezionati. Deseleziona quelli da unire.
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Seleziona i pazienti da tenere come separati. Gli altri verranno uniti sotto il nome principale.
                      </p>
                      
                      <div className="space-y-2">
                        {conflict.options.map((option, optIdx) => {
                          const isSelected = (syncConflictChoices[conflict.id] || []).includes(option.name);
                          return (
                            <div 
                              key={optIdx} 
                              className={`flex items-start space-x-3 p-2 rounded transition-colors cursor-pointer ${
                                option.exists_in_db 
                                  ? isSelected 
                                    ? "bg-green-200 border-2 border-green-500" 
                                    : "bg-green-50 border border-green-300 hover:bg-green-100"
                                  : isSelected
                                    ? "bg-blue-100 border-2 border-blue-500"
                                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                              }`}
                              onClick={() => {
                                setSyncConflictChoices(prev => {
                                  const current = prev[conflict.id] || [];
                                  if (current.includes(option.name)) {
                                    // Deseleziona - permette di deselezionare tutti
                                    return {
                                      ...prev,
                                      [conflict.id]: current.filter(n => n !== option.name)
                                    };
                                  } else {
                                    // Seleziona
                                    return {
                                      ...prev,
                                      [conflict.id]: [...current, option.name]
                                    };
                                  }
                                });
                              }}
                            >
                              <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "border-gray-400 bg-white"
                              }`}>
                                {isSelected && <span className="text-xs font-bold">✓</span>}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold ${option.exists_in_db ? "text-green-900" : "text-gray-900"}`}>
                                    {option.name}
                                  </span>
                                  {option.name === conflict.suggested && (
                                    <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-medium">
                                      ⭐ CONSIGLIATO
                                    </span>
                                  )}
                                  {option.exists_in_db && (
                                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                                      ✓ GIÀ NEL SISTEMA
                                    </span>
                                  )}
                                  {option.source === "foglio" && !option.exists_in_db && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                      dal foglio
                                    </span>
                                  )}
                                  {isNamePendingIgnore(option.name) && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
                                      🚫 VERRÀ IGNORATO
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    ({option.similarity}% simile)
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {option.occurrences > 0 && (
                                    <span>{option.occurrences} appuntamenti nel foglio • </span>
                                  )}
                                  {option.dates.length > 0 && (
                                    <span>Date: {option.dates.slice(0, 3).join(", ")}{option.dates.length > 3 ? "..." : ""}</span>
                                  )}
                                  {option.tipos?.length > 0 && (
                                    <span> • Tipo: {option.tipos.join(", ")}</span>
                                  )}
                                </div>
                              </div>
                              {/* Pulsante Toggle Non chiedere più */}
                              <Button
                                type="button"
                                variant={isNamePendingIgnore(option.name) ? "default" : "ghost"}
                                size="sm"
                                className={`ml-2 text-xs shrink-0 ${
                                  isNamePendingIgnore(option.name) 
                                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                                    : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleIgnoreName(option.name, option.dates);
                                }}
                                title={isNamePendingIgnore(option.name) ? "Clicca per riabilitare" : "Non mostrare più questo nome nei conflitti"}
                              >
                                {isNamePendingIgnore(option.name) ? (
                                  <>
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Riabilita
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3 mr-1" />
                                    Non chiedere più
                                  </>
                                )}
                              </Button>
                              
                              {/* Selettore associazione se non selezionato e ci sono 2+ selezionati */}
                              {!isSelected && (syncConflictChoices[conflict.id] || []).length >= 2 && (
                                <div className="ml-2 flex items-center gap-1">
                                  <span className="text-xs text-gray-500">→</span>
                                  <select
                                    className="text-xs border rounded px-1 py-0.5 bg-white"
                                    value={nameAssociations[`${conflict.id}_${option.name}`] || (syncConflictChoices[conflict.id] || [])[0] || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setNameAssociations(prev => ({
                                        ...prev,
                                        [`${conflict.id}_${option.name}`]: e.target.value
                                      }));
                                    }}
                                  >
                                    {(syncConflictChoices[conflict.id] || []).map(selectedName => (
                                      <option key={selectedName} value={selectedName}>
                                        {selectedName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Pulsanti rapidi */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-200">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSyncConflictChoices(prev => ({
                                ...prev,
                                [conflict.id]: conflict.options.map(o => o.name)
                              }));
                            }}
                          >
                            Seleziona tutti
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => {
                              // Seleziona il paziente suggerito (priorità a quelli già nel sistema)
                              const suggested = conflict.suggested || 
                                conflict.options.find(o => o.exists_in_db)?.name || 
                                conflict.options[0]?.name;
                              setSyncConflictChoices(prev => ({
                                ...prev,
                                [conflict.id]: [suggested].filter(Boolean)
                              }));
                            }}
                          >
                            ⭐ Consigliato
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-gray-500"
                            onClick={() => {
                              // Deseleziona tutti
                              setSyncConflictChoices(prev => ({
                                ...prev,
                                [conflict.id]: []
                              }));
                            }}
                          >
                            Deseleziona tutti
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSyncStep("initial")}>
                  ← Indietro
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSyncDialogOpen(false); setPendingIgnoredNames([]); }}>
                    Annulla
                  </Button>
                  <Button 
                    onClick={() => handleGoogleSheetsSync()}
                    disabled={syncLoading || syncConflicts.some(c => !(syncConflictChoices[c.id]?.length > 0))}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {syncLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizzando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Conferma e Sincronizza
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Mostra nomi che verranno ignorati */}
              {pendingIgnoredNames.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    <Ban className="w-4 h-4 inline mr-1" />
                    {pendingIgnoredNames.length} nome/i verranno ignorati dopo la conferma:
                    <span className="font-medium ml-1">
                      {pendingIgnoredNames.map(p => p.name).join(", ")}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}

          {syncStep === "syncing" && (
            <div className="py-8 text-center">
              <RefreshCw className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Sincronizzazione in corso...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Database Scelte (nomi ignorati) */}
      <Dialog open={ignoredNamesDialogOpen} onOpenChange={setIgnoredNamesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              Database Scelte
            </DialogTitle>
            <DialogDescription>
              Nomi che non verranno più mostrati nei conflitti durante la sincronizzazione.
              Clicca su "Riabilita" per farli riapparire.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingIgnoredNames ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-2" />
                <p className="text-gray-500">Caricamento...</p>
              </div>
            ) : ignoredNamesList.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Ban className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Nessun nome ignorato</p>
                <p className="text-xs text-gray-400 mt-1">
                  I nomi su cui clicchi "Non chiedere più" durante la sincronizzazione appariranno qui
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <div className="space-y-2 p-2">
                  {ignoredNamesList.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Ignorato il {new Date(item.ignored_at).toLocaleDateString('it-IT')}
                          {item.ignored_by && ` da ${item.ignored_by}`}
                        </p>
                        {item.dates?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Date nel foglio: {item.dates.slice(0, 3).join(", ")}{item.dates.length > 3 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 text-green-600 border-green-300 hover:bg-green-50 shrink-0"
                        onClick={() => handleRestoreIgnoredName(item.id, item.name)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Riabilita
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {ignoredNamesList.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleClearIgnoredNames}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Svuota tutto
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setIgnoredNamesDialogOpen(false)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
