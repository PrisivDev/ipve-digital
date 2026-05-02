'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  program: string;
}

const classes = [
  'Informatique L2',
  'Gestion L1',
  'Marketing L1',
  'Informatique L1',
  'Comptabilité L3',
];

const programColors: Record<string, string> = {
  'Informatique': 'bg-cyan-50 border-cyan-200 text-cyan-800',
  'Gestion': 'bg-amber-50 border-amber-200 text-amber-800',
  'Marketing': 'bg-purple-50 border-purple-200 text-purple-800',
  'Comptabilité': 'bg-primary/5 border-[oklch(0.85_0.03_155)] text-[oklch(0.35_0.08_155)]',
};

const programBadgeColors: Record<string, string> = {
  'Informatique': 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  'Gestion': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  'Marketing': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
  'Comptabilité': 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]',
};

const mockTimetable: TimetableSlot[] = [
  { id: '1', day: 'Lundi', startTime: '08:00', endTime: '10:00', subject: 'Algorithmique', teacher: 'M. Konan Pascal', room: 'Salle A1', program: 'Informatique' },
  { id: '2', day: 'Lundi', startTime: '10:15', endTime: '12:15', subject: 'Base de Données', teacher: 'Mme Tra Béatrice', room: 'Labo Info', program: 'Informatique' },
  { id: '3', day: 'Mardi', startTime: '08:00', endTime: '10:00', subject: 'Compta Générale', teacher: 'M. Bamba Moussa', room: 'Salle B2', program: 'Gestion' },
  { id: '4', day: 'Mardi', startTime: '10:15', endTime: '12:15', subject: 'Droit', teacher: 'Mme Diop Aïda', room: 'Salle B2', program: 'Gestion' },
  { id: '5', day: 'Mercredi', startTime: '08:00', endTime: '10:00', subject: 'Algorithmique', teacher: 'M. Konan Pascal', room: 'Salle A1', program: 'Informatique' },
  { id: '6', day: 'Mercredi', startTime: '14:00', endTime: '16:00', subject: 'Marketing Digital', teacher: 'M. Coulibaly Drissa', room: 'Salle C3', program: 'Marketing' },
  { id: '7', day: 'Jeudi', startTime: '08:00', endTime: '10:00', subject: 'Marketing Digital', teacher: 'M. Coulibaly Drissa', room: 'Salle C3', program: 'Marketing' },
  { id: '8', day: 'Jeudi', startTime: '10:15', endTime: '12:15', subject: 'Communication', teacher: 'Mme Yao Akissi', room: 'Salle C3', program: 'Marketing' },
  { id: '9', day: 'Vendredi', startTime: '08:00', endTime: '11:00', subject: 'Compta OHADA', teacher: 'M. Bamba Moussa', room: 'Salle D4', program: 'Comptabilité' },
  { id: '10', day: 'Vendredi', startTime: '13:00', endTime: '15:00', subject: 'Dev Web', teacher: "M. N'Guessan Aimé", room: 'Labo Info', program: 'Informatique' },
];

const subjectsList = [
  'Algorithmique', 'Base de Données', 'Compta Générale', 'Droit',
  'Marketing Digital', 'Communication', 'Compta OHADA', 'Dev Web',
  'Réseaux', 'Anglais',
];

const rooms = [
  'Salle A1', 'Salle B2', 'Salle C3', 'Salle D4', 'Labo Info', 'Amphi 1',
];

function getRowSpan(startTime: string, endTime: string) {
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  return Math.max(1, endHour - startHour);
}

function getSlotMap() {
  const map = new Map<string, TimetableSlot>();
  mockTimetable.forEach((slot) => {
    const startHour = parseInt(slot.startTime.split(':')[0], 10);
    const endHour = parseInt(slot.endTime.split(':')[0], 10);
    for (let h = startHour; h < endHour; h++) {
      const key = `${slot.day}-${String(h).padStart(2, '0')}:00`;
      if (h === startHour) {
        map.set(key, slot);
      } else {
        map.set(key, { ...slot, id: `${slot.id}-span-${h}` });
      }
    }
  });
  return map;
}

export function TimetableSection() {
  const [selectedClass, setSelectedClass] = useState('Informatique L2');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    day: 'Lundi',
    startTime: '08:00',
    endTime: '10:00',
    subject: 'Algorithmique',
    room: 'Salle A1',
  });

  const slotMap = useMemo(() => getSlotMap(), []);

  const handleAddSlot = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with class selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Classe :</Label>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un créneau
        </Button>
      </div>

      {/* Program color legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(programColors).map(([prog, cls]) => (
          <div key={prog} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded border ${cls}`} />
            <span className="text-xs text-muted-foreground">{prog}</span>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-2 sm:p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid grid-cols-6 gap-px bg-border rounded-t-lg overflow-hidden">
                <div className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
                  Heure
                </div>
                {days.map((day) => (
                  <div key={day} className="bg-muted/50 p-2 text-center text-xs font-semibold">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-6 gap-px bg-border">
                  <div className="bg-background p-2 flex items-center justify-center text-xs text-muted-foreground min-h-[56px]">
                    {timeSlot}
                  </div>
                  {days.map((day) => {
                    const key = `${day}-${timeSlot}`;
                    const slot = slotMap.get(key);
                    const isStart = slot && parseInt(slot.startTime.split(':')[0], 10) === parseInt(timeSlot.split(':')[0], 10) && slot.startTime === timeSlot;

                    if (isStart) {
                      const span = getRowSpan(slot.startTime, slot.endTime);
                      return (
                        <div
                          key={key}
                          className={`border rounded p-2 ${programColors[slot.program] || 'bg-muted/30 border-border'}`}
                          style={{ gridRow: `span ${span}` }}
                        >
                          <div className="font-semibold text-sm">{slot.subject}</div>
                          <div className="text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {slot.teacher}
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {slot.room}
                          </div>
                          <div className="mt-1">
                            <Badge className={`text-[10px] px-1.5 py-0 ${programBadgeColors[slot.program] || ''}`}>
                              {slot.program}
                            </Badge>
                          </div>
                        </div>
                      );
                    }

                    if (slot && !isStart) {
                      // This cell is part of a multi-hour slot, skip it
                      return null;
                    }

                    return (
                      <div key={key} className="bg-background min-h-[56px]" />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add slot dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un créneau</DialogTitle>
            <DialogDescription>Planifiez un nouveau créneau horaire dans l'emploi du temps.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jour</Label>
                <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Matière</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsList.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure début</Label>
                <Select value={form.startTime} onValueChange={(v) => setForm({ ...form, startTime: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Heure fin</Label>
                <Select value={form.endTime} onValueChange={(v) => setForm({ ...form, endTime: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.filter((t) => t > form.startTime).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Salle</Label>
              <Select value={form.room} onValueChange={(v) => setForm({ ...form, room: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddSlot}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
