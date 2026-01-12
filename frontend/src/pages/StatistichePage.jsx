import { useState, useEffect, useCallback, useRef } from "react";
import { useAmbulatorio, apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  Bandage,
  Syringe,
  Droplets,
  CircleDot,
  ChevronDown,
  ArrowRight,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  { value: null, label: "Tutto l'anno" },
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

const PRESTAZIONI_LABELS = {
  medicazione_semplice: { label: "Medicazione semplice", icon: Bandage },
  irrigazione_catetere: { label: "Irrigazione catetere", icon: Droplets },
  fasciatura_semplice: { label: "Fasciatura semplice", icon: CircleDot },
  iniezione_terapeutica: { label: "Iniezione terapeutica", icon: Syringe },
  catetere_vescicale: { label: "Catetere vescicale", icon: Droplets },
  espianto_picc: { label: "Espianto PICC", icon: CircleDot, isEspianto: true },
  espianto_picc_port: { label: "Espianto PICC Port", icon: CircleDot, isEspianto: true },
  espianto_midline: { label: "Espianto Midline", icon: CircleDot, isEspianto: true },
};

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

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

// Visual comparison badge component
const ComparisonBadge = ({ current, compare, invertColors = false }) => {
  if (compare === null || compare === undefined) return null;
  
  const diff = current - compare;
  
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <Minus className="w-3 h-3" />
        <span>=0</span>
      </span>
    );
  }
  
  // For most stats, positive is good (green). invertColors flips this logic
  const isPositive = invertColors ? diff < 0 : diff > 0;
  
  if (isPositive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
        <TrendingUp className="w-3 h-3" />
        <span>+{Math.abs(diff)}</span>
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
      <TrendingDown className="w-3 h-3" />
      <span>-{Math.abs(diff)}</span>
    </span>
  );
};

// Stat Card with comparison
const StatCard = ({ title, value, compareValue, icon: Icon, showComparison }) => {
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="stat-value">{value || 0}</p>
          <p className="stat-label">{title}</p>
          {showComparison && compareValue !== null && (
            <div className="mt-2">
              <ComparisonBadge current={value || 0} compare={compareValue} />
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default function StatistichePage() {
  const { ambulatorio } = useAmbulatorio();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [implantStats, setImplantStats] = useState(null);
  const [espiantiStats, setEspiantiStats] = useState(null);
  const [compareStats, setCompareStats] = useState(null);
  const [compareImplantStats, setCompareImplantStats] = useState(null);
  const [compareEspiantiStats, setCompareEspiantiStats] = useState(null);
  const [activeTab, setActiveTab] = useState(
    ambulatorio === "villa_ginestre" ? "PICC" : "MED"
  );

  // Primary period filters
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(null); // null = tutto l'anno

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareAnno, setCompareAnno] = useState(new Date().getFullYear() - 1); // Anno precedente per confronto
  const [compareMese, setCompareMese] = useState(null); // null = tutto l'anno

  const isVillaGinestre = ambulatorio === "villa_ginestre";

  // Convert to select options
  const yearOptions = YEARS.map(y => ({ value: y, label: y.toString() }));
  const monthOptions = MONTHS.map(m => ({ value: m.value, label: m.label }));

  // Get period label for display
  const getPeriodLabel = (year, month) => {
    if (month === null) {
      return `Anno ${year}`;
    }
    const monthName = MONTHS.find(m => m.value === month)?.label || "";
    return `${monthName} ${year}`;
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "IMPIANTI") {
        // Fetch implant statistics for primary period
        const params = { ambulatorio, anno };
        if (mese !== null) params.mese = mese;
        const response = await apiClient.get("/statistics/implants", { params });
        setImplantStats(response.data);
        
        // Fetch espianti statistics
        const espiantiResponse = await apiClient.get("/statistics/espianti", { params });
        setEspiantiStats(espiantiResponse.data);
        
        setStats(null);

        // Fetch compare period if enabled
        if (compareMode) {
          const compareParams = { ambulatorio, anno: compareAnno };
          if (compareMese !== null) compareParams.mese = compareMese;
          const compareResponse = await apiClient.get("/statistics/implants", { params: compareParams });
          setCompareImplantStats(compareResponse.data);
          
          const compareEspiantiResponse = await apiClient.get("/statistics/espianti", { params: compareParams });
          setCompareEspiantiStats(compareEspiantiResponse.data);
        } else {
          setCompareImplantStats(null);
          setCompareEspiantiStats(null);
        }
      } else if (activeTab === "ESPIANTI") {
        // Fetch espianti statistics for primary period
        const params = { ambulatorio, anno };
        if (mese !== null) params.mese = mese;
        const response = await apiClient.get("/statistics/espianti", { params });
        setEspiantiStats(response.data);
        setStats(null);
        setImplantStats(null);

        // Fetch compare period if enabled
        if (compareMode) {
          const compareParams = { ambulatorio, anno: compareAnno };
          if (compareMese !== null) compareParams.mese = compareMese;
          const compareResponse = await apiClient.get("/statistics/espianti", { params: compareParams });
          setCompareEspiantiStats(compareResponse.data);
        } else {
          setCompareEspiantiStats(null);
        }
        setCompareImplantStats(null);
        setCompareStats(null);
      } else {
        // Fetch regular statistics for primary period
        const params = {
          ambulatorio,
          anno,
          tipo: isVillaGinestre ? "PICC" : activeTab,
        };
        if (mese !== null) params.mese = mese;

        const response = await apiClient.get("/statistics", { params });
        setStats(response.data);
        setImplantStats(null);
        setEspiantiStats(null);

        // Fetch compare period if enabled
        if (compareMode) {
          const compareParams = {
            ambulatorio,
            anno: compareAnno,
            tipo: isVillaGinestre ? "PICC" : activeTab,
          };
          if (compareMese !== null) compareParams.mese = compareMese;
          const compareResponse = await apiClient.get("/statistics", { params: compareParams });
          setCompareStats(compareResponse.data);
        } else {
          setCompareStats(null);
        }
        setCompareImplantStats(null);
        setCompareEspiantiStats(null);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
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
  }, [ambulatorio, anno, mese, activeTab, compareMode, compareAnno, compareMese, isVillaGinestre]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const generateExcel = () => {
    const tipo = isVillaGinestre ? "PICC" : activeTab;
    const periodo = mese !== null ? `${MONTHS.find(m => m.value === mese)?.label}_${anno}` : `Anno_${anno}`;
    const ambulatorioName = ambulatorio === "pta_centro" ? "PTA Centro" : "Villa delle Ginestre";
    
    let csvContent = "REPORT AMBULATORIO INFERMIERISTICO\n";
    csvContent += `Tipo: ${tipo}\n`;
    csvContent += `Periodo: ${mese !== null ? MONTHS.find(m => m.value === mese)?.label + ' ' + anno : 'Anno ' + anno}\n`;
    csvContent += `Ambulatorio: ${ambulatorioName}\n`;
    
    if (compareMode) {
      const comparePeriodoLabel = compareMese !== null ? `${MONTHS.find(m => m.value === compareMese)?.label} ${compareAnno}` : `Anno ${compareAnno}`;
      csvContent += `Confronto con: ${comparePeriodoLabel}\n`;
    }
    csvContent += "\n";
    
    if (activeTab === "IMPIANTI" && implantStats) {
      csvContent += "RIEPILOGO IMPIANTI\n";
      csvContent += `Totale Impianti;${implantStats.totale_impianti}`;
      if (compareMode && compareImplantStats) {
        const diff = implantStats.totale_impianti - compareImplantStats.totale_impianti;
        csvContent += `;${diff >= 0 ? '+' : ''}${diff}`;
      }
      csvContent += "\n\n";
      
      csvContent += "DETTAGLIO PER TIPO\n";
      csvContent += compareMode ? "Tipo Impianto;Quantità;Differenza\n" : "Tipo Impianto;Quantità\n";
      Object.entries(implantStats.per_tipo || {}).forEach(([key, value]) => {
        const label = implantStats.tipo_labels?.[key] || key;
        csvContent += `${label};${value}`;
        if (compareMode && compareImplantStats) {
          const compareVal = compareImplantStats.per_tipo?.[key] || 0;
          const diff = value - compareVal;
          csvContent += `;${diff >= 0 ? '+' : ''}${diff}`;
        }
        csvContent += "\n";
      });
    } else if (stats) {
      csvContent += "RIEPILOGO GENERALE\n";
      csvContent += `Totale Accessi;${stats.totale_accessi}`;
      if (compareMode && compareStats) {
        const diff = stats.totale_accessi - compareStats.totale_accessi;
        csvContent += `;${diff >= 0 ? '+' : ''}${diff}`;
      }
      csvContent += "\n";
      
      csvContent += `Pazienti Unici;${stats.pazienti_unici}`;
      if (compareMode && compareStats) {
        const diff = stats.pazienti_unici - compareStats.pazienti_unici;
        csvContent += `;${diff >= 0 ? '+' : ''}${diff}`;
      }
      csvContent += "\n\n";
      
      csvContent += "DETTAGLIO PRESTAZIONI\n";
      csvContent += compareMode ? "Prestazione;Quantità;Differenza\n" : "Prestazione;Quantità\n";
      Object.entries(stats.prestazioni || {}).forEach(([key, value]) => {
        const label = PRESTAZIONI_LABELS[key]?.label || key;
        csvContent += `${label};${value}`;
        if (compareMode && compareStats) {
          const compareVal = compareStats.prestazioni?.[key] || 0;
          const diff = value - compareVal;
          csvContent += `;${diff >= 0 ? '+' : ''}${diff}`;
        }
        csvContent += "\n";
      });
    } else {
      toast.error("Nessun dato da esportare");
      return;
    }

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${tipo}_${periodo}.csv`;
    link.click();
    toast.success("Report Excel (CSV) scaricato");
  };

  const generatePDF = () => {
    const tipo = isVillaGinestre ? "PICC" : activeTab;
    const periodo = mese !== null ? `${MONTHS.find(m => m.value === mese)?.label} ${anno}` : `Anno ${anno}`;
    const ambulatorioName = ambulatorio === "pta_centro" ? "PTA Centro" : "Villa delle Ginestre";
    const confrontoPeriodo = compareMode ? (compareMese !== null ? `${MONTHS.find(m => m.value === compareMese)?.label} ${compareAnno}` : `Anno ${compareAnno}`) : null;

    const getDiffBadge = (current, compare) => {
      if (!compareMode || compare === null || compare === undefined) return '';
      const diff = current - compare;
      if (diff === 0) return '<span class="badge neutral">=0</span>';
      if (diff > 0) return `<span class="badge positive">+${diff}</span>`;
      return `<span class="badge negative">${diff}</span>`;
    };

    let bodyContent = "";
    
    if (activeTab === "IMPIANTI" && implantStats) {
      const compareTotale = compareImplantStats?.totale_impianti || 0;
      
      bodyContent = `
        <h2>📈 Riepilogo Impianti</h2>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${implantStats.totale_impianti || 0}</div>
            <div class="stat-label">Totale Impianti</div>
            ${getDiffBadge(implantStats.totale_impianti || 0, compareTotale)}
          </div>
        </div>

        <h2>💉 Dettaglio per Tipo</h2>
        <table>
          <thead>
            <tr>
              <th>Tipo Impianto</th>
              <th>Quantità</th>
              ${compareMode ? '<th>Confronto</th><th>Differenza</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${Object.entries(implantStats.per_tipo || {}).map(([key, value]) => {
              const compareVal = compareImplantStats?.per_tipo?.[key] || 0;
              return `
                <tr>
                  <td>${implantStats.tipo_labels?.[key] || key}</td>
                  <td><strong>${value}</strong></td>
                  ${compareMode ? `<td>${compareVal}</td><td>${getDiffBadge(value, compareVal)}</td>` : ''}
                </tr>
              `;
            }).join('')}
            ${Object.keys(implantStats.per_tipo || {}).length === 0 ? `<tr><td colspan="${compareMode ? 4 : 2}" style="text-align:center;color:#64748b;">Nessun impianto registrato</td></tr>` : ''}
          </tbody>
        </table>
      `;
    } else if (stats) {
      const compareAccessi = compareStats?.totale_accessi || 0;
      const comparePazienti = compareStats?.pazienti_unici || 0;
      
      bodyContent = `
        <h2>📈 Riepilogo Generale</h2>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totale_accessi}</div>
            <div class="stat-label">Totale Accessi</div>
            ${getDiffBadge(stats.totale_accessi, compareAccessi)}
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pazienti_unici}</div>
            <div class="stat-label">Pazienti Unici</div>
            ${getDiffBadge(stats.pazienti_unici, comparePazienti)}
          </div>
        </div>

        <h2>💉 Dettaglio Prestazioni</h2>
        <table>
          <thead>
            <tr>
              <th>Prestazione</th>
              <th>Quantità</th>
              ${compareMode ? '<th>Confronto</th><th>Differenza</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.prestazioni || {}).map(([key, value]) => {
              const compareVal = compareStats?.prestazioni?.[key] || 0;
              return `
                <tr>
                  <td>${PRESTAZIONI_LABELS[key]?.label || key}</td>
                  <td><strong>${value}</strong></td>
                  ${compareMode ? `<td>${compareVal}</td><td>${getDiffBadge(value, compareVal)}</td>` : ''}
                </tr>
              `;
            }).join('')}
            ${Object.keys(stats.prestazioni || {}).length === 0 ? `<tr><td colspan="${compareMode ? 4 : 2}" style="text-align:center;color:#64748b;">Nessuna prestazione registrata</td></tr>` : ''}
          </tbody>
        </table>
      `;
    } else {
      toast.error("Nessun dato da esportare");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report ${tipo} - ${periodo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a365d; }
          h1 { color: #1a56db; border-bottom: 3px solid #1a56db; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { background: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .comparison-info { background: #fef3c7; padding: 10px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #f59e0b; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #fff; border: 2px solid #1a56db; border-radius: 8px; padding: 20px; text-align: center; }
          .stat-value { font-size: 36px; font-weight: bold; color: #1a56db; }
          .stat-label { color: #64748b; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1a56db; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-top: 5px; }
          .badge.positive { background: #dcfce7; color: #166534; }
          .badge.negative { background: #fee2e2; color: #991b1b; }
          .badge.neutral { background: #f3f4f6; color: #4b5563; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 REPORT AMBULATORIO INFERMIERISTICO</h1>
          <p style="font-size: 18px; color: #64748b;">Statistiche ${tipo}</p>
        </div>
        
        <div class="info">
          <p><strong>Ambulatorio:</strong> ${ambulatorioName}</p>
          <p><strong>Periodo:</strong> ${periodo}</p>
          <p><strong>Tipologia:</strong> ${tipo}</p>
          <p><strong>Data generazione:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
          ${confrontoPeriodo ? `
            <div class="comparison-info">
              <strong>⚖️ Confronto con:</strong> ${confrontoPeriodo}
            </div>
          ` : ''}
        </div>

        ${bodyContent}

        <div class="footer">
          <p>Ambulatorio Infermieristico - ASP Palermo</p>
          <p>Report generato automaticamente</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      toast.success("Report PDF aperto per la stampa");
    } else {
      toast.error("Popup bloccato. Abilita i popup per questa pagina.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="statistiche-page">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiche</h1>
          <p className="text-muted-foreground text-sm">
            Report e analisi delle prestazioni
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePDF} data-testid="export-pdf-btn">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={generateExcel} data-testid="export-excel-btn">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Primary Period Filters */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Periodo Principale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mese</Label>
              <SimpleSelect
                value={mese}
                onChange={setMese}
                options={monthOptions}
                placeholder="Seleziona mese"
              />
            </div>
            <div className="space-y-2">
              <Label>Anno</Label>
              <SimpleSelect
                value={anno}
                onChange={setAnno}
                options={yearOptions}
                placeholder="Seleziona anno"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compare Mode */}
      <Card className={`mb-6 transition-all ${compareMode ? 'border-amber-300 bg-amber-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Confronta Periodi
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="compareMode"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="compareMode" className="text-sm font-medium cursor-pointer">
                Abilita confronto
              </label>
            </div>
          </div>
          {compareMode && (
            <CardDescription className="mt-2 flex items-center gap-2 text-amber-700">
              <ArrowRight className="w-4 h-4" />
              Confronto: <strong>{getPeriodLabel(anno, mese)}</strong> vs <strong>{getPeriodLabel(compareAnno, compareMese)}</strong>
            </CardDescription>
          )}
        </CardHeader>
        {compareMode && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mese da Confrontare</Label>
                <SimpleSelect
                  value={compareMese}
                  onChange={setCompareMese}
                  options={monthOptions}
                  placeholder="Seleziona mese"
                />
              </div>
              <div className="space-y-2">
                <Label>Anno da Confrontare</Label>
                <SimpleSelect
                  value={compareAnno}
                  onChange={setCompareAnno}
                  options={yearOptions}
                  placeholder="Seleziona anno"
                />
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  <TrendingUp className="w-3 h-3" />+N
                </span>
                <span className="text-muted-foreground">Miglioramento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  <TrendingDown className="w-3 h-3" />-N
                </span>
                <span className="text-muted-foreground">Peggioramento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                  <Minus className="w-3 h-3" />=0
                </span>
                <span className="text-muted-foreground">Invariato</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          {!isVillaGinestre && (
            <TabsTrigger value="MED" data-testid="stats-tab-med">
              Statistiche MED
            </TabsTrigger>
          )}
          <TabsTrigger value="PICC" data-testid="stats-tab-picc">
            Statistiche PICC
          </TabsTrigger>
          <TabsTrigger value="IMPIANTI" data-testid="stats-tab-impianti">
            Impianti
          </TabsTrigger>
          <TabsTrigger value="ESPIANTI" data-testid="stats-tab-espianti">
            Espianti
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period Labels */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="font-medium text-primary">{getPeriodLabel(anno, mese)}</span>
        {compareMode && (
          <>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">vs</span>
            <span className="font-medium text-amber-600">{getPeriodLabel(compareAnno, compareMese)}</span>
          </>
        )}
      </div>

      {/* IMPLANT STATISTICS */}
      {activeTab === "IMPIANTI" && implantStats && (
        <>
          {/* Summary Cards for Implants */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Totale Impianti"
              value={implantStats?.totale_impianti}
              compareValue={compareImplantStats?.totale_impianti}
              icon={Syringe}
              showComparison={compareMode}
            />
            {Object.entries(implantStats?.per_tipo || {}).map(([tipo, count]) => (
              <Card key={tipo} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="stat-value">{count}</p>
                    <p className="stat-label">{implantStats?.tipo_labels?.[tipo] || tipo}</p>
                    {compareMode && (
                      <ComparisonBadge 
                        current={count} 
                        compare={compareImplantStats?.per_tipo?.[tipo] || 0} 
                      />
                    )}
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Syringe className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Implant Types Detail */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Dettaglio Impianti per Tipo</CardTitle>
              <CardDescription>
                Conteggio degli impianti effettuati nel periodo selezionato
              </CardDescription>
            </CardHeader>
            <CardContent>
              {implantStats?.per_tipo && Object.keys(implantStats.per_tipo).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(implantStats.per_tipo).map(([tipo, count]) => {
                    const compareVal = compareImplantStats?.per_tipo?.[tipo] || 0;
                    return (
                      <div
                        key={tipo}
                        className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Syringe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-medium">{implantStats?.tipo_labels?.[tipo] || tipo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-emerald-600">{count}</span>
                          {compareMode && <ComparisonBadge current={count} compare={compareVal} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Syringe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun impianto registrato per il periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ESPIANTI STATISTICS (separate tab) */}
      {activeTab === "ESPIANTI" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Totale Espianti"
              value={espiantiStats?.totale_espianti}
              compareValue={compareEspiantiStats?.totale_espianti}
              icon={CircleDot}
              showComparison={compareMode}
            />
            {Object.entries(espiantiStats?.per_tipo || {}).map(([tipo, count]) => (
              <Card key={tipo} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="stat-value">{count}</p>
                    <p className="stat-label">{espiantiStats?.tipo_labels?.[tipo] || tipo}</p>
                    {compareMode && (
                      <ComparisonBadge 
                        current={count} 
                        compare={compareEspiantiStats?.per_tipo?.[tipo] || 0} 
                      />
                    )}
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <CircleDot className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Espianti Types Detail */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Dettaglio Espianti per Tipo</CardTitle>
              <CardDescription>
                Conteggio degli espianti effettuati nel periodo selezionato
              </CardDescription>
            </CardHeader>
            <CardContent>
              {espiantiStats?.per_tipo && Object.values(espiantiStats.per_tipo).some(v => v > 0) ? (
                <div className="space-y-4">
                  {Object.entries(espiantiStats.per_tipo).map(([tipo, count]) => {
                    const compareVal = compareEspiantiStats?.per_tipo?.[tipo] || 0;
                    return (
                      <div
                        key={tipo}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <CircleDot className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="font-medium">{espiantiStats?.tipo_labels?.[tipo] || tipo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-red-600">{count}</span>
                          {compareMode && <ComparisonBadge current={count} compare={compareVal} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CircleDot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun espianto registrato per il periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* REGULAR STATISTICS (MED/PICC) */}
      {(activeTab === "MED" || activeTab === "PICC") && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Totale Accessi"
              value={stats?.totale_accessi}
              compareValue={compareStats?.totale_accessi}
              icon={Calendar}
              showComparison={compareMode}
            />
            <StatCard
              title="Pazienti Unici"
              value={stats?.pazienti_unici}
              compareValue={compareStats?.pazienti_unici}
              icon={Users}
              showComparison={compareMode}
            />
          </div>

          {/* Prestazioni Detail */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Dettaglio Prestazioni</CardTitle>
              <CardDescription>
                Conteggio delle prestazioni per tipologia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.prestazioni && Object.keys(stats.prestazioni).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.prestazioni).map(([key, value]) => {
                    const prestInfo = PRESTAZIONI_LABELS[key] || { label: key, icon: Bandage };
                    const Icon = prestInfo.icon;
                    const compareVal = compareStats?.prestazioni?.[key] || 0;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium">{prestInfo.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-primary">{value}</span>
                          {compareMode && <ComparisonBadge current={value} compare={compareVal} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna prestazione registrata per il periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
