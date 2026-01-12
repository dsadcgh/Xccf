import { useState, useEffect, useCallback } from "react";
import { useAmbulatorio, apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";

// Template moduli con URL
const DOCUMENT_TEMPLATES = {
  MED: [
    { id: "consent_med", nome: "Consenso Informato MED", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_f548c735-b113-437f-82ec-c0afbf122c8d/artifacts/k3jcaxa4_CONSENSO_INFORMATO.pdf" },
    { id: "scheda_mmg", nome: "Scheda MMG", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_f548c735-b113-437f-82ec-c0afbf122c8d/artifacts/8bonfflf_SCHEDA_MMG.pdf" },
    { id: "anagrafica_med_template", nome: "Scheda Anagrafica MED", tipo_file: "template", downloadable: true },
    { id: "medicazione_med_template", nome: "Scheda Medicazione MED", tipo_file: "template", downloadable: true },
  ],
  PICC: [
    { id: "consent_picc_1", nome: "Consenso Processi Clinico-Assistenziali", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_medhub-38/artifacts/ysusww7f_CONSENSO%20GENERICO%20AI%20PROCESSI%20CLINICO.ASSISTENZIALI%20ORDINARI%201.pdf" },
    { id: "consent_picc_2", nome: "Consenso Informato PICC e Midline", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_medhub-38/artifacts/siz46bgw_CONSENSO%20INFORMATO%20PICC%20E%20MIDLINE.pdf" },
    { id: "brochure_picc_port", nome: "Brochure PICC Port", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_medhub-38/artifacts/cein282q_Picc%20Port.pdf" },
    { id: "brochure_picc", nome: "Brochure PICC", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_medhub-38/artifacts/kk882djy_Picc.pdf" },
    { id: "scheda_impianto_gestione", nome: "Scheda Impianto e Gestione AV", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_medhub-38/artifacts/sbw1iws9_Sch%20Impianto%20Gestione%20AV%20NEW.pdf" },
    { id: "scheda_impianto", nome: "Scheda Impianto", tipo_file: "pdf", url: "https://customer-assets.emergentagent.com/job_docucare-6/artifacts/3c52ewuw_Scheda%20Impianto.pdf" },
  ],
};

// Funzione per generare la scheda anagrafica MED in formato HTML stampabile
const generateAnagraficaMEDTemplate = () => {
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Scheda Anagrafica/Anamnesi MED</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; color: #333; }
    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
    .header h1 { font-size: 16px; color: #1a56db; margin-bottom: 5px; }
    .header p { font-size: 10px; color: #666; }
    .section { margin-bottom: 12px; }
    .section-title { background: #1a56db; color: white; padding: 5px 10px; font-size: 11px; font-weight: bold; margin-bottom: 8px; }
    .row { display: flex; margin-bottom: 6px; }
    .field { flex: 1; padding-right: 10px; }
    .field label { display: block; font-size: 9px; color: #666; margin-bottom: 2px; }
    .field .input { border-bottom: 1px solid #ccc; min-height: 18px; padding: 2px 0; }
    .field-half { flex: 0.5; }
    .field-full { flex: 1; width: 100%; }
    .textarea-field .input { min-height: 50px; border: 1px solid #ccc; padding: 5px; }
    .body-diagram { display: flex; justify-content: space-around; margin: 15px 0; }
    .body-diagram svg { width: 120px; height: 200px; }
    .body-diagram .diagram-label { text-align: center; font-size: 9px; margin-top: 5px; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 15px; }
    .signature { width: 45%; }
    .signature label { font-size: 9px; color: #666; }
    .signature .line { border-bottom: 1px solid #333; margin-top: 30px; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCHEDA ANAGRAFICA / ANAMNESI</h1>
    <p>Ambulatorio Infermieristico - Trattamento Lesioni Cutanee (MED)</p>
  </div>

  <div class="section">
    <div class="section-title">DATI ANAGRAFICI</div>
    <div class="row">
      <div class="field"><label>Cognome</label><div class="input" contenteditable="true"></div></div>
      <div class="field"><label>Nome</label><div class="input" contenteditable="true"></div></div>
      <div class="field field-half"><label>Data di Nascita</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>Luogo di Nascita</label><div class="input" contenteditable="true"></div></div>
      <div class="field"><label>Codice Fiscale</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>Indirizzo</label><div class="input" contenteditable="true"></div></div>
      <div class="field field-half"><label>Telefono</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>Medico di Base</label><div class="input" contenteditable="true"></div></div>
      <div class="field"><label>ASL di Appartenenza</label><div class="input" contenteditable="true"></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ANAMNESI PATOLOGICA</div>
    <div class="row">
      <div class="field field-full textarea-field"><label>Patologie Pregresse</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="row">
      <div class="field field-full textarea-field"><label>Terapia Farmacologica in Atto</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>Allergie</label><div class="input" contenteditable="true"></div></div>
      <div class="field"><label>Intolleranze</label><div class="input" contenteditable="true"></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">LOCALIZZAZIONE LESIONI</div>
    <p style="font-size: 9px; color: #666; margin-bottom: 10px;">Indicare con un cerchio la sede della/e lesione/i</p>
    <div class="body-diagram">
      <div>
        <svg viewBox="0 0 100 200">
          <ellipse cx="50" cy="15" rx="12" ry="14" fill="none" stroke="#333" stroke-width="1"/>
          <line x1="45" y1="29" x2="45" y2="35" stroke="#333" stroke-width="1"/>
          <line x1="55" y1="29" x2="55" y2="35" stroke="#333" stroke-width="1"/>
          <path d="M 25 45 L 25 95 Q 30 105 50 105 Q 70 105 75 95 L 75 45 L 55 35 L 45 35 Z" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 25 45 Q 15 55 10 75 Q 8 85 5 100" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 75 45 Q 85 55 90 75 Q 92 85 95 100" fill="none" stroke="#333" stroke-width="1"/>
          <ellipse cx="5" cy="105" rx="4" ry="6" fill="none" stroke="#333" stroke-width="1"/>
          <ellipse cx="95" cy="105" rx="4" ry="6" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 35 105 L 32 145 L 28 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 65 105 L 68 145 L 72 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 45 105 L 42 145 L 38 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 55 105 L 58 145 L 62 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 28 180 Q 25 195 38 195" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 72 180 Q 75 195 62 195" fill="none" stroke="#333" stroke-width="1"/>
        </svg>
        <div class="diagram-label">ANTERIORE</div>
      </div>
      <div>
        <svg viewBox="0 0 100 200">
          <ellipse cx="50" cy="15" rx="12" ry="14" fill="none" stroke="#333" stroke-width="1"/>
          <line x1="45" y1="29" x2="45" y2="35" stroke="#333" stroke-width="1"/>
          <line x1="55" y1="29" x2="55" y2="35" stroke="#333" stroke-width="1"/>
          <path d="M 25 45 L 25 95 Q 30 105 50 105 Q 70 105 75 95 L 75 45 L 55 35 L 45 35 Z" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 25 45 Q 15 55 10 75 Q 8 85 5 100" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 75 45 Q 85 55 90 75 Q 92 85 95 100" fill="none" stroke="#333" stroke-width="1"/>
          <ellipse cx="5" cy="105" rx="4" ry="6" fill="none" stroke="#333" stroke-width="1"/>
          <ellipse cx="95" cy="105" rx="4" ry="6" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 35 105 L 32 145 L 28 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 65 105 L 68 145 L 72 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 45 105 L 42 145 L 38 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 55 105 L 58 145 L 62 180" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 28 180 Q 25 195 38 195" fill="none" stroke="#333" stroke-width="1"/>
          <path d="M 72 180 Q 75 195 62 195" fill="none" stroke="#333" stroke-width="1"/>
        </svg>
        <div class="diagram-label">POSTERIORE</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">NOTE CLINICHE</div>
    <div class="row">
      <div class="field field-full textarea-field"><label>Diagnosi / Motivo della Presa in Carico</label><div class="input" contenteditable="true"></div></div>
    </div>
  </div>

  <div class="footer">
    <div class="row">
      <div class="field"><label>Data Apertura Cartella</label><div class="input" contenteditable="true"></div></div>
      <div class="field"><label>Operatore</label><div class="input" contenteditable="true"></div></div>
    </div>
    <div class="signature-row">
      <div class="signature">
        <label>Firma Paziente</label>
        <div class="line"></div>
      </div>
      <div class="signature">
        <label>Firma Operatore</label>
        <div class="line"></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  return html;
};

// Funzione per generare la scheda medicazione MED
const generateMedicazioneMEDTemplate = () => {
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Scheda Medicazione MED</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; padding: 15px; color: #333; }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #1a56db; padding-bottom: 8px; }
    .header h1 { font-size: 14px; color: #1a56db; margin-bottom: 3px; }
    .patient-info { display: flex; gap: 15px; margin-bottom: 12px; padding: 8px; background: #f0f7ff; border-radius: 4px; }
    .patient-info .field { flex: 1; }
    .patient-info label { font-size: 8px; color: #666; display: block; }
    .patient-info .value { font-weight: bold; border-bottom: 1px solid #ccc; padding: 2px 0; min-height: 16px; }
    .section { margin-bottom: 10px; }
    .section-title { background: #1a56db; color: white; padding: 4px 8px; font-size: 10px; font-weight: bold; margin-bottom: 6px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
    .checkbox-item { display: flex; align-items: center; gap: 3px; font-size: 9px; padding: 3px 5px; border: 1px solid #ddd; border-radius: 3px; }
    .checkbox-item input { width: 12px; height: 12px; }
    .row { display: flex; gap: 10px; margin-bottom: 6px; }
    .field { flex: 1; }
    .field label { display: block; font-size: 8px; color: #666; margin-bottom: 2px; }
    .field .input { border: 1px solid #ccc; min-height: 16px; padding: 3px; font-size: 9px; }
    .textarea { min-height: 60px; }
    .wound-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
    .wound-box { border: 1px solid #ddd; padding: 6px; border-radius: 4px; }
    .wound-box h4 { font-size: 9px; color: #1a56db; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
    .wound-options { font-size: 8px; }
    .wound-options label { display: block; margin: 2px 0; }
    .footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; }
    .signature { width: 30%; }
    .signature label { font-size: 8px; color: #666; }
    .signature .line { border-bottom: 1px solid #333; margin-top: 20px; }
    @media print { body { padding: 8px; font-size: 9px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCHEDA MEDICAZIONE LESIONI CUTANEE</h1>
    <p style="font-size: 9px; color: #666;">Ambulatorio Infermieristico MED</p>
  </div>

  <div class="patient-info">
    <div class="field"><label>Cognome e Nome</label><div class="value" contenteditable="true"></div></div>
    <div class="field"><label>Data di Nascita</label><div class="value" contenteditable="true"></div></div>
    <div class="field"><label>Data Medicazione</label><div class="value" contenteditable="true"></div></div>
    <div class="field"><label>N° Accesso</label><div class="value" contenteditable="true"></div></div>
  </div>

  <div class="wound-section">
    <div class="wound-box">
      <h4>FONDO LESIONE</h4>
      <div class="wound-options">
        <label><input type="checkbox"> Granuleggiante</label>
        <label><input type="checkbox"> Fibrinoso</label>
        <label><input type="checkbox"> Necrotico</label>
        <label><input type="checkbox"> Infetto</label>
        <label><input type="checkbox"> Biofilmato</label>
      </div>
    </div>
    <div class="wound-box">
      <h4>MARGINI LESIONE</h4>
      <div class="wound-options">
        <label><input type="checkbox"> Attivi</label>
        <label><input type="checkbox"> Piantati</label>
        <label><input type="checkbox"> In Estensione</label>
        <label><input type="checkbox"> A Scogliera</label>
      </div>
    </div>
    <div class="wound-box">
      <h4>CUTE PERILESIONALE</h4>
      <div class="wound-options">
        <label><input type="checkbox"> Integra</label>
        <label><input type="checkbox"> Secca</label>
        <label><input type="checkbox"> Arrossata</label>
        <label><input type="checkbox"> Macerata</label>
        <label><input type="checkbox"> Ipercheratosica</label>
      </div>
    </div>
    <div class="wound-box">
      <h4>ESSUDATO</h4>
      <div class="wound-options">
        <p style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">Quantità:</p>
        <label><input type="checkbox"> Assente</label>
        <label><input type="checkbox"> Moderato</label>
        <label><input type="checkbox"> Abbondante</label>
        <p style="font-size: 8px; font-weight: bold; margin: 4px 0 2px;">Tipo:</p>
        <label><input type="checkbox"> Sieroso</label>
        <label><input type="checkbox"> Ematico</label>
        <label><input type="checkbox"> Purulento</label>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">MEDICAZIONE PRATICATA</div>
    <div class="field">
      <div class="input textarea" contenteditable="true">La lesione è stata trattata seguendo le 4 fasi del Wound Hygiene:
Detersione con Prontosan
Debridement e Riattivazione dei margini
Medicazione: </div>
    </div>
  </div>

  <div class="row">
    <div class="field">
      <label>Prossimo Cambio Medicazione</label>
      <div class="input" contenteditable="true"></div>
    </div>
    <div class="field">
      <label>Dimensioni Lesione (cm)</label>
      <div class="input" contenteditable="true"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">NOTE</div>
    <div class="field">
      <div class="input textarea" contenteditable="true"></div>
    </div>
  </div>

  <div class="footer">
    <div class="signature">
      <label>Data</label>
      <div class="line"></div>
    </div>
    <div class="signature">
      <label>Firma Paziente</label>
      <div class="line"></div>
    </div>
    <div class="signature">
      <label>Firma Operatore</label>
      <div class="line"></div>
    </div>
  </div>
</body>
</html>`;
  return html;
};

export default function ModulisticaPage() {
  const { ambulatorio } = useAmbulatorio();
  const [activeTab, setActiveTab] = useState(
    ambulatorio === "villa_ginestre" ? "PICC" : "MED"
  );

  const isVillaGinestre = ambulatorio === "villa_ginestre";

  const handleDownload = (doc) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
      toast.success(`Download ${doc.nome} avviato`);
    }
  };

  const handlePrintTemplate = (templateId) => {
    let html = "";
    if (templateId === "anagrafica_med_template") {
      html = generateAnagraficaMEDTemplate();
    } else if (templateId === "medicazione_med_template") {
      html = generateMedicazioneMEDTemplate();
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadWord = (templateId) => {
    let html = "";
    let filename = "";
    
    if (templateId === "anagrafica_med_template") {
      html = generateAnagraficaMEDTemplate();
      filename = "Scheda_Anagrafica_MED.doc";
    } else if (templateId === "medicazione_med_template") {
      html = generateMedicazioneMEDTemplate();
      filename = "Scheda_Medicazione_MED.doc";
    }

    // Create blob and download as .doc (Word can open HTML)
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success(`${filename} scaricato`);
  };

  const filteredDocs = DOCUMENT_TEMPLATES[activeTab] || [];

  return (
    <div className="animate-fade-in" data-testid="modulistica-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Modulistica</h1>
        <p className="text-muted-foreground text-sm">
          Moduli e documenti scaricabili e stampabili
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!isVillaGinestre && (
          <TabsList className="mb-6">
            <TabsTrigger value="MED" data-testid="tab-modulistica-med">
              Moduli MED
            </TabsTrigger>
            <TabsTrigger value="PICC" data-testid="tab-modulistica-picc">
              Moduli PICC
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value={activeTab}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.tipo_file === "pdf" 
                          ? "bg-red-100 text-red-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {doc.tipo_file === "pdf" ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {doc.nome}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {doc.tipo_file === "template" ? "WORD" : doc.tipo_file.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {doc.tipo_file === "template" ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadWord(doc.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Word
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePrintTemplate(doc.id)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Stampa
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Scarica
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Informazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              I documenti PDF possono essere visualizzati, stampati e salvati
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              Le schede Word sono modificabili dopo il download
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              I moduli compilati possono essere associati alla cartella clinica del paziente
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
