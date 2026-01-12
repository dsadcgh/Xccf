import { useNavigate } from "react-router-dom";
import { useAuth, useAmbulatorio } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, LogOut } from "lucide-react";

const AMBULATORI_INFO = {
  pta_centro: {
    nome: "PTA Centro",
    descrizione: "Gestione pazienti MED e PICC",
    indirizzo: "Via G. Cusmano, 24 - Palermo",
    tipi: ["MED", "PICC"],
  },
  villa_ginestre: {
    nome: "Villa delle Ginestre",
    descrizione: "Gestione pazienti PICC",
    indirizzo: "Palermo",
    tipi: ["PICC"],
  },
};

export default function SelectAmbulatorioPage() {
  const { user, logout } = useAuth();
  const { selectAmbulatorio } = useAmbulatorio();
  const navigate = useNavigate();

  const handleSelect = (amb) => {
    selectAmbulatorio(amb);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Benvenuto, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-2">
            Seleziona l'ambulatorio su cui vuoi operare
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {user?.ambulatori.map((amb) => {
            const info = AMBULATORI_INFO[amb];
            return (
              <Card
                key={amb}
                data-testid={`select-ambulatorio-${amb}`}
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary"
                onClick={() => handleSelect(amb)}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{info.nome}</CardTitle>
                  <CardDescription>{info.descrizione}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{info.indirizzo}</span>
                  </div>
                  <div className="flex gap-2">
                    {info.tipi.map((tipo) => (
                      <span
                        key={tipo}
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          tipo === "PICC"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tipo}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            data-testid="logout-btn"
            onClick={logout}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </Button>
        </div>
      </div>
    </div>
  );
}
