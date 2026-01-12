import { useState } from "react";
import { apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Copy, Check, Edit2, Calendar, Trash2, Save, Printer, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format, getDaysInMonth } from "date-fns";
import { it } from "date-fns/locale";

const GESTIONE_ITEMS = [
  { id: "data_giorno_mese", label: "Data (giorno/mese)" },
  { id: "uso_precauzioni_barriera", label: "Uso massime precauzioni barriera" },
  { id: "lavaggio_mani", label: "Lavaggio mani" },
  { id: "guanti_non_sterili", label: "Uso guanti non sterili" },
  { id: "cambio_guanti_sterili", label: "Cambio guanti con guanti sterili" },
  { id: "rimozione_medicazione_sutureless", label: "Rimozione medicazione e sostituzione sutureless device" },
  { id: "rimozione_medicazione_straordinaria", label: "Rimozione medicazione e sostituzione ord/straordinaria" },
  { id: "ispezione_sito", label: "Ispezione del sito" },
  { id: "sito_dolente", label: "Sito dolente" },
  { id: "edema_arrossamento", label: "Presenza di edema/arrossamento" },
  { id: "disinfezione_sito", label: "Disinfezione del sito" },
  { id: "exit_site_cm", label: "Exit-site cm" },
  { id: "fissaggio_sutureless", label: "Fissaggio catetere con sutureless device / cambio Ago di Huber" },
  { id: "medicazione_trasparente", label: "Impiego medicazione semipermeabile trasparente" },
  { id: "lavaggio_fisiologica", label: "Lavaggio con fisiologica in siringhe da 10cc/20cc" },
  { id: "disinfezione_clorexidina", label: "Disinfezione con Clorexidina 2%-delle porte di accesso" },
  { id: "difficolta_aspirazione", label: "Difficoltà di aspirazione" },
  { id: "difficolta_iniezione", label: "Difficoltà iniezione" },
  { id: "medicazione_clorexidina_prolungato", label: "Impiego medicazione con Clorexidina a rilascio prolungato" },
  { id: "port_protector", label: "Utilizzo Port Protector" },
  { id: "lock_eparina", label: "Lock eparina per lavaggi" },
  { id: "sostituzione_set", label: "Sostituzione set infusione" },
  { id: "ore_sostituzione_set", label: "Ore da precedente sostituzione set" },
  { id: "febbre", label: "Febbre: se presente riportare valore" },
  { id: "emocoltura", label: "Prelievo ematico per emocoltura" },
  { id: "emocoltura_positiva", label: "Emocoltura positiva per infezione CVC" },
  { id: "trasferimento", label: "Trasferimento in altra struttura sanitaria con CVC" },
  { id: "rimozione_cvc", label: "Rimozione CVC" },
  { id: "sigla_operatore", label: "SIGLA/MATRICOLA OPERATORE" },
];

// Quick input component for cell editing
const CellInput = ({ value, onChange, colId, itemId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const handleQuickSelect = (val) => {
    onChange(colId, itemId, val);
    setIsOpen(false);
  };

  const handleCustomSave = () => {
    onChange(colId, itemId, inputValue);
    setIsOpen(false);
  };

  const displayValue = value || "-";
  const hasValue = value && value !== "-";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`w-full h-full min-h-[32px] text-xs font-medium rounded transition-colors border ${
            hasValue
              ? value.toLowerCase() === "si" || value.toLowerCase() === "sì" || value.toLowerCase() === "x"
                ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-300"
                : value.toLowerCase() === "no"
                ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
              : "hover:bg-accent text-muted-foreground border-transparent hover:border-gray-300"
          }`}
        >
          {displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="center" style={{ zIndex: 9999 }}>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant={value === "X" ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => handleQuickSelect("X")}
            >
              X
            </Button>
            <Button
              size="sm"
              variant={value === "Sì" ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => handleQuickSelect("Sì")}
            >
              Sì
            </Button>
            <Button
              size="sm"
              variant={value === "No" ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => handleQuickSelect("No")}
            >
              No
            </Button>
          </div>
          <div className="flex gap-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 10))}
              placeholder="Testo..."
              className="h-8 text-xs"
              maxLength={10}
            />
            <Button size="sm" className="h-8 px-2" onClick={handleCustomSave}>
              <Check className="w-3 h-3" />
            </Button>
          </div>
          {hasValue && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-7 text-xs text-muted-foreground"
              onClick={() => handleQuickSelect("")}
            >
              Cancella
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const SchedaGestionePICC = ({ patientId, ambulatorio, schede, onRefresh, patientInfo }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheda, setSelectedScheda] = useState(null);
  // Default to December 2025
  const [newMese, setNewMese] = useState("2025-12");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("12");
  
  // State for dynamic columns (dates)
  const [columns, setColumns] = useState([]);
  const [columnData, setColumnData] = useState({});
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [insertPosition, setInsertPosition] = useState(null); // { index, side: 'left' | 'right' }

  const generateMonthOptions = () => {
    const options = [];
    // Start from December 2025 and go until 2040
    const startYear = 2025;
    const startMonth = 12; // December
    const endYear = 2040;
    
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = (year === startYear) ? startMonth : 1;
      for (let month = monthStart; month <= 12; month++) {
        options.push({
          value: `${year}-${month.toString().padStart(2, "0")}`,
          label: format(new Date(year, month - 1), "MMMM yyyy", { locale: it }),
        });
      }
    }
    return options;
  };

  // Separate options for year and month selectors
  const generateYearOptions = () => {
    const years = [];
    for (let year = 2025; year <= 2040; year++) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  const generateMonthOptionsOnly = () => {
    return [
      { value: "01", label: "Gennaio" },
      { value: "02", label: "Febbraio" },
      { value: "03", label: "Marzo" },
      { value: "04", label: "Aprile" },
      { value: "05", label: "Maggio" },
      { value: "06", label: "Giugno" },
      { value: "07", label: "Luglio" },
      { value: "08", label: "Agosto" },
      { value: "09", label: "Settembre" },
      { value: "10", label: "Ottobre" },
      { value: "11", label: "Novembre" },
      { value: "12", label: "Dicembre" },
    ];
  };

  const getAvailableDates = (mese) => {
    const [year, month] = mese.split("-").map(Number);
    const daysCount = getDaysInMonth(new Date(year, month - 1));
    const dates = [];
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      dates.push({
        value: dateStr,
        label: format(new Date(year, month - 1, day), "d MMMM", { locale: it }),
        shortLabel: `${day}/${month}`,
      });
    }
    return dates;
  };

  const handleCreate = async () => {
    if (schede.some((s) => s.mese === newMese)) {
      toast.error("Esiste già una scheda per questo mese");
      return;
    }

    try {
      const response = await apiClient.post("/schede-gestione-picc", {
        patient_id: patientId,
        ambulatorio,
        mese: newMese,
        giorni: {},
        note: "",
      });
      toast.success("Scheda mensile creata");
      setDialogOpen(false);
      onRefresh();
      handleOpenEdit(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore nella creazione");
    }
  };

  const handleOpenEdit = (scheda) => {
    setSelectedScheda(scheda);
    
    const existingData = scheda.giorni || {};
    const dates = [];
    const data = {};
    
    const keys = Object.keys(existingData);
    if (keys.length > 0) {
      const firstKey = keys[0];
      if (firstKey.includes("-")) {
        keys.forEach(dateStr => {
          dates.push(dateStr);
          data[dateStr] = existingData[dateStr];
        });
      } else {
        const [year, month] = scheda.mese.split("-").map(Number);
        keys.forEach(dayNum => {
          const dateStr = `${year}-${month.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
          dates.push(dateStr);
          data[dateStr] = existingData[dayNum];
        });
      }
    }
    
    dates.sort();
    
    setColumns(dates);
    setColumnData(data);
    setEditNote(scheda.note || "");
    setEditDialogOpen(true);
  };

  const handleAddColumn = (dateStr, position = null) => {
    if (columns.includes(dateStr)) {
      toast.error("Questa data è già presente");
      return;
    }
    
    let newColumns;
    let insertIdx;
    if (position !== null) {
      // Insert at specific position
      newColumns = [...columns];
      newColumns.splice(position, 0, dateStr);
      insertIdx = position;
    } else {
      // Add and sort
      newColumns = [...columns, dateStr].sort();
      insertIdx = newColumns.indexOf(dateStr);
    }
    
    // Auto-populate the date field in the new column
    const day = parseInt(dateStr.split("-")[2]);
    const month = parseInt(dateStr.split("-")[1]);
    const dateValue = `${day}/${month}`;
    
    // NUOVA FUNZIONALITÀ: Copia automatica dalla medicazione precedente
    // Se esiste una colonna precedente con dati, copia tutti i dati (eccetto la data)
    let newColumnData = { data_giorno_mese: dateValue };
    
    // Trova la colonna precedente più vicina che ha dati
    const sortedExistingColumns = [...columns].sort();
    const previousColumns = sortedExistingColumns.filter(col => col < dateStr);
    
    if (previousColumns.length > 0) {
      // Prendi l'ultima colonna precedente (la più vicina alla nuova data)
      const lastPreviousCol = previousColumns[previousColumns.length - 1];
      const previousData = columnData[lastPreviousCol];
      
      if (previousData && Object.keys(previousData).length > 0) {
        // Copia tutti i dati eccetto data_giorno_mese
        const { data_giorno_mese, ...restData } = previousData;
        newColumnData = { ...restData, data_giorno_mese: dateValue };
        toast.success("Dati copiati dalla medicazione precedente", { duration: 2000 });
      }
    }
    
    setColumns(newColumns);
    setColumnData(prev => ({ 
      ...prev, 
      [dateStr]: newColumnData 
    }));
    setInsertPosition(null);
  };

  const handleRemoveColumn = (dateStr) => {
    setColumns(prev => prev.filter(d => d !== dateStr));
    setColumnData(prev => {
      const { [dateStr]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleCellChange = (colId, itemId, value) => {
    setColumnData((prev) => {
      const colData = prev[colId] || {};
      if (!value || value === "") {
        const { [itemId]: removed, ...rest } = colData;
        return { ...prev, [colId]: rest };
      }
      return {
        ...prev,
        [colId]: {
          ...colData,
          [itemId]: value,
        },
      };
    });
  };

  const handleCopyFromPrevious = (currentColIndex) => {
    if (currentColIndex <= 0) {
      toast.error("Non c'è una colonna precedente da copiare");
      return;
    }
    
    const prevCol = columns[currentColIndex - 1];
    const currentCol = columns[currentColIndex];
    const prevData = columnData[prevCol];
    
    if (!prevData || Object.keys(prevData).length === 0) {
      toast.error("La colonna precedente non ha dati");
      return;
    }

    // Copy all data except the date field
    const { data_giorno_mese, ...restData } = prevData;
    const currentDate = columnData[currentCol]?.data_giorno_mese || "";
    
    setColumnData(prev => ({
      ...prev,
      [currentCol]: { 
        ...restData,
        data_giorno_mese: currentDate
      },
    }));
    toast.success("Dati copiati dalla colonna precedente");
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const giorni = {};
      columns.forEach(dateStr => {
        if (columnData[dateStr] && Object.keys(columnData[dateStr]).length > 0) {
          giorni[dateStr] = columnData[dateStr];
        }
      });

      await apiClient.put(`/schede-gestione-picc/${selectedScheda.id}`, {
        giorni,
        note: editNote,
      });
      toast.success("Scheda salvata");
      setEditDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheda) return;
    
    try {
      await apiClient.delete(`/schede-gestione-picc/${selectedScheda.id}`);
      toast.success("Scheda eliminata");
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  // Print only filled days
  const handlePrintFilled = () => {
    if (columns.length === 0) {
      toast.error("Nessuna data da stampare");
      return;
    }

    const filledColumns = columns.filter(col => 
      columnData[col] && Object.keys(columnData[col]).length > 0
    );

    if (filledColumns.length === 0) {
      toast.error("Nessuna medicazione compilata da stampare");
      return;
    }

    generatePrintHTML(filledColumns, false);
  };

  // Print complete table (1-31)
  const handlePrintComplete = () => {
    generatePrintHTML(columns, true);
  };

  const generatePrintHTML = (colsToPrint, isComplete) => {
    const [year, month] = selectedScheda.mese.split("-").map(Number);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const monthName = format(new Date(year, month - 1), "MMMM yyyy", { locale: it });

    // Create column headers
    let colHeaders = "";
    let colCount = 0;
    
    if (isComplete) {
      // Generate all 31 columns
      for (let day = 1; day <= 31; day++) {
        colHeaders += `<th class="day-col">${day}</th>`;
        colCount++;
      }
    } else {
      // Only filled columns
      colsToPrint.forEach(dateStr => {
        const day = parseInt(dateStr.split("-")[2]);
        colHeaders += `<th class="day-col">${day}</th>`;
        colCount++;
      });
    }

    // Create rows - starting with "Data" instead of full GESTIONE_ITEMS
    let rows = "";
    
    // First row: Data (giorno/mese) - only for this row
    const dataItem = GESTIONE_ITEMS[0];
    let dataCells = "";
    if (isComplete) {
      for (let day = 1; day <= 31; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        const value = columnData[dateStr]?.data_giorno_mese || `${day}/${month}`;
        dataCells += `<td class="data-cell">${value}</td>`;
      }
    } else {
      colsToPrint.forEach(dateStr => {
        const day = parseInt(dateStr.split("-")[2]);
        const value = columnData[dateStr]?.data_giorno_mese || `${day}/${month}`;
        dataCells += `<td class="data-cell">${value}</td>`;
      });
    }
    rows += `<tr><td class="activity-cell">${dataItem.label}</td>${dataCells}</tr>`;
    
    // Remaining rows
    GESTIONE_ITEMS.slice(1).forEach(item => {
      let cells = "";
      
      if (isComplete) {
        // All 31 days
        for (let day = 1; day <= 31; day++) {
          const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
          const value = columnData[dateStr]?.[item.id] || "";
          cells += `<td class="data-cell">${value}</td>`;
        }
      } else {
        // Only filled columns
        colsToPrint.forEach(dateStr => {
          const value = columnData[dateStr]?.[item.id] || "";
          cells += `<td class="data-cell">${value}</td>`;
        });
      }
      
      rows += `<tr><td class="activity-cell">${item.label}</td>${cells}</tr>`;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scheda Gestione PICC - ${monthName}</title>
        <style>
          @page { 
            size: landscape; 
            margin: 10mm;
          }
          * { 
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 8pt;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
          }
          .header h1 {
            font-size: 12pt;
            margin-bottom: 3px;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            margin-top: 5px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            margin-bottom: 10px;
            font-size: 8pt;
          }
          .patient-info div {
            border: 1px solid #ccc;
            padding: 3px 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
          }
          th, td {
            border: 1px solid #333;
            padding: 2px;
            text-align: center;
          }
          th {
            background: #e0e0e0;
            font-weight: bold;
          }
          .activity-cell {
            text-align: left;
            padding-left: 5px;
            white-space: nowrap;
            font-size: 7pt;
            min-width: 180px;
            max-width: 200px;
          }
          .day-col {
            width: ${isComplete ? '18px' : '25px'};
            min-width: ${isComplete ? '18px' : '25px'};
          }
          .data-cell {
            width: ${isComplete ? '18px' : '25px'};
            min-width: ${isComplete ? '18px' : '25px'};
            font-size: 6pt;
          }
          .note-section {
            margin-top: 10px;
            padding: 5px;
            border: 1px solid #333;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SCHEDA IMPIANTO E GESTIONE ACCESSI VENOSI</h1>
          <div class="header-info">
            <span>Mese: ${monthName}</span>
            <span>${isComplete ? 'Stampa Completa' : 'Solo Giorni Compilati'}</span>
          </div>
        </div>
        
        <div class="patient-info">
          <div><strong>Cognome e Nome:</strong> ${patientInfo?.cognome || ''} ${patientInfo?.nome || ''}</div>
          <div><strong>Data di nascita:</strong> ${patientInfo?.data_nascita || ''}</div>
          <div><strong>Codice Fiscale:</strong> ${patientInfo?.codice_fiscale || ''}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="activity-cell">Data</th>
              ${colHeaders}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${editNote ? `<div class="note-section"><strong>Note:</strong> ${editNote}</div>` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getFilledColumnsCount = (scheda) => {
    const giorni = scheda.giorni || {};
    return Object.keys(giorni).length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Schede Medicazione PICC</h2>
          <p className="text-sm text-muted-foreground">
            Tracciamento mensile - aggiungi date e compila le attività
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="new-scheda-gestione-btn">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Mese
        </Button>
      </div>

      {schede.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna scheda presente</p>
            <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
              Crea la prima scheda mensile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {schede.map((scheda) => {
            const completedCols = getFilledColumnsCount(scheda);
            return (
              <Card
                key={scheda.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleOpenEdit(scheda)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">
                      {format(new Date(scheda.mese + "-01"), "MMMM yyyy", { locale: it })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {completedCols} medicazioni
                      </span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenEdit(scheda); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setSelectedScheda(scheda); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Scheda Mensile PICC</DialogTitle>
            <DialogDescription>Seleziona mese e anno per la nuova scheda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mese</Label>
                <Select 
                  value={selectedMonth} 
                  onValueChange={(val) => {
                    setSelectedMonth(val);
                    setNewMese(`${selectedYear}-${val}`);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Mese" /></SelectTrigger>
                  <SelectContent>
                    {generateMonthOptionsOnly().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anno</Label>
                <Select 
                  value={selectedYear} 
                  onValueChange={(val) => {
                    setSelectedYear(val);
                    setNewMese(`${val}-${selectedMonth}`);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Anno" /></SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scheda selezionata: <span className="font-medium capitalize">{format(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1), "MMMM yyyy", { locale: it })}</span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
              <Button onClick={handleCreate}>Crea Scheda</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Full screen with scroll support */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] p-0 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <DialogTitle className="capitalize">
                  Scheda {selectedScheda && format(new Date(selectedScheda.mese + "-01"), "MMMM yyyy", { locale: it })}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {/* Print Buttons */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Stampa
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handlePrintFilled}>
                      <Printer className="w-4 h-4 mr-2" />
                      Stampa Solo Compilati
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePrintComplete}>
                      <FileText className="w-4 h-4 mr-2" />
                      Stampa Completa (1-31)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
            <DialogDescription className="mt-1">
              Aggiungi date con + , compila le attività. Usa i pulsanti ← → per inserire colonne.
            </DialogDescription>
          </div>

          {selectedScheda && (
            <div className="flex-1 flex flex-col min-h-0 p-4">
              {/* Add Date Section */}
              <div className="flex-shrink-0 flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 mb-3">
                <Plus className="w-4 h-4 text-emerald-600" />
                <Label className="text-sm font-medium text-emerald-700">Aggiungi Data:</Label>
                <Select onValueChange={(dateStr) => handleAddColumn(dateStr)}>
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="Seleziona data..." />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 9999 }}>
                    {getAvailableDates(selectedScheda.mese)
                      .filter(d => !columns.includes(d.value))
                      .map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-emerald-600 ml-2">
                  {columns.length} date aggiunte
                </span>
              </div>

              {/* Table with full horizontal and vertical scroll support */}
              <div className="flex-1 border rounded-lg overflow-auto min-h-0" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                {columns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <Calendar className="w-12 h-12 mb-4 opacity-50" />
                    <p>Nessuna data aggiunta</p>
                    <p className="text-sm">Usa il selettore sopra per aggiungere date</p>
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse" style={{ minWidth: `${200 + columns.length * 80}px` }}>
                    <thead className="sticky top-0 z-20">
                      <tr>
                        <th className="sticky left-0 z-30 bg-emerald-600 text-white p-2 text-left min-w-[200px] font-semibold">
                          Data
                        </th>
                        {columns.map((dateStr, idx) => {
                          const date = new Date(dateStr);
                          return (
                            <th key={dateStr} className="bg-emerald-600 text-white p-1 min-w-[80px] text-center font-medium">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold">{format(date, "d", { locale: it })}</span>
                                <span className="text-[10px] opacity-80">{format(date, "MMM", { locale: it })}</span>
                                <div className="flex gap-0.5 mt-1">
                                  {/* Insert Left Button */}
                                  <button
                                    className="p-0.5 hover:bg-emerald-500 rounded text-white/80 hover:text-white"
                                    onClick={() => {
                                      setInsertPosition({ index: idx, side: 'left' });
                                    }}
                                    title="Inserisci colonna a sinistra"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  {idx > 0 && (
                                    <button
                                      className="p-0.5 hover:bg-emerald-500 rounded"
                                      onClick={() => handleCopyFromPrevious(idx)}
                                      title="Incolla da precedente"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    className="p-0.5 hover:bg-red-500 rounded"
                                    onClick={() => handleRemoveColumn(dateStr)}
                                    title="Rimuovi colonna"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  {/* Insert Right Button */}
                                  <button
                                    className="p-0.5 hover:bg-emerald-500 rounded text-white/80 hover:text-white"
                                    onClick={() => {
                                      setInsertPosition({ index: idx + 1, side: 'right' });
                                    }}
                                    title="Inserisci colonna a destra"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {GESTIONE_ITEMS.map((item, rowIdx) => (
                        <tr key={item.id} className={rowIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="sticky left-0 z-10 bg-slate-100 p-2 font-medium border-b border-r text-xs whitespace-nowrap">
                            {item.id === "data_giorno_mese" ? "Data (giorno/mese)" : item.label}
                          </td>
                          {columns.map((dateStr) => (
                            <td key={dateStr} className="p-0.5 border-b border-r border-gray-200">
                              <CellInput
                                value={columnData[dateStr]?.[item.id] || ""}
                                onChange={handleCellChange}
                                colId={dateStr}
                                itemId={item.id}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Notes Section */}
              <div className="flex-shrink-0 mt-3 space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  placeholder="Note aggiuntive..."
                  className="resize-none"
                />
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 flex justify-end gap-2 pt-3 border-t mt-3">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annulla</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Insert Column Position Dialog */}
      <Dialog open={insertPosition !== null} onOpenChange={() => setInsertPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserisci Nuova Colonna</DialogTitle>
            <DialogDescription>
              Seleziona la data da inserire {insertPosition?.side === 'left' ? 'a sinistra' : 'a destra'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={(dateStr) => {
              handleAddColumn(dateStr, insertPosition?.index);
            }}>
              <SelectTrigger><SelectValue placeholder="Seleziona data..." /></SelectTrigger>
              <SelectContent>
                {selectedScheda && getAvailableDates(selectedScheda.mese)
                  .filter(d => !columns.includes(d.value))
                  .map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setInsertPosition(null)}>Annulla</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa scheda?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchedaGestionePICC;
