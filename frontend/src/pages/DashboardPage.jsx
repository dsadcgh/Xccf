import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAmbulatorio, apiClient } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FileText, BarChart3, UserCheck, Activity, ClipboardList, Syringe } from "lucide-react";
import { toast } from "sonner";

const DASHBOARD_ITEMS = [
  {
    id: "agenda",
    title: "Agenda",
    description: "Gestisci appuntamenti e prenotazioni",
    icon: Calendar,
    path: "/agenda",
    color: "agenda",
  },
  {
    id: "pazienti",
    title: "Pazienti",
    description: "Cartelle cliniche e anagrafica",
    icon: Users,
    path: "/pazienti",
    color: "pazienti",
  },
  {
    id: "impianti",
    title: "Impianti",
    description: "Registro impianti PICC, Port e Midline",
    icon: Syringe,
    path: "/impianti",
    color: "impianti",
  },
  {
    id: "prescrizioni",
    title: "Prescrizioni",
    description: "Gestione prescrizioni infermieristiche",
    icon: ClipboardList,
    path: "/prescrizioni",
    color: "prescrizioni",
  },
  {
    id: "modulistica",
    title: "Modulistica",
    description: "Moduli e documenti scaricabili",
    icon: FileText,
    path: "/modulistica",
    color: "modulistica",
  },
  {
    id: "statistiche",
    title: "Statistiche",
    description: "Report e analisi dati",
    icon: BarChart3,
    path: "/statistiche",
    color: "statistiche",
  },
];

const AMBULATORI_NAMES = {
  pta_centro: "PTA Centro",
  villa_ginestre: "Villa delle Ginestre",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { ambulatorio } = useAmbulatorio();
  const [stats, setStats] = useState({
    totalePICC: 0,
    totaleMED: 0,
    totalePICCMED: 0,
    totaleInCura: 0,
    totaleDimessi: 0,
    totaleSospesi: 0,
  });
  const [loading, setLoading] = useState(true);

  const isVillaGinestre = ambulatorio === "villa_ginestre";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch patients to calculate stats
        const [inCuraRes, dimessiRes, sospesiRes] = await Promise.all([
          apiClient.get("/patients", { params: { ambulatorio, status: "in_cura" } }),
          apiClient.get("/patients", { params: { ambulatorio, status: "dimesso" } }),
          apiClient.get("/patients", { params: { ambulatorio, status: "sospeso" } }),
        ]);

        const inCura = inCuraRes.data;
        const dimessi = dimessiRes.data;
        const sospesi = sospesiRes.data;

        setStats({
          totalePICC: inCura.filter(p => p.tipo === "PICC").length,
          totaleMED: inCura.filter(p => p.tipo === "MED").length,
          totalePICCMED: inCura.filter(p => p.tipo === "PICC_MED").length,
          totaleInCura: inCura.length,
          totaleDimessi: dimessi.length,
          totaleSospesi: sospesi.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [ambulatorio]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {AMBULATORI_NAMES[ambulatorio]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Seleziona una sezione per iniziare
        </p>
      </div>

      {/* Panoramica Pazienti */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Panoramica Pazienti in Carico
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {!isVillaGinestre && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="text-3xl font-bold text-blue-600">
                  {loading ? <span className="animate-pulse">—</span> : stats.totaleMED}
                </div>
                <p className="text-sm text-blue-600/80 font-medium">Pazienti MED</p>
              </CardContent>
            </Card>
          )}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-3xl font-bold text-emerald-600">
                {loading ? <span className="animate-pulse">—</span> : stats.totalePICC}
              </div>
              <p className="text-sm text-emerald-600/80 font-medium">Pazienti PICC</p>
            </CardContent>
          </Card>
          {!isVillaGinestre && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="text-3xl font-bold text-purple-600">
                  {loading ? <span className="animate-pulse">—</span> : stats.totalePICCMED}
                </div>
                <p className="text-sm text-purple-600/80 font-medium">PICC + MED</p>
              </CardContent>
            </Card>
          )}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-3xl font-bold text-green-600">
                {loading ? <span className="animate-pulse">—</span> : stats.totaleInCura}
              </div>
              <p className="text-sm text-green-600/80 font-medium">In Cura</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-3xl font-bold text-orange-600">
                {loading ? <span className="animate-pulse">—</span> : stats.totaleSospesi}
              </div>
              <p className="text-sm text-orange-600/80 font-medium">Sospesi</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-3xl font-bold text-slate-600">
                {loading ? <span className="animate-pulse">—</span> : stats.totaleDimessi}
              </div>
              <p className="text-sm text-slate-600/80 font-medium">Dimessi</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Menu Principale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DASHBOARD_ITEMS.map((item) => (
          <Card
            key={item.id}
            data-testid={`dashboard-${item.id}-btn`}
            className="dashboard-card group"
            onClick={() => navigate(item.path)}
          >
            <CardHeader className="pb-2">
              <div className={`dashboard-card-icon ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {ambulatorio === "villa_ginestre" && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800">
            <strong>Nota:</strong> Villa delle Ginestre gestisce esclusivamente pazienti PICC.
            Le sezioni MED non sono disponibili in questo ambulatorio.
          </p>
        </div>
      )}
    </div>
  );
}
