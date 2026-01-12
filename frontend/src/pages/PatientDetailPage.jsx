import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAmbulatorio, apiClient, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  User,
  FileText,
  Camera,
  Save,
  UserMinus,
  UserX,
  UserPlus,
  Plus,
  Trash2,
  Copy,
  Download,
  FileDown,
  FileArchive,
  X,
  Paperclip,
  File,
  Image,
  FileSpreadsheet,
  Upload,
  Printer,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import BodyMap from "@/components/BodyMap";
import SchedaMedicazioneMED from "@/components/SchedaMedicazioneMED";
import SchedaImpiantoPICC from "@/components/SchedaImpiantoPICC";
import SchedaGestionePICC from "@/components/SchedaGestionePICC";

// Simple custom select component without portal issues
const SimpleSelect = ({ value, onChange, options, placeholder }) => {
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
    <div ref={selectRef} className="relative">
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

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { ambulatorio } = useAmbulatorio();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Medical records state
  const [schedeMED, setSchedeMED] = useState([]);
  const [schedeImpiantoPICC, setSchedeImpiantoPICC] = useState([]);
  const [schedeGestionePICC, setSchedeGestionePICC] = useState([]);
  const [photos, setPhotos] = useState([]);

  const fetchPatient = useCallback(async () => {
    try {
      const response = await apiClient.get(`/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error("Error fetching patient:", error);
      if (error.response?.status === 404) {
        toast.error("Paziente non trovato");
        navigate("/pazienti");
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Errore di connessione al server");
      }
      // For other errors, redirect to patients list
      if (error.response?.status !== 401) {
        navigate("/pazienti");
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, navigate]);

  // Download patient folder as PDF
  const handleDownloadPDF = async (section = "all") => {
    try {
      const sectionNames = {
        all: "completa",
        anagrafica: "anagrafica",
        medicazione: "medicazione",
        impianto: "impianto"
      };
      toast.info(`Generazione PDF ${sectionNames[section]} in corso...`);
      const response = await apiClient.get(`/patients/${patientId}/download/pdf`, {
        params: { section },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartella_${sectionNames[section]}_${patient?.cognome}_${patient?.nome}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF scaricato con successo!");
    } catch (error) {
      toast.error("Errore nel download del PDF");
      console.error(error);
    }
  };

  // Download patient folder as ZIP
  const handleDownloadZIP = async () => {
    try {
      toast.info("Generazione ZIP in corso...");
      const response = await apiClient.get(`/patients/${patientId}/download/zip`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartella_${patient?.cognome}_${patient?.nome}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("ZIP scaricato con successo!");
    } catch (error) {
      toast.error("Errore nel download dello ZIP");
      console.error(error);
    }
  };

  const fetchMedicalRecords = useCallback(async () => {
    if (!patient) return;

    try {
      const requests = [];

      // MED records
      if (patient.tipo === "MED" || patient.tipo === "PICC_MED") {
        requests.push(
          apiClient.get("/schede-medicazione-med", {
            params: { patient_id: patientId, ambulatorio },
          })
        );
      } else {
        requests.push(Promise.resolve({ data: [] }));
      }

      // PICC records
      if (patient.tipo === "PICC" || patient.tipo === "PICC_MED") {
        requests.push(
          apiClient.get("/schede-impianto-picc", {
            params: { patient_id: patientId, ambulatorio },
          }),
          apiClient.get("/schede-gestione-picc", {
            params: { patient_id: patientId, ambulatorio },
          })
        );
      } else {
        requests.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }));
      }

      // Photos
      requests.push(
        apiClient.get("/photos", {
          params: { patient_id: patientId, ambulatorio },
        })
      );

      const [medRes, impiantoRes, gestioneRes, photosRes] = await Promise.all(requests);

      setSchedeMED(medRes.data);
      setSchedeImpiantoPICC(impiantoRes.data);
      setSchedeGestionePICC(gestioneRes.data);
      setPhotos(photosRes.data);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  }, [patient, patientId, ambulatorio]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  useEffect(() => {
    if (patient) {
      fetchMedicalRecords();
    }
  }, [patient, fetchMedicalRecords]);

  const handleSavePatient = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/patients/${patientId}`, patient);
      toast.success("Paziente aggiornato");
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    // Validation only for dimesso and sospeso
    if (statusAction === "dimesso" && !statusReason) {
      toast.error("Seleziona una motivazione");
      return;
    }
    if ((statusAction === "dimesso" && statusReason === "altro" && !statusNotes) ||
        (statusAction === "sospeso" && !statusNotes)) {
      toast.error("Inserisci una nota");
      return;
    }

    try {
      const updateData = {
        status: statusAction,
      };

      if (statusAction === "dimesso") {
        updateData.discharge_reason = statusReason;
        updateData.discharge_notes = statusNotes;
      } else if (statusAction === "sospeso") {
        updateData.suspend_notes = statusNotes;
      }
      // For in_cura, we just update status - history is preserved

      await apiClient.put(`/patients/${patientId}`, updateData);
      
      const messages = {
        in_cura: "Paziente ripreso in cura",
        dimesso: "Paziente dimesso",
        sospeso: "Paziente sospeso",
      };
      toast.success(messages[statusAction]);
      setStatusDialogOpen(false);
      
      if (statusAction !== "in_cura") {
        navigate("/pazienti");
      } else {
        fetchPatient(); // Refresh patient data
      }
    } catch (error) {
      toast.error("Errore nel cambio stato");
    }
  };

  const handleLesionMarkerAdd = (marker) => {
    const newMarkers = [...(patient.lesion_markers || []), marker];
    setPatient({ ...patient, lesion_markers: newMarkers });
  };

  const handleLesionMarkerRemove = (index) => {
    const newMarkers = patient.lesion_markers.filter((_, i) => i !== index);
    setPatient({ ...patient, lesion_markers: newMarkers });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) return null;

  const isMED = patient.tipo === "MED" || patient.tipo === "PICC_MED";
  const isPICC = patient.tipo === "PICC" || patient.tipo === "PICC_MED";

  return (
    <div className="animate-fade-in" data-testid="patient-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/pazienti")}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {patient.cognome} {patient.nome}
            </h1>
            <Badge
              className={
                patient.tipo === "PICC"
                  ? "bg-emerald-100 text-emerald-700"
                  : patient.tipo === "MED"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }
            >
              {patient.tipo === "PICC_MED" ? "PICC + MED" : patient.tipo}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Cartella Clinica</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Download Buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="download-folder-btn">
                <Download className="w-4 h-4 mr-2" />
                Scarica Cartella
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleDownloadPDF("all")} data-testid="download-pdf-all-btn">
                <FileDown className="w-4 h-4 mr-2 text-red-500" />
                Cartella Completa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF("anagrafica")} data-testid="download-pdf-anagrafica-btn">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Solo Anagrafica e Anamnesi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF("medicazione")} data-testid="download-pdf-medicazione-btn">
                <FileText className="w-4 h-4 mr-2 text-green-500" />
                Solo Medicazioni
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF("impianto")} data-testid="download-pdf-impianto-btn">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-purple-500" />
                Solo Schede Impianto (Complete)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadZIP} data-testid="download-zip-btn">
                <FileArchive className="w-4 h-4 mr-2 text-amber-500" />
                Scarica ZIP (con foto)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Show "Riprendi in Cura" for dimesso/sospeso patients */}
          {(patient.status === "dimesso" || patient.status === "sospeso") && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setStatusAction("in_cura");
                setStatusReason("");
                setStatusNotes("");
                setStatusDialogOpen(true);
              }}
              data-testid="reactivate-patient-btn"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Riprendi in Cura
            </Button>
          )}
          {patient.status === "in_cura" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusAction("sospeso");
                  setStatusReason("");
                  setStatusNotes("");
                  setStatusDialogOpen(true);
                }}
                data-testid="suspend-patient-btn"
              >
                <UserX className="w-4 h-4 mr-2" />
                Sospendi
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusAction("dimesso");
                  setStatusReason("");
                  setStatusNotes("");
                  setStatusDialogOpen(true);
                }}
                data-testid="discharge-patient-btn"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Dimetti
              </Button>
            </>
          )}
          {patient.status !== "in_cura" && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusAction("sospeso");
                if (patient.status === "sospeso") {
                  setStatusAction("dimesso");
                }
                setStatusReason("");
                setStatusNotes("");
                setStatusDialogOpen(true);
              }}
              data-testid="change-status-btn"
            >
              {patient.status === "sospeso" ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Dimetti
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Sospendi
                </>
              )}
            </Button>
          )}
          <Button onClick={handleSavePatient} disabled={saving} data-testid="save-patient-btn">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="anagrafica" className="gap-2">
            <User className="w-4 h-4" />
            Anagrafica
          </TabsTrigger>
          {isMED && (
            <TabsTrigger value="medicazione-med" className="gap-2">
              <FileText className="w-4 h-4" />
              Medicazione MED
            </TabsTrigger>
          )}
          {isPICC && (
            <>
              <TabsTrigger value="impianto-picc" className="gap-2">
                <FileText className="w-4 h-4" />
                Impianto PICC
              </TabsTrigger>
              <TabsTrigger value="gestione-picc" className="gap-2">
                <FileText className="w-4 h-4" />
                Gestione PICC
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="allegati" className="gap-2">
            <Paperclip className="w-4 h-4" />
            Allegati
          </TabsTrigger>
        </TabsList>

        {/* Anagrafica Tab */}
        <TabsContent value="anagrafica">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dati Anagrafici</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cognome</Label>
                    <Input
                      value={patient.cognome}
                      onChange={(e) =>
                        setPatient({ ...patient, cognome: e.target.value })
                      }
                      data-testid="patient-cognome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={patient.nome}
                      onChange={(e) =>
                        setPatient({ ...patient, nome: e.target.value })
                      }
                      data-testid="patient-nome"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data di Nascita</Label>
                    <Input
                      type="date"
                      value={patient.data_nascita || ""}
                      onChange={(e) =>
                        setPatient({ ...patient, data_nascita: e.target.value })
                      }
                      data-testid="patient-data-nascita"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Codice Fiscale</Label>
                    <Input
                      value={patient.codice_fiscale || ""}
                      onChange={(e) =>
                        setPatient({ ...patient, codice_fiscale: e.target.value.toUpperCase() })
                      }
                      data-testid="patient-cf"
                      maxLength={16}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <Input
                      value={patient.telefono || ""}
                      onChange={(e) =>
                        setPatient({ ...patient, telefono: e.target.value })
                      }
                      data-testid="patient-telefono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={patient.email || ""}
                      onChange={(e) =>
                        setPatient({ ...patient, email: e.target.value })
                      }
                      data-testid="patient-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Medico di Base</Label>
                  <Input
                    value={patient.medico_base || ""}
                    onChange={(e) =>
                      setPatient({ ...patient, medico_base: e.target.value })
                    }
                    data-testid="patient-medico"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anamnesi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Anamnesi</Label>
                  <Textarea
                    value={patient.anamnesi || ""}
                    onChange={(e) =>
                      setPatient({ ...patient, anamnesi: e.target.value })
                    }
                    rows={3}
                    data-testid="patient-anamnesi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Terapia in Atto</Label>
                  <Textarea
                    value={patient.terapia_in_atto || ""}
                    onChange={(e) =>
                      setPatient({ ...patient, terapia_in_atto: e.target.value })
                    }
                    rows={2}
                    data-testid="patient-terapia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allergie</Label>
                  <Textarea
                    value={patient.allergie || ""}
                    onChange={(e) =>
                      setPatient({ ...patient, allergie: e.target.value })
                    }
                    rows={2}
                    data-testid="patient-allergie"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Body Map for MED patients */}
            {isMED && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Mappa Lesioni</CardTitle>
                  <CardDescription>
                    Clicca sulla sagoma per segnare la posizione delle lesioni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BodyMap
                    markers={patient.lesion_markers || []}
                    onAddMarker={handleLesionMarkerAdd}
                    onRemoveMarker={handleLesionMarkerRemove}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Medicazione MED Tab */}
        {isMED && (
          <TabsContent value="medicazione-med">
            <SchedaMedicazioneMED
              patientId={patientId}
              ambulatorio={ambulatorio}
              schede={schedeMED}
              onRefresh={fetchMedicalRecords}
              patientInfo={patient}
            />
          </TabsContent>
        )}

        {/* Impianto PICC Tab */}
        {isPICC && (
          <TabsContent value="impianto-picc">
            <SchedaImpiantoPICC
              patientId={patientId}
              ambulatorio={ambulatorio}
              schede={schedeImpiantoPICC}
              onRefresh={fetchMedicalRecords}
              patient={patient}
            />
          </TabsContent>
        )}

        {/* Gestione PICC Tab */}
        {isPICC && (
          <TabsContent value="gestione-picc">
            <SchedaGestionePICC
              patientId={patientId}
              ambulatorio={ambulatorio}
              schede={schedeGestionePICC}
              onRefresh={fetchMedicalRecords}
              patientInfo={patient}
            />
          </TabsContent>
        )}

        {/* Allegati Tab */}
        <TabsContent value="allegati">
          <AllegatiGallery
            patientId={patientId}
            ambulatorio={ambulatorio}
            patientTipo={patient.tipo}
            photos={photos}
            onRefresh={fetchMedicalRecords}
          />
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction === "in_cura" && "Riprendi Paziente in Cura"}
              {statusAction === "dimesso" && "Dimetti Paziente"}
              {statusAction === "sospeso" && "Sospendi Paziente"}
            </DialogTitle>
            <DialogDescription>
              {statusAction === "in_cura"
                ? "Il paziente verrà riportato in stato 'In Cura'. Lo storico sarà conservato."
                : statusAction === "dimesso"
                ? "Seleziona la motivazione della dimissione"
                : "Inserisci una nota per la sospensione temporanea"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {statusAction === "in_cura" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Confermando, il paziente tornerà visibile nella lista &quot;In Cura&quot; e sarà possibile gestire nuovamente appuntamenti e schede.
                </p>
              </div>
            )}

            {statusAction === "dimesso" && (
              <div className="space-y-2">
                <Label>Motivazione *</Label>
                <SimpleSelect 
                  value={statusReason} 
                  onChange={setStatusReason}
                  options={[
                    { value: "guarito", label: "Guarito" },
                    { value: "adi", label: "ADI" },
                    { value: "altro", label: "Altro" }
                  ]}
                  placeholder="Seleziona motivazione"
                />
              </div>
            )}

            {statusAction !== "in_cura" && (
              <div className="space-y-2">
                <Label>
                  Note {statusAction === "sospeso" || statusReason === "altro" ? "*" : ""}
                </Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={
                    statusAction === "sospeso"
                      ? "Es: Ricovero ospedaliero"
                      : "Inserisci note aggiuntive..."
                  }
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Annulla
              </Button>
              <Button 
                onClick={handleStatusChange}
                className={statusAction === "in_cura" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Conferma
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Allegati Gallery Component - Supports photos, PDF, Word, Excel
function AllegatiGallery({ patientId, ambulatorio, patientTipo, photos, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Supported file types
  const SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    pdf: ['application/pdf'],
    word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  };

  const getAllSupportedTypes = () => [
    ...SUPPORTED_TYPES.image,
    ...SUPPORTED_TYPES.pdf,
    ...SUPPORTED_TYPES.word,
    ...SUPPORTED_TYPES.excel,
  ].join(',');

  const getFileType = (mimeType) => {
    if (SUPPORTED_TYPES.image.includes(mimeType)) return 'image';
    if (SUPPORTED_TYPES.pdf.includes(mimeType)) return 'pdf';
    if (SUPPORTED_TYPES.word.includes(mimeType)) return 'word';
    if (SUPPORTED_TYPES.excel.includes(mimeType)) return 'excel';
    return 'other';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <Image className="w-8 h-8 text-blue-500" />;
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'word': return <FileText className="w-8 h-8 text-blue-600" />;
      case 'excel': return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleFileSelect = (e, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = getFileType(file.type);
    if (fileType === 'other') {
      toast.error("Tipo di file non supportato. Usa immagini, PDF, Word o Excel.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File troppo grande. Massimo 10MB.");
      return;
    }

    // Set pending file and open dialog to ask for name
    setPendingFile({ file, fileType, isCamera });
    setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for default name
    setUploadDialogOpen(true);
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;
    
    const { file, fileType } = pendingFile;
    const finalName = fileName.trim() || file.name;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId);
    formData.append("ambulatorio", ambulatorio);
    formData.append("tipo", patientTipo === "MED" ? "MED" : "PICC");
    formData.append("data", format(new Date(), "yyyy-MM-dd"));
    formData.append("file_type", fileType);
    formData.append("original_name", finalName + (file.name.match(/\.[^/.]+$/)?.[0] || ""));

    setUploading(true);
    try {
      await apiClient.post("/photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(fileType === 'image' ? "Foto caricata come allegato PDF" : "Documento caricato");
      onRefresh();
      setUploadDialogOpen(false);
      setPendingFile(null);
      setFileName("");
    } catch (error) {
      toast.error("Errore nel caricamento");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await apiClient.delete(`/photos/${photoId}`);
      toast.success("Allegato eliminato");
      onRefresh();
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleViewDocument = (photo) => {
    const fileType = photo.file_type || 'image';
    if (fileType === 'image') {
      setSelectedPhoto(photo);
    } else {
      // For documents, open in new tab or download
      const blob = new Blob(
        [Uint8Array.from(atob(photo.image_data), c => c.charCodeAt(0))],
        { type: photo.mime_type || 'application/pdf' }
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  // Group files by type
  const imageFiles = photos.filter(p => !p.file_type || p.file_type === 'image');
  const documentFiles = photos.filter(p => p.file_type && p.file_type !== 'image');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Allegati</h2>
        <div className="flex gap-2">
          {/* Camera button for photos */}
          <label>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e, true)}
              disabled={uploading}
            />
            <Button asChild variant="outline" disabled={uploading}>
              <span>
                <Camera className="w-4 h-4 mr-2" />
                Scatta Foto
              </span>
            </Button>
          </label>
          {/* Upload button for all files */}
          <label>
            <input
              ref={fileInputRef}
              type="file"
              accept={getAllSupportedTypes()}
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Caricamento..." : "Carica File"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Upload Name Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setUploadDialogOpen(false);
          setPendingFile(null);
          setFileName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nome Allegato</DialogTitle>
            <DialogDescription>
              Inserisci un nome per questo allegato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {pendingFile && getFileIcon(pendingFile.fileType)}
              <div>
                <p className="font-medium">{pendingFile?.file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pendingFile?.fileType?.toUpperCase()} • {pendingFile?.file && (pendingFile.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome del file</Label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Es: Referto esami, Foto lesione..."
              />
              <p className="text-xs text-muted-foreground">
                Le foto verranno salvate come allegati PDF
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setUploadDialogOpen(false);
                setPendingFile(null);
              }}>
                Annulla
              </Button>
              <Button onClick={handleUploadConfirm} disabled={uploading}>
                {uploading ? "Caricamento..." : "Carica"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Paperclip className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun allegato presente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supportati: Immagini, PDF, Word, Excel
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Images Section - Now with download/print buttons */}
          {imageFiles.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" /> Foto Allegate ({imageFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageFiles.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group">
                    <div 
                      className="aspect-square relative cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={`data:image/jpeg;base64,${photo.image_data}`}
                        alt={photo.original_name || "Foto paziente"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-2 space-y-2">
                      <p className="text-xs font-medium truncate">{photo.original_name || "Foto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(photo.data), "d MMM yyyy", { locale: it })}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download as PDF
                            const link = document.createElement('a');
                            link.href = `data:image/jpeg;base64,${photo.image_data}`;
                            link.download = `${photo.original_name || 'foto'}.jpg`;
                            link.click();
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Scarica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Print image
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`
                              <html><head><title>${photo.original_name || 'Foto'}</title></head>
                              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                              <img src="data:image/jpeg;base64,${photo.image_data}" style="max-width:100%;max-height:100vh;"/>
                              </body></html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Stampa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(photo.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section - with download/print */}
          {documentFiles.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documenti ({documentFiles.length})
              </h3>
              <div className="grid gap-3">
                {documentFiles.map((doc) => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleViewDocument(doc)}>
                        {getFileIcon(doc.file_type)}
                        <div>
                          <p className="font-medium">{doc.original_name || 'Documento'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.data), "d MMM yyyy", { locale: it })}
                            {doc.file_type && ` • ${doc.file_type.toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download document
                            const blob = new Blob(
                              [Uint8Array.from(atob(doc.image_data), c => c.charCodeAt(0))],
                              { type: doc.mime_type || 'application/pdf' }
                            );
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = doc.original_name || 'documento';
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Scarica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Print document
                            const blob = new Blob(
                              [Uint8Array.from(atob(doc.image_data), c => c.charCodeAt(0))],
                              { type: doc.mime_type || 'application/pdf' }
                            );
                            const url = URL.createObjectURL(blob);
                            const printWindow = window.open(url, '_blank');
                            printWindow.onload = () => printWindow.print();
                          }}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Stampa
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Detail Dialog with rotation and zoom */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => {
        setSelectedPhoto(null);
        setPhotoRotation(0);
        setPhotoZoom(1);
      }}>
        <DialogContent className="max-w-4xl max-h-[95vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="truncate max-w-md">
              {selectedPhoto?.original_name || "Foto"} - {selectedPhoto && format(new Date(selectedPhoto.data), "d MMMM yyyy", { locale: it })}
            </DialogTitle>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setPhotoZoom(prev => Math.max(0.25, prev - 0.25))}
                className="h-8 w-8"
                title="Riduci"
                disabled={photoZoom <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="flex items-center justify-center w-12 text-xs">{Math.round(photoZoom * 100)}%</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setPhotoZoom(prev => Math.min(3, prev + 0.25))}
                className="h-8 w-8"
                title="Ingrandisci"
                disabled={photoZoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setPhotoRotation(prev => (prev + 90) % 360)}
                className="h-8 w-8"
                title="Ruota 90°"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoRotation(0);
                  setPhotoZoom(1);
                }}
                className="h-8 w-8 rounded-full hover:bg-destructive/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative flex flex-col items-center">
              <div 
                className="overflow-auto rounded-lg border bg-muted/30" 
                style={{ maxHeight: '60vh', maxWidth: '100%' }}
              >
                <img
                  src={`data:image/jpeg;base64,${selectedPhoto.image_data}`}
                  alt="Foto ingrandita"
                  className="transition-transform duration-200"
                  style={{ 
                    transform: `rotate(${photoRotation}deg) scale(${photoZoom})`,
                    transformOrigin: 'center center',
                    imageRendering: photoZoom > 1 ? 'auto' : 'auto',
                  }}
                />
              </div>
              <div className="flex gap-2 mt-4 w-full flex-wrap justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhotoZoom(prev => Math.max(0.25, prev - 0.25))}
                  disabled={photoZoom <= 0.25}
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Riduci
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhotoZoom(1)}
                >
                  100%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhotoZoom(prev => Math.min(3, prev + 0.25))}
                  disabled={photoZoom >= 3}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Ingrandisci
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhotoRotation(prev => (prev + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Ruota
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setPhotoRotation(0);
                    setPhotoZoom(1);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
