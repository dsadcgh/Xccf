import { useState, useRef, useEffect } from "react";
import { apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, FileText, Edit2, Trash2, Printer, Download, 
  RotateCw, RotateCcw, ZoomIn, ZoomOut, Upload, Image as ImageIcon,
  Maximize2, FileCheck, FileEdit
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Opzioni per i tipi di catetere - aggiornato da nuovo PDF
const TIPO_CATETERE_OPTIONS = [
  { id: "picc", label: "PICC" },
  { id: "midline", label: "Midline" },
  { id: "picc_port", label: "PICC Port" },
  { id: "port_a_cath", label: "PORT a cath" },
  { id: "altro", label: "Altro" },
];

// Opzioni semplificate (mantenute per retrocompatibilità)
const TIPO_IMPIANTO_SEMPLICE = [
  { id: "picc", label: "PICC" },
  { id: "picc_port", label: "PICC Port" },
  { id: "midline", label: "Midline" },
];

// Opzioni posizionamento CVC - RIMOSSO, non più usato nella scheda completa
const POSIZIONAMENTO_CVC_OPTIONS = [
  { id: "altro", label: "altro" },
];

// Opzioni vena - AGGIORNATO con "Altro"
const VENA_OPTIONS = [
  { id: "basilica", label: "Basilica" },
  { id: "cefalica", label: "Cefalica" },
  { id: "brachiale", label: "Brachiale" },
  { id: "altro", label: "Altro" },
];

// Opzioni disinfezione
const DISINFEZIONE_OPTIONS = [
  { id: "clorexidina_2", label: "CLOREXIDINA IN SOLUZIONE ALCOLICA 2%" },
  { id: "iodiopovidone", label: "IODIOPOVIDONE" },
];

// Opzioni motivazione - aggiornato da nuovo PDF
const MOTIVAZIONE_OPTIONS = [
  { id: "chemioterapia", label: "Chemioterapia" },
  { id: "scarso_patrimonio_venoso", label: "Scarso patrimonio venoso" },
  { id: "npt", label: "NPT (Nutrizione Parenterale)" },
  { id: "monitoraggio", label: "Monitoraggio invasivo" },
  { id: "altro", label: "Altro" },
];

// Componente per visualizzare foto con rotazione adattiva - MIGLIORATO
const PhotoViewer = ({ photo, onDelete }) => {
  const [rotation, setRotation] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const imageSrc = photo.image_data?.startsWith('data:') 
    ? photo.image_data 
    : `data:image/jpeg;base64,${photo.image_data}`;

  // Load image dimensions
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleRotate = (direction) => {
    setRotation(prev => (prev + (direction === 'cw' ? 90 : -90)) % 360);
  };

  // Calculate scale to fit rotated image in container
  const isRotated90or270 = Math.abs(rotation % 180) === 90;
  const containerSize = 120; // Fixed container size
  
  // Calculate scale factor based on image aspect ratio and rotation
  let scale = 1;
  if (imgDimensions.width > 0 && imgDimensions.height > 0) {
    if (isRotated90or270) {
      // When rotated 90/270, width becomes height and vice versa
      const rotatedWidth = imgDimensions.height;
      const rotatedHeight = imgDimensions.width;
      scale = Math.min(containerSize / rotatedWidth, containerSize / rotatedHeight);
    } else {
      scale = Math.min(containerSize / imgDimensions.width, containerSize / imgDimensions.height);
    }
    // Ensure scale doesn't exceed 1 (don't enlarge small images too much)
    scale = Math.min(scale, 1);
  }

  return (
    <>
      <div className="relative group border rounded-lg overflow-hidden bg-gray-100 hover:shadow-md transition-shadow">
        {/* Fixed size container */}
        <div 
          className="relative flex items-center justify-center bg-gray-50"
          style={{ 
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            overflow: 'hidden'
          }}
        >
          <img
            src={imageSrc}
            alt={photo.descrizione || 'Allegato'}
            className="cursor-pointer"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.2s ease',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            onClick={() => setShowFullscreen(true)}
          />
        </div>

        {/* Toolbar overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleRotate('ccw'); }}
              title="Ruota sinistra"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleRotate('cw'); }}
              title="Ruota destra"
            >
              <RotateCw className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
              title="Ingrandisci"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-red-400 hover:bg-red-500/20"
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id || photo.tempId); }}
              title="Elimina"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {photo.descrizione && (
          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded max-w-[90%] truncate">
            {photo.descrizione.substring(0, 15)}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">{photo.descrizione || 'Visualizza foto'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 pb-2">
            <Button variant="outline" size="sm" onClick={() => handleRotate('ccw')}>
              <RotateCcw className="h-4 w-4 mr-1" /> Ruota Sx
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRotate('cw')}>
              <RotateCw className="h-4 w-4 mr-1" /> Ruota Dx
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-4 w-4 mr-1" /> Zoom +
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
              <ZoomOut className="h-4 w-4 mr-1" /> Zoom -
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setZoom(1); setRotation(0); }}>
              Reset
            </Button>
          </div>
          <div 
            className="flex items-center justify-center overflow-auto bg-gray-900 rounded-lg"
            style={{ height: '60vh' }}
          >
            <img
              src={imageSrc}
              alt={photo.descrizione || 'Allegato'}
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.2s ease',
                maxWidth: isRotated90or270 ? '60vh' : '85vw',
                maxHeight: isRotated90or270 ? '85vw' : '55vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Form iniziale vuoto - aggiornato con nuovi campi dal PDF Scheda Impianto
const getEmptyFormData = () => ({
  scheda_type: "semplificata",
  presidio_ospedaliero: "",
  codice: "",
  unita_operativa: "",
  data_presa_carico: format(new Date(), "yyyy-MM-dd"),
  cartella_clinica: "",
  catetere_presente: false,
  catetere_presente_tipo: "",
  catetere_presente_struttura: "",
  catetere_presente_data: "",
  catetere_presente_ora: "",
  catetere_presente_modalita: "",
  catetere_presente_rx: null,
  catetere_da_sostituire: null,
  tipo_catetere: "",
  tipo_catetere_altro: "",
  posizionamento_cvc: "",
  posizionamento_cvc_altro: "",
  braccio: "",
  vena: "",
  vena_altro: "",  // NUOVO: campo per vena "altro"
  exit_site_cm: "",
  diametro_vena_mm: "",
  profondita_cm: "",
  lunghezza_totale_cm: "",
  lunghezza_impiantata_cm: "",
  french: "",
  lumi: "",
  tunnelizzazione: false,
  tunnellizzazione_cm: "",
  tunnelizzazione_note: "",
  valutazione_sito: null,
  ecoguidato: null,
  igiene_mani: null,
  precauzioni_barriera: null,
  disinfezione: [],
  colla_hystoacrilica: null,
  sutureless_device: null,
  medicazione_trasparente: null,
  medicazione_occlusiva: null,
  controllo_rx: null,
  controllo_ecg: null,
  ecg_intracavitario: null,
  modalita: "",
  motivazione: [],
  motivazione_altro: "",
  data_posizionamento: format(new Date(), "yyyy-MM-dd"),
  operatore: "",
  secondo_operatore: "",
  lotto: "",
  allegati: [],
  data_impianto: format(new Date(), "yyyy-MM-dd"),
});

export const SchedaImpiantoPICC = ({ patientId, ambulatorio, schede, onRefresh, patient }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheda, setSelectedScheda] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(getEmptyFormData());
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [selectTypeOpen, setSelectTypeOpen] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData(getEmptyFormData());
    setUploadedPhotos([]);
  };

  const openNewScheda = (type) => {
    resetForm();
    setFormData(prev => ({ ...prev, scheda_type: type }));
    setSelectTypeOpen(false);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await apiClient.post("/schede-impianto-picc", {
        patient_id: patientId,
        ambulatorio,
        ...formData,
        data_impianto: formData.data_posizionamento,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda impianto creata");
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedScheda) return;
    setSaving(true);
    try {
      await apiClient.put(`/schede-impianto-picc/${selectedScheda.id}`, {
        ...formData,
        data_impianto: formData.data_posizionamento,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda aggiornata");
      setEditDialogOpen(false);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheda) return;
    try {
      await apiClient.delete(`/schede-impianto-picc/${selectedScheda.id}`);
      toast.success("Scheda eliminata");
      setDeleteDialogOpen(false);
      setSelectedScheda(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'eliminazione");
    }
  };

  const openEditDialog = (scheda) => {
    setSelectedScheda(scheda);
    setFormData({
      ...getEmptyFormData(),
      ...scheda,
      data_posizionamento: scheda.data_posizionamento || scheda.data_impianto || format(new Date(), "yyyy-MM-dd")
    });
    setUploadedPhotos(scheda.allegati_data || []);
    setIsEditing(false);
    setEditDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        const newPhoto = {
          tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          image_data: base64,
          descrizione: file.name,
          data: format(new Date(), "yyyy-MM-dd")
        };
        setUploadedPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(p => (p.id || p.tempId) !== photoId));
  };

  // Stampa PDF - apre il PDF in una nuova finestra per la stampa
  const handlePrintPDF = async (scheda) => {
    if (scheda.scheda_type === 'semplificata') {
      toast.error("La stampa PDF è disponibile solo per la scheda completa");
      return;
    }
    try {
      toast.info("Generazione PDF in corso...");
      const response = await apiClient.get(`/schede-impianto-picc/${scheda.id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success("PDF pronto per la stampa");
    } catch (error) {
      toast.error("Errore nella generazione del PDF");
    }
  };

  // Scarica PDF e salva nella cartella paziente
  const handleDownloadPDF = async (scheda) => {
    if (scheda.scheda_type === 'semplificata') {
      toast.error("Il PDF è disponibile solo per la scheda completa");
      return;
    }
    try {
      toast.info("Download PDF in corso...");
      const response = await apiClient.get(`/schede-impianto-picc/${scheda.id}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `scheda_impianto_${patient?.cognome || ''}_${patient?.nome || ''}_${scheda.data_posizionamento || scheda.data_impianto || 'nd'}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Save to patient folder (create a document record)
      try {
        await apiClient.post("/documents", {
          patient_id: patientId,
          ambulatorio,
          tipo: "scheda_impianto_picc",
          nome: filename,
          scheda_id: scheda.id,
          data: scheda.data_posizionamento || scheda.data_impianto
        });
      } catch (docError) {
        // Silently fail if documents endpoint doesn't exist
        console.log("Document save skipped");
      }
      
      toast.success("PDF scaricato");
    } catch (error) {
      toast.error("Errore nel download del PDF");
    }
  };

  // Toggle array value
  const toggleArrayValue = (field, value) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  // ========== FORM SEMPLIFICATO ==========
  const renderSimplifiedForm = (data, readOnly = false) => (
    <div className="space-y-5 p-4">
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-blue-700">Scheda Impianto Semplificata</h3>
        <p className="text-xs text-gray-500">Per statistiche rapide</p>
      </div>

      {/* Tipo di Impianto */}
      <div className="space-y-2">
        <Label className="font-semibold text-sm">Tipo di Impianto *</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIPO_IMPIANTO_SEMPLICE.map(opt => (
            <div 
              key={opt.id} 
              className={`p-2.5 border-2 rounded-lg cursor-pointer text-center transition-all text-sm ${
                data.tipo_catetere === opt.id 
                  ? 'border-blue-500 bg-blue-50 font-medium' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${readOnly ? 'cursor-default opacity-70' : ''}`}
              onClick={() => !readOnly && setFormData(p => ({...p, tipo_catetere: opt.id}))}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* Braccio e Vena */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Braccio *</Label>
          <div className="flex gap-2">
            {[{id: 'dx', label: 'Destro'}, {id: 'sn', label: 'Sinistro'}].map(opt => (
              <div 
                key={opt.id}
                className={`flex-1 p-2 border-2 rounded-lg cursor-pointer text-center text-sm ${
                  data.braccio === opt.id ? 'border-blue-500 bg-blue-50 font-medium' : 'border-gray-200'
                } ${readOnly ? 'cursor-default opacity-70' : ''}`}
                onClick={() => !readOnly && setFormData(p => ({...p, braccio: opt.id}))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-sm">Vena *</Label>
          <div className="flex gap-1.5 flex-wrap">
            {VENA_OPTIONS.map(opt => (
              <div 
                key={opt.id}
                className={`px-3 py-2 border-2 rounded-lg cursor-pointer text-center text-xs ${
                  data.vena === opt.id ? 'border-blue-500 bg-blue-50 font-medium' : 'border-gray-200'
                } ${readOnly ? 'cursor-default opacity-70' : ''}`}
                onClick={() => !readOnly && setFormData(p => ({...p, vena: opt.id}))}
              >
                {opt.label}
              </div>
            ))}
          </div>
          {data.vena === 'altro' && (
            <Input 
              value={data.vena_altro || ''} 
              onChange={e => setFormData(p => ({...p, vena_altro: e.target.value}))}
              disabled={readOnly}
              placeholder="Specificare la vena..."
              className="mt-2 h-9"
            />
          )}
        </div>
      </div>

      {/* Exit Site */}
      <div className="space-y-2">
        <Label className="font-semibold text-sm">Exit-site (cm)</Label>
        <Input 
          value={data.exit_site_cm || ''} 
          onChange={e => setFormData(p => ({...p, exit_site_cm: e.target.value}))}
          disabled={readOnly}
          placeholder="es. 35"
          className="max-w-28 h-9"
        />
      </div>

      {/* Lunghezza Catetere - NUOVI CAMPI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Lunghezza Totale Catetere (cm)</Label>
          <Input 
            value={data.lunghezza_totale_cm || ''} 
            onChange={e => setFormData(p => ({...p, lunghezza_totale_cm: e.target.value}))}
            disabled={readOnly}
            placeholder="es. 25"
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Lunghezza Impiantata (cm)</Label>
          <Input 
            value={data.lunghezza_impiantata_cm || ''} 
            onChange={e => setFormData(p => ({...p, lunghezza_impiantata_cm: e.target.value}))}
            disabled={readOnly}
            placeholder="es. 21"
            className="h-9"
          />
        </div>
      </div>

      {/* Tunnelizzazione */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="font-semibold text-sm">Tunnelizzazione</Label>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={data.tunnelizzazione === true}
              onCheckedChange={(checked) => !readOnly && setFormData(p => ({
                ...p, 
                tunnelizzazione: checked,
                tunnelizzazione_note: checked ? p.tunnelizzazione_note : ''
              }))}
              disabled={readOnly}
            />
            <span className="text-sm">Sì</span>
          </div>
          {data.tunnelizzazione && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">Note (max 6 car.):</Label>
              <Input 
                value={data.tunnelizzazione_note || ''} 
                onChange={e => setFormData(p => ({
                  ...p, 
                  tunnelizzazione_note: e.target.value.slice(0, 6)
                }))}
                disabled={readOnly}
                maxLength={6}
                placeholder="3cm"
                className="w-16 h-8 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Motivazione */}
      <div className="space-y-2">
        <Label className="font-semibold text-sm">Motivazione Impianto</Label>
        <div className="flex flex-wrap gap-1.5">
          {MOTIVAZIONE_OPTIONS.map(opt => (
            <div 
              key={opt.id}
              className={`px-2.5 py-1.5 border-2 rounded-lg cursor-pointer text-xs ${
                (data.motivazione || []).includes(opt.id) ? 'border-blue-500 bg-blue-50 font-medium' : 'border-gray-200'
              } ${readOnly ? 'cursor-default opacity-70' : ''}`}
              onClick={() => !readOnly && toggleArrayValue('motivazione', opt.id)}
            >
              {opt.label}
            </div>
          ))}
        </div>
        {(data.motivazione || []).includes('altro') && (
          <Input 
            value={data.motivazione_altro || ''} 
            onChange={e => setFormData(p => ({...p, motivazione_altro: e.target.value}))}
            disabled={readOnly}
            placeholder="Specificare..."
            className="mt-2 h-9"
          />
        )}
      </div>

      {/* Operatore e Data */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Operatore *</Label>
          <Input 
            value={data.operatore || ''} 
            onChange={e => setFormData(p => ({...p, operatore: e.target.value}))}
            disabled={readOnly}
            placeholder="Nome e Cognome"
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-sm">Data Impianto *</Label>
          <Input 
            type="date"
            value={data.data_posizionamento || ''} 
            onChange={e => setFormData(p => ({...p, data_posizionamento: e.target.value}))}
            disabled={readOnly}
            className="h-9"
          />
        </div>
      </div>

      {/* Allegati */}
      {!readOnly && (
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-sm">Allegati / Foto</Label>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Carica
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </div>
          
          {uploadedPhotos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uploadedPhotos.map((photo) => (
                <PhotoViewer key={photo.id || photo.tempId} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-3 border border-dashed rounded-lg text-xs">
              Nessun allegato
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ========== FORM COMPLETO ==========
  const renderFullForm = (data, readOnly = false) => (
    <div className="space-y-3 text-xs">
      {/* HEADER */}
      <div className="border-2 border-gray-300 p-2.5 bg-gray-50">
        <div className="text-center font-bold text-sm mb-1">
          SCHEDA IMPIANTO e GESTIONE ACCESSI VENOSI
        </div>
        <div className="text-right text-[10px] text-gray-500 -mt-4 mb-1">Allegato n. 2</div>
        
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label className="whitespace-nowrap text-[11px]">Presidio:</Label>
              <Input value={data.presidio_ospedaliero || ''} onChange={e => setFormData(p => ({...p, presidio_ospedaliero: e.target.value}))} disabled={readOnly} className="h-6 text-[11px]" />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-[11px]">Codice:</Label>
              <Input value={data.codice || ''} onChange={e => setFormData(p => ({...p, codice: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] w-14" />
              <Label className="text-[11px] ml-1">U.O.:</Label>
              <Input value={data.unita_operativa || ''} onChange={e => setFormData(p => ({...p, unita_operativa: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label className="text-[11px] whitespace-nowrap">Preso in carico:</Label>
              <Input type="date" value={data.data_presa_carico || ''} onChange={e => setFormData(p => ({...p, data_presa_carico: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] w-28" />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-[11px]">Cartella n.:</Label>
              <Input value={data.cartella_clinica || ''} onChange={e => setFormData(p => ({...p, cartella_clinica: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] flex-1" />
            </div>
          </div>
        </div>

        <div className="mt-1.5 pt-1.5 border-t flex items-center gap-3 text-[11px]">
          <span><b>Paziente:</b> {patient?.cognome} {patient?.nome}</span>
          <span><b>Nato:</b> {patient?.data_nascita || '-'}</span>
          <span><b>Sesso:</b> {patient?.sesso || '-'}</span>
        </div>
      </div>

      {/* SEZIONE CATETERE GIÀ PRESENTE */}
      <div className="border-2 border-gray-300">
        <div className="bg-gray-200 px-2 py-1 font-bold text-center text-[11px]">SEZIONE CATETERE GIÀ PRESENTE</div>
        <div className="p-2 space-y-1.5 text-[11px]">
          <div className="grid grid-cols-3 gap-1">
            {TIPO_CATETERE_OPTIONS.map(opt => (
              <div key={opt.id} className="flex items-center gap-1">
                <Checkbox checked={data.catetere_presente_tipo === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_tipo: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[10px] truncate">{opt.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>Struttura:</span>
            <Input value={data.catetere_presente_struttura || ''} onChange={e => setFormData(p => ({...p, catetere_presente_struttura: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-32" />
            <span>data:</span>
            <Input type="date" value={data.catetere_presente_data || ''} onChange={e => setFormData(p => ({...p, catetere_presente_data: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-24" />
            <span>ora:</span>
            <Input type="time" value={data.catetere_presente_ora || ''} onChange={e => setFormData(p => ({...p, catetere_presente_ora: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-16" />
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span>modalità:</span>
            <Checkbox checked={data.catetere_presente_modalita === 'emergenza_urgenza'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_modalita: c ? 'emergenza_urgenza' : ''}))} disabled={readOnly} className="h-3 w-3" /><span>emergenza/urgenza</span>
            <Checkbox checked={data.catetere_presente_modalita === 'programmato_elezione'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_modalita: c ? 'programmato_elezione' : ''}))} disabled={readOnly} className="h-3 w-3" /><span>programmato</span>
            <span className="ml-2">RX Post:</span>
            <Checkbox checked={data.catetere_presente_rx === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_rx: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span>SI</span>
            <Checkbox checked={data.catetere_presente_rx === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_presente_rx: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span>NO</span>
            <span className="ml-2">Da sostituire:</span>
            <Checkbox checked={data.catetere_da_sostituire === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_da_sostituire: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span>SI</span>
            <Checkbox checked={data.catetere_da_sostituire === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, catetere_da_sostituire: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span>NO</span>
          </div>
        </div>
      </div>

      {/* SEZIONE IMPIANTO CATETERE */}
      <div className="border-2 border-gray-300">
        <div className="bg-gray-200 px-2 py-1 font-bold text-center text-[11px]">SEZIONE IMPIANTO CATETERE</div>
        <div className="p-2 space-y-1.5 text-[10px]">
          {/* TIPO */}
          <div className="flex items-center gap-1 flex-wrap">
            <b>TIPO:</b>
            {TIPO_CATETERE_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={data.tipo_catetere === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, tipo_catetere: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[9px]">{opt.label.split('(')[0].trim()}</span>
              </span>
            ))}
          </div>
          {/* POSIZIONAMENTO: Solo Braccio dx/sn e Vena */}
          <div className="flex items-center gap-1 flex-wrap">
            <b>BRACCIO:</b>
            <Checkbox checked={data.braccio === 'dx'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, braccio: c ? 'dx' : ''}))} disabled={readOnly} className="h-3 w-3" /><span>dx</span>
            <Checkbox checked={data.braccio === 'sn'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, braccio: c ? 'sn' : ''}))} disabled={readOnly} className="h-3 w-3" /><span>sn</span>
            <b className="ml-3">VENA:</b>
            {VENA_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={data.vena === opt.id} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, vena: c ? opt.id : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span>{opt.label}</span>
              </span>
            ))}
            {data.vena === 'altro' && (
              <Input 
                value={data.vena_altro || ''} 
                onChange={e => setFormData(p => ({...p, vena_altro: e.target.value}))} 
                disabled={readOnly} 
                className="h-5 text-[10px] w-24 ml-1" 
                placeholder="Specificare..."
              />
            )}
          </div>
          {/* Misure catetere - SENZA LOTTO */}
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span>Diametro vena:</span>
            <Input value={data.diametro_vena_mm || ''} onChange={e => setFormData(p => ({...p, diametro_vena_mm: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" placeholder="mm" />
            <span>Profondità:</span>
            <Input value={data.profondita_cm || ''} onChange={e => setFormData(p => ({...p, profondita_cm: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" placeholder="cm" />
            <span>Exit-site:</span>
            <Input value={data.exit_site_cm || ''} onChange={e => setFormData(p => ({...p, exit_site_cm: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" placeholder="cm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span>Lung. totale:</span>
            <Input value={data.lunghezza_totale_cm || ''} onChange={e => setFormData(p => ({...p, lunghezza_totale_cm: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" placeholder="cm" />
            <span>Lung. impiantata:</span>
            <Input value={data.lunghezza_impiantata_cm || ''} onChange={e => setFormData(p => ({...p, lunghezza_impiantata_cm: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" placeholder="cm" />
            <span>French:</span>
            <Input value={data.french || ''} onChange={e => setFormData(p => ({...p, french: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" />
            <span>Lumi:</span>
            <Input value={data.lumi || ''} onChange={e => setFormData(p => ({...p, lumi: e.target.value}))} disabled={readOnly} className="h-5 text-[10px] w-10" />
          </div>
          {/* PROCEDURE */}
          <div className="grid grid-cols-2 gap-1">
            {[
              { key: 'valutazione_sito', label: 'Valutazione sito' },
              { key: 'ecoguidato', label: 'Ecoguidato' },
              { key: 'igiene_mani', label: 'Igiene mani' },
              { key: 'precauzioni_barriera', label: 'Precauzioni barriera' },
              { key: 'colla_hystoacrilica', label: 'Colla hystoacrilica' },
              { key: 'sutureless_device', label: 'Sutureless device' },
              { key: 'medicazione_trasparente', label: 'Med. trasparente' },
              { key: 'medicazione_occlusiva', label: 'Med. occlusiva' },
              { key: 'controllo_rx', label: 'Controllo RX' },
              { key: 'ecg_intracavitario', label: 'ECG intracavitario' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-1">
                <span className="w-28 truncate">{item.label}:</span>
                <Checkbox checked={data[item.key] === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? true : null}))} disabled={readOnly} className="h-3 w-3" /><span>SI</span>
                <Checkbox checked={data[item.key] === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, [item.key]: c ? false : null}))} disabled={readOnly} className="h-3 w-3" /><span>NO</span>
              </div>
            ))}
          </div>
          {/* DISINFEZIONE */}
          <div className="flex items-center gap-1 flex-wrap">
            <b>Disinfezione:</b>
            {DISINFEZIONE_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={(data.disinfezione || []).includes(opt.id)} onCheckedChange={() => !readOnly && toggleArrayValue('disinfezione', opt.id)} disabled={readOnly} className="h-3 w-3" />
                <span className="text-[9px]">{opt.label}</span>
              </span>
            ))}
          </div>
          {/* MODALITÀ */}
          <div className="flex items-center gap-2">
            <b>Modalità:</b>
            {['emergenza', 'urgenza', 'elezione'].map(m => (
              <span key={m} className="flex items-center gap-0.5">
                <Checkbox checked={data.modalita === m} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, modalita: c ? m : ''}))} disabled={readOnly} className="h-3 w-3" />
                <span className="uppercase">{m}</span>
              </span>
            ))}
          </div>
          {/* MOTIVAZIONE */}
          <div className="flex items-center gap-1 flex-wrap">
            <b>Motivazione:</b>
            {MOTIVAZIONE_OPTIONS.map(opt => (
              <span key={opt.id} className="flex items-center gap-0.5">
                <Checkbox checked={(data.motivazione || []).includes(opt.id)} onCheckedChange={() => !readOnly && toggleArrayValue('motivazione', opt.id)} disabled={readOnly} className="h-3 w-3" />
                <span>{opt.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-2 border-gray-300 p-2 space-y-1.5">
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <b>DATA:</b>
          <Input type="date" value={data.data_posizionamento || ''} onChange={e => setFormData(p => ({...p, data_posizionamento: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] w-32" />
          <b className="ml-2">1° OPERATORE:</b>
          <Input value={data.operatore || ''} onChange={e => setFormData(p => ({...p, operatore: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] w-32" placeholder="Nome" />
          <b>2° OPERATORE:</b>
          <Input value={data.secondo_operatore || ''} onChange={e => setFormData(p => ({...p, secondo_operatore: e.target.value}))} disabled={readOnly} className="h-6 text-[11px] w-32" placeholder="Nome" />
        </div>
      </div>

      {/* ALLEGATI */}
      {!readOnly && (
        <div className="border-2 border-gray-300 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-[11px]">ALLEGATI</Label>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-6 text-[10px]">
              <Upload className="h-3 w-3 mr-1" /> Carica
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </div>
          {uploadedPhotos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uploadedPhotos.map((photo) => (
                <PhotoViewer key={photo.id || photo.tempId} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-2 border border-dashed rounded text-[10px]">Nessun allegato</div>
          )}
        </div>
      )}
    </div>
  );

  // Get label for tipo
  const getTipoLabel = (tipo) => {
    const opt = [...TIPO_CATETERE_OPTIONS, ...TIPO_IMPIANTO_SEMPLICE].find(o => o.id === tipo);
    return opt?.label?.split('(')[0].trim() || tipo || '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Schede Impianto PICC
        </h3>
        <Button onClick={() => setSelectTypeOpen(true)} data-testid="new-scheda-impianto-btn">
          <Plus className="h-4 w-4 mr-2" /> Nuova Scheda
        </Button>
      </div>

      {/* Lista schede esistenti */}
      {schede && schede.length > 0 ? (
        <div className="grid gap-2">
          {schede.map((scheda) => (
            <Card key={scheda.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-2.5 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {scheda.scheda_type === 'completa' ? (
                      <FileCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileEdit className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-sm">
                        {scheda.scheda_type === 'completa' ? 'Completa' : 'Semplificata'} - {scheda.data_posizionamento || scheda.data_impianto ? format(new Date(scheda.data_posizionamento || scheda.data_impianto), "dd/MM/yyyy", { locale: it }) : 'N/D'}
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        {getTipoLabel(scheda.tipo_catetere)} | {scheda.braccio === 'dx' ? 'Dx' : scheda.braccio === 'sn' ? 'Sn' : '-'} | {VENA_OPTIONS.find(o => o.id === scheda.vena)?.label || '-'} | {scheda.operatore || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {scheda.scheda_type === 'completa' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintPDF(scheda)} title="Stampa PDF">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPDF(scheda)} title="Scarica PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(scheda)} title="Visualizza/Modifica">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedScheda(scheda); setDeleteDialogOpen(true); }} title="Elimina">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardContent className="py-6 text-center text-gray-500">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nessuna scheda impianto registrata</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Selezione Tipo Scheda */}
      <Dialog open={selectTypeOpen} onOpenChange={setSelectTypeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuova Scheda Impianto</DialogTitle>
            <DialogDescription>Seleziona il tipo di scheda</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-3">
            <div 
              className="border-2 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              onClick={() => openNewScheda('semplificata')}
            >
              <FileEdit className="h-8 w-8 mx-auto mb-1.5 text-blue-600" />
              <h4 className="font-semibold text-sm">Semplificata</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Campi essenziali</p>
            </div>
            <div 
              className="border-2 rounded-lg p-3 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all text-center"
              onClick={() => openNewScheda('completa')}
            >
              <FileCheck className="h-8 w-8 mx-auto mb-1.5 text-green-600" />
              <h4 className="font-semibold text-sm">Completa</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Modulo ufficiale PDF</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuova Scheda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={formData.scheda_type === 'completa' ? "max-w-3xl max-h-[90vh]" : "max-w-md max-h-[90vh]"}>
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              {formData.scheda_type === 'completa' ? <FileCheck className="h-5 w-5 text-green-600" /> : <FileEdit className="h-5 w-5 text-blue-600" />}
              {formData.scheda_type === 'completa' ? 'Nuova Scheda Completa' : 'Nuova Scheda Semplificata'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[72vh] pr-2">
            {formData.scheda_type === 'semplificata' 
              ? renderSimplifiedForm(formData, false)
              : renderFullForm(formData, false)
            }
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizza/Modifica */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className={formData.scheda_type === 'completa' ? "max-w-3xl max-h-[90vh]" : "max-w-md max-h-[90vh]"}>
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                {formData.scheda_type === 'completa' ? <FileCheck className="h-5 w-5 text-green-600" /> : <FileEdit className="h-5 w-5 text-blue-600" />}
                {formData.scheda_type === 'completa' ? 'Scheda Completa' : 'Scheda Semplificata'}
              </span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Modifica
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[72vh] pr-2">
            {formData.scheda_type === 'semplificata' 
              ? renderSimplifiedForm(formData, !isEditing)
              : renderFullForm(formData, !isEditing)
            }
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-2 border-t">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Annulla</Button>
                <Button size="sm" onClick={handleUpdate} disabled={saving}>
                  {saving ? "Salvataggio..." : "Salva"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Chiudi</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa scheda? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchedaImpiantoPICC;
