import { useState, useMemo } from "react";
import { Plus, CalendarDays, Clock, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useVisits } from "@/hooks/useVisits";
import { VisitStatus, VISIT_STATUS_LABELS } from "@/types/proposal";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const VISIT_STATUS_COLORS: Record<VisitStatus, string> = {
  agendada: "bg-info text-info-foreground",
  realizada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
};

export default function Visits() {
  const { visits, loading, createVisit, updateVisit, deleteVisit } = useVisits();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    producer_name: "", date: new Date().toISOString().split("T")[0],
    time: "09:00", objective: "", status: "agendada", proposal_id: null as string | null,
  });

  const visitDates = useMemo(() =>
    visits.filter((v) => v.status !== "cancelada").map((v) => parseISO(v.date)),
    [visits]
  );

  const selectedDayVisits = useMemo(() =>
    visits.filter((v) => isSameDay(parseISO(v.date), selectedDate)),
    [visits, selectedDate]
  );

  const upcomingVisits = useMemo(() => {
    const today = new Date();
    return visits
      .filter((v) => v.status === "agendada" && parseISO(v.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [visits]);

  const handleSave = async () => {
    if (!formData.producer_name.trim() || !formData.objective.trim()) return;
    await createVisit(formData as any);
    setIsDialogOpen(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Agenda de Visitas</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendário e controle de visitas</p>
        </div>
        <Button onClick={() => { setFormData({ producer_name: "", date: new Date().toISOString().split("T")[0], time: "09:00", objective: "", status: "agendada", proposal_id: null }); setIsDialogOpen(true); }} className="gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" /> Nova Visita
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Calendário</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single" selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              modifiers={{ hasVisit: visitDates }}
              modifiersStyles={{ hasVisit: { fontWeight: "bold", backgroundColor: "hsl(210, 80%, 55%)", color: "white", borderRadius: "50%" } }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma visita neste dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayVisits.map((visit) => (
                  <div key={visit.id} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/30">
                    <div className="flex flex-col items-center min-w-[48px]">
                      <Clock className="h-4 w-4 text-primary mb-1" />
                      <span className="text-sm font-semibold">{visit.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{visit.producer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{visit.objective}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Select value={visit.status} onValueChange={(v) => updateVisit(visit.id, { status: v })}>
                          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(VISIT_STATUS_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteVisit(visit.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Badge className={`${VISIT_STATUS_COLORS[visit.status as VisitStatus]} text-[10px] shrink-0`}>
                      {VISIT_STATUS_LABELS[visit.status as VisitStatus]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Próximas Visitas</CardTitle></CardHeader>
        <CardContent>
          {upcomingVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma visita agendada</p>
          ) : (
            <div className="space-y-2">
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedDate(parseISO(visit.date))}>
                  <div className="flex flex-col items-center min-w-[48px] rounded-lg bg-primary/10 p-2">
                    <span className="text-[10px] font-semibold text-primary uppercase">{format(parseISO(visit.date), "MMM", { locale: ptBR })}</span>
                    <span className="text-lg font-bold text-primary leading-none">{format(parseISO(visit.date), "dd")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{visit.producer_name}</p>
                    <p className="text-xs text-muted-foreground">{visit.objective}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{visit.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Nova Visita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produtor *</Label>
              <Input value={formData.producer_name} onChange={(e) => setFormData((f) => ({ ...f, producer_name: e.target.value }))} placeholder="Nome do produtor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" value={formData.time} onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objetivo *</Label>
              <Input value={formData.objective} onChange={(e) => setFormData((f) => ({ ...f, objective: e.target.value }))} placeholder="Objetivo da visita" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
