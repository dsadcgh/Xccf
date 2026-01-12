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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Copy, FileText, Edit2, Save, Printer, Trash2, Camera, Upload, Image, X, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const FONDO_OPTIONS = [
  { id: "granuleggiante", label: "Granuleggiante" },
  { id: "fibrinoso", label: "Fibrinoso" },
  { id: "necrotico", label: "Necrotico" },
  { id: "infetto", label: "Infetto" },
  { id: "biofilmato", label: "Biofilmato" },
];

const MARGINI_OPTIONS = [
  { id: "attivi", label: "Attivi" },
  { id: "piantati", label: "Piantati" },
  { id: "in_estensione", label: "In Estensione" },
  { id: "a_scogliera", label: "A Scogliera" },
];

const CUTE_OPTIONS = [
  { id: "integra", label: "Integra" },
  { id: "secca", label: "Secca" },
  { id: "arrossata", label: "Arrossata" },
  { id: "macerata", label: "Macerata" },
  { id: "ipercheratosica", label: "Ipercheratosica" },
];

const ESSUDATO_QUANTITA = [
  { id: "assente", label: "Assente" },
  { id: "moderato", label: "Moderato" },
  { id: "abbondante", label: "Abbondante" },
];

const ESSUDATO_TIPO = [
  { id: "sieroso", label: "Sieroso" },
  { id: "ematico", label: "Ematico" },
  { id: "infetto", label: "Infetto" },
];

const DEFAULT_MEDICAZIONE = `La lesione è stata trattata seguendo le 4 fasi del Wound Hygiene:
Detersione con Prontosan
Debridement e Riattivazione dei margini
Medicazione: `;

// Selection chips component - extracted to avoid render-time definition
const SelectionChips = ({ options, selected, onToggle, multiple = true }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = multiple
        ? selected?.includes(opt.id)
        : selected === opt.id;
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => onToggle(opt.id)}
          className={`selection-chip ${isSelected ? "selected" : ""}`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const AMBULATORI_NAMES = {
  pta_centro: "PTA Centro",
  villa_ginestre: "Villa delle Ginestre",
};


export const SchedaMedicazioneMED = ({ patientId, ambulatorio, schede, onRefresh, patientInfo }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheda, setSelectedScheda] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [formData, setFormData] = useState({
    data_compilazione: format(new Date(), "yyyy-MM-dd"),
    fondo: [],
    margini: [],
    cute_perilesionale: [],
    essudato_quantita: "",
    essudato_tipo: [],
    medicazione: DEFAULT_MEDICAZIONE,
    prossimo_cambio: "",
    firma: "",
    photos: [], // Photos attached to this scheda
  });

  const handleToggle = (field, value, isEditMode = false) => {
    const setter = isEditMode ? setSelectedScheda : setFormData;
    setter((prev) => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...(prev[field] || []), value],
    }));
  };

  const handleSingleSelect = (field, value, isEditMode = false) => {
    const setter = isEditMode ? setSelectedScheda : setFormData;
    setter((prev) => ({
      ...prev,
      [field]: prev[field] === value ? "" : value,
    }));
  };

  const handleFieldChange = (field, value, isEditMode = false) => {
    const setter = isEditMode ? setSelectedScheda : setFormData;
    setter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    try {
      await apiClient.post("/schede-medicazione-med", {
        patient_id: patientId,
        ambulatorio,
        ...formData,
      });
      toast.success("Scheda creata");
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error("Errore nella creazione");
    }
  };

  const handleUpdate = async () => {
    if (!selectedScheda) return;
    setSaving(true);
    try {
      await apiClient.put(`/schede-medicazione-med/${selectedScheda.id}`, {
        data_compilazione: selectedScheda.data_compilazione,
        fondo: selectedScheda.fondo,
        margini: selectedScheda.margini,
        cute_perilesionale: selectedScheda.cute_perilesionale,
        essudato_quantita: selectedScheda.essudato_quantita,
        essudato_tipo: selectedScheda.essudato_tipo,
        medicazione: selectedScheda.medicazione,
        prossimo_cambio: selectedScheda.prossimo_cambio,
        firma: selectedScheda.firma,
      });
      toast.success("Scheda aggiornata");
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheda) return;
    
    try {
      await apiClient.delete(`/schede-medicazione-med/${selectedScheda.id}`);
      toast.success("Scheda eliminata");
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleCopyFromPrevious = () => {
    if (schede.length > 0) {
      const lastScheda = schede[0];
      setFormData({
        ...formData,
        data_compilazione: format(new Date(), "yyyy-MM-dd"),
        fondo: lastScheda.fondo || [],
        margini: lastScheda.margini || [],
        cute_perilesionale: lastScheda.cute_perilesionale || [],
        essudato_quantita: lastScheda.essudato_quantita || "",
        essudato_tipo: lastScheda.essudato_tipo || [],
        medicazione: lastScheda.medicazione || DEFAULT_MEDICAZIONE,
        prossimo_cambio: "",
        firma: lastScheda.firma || "",
      });
      toast.success("Dati copiati dalla scheda precedente");
    }
  };

  const handleOpenView = (scheda) => {
    setSelectedScheda({ ...scheda });
    setIsEditing(false);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      data_compilazione: format(new Date(), "yyyy-MM-dd"),
      fondo: [],
      margini: [],
      cute_perilesionale: [],
      essudato_quantita: "",
      essudato_tipo: [],
      medicazione: DEFAULT_MEDICAZIONE,
      prossimo_cambio: "",
      firma: "",
      photos: [],
    });
  };

  // Generate photo description with date
  const generatePhotoDescription = (dataMedicazione) => {
    const dateFormatted = dataMedicazione 
      ? format(new Date(dataMedicazione), "dd/MM/yy", { locale: it })
      : format(new Date(), "dd/MM/yy", { locale: it });
    return `Foto medicazione del ${dateFormatted}`;
  };

  // Handle photo upload for scheda
  const handlePhotoUpload = async (e, schedaId = null, dataMedicazione = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept images
    if (!file.type.startsWith('image/')) {
      toast.error("Solo immagini sono supportate per le schede MED");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Get the data for description
      const dataScheda = dataMedicazione || (schedaId && selectedScheda?.data_compilazione) || formData.data_compilazione;
      const descrizioneAuto = generatePhotoDescription(dataScheda);
      
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("patient_id", patientId);
      formDataUpload.append("ambulatorio", ambulatorio);
      formDataUpload.append("tipo", "MED_SCHEDA");
      formDataUpload.append("data", dataScheda || format(new Date(), "yyyy-MM-dd"));
      formDataUpload.append("scheda_med_id", schedaId || "pending");
      formDataUpload.append("file_type", "image");
      formDataUpload.append("descrizione", descrizioneAuto);

      const response = await apiClient.post("/photos", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (schedaId) {
        // Update existing scheda with new photo
        const currentPhotos = selectedScheda?.photos || [];
        setSelectedScheda(prev => ({
          ...prev,
          photos: [...currentPhotos, response.data.id]
        }));
        toast.success("Foto aggiunta alla scheda");
        onRefresh();
      } else {
        // Add to form for new scheda
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), response.data.id]
        }));
        toast.success("Foto caricata");
      }
    } catch (error) {
      toast.error("Errore nel caricamento della foto");
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Delete photo from scheda
  const handleDeleteSchedaPhoto = async (photoId, schedaId = null) => {
    try {
      await apiClient.delete(`/photos/${photoId}`);
      if (schedaId) {
        toast.success("Foto rimossa dalla scheda");
        onRefresh();
      } else {
        setFormData(prev => ({
          ...prev,
          photos: prev.photos.filter(id => id !== photoId)
        }));
        toast.success("Foto rimossa");
      }
    } catch (error) {
      toast.error("Errore nella rimozione della foto");
    }
  };

  // Print function for MED scheda with requested format
  const handlePrintScheda = (scheda) => {
    const getLabels = (ids, options) => {
      if (!ids || ids.length === 0) return "-";
      return ids.map(id => options.find(o => o.id === id)?.label || id).join(", ");
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
      } catch {
        return dateStr;
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scheda Medicazione MED - ${patientInfo?.cognome || ''} ${patientInfo?.nome || ''}</title>
        <style>
          @page { 
            size: A4; 
            margin: 20mm;
          }
          * { 
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #1a56db;
            padding-bottom: 15px;
          }
          .header h1 {
            font-size: 16pt;
            color: #1a56db;
            margin-bottom: 5px;
          }
          .section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #fafafa;
          }
          .section-title {
            font-size: 13pt;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 10px;
            border-bottom: 1px solid #1a56db;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-item {
            padding: 5px 0;
          }
          .info-item strong {
            color: #555;
          }
          .lesion-list {
            list-style: none;
            padding: 0;
          }
          .lesion-list li {
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
          }
          .lesion-list li:last-child {
            border-bottom: none;
          }
          .lesion-label {
            font-weight: bold;
            color: #333;
          }
          .medication-text {
            background: #fff;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: inherit;
          }
          .footer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #333;
          }
          .signature-box {
            border: 1px solid #333;
            padding: 10px;
            text-align: center;
            min-height: 60px;
          }
          .signature-label {
            font-size: 9pt;
            color: #666;
            margin-bottom: 5px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SCHEDA MEDICAZIONE MED</h1>
          <p>Ambulatorio Infermieristico - ${AMBULATORI_NAMES[ambulatorio] || ambulatorio}</p>
        </div>

        <div class="section">
          <div class="section-title">=== ANAGRAFICA PAZIENTE ===</div>
          <div class="info-grid">
            <div class="info-item"><strong>Cognome:</strong> ${patientInfo?.cognome || '-'}</div>
            <div class="info-item"><strong>Nome:</strong> ${patientInfo?.nome || '-'}</div>
            <div class="info-item"><strong>Data di Nascita:</strong> ${formatDate(patientInfo?.data_nascita)}</div>
            <div class="info-item"><strong>Codice Fiscale:</strong> ${patientInfo?.codice_fiscale || '-'}</div>
            <div class="info-item"><strong>Telefono:</strong> ${patientInfo?.telefono || '-'}</div>
            <div class="info-item"><strong>Ambulatorio:</strong> ${AMBULATORI_NAMES[ambulatorio] || ambulatorio}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">=== SCHEDA MEDICAZIONE ===</div>
          <p style="margin-bottom: 15px;"><strong>Data della medicazione:</strong> ${formatDate(scheda.data_compilazione)}</p>
          
          <div style="margin-bottom: 15px;">
            <p style="font-weight: bold; margin-bottom: 10px;">La lesione presenta:</p>
            <ul class="lesion-list">
              <li><span class="lesion-label">Fondo:</span> ${getLabels(scheda.fondo, FONDO_OPTIONS)}</li>
              <li><span class="lesion-label">Margine:</span> ${getLabels(scheda.margini, MARGINI_OPTIONS)}</li>
              <li><span class="lesion-label">Cute perilesionale:</span> ${getLabels(scheda.cute_perilesionale, CUTE_OPTIONS)}</li>
              <li><span class="lesion-label">Essudato:</span> ${
                scheda.essudato_quantita 
                  ? `${ESSUDATO_QUANTITA.find(e => e.id === scheda.essudato_quantita)?.label || scheda.essudato_quantita}${scheda.essudato_tipo?.length ? ' - ' + getLabels(scheda.essudato_tipo, ESSUDATO_TIPO) : ''}`
                  : '-'
              }</li>
            </ul>
          </div>

          <div style="margin-bottom: 15px;">
            <p style="font-weight: bold; margin-bottom: 10px;">Viene trattata seguendo:</p>
            <div class="medication-text">${scheda.medicazione || '-'}</div>
          </div>

          <p><strong>Data del nuovo appuntamento:</strong> ${formatDate(scheda.prossimo_cambio)}</p>
        </div>

        <div class="footer-section">
          <div class="signature-box">
            <div class="signature-label">Firma Operatore</div>
            <div style="font-size: 14pt; font-weight: bold; margin-top: 10px;">${scheda.firma || ''}</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">Data</div>
            <div style="font-size: 14pt; margin-top: 10px;">${formatDate(scheda.data_compilazione)}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Render form fields (shared between create and edit)
  const renderFormFields = (data, isEditMode = false) => (
    <div className="space-y-6">
      {/* Header with date and copy button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label>Data Compilazione</Label>
          <Input
            type="date"
            value={data.data_compilazione || ""}
            onChange={(e) => handleFieldChange("data_compilazione", e.target.value, isEditMode)}
            disabled={!isEditMode && editDialogOpen}
          />
        </div>
        {!editDialogOpen && schede.length > 0 && (
          <Button variant="outline" onClick={handleCopyFromPrevious}>
            <Copy className="w-4 h-4 mr-2" />
            Copia da precedente
          </Button>
        )}
      </div>

      {/* Fondo Lesione */}
      <div className="form-section">
        <div className="form-section-title">Fondo Lesione</div>
        <SelectionChips
          options={FONDO_OPTIONS}
          selected={data.fondo}
          onToggle={(id) => handleToggle("fondo", id, isEditMode)}
        />
      </div>

      {/* Margini Lesione */}
      <div className="form-section">
        <div className="form-section-title">Margini Lesione</div>
        <SelectionChips
          options={MARGINI_OPTIONS}
          selected={data.margini}
          onToggle={(id) => handleToggle("margini", id, isEditMode)}
        />
      </div>

      {/* Cute Perilesionale */}
      <div className="form-section">
        <div className="form-section-title">Cute Perilesionale</div>
        <SelectionChips
          options={CUTE_OPTIONS}
          selected={data.cute_perilesionale}
          onToggle={(id) => handleToggle("cute_perilesionale", id, isEditMode)}
        />
      </div>

      {/* Essudato */}
      <div className="form-section">
        <div className="form-section-title">Essudato</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Quantità</Label>
            <SelectionChips
              options={ESSUDATO_QUANTITA}
              selected={data.essudato_quantita}
              onToggle={(id) => handleSingleSelect("essudato_quantita", id, isEditMode)}
              multiple={false}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Tipologia</Label>
            <SelectionChips
              options={ESSUDATO_TIPO}
              selected={data.essudato_tipo}
              onToggle={(id) => handleToggle("essudato_tipo", id, isEditMode)}
            />
          </div>
        </div>
      </div>

      {/* Medicazione */}
      <div className="form-section">
        <div className="form-section-title">Medicazione Praticata</div>
        <Textarea
          value={data.medicazione || ""}
          onChange={(e) => handleFieldChange("medicazione", e.target.value, isEditMode)}
          rows={5}
          className="font-mono text-sm"
        />
      </div>

      {/* Footer */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Prossimo Cambio</Label>
          <Input
            type="date"
            value={data.prossimo_cambio || ""}
            onChange={(e) => handleFieldChange("prossimo_cambio", e.target.value, isEditMode)}
          />
        </div>
        <div className="space-y-2">
          <Label>Firma Operatore</Label>
          <Input
            value={data.firma || ""}
            onChange={(e) => handleFieldChange("firma", e.target.value, isEditMode)}
            placeholder="Nome operatore"
          />
        </div>
      </div>

      {/* Photos Section */}
      <div className="form-section">
        <div className="form-section-title flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Foto Lesione
        </div>
        <div className="space-y-3">
          {/* Upload buttons */}
          <div className="flex gap-2">
            <label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, isEditMode ? selectedScheda?.id : null, isEditMode ? selectedScheda?.data_compilazione : formData.data_compilazione)}
                disabled={uploadingPhoto}
              />
              <Button asChild variant="outline" size="sm" disabled={uploadingPhoto}>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  Scatta Foto
                </span>
              </Button>
            </label>
            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, isEditMode ? selectedScheda?.id : null, isEditMode ? selectedScheda?.data_compilazione : formData.data_compilazione)}
                disabled={uploadingPhoto}
              />
              <Button asChild variant="outline" size="sm" disabled={uploadingPhoto}>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingPhoto ? "Caricamento..." : "Carica da Galleria"}
                </span>
              </Button>
            </label>
          </div>
          
          {/* Photo info */}
          <p className="text-xs text-muted-foreground">
            Le foto vengono salvate con la data della medicazione.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Schede Medicazione MED</h2>
        <Button onClick={() => setDialogOpen(true)} data-testid="new-scheda-med-btn">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Scheda
        </Button>
      </div>

      {schede.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna scheda presente</p>
            <Button
              variant="link"
              onClick={() => setDialogOpen(true)}
              className="mt-2"
            >
              Crea la prima scheda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {schede.map((scheda) => (
            <Card
              key={scheda.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleOpenView(scheda)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Scheda del {format(new Date(scheda.data_compilazione), "d MMMM yyyy", { locale: it })}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintScheda(scheda);
                      }}
                      title="Stampa scheda"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenView(scheda);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScheda(scheda);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {scheda.fondo?.map((f) => (
                    <span key={f} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                  {scheda.margini?.map((m) => (
                    <span key={m} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nuova Scheda Medicazione MED</DialogTitle>
            <DialogDescription>
              Compila i campi della scheda di medicazione
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {renderFormFields(formData, false)}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} data-testid="save-scheda-med-btn">
              Salva Scheda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Scheda del {selectedScheda && format(new Date(selectedScheda.data_compilazione), "d MMMM yyyy", { locale: it })}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedScheda && handlePrintScheda(selectedScheda)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Stampa
                </Button>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
            <DialogDescription>
              {isEditing 
                ? "Modifica i campi della scheda e salva le modifiche" 
                : "Clicca su 'Modifica' per modificare questa scheda"}
            </DialogDescription>
          </DialogHeader>

          {selectedScheda && (
            <>
              <ScrollArea className="max-h-[60vh] pr-4">
                {isEditing ? (
                  renderFormFields(selectedScheda, true)
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Data Compilazione</Label>
                      <p>{format(new Date(selectedScheda.data_compilazione), "d MMMM yyyy", { locale: it })}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fondo Lesione</Label>
                      <p>{selectedScheda.fondo?.join(", ") || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Margini Lesione</Label>
                      <p>{selectedScheda.margini?.join(", ") || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cute Perilesionale</Label>
                      <p>{selectedScheda.cute_perilesionale?.join(", ") || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Essudato</Label>
                      <p>
                        Quantità: {selectedScheda.essudato_quantita || "-"} | 
                        Tipo: {selectedScheda.essudato_tipo?.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Medicazione Praticata</Label>
                      <p className="whitespace-pre-wrap">{selectedScheda.medicazione || "-"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Prossimo Cambio</Label>
                        <p>
                          {selectedScheda.prossimo_cambio
                            ? format(new Date(selectedScheda.prossimo_cambio), "d MMM yyyy", { locale: it })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Firma</Label>
                        <p>{selectedScheda.firma || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleUpdate} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa scheda?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La scheda medicazione verrà eliminata definitivamente.
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

export default SchedaMedicazioneMED;
