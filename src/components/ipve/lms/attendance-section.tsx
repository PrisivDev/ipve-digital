'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AttendanceStatus = 'Présent' | 'Absent' | 'Retard' | 'Excusé';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  program: string;
  subject: string;
  date: string;
  status: AttendanceStatus;
  comment: string;
}

const programs = ['Informatique', 'Gestion', 'Marketing', 'Comptabilité'];
const subjects = [
  'Algorithmique', 'Base de Données', 'Compta Générale', 'Droit',
  'Marketing Digital', 'Communication', 'Compta OHADA', 'Dev Web',
  'Réseaux', 'Anglais',
];

const mockAttendance: AttendanceRecord[] = [
  { id: '1', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', subject: 'Algorithmique', date: '2025-01-06', status: 'Présent', comment: '' },
  { id: '2', studentId: '2', studentFirstName: 'Jean-Baptiste', studentLastName: 'Yao', program: 'Gestion', subject: 'Compta Générale', date: '2025-01-06', status: 'Présent', comment: '' },
  { id: '3', studentId: '3', studentFirstName: 'Fatoumata', studentLastName: 'Coulibaly', program: 'Marketing', subject: 'Marketing Digital', date: '2025-01-06', status: 'Absent', comment: 'Non justifié' },
  { id: '4', studentId: '4', studentFirstName: 'Kouamé', studentLastName: 'Brou', program: 'Comptabilité', subject: 'Compta OHADA', date: '2025-01-06', status: 'Retard', comment: '15 min de retard' },
  { id: '5', studentId: '5', studentFirstName: 'Marie-Claire', studentLastName: 'Diallo', program: 'Informatique', subject: 'Algorithmique', date: '2025-01-06', status: 'Présent', comment: '' },
  { id: '6', studentId: '6', studentFirstName: 'Emmanuel', studentLastName: 'Aka', program: 'Gestion', subject: 'Droit', date: '2025-01-07', status: 'Absent', comment: 'Certificat médical' },
  { id: '7', studentId: '7', studentFirstName: 'Aïssatou', studentLastName: 'Touré', program: 'Marketing', subject: 'Communication', date: '2025-01-07', status: 'Présent', comment: '' },
  { id: '8', studentId: '8', studentFirstName: 'Yves', studentLastName: "N'Guessan", program: 'Informatique', subject: 'Base de Données', date: '2025-01-07', status: 'Présent', comment: '' },
  { id: '9', studentId: '9', studentFirstName: 'Adama', studentLastName: 'Ouattara', program: 'Comptabilité', subject: 'Compta Générale', date: '2025-01-07', status: 'Excusé', comment: 'Raison familiale' },
  { id: '10', studentId: '10', studentFirstName: 'Sitan', studentLastName: 'Cissé', program: 'Gestion', subject: 'Marketing Digital', date: '2025-01-07', status: 'Présent', comment: '' },
  { id: '11', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', subject: 'Dev Web', date: '2025-01-08', status: 'Présent', comment: '' },
  { id: '12', studentId: '3', studentFirstName: 'Fatoumata', studentLastName: 'Coulibaly', program: 'Marketing', subject: 'Marketing Digital', date: '2025-01-08', status: 'Présent', comment: '' },
  { id: '13', studentId: '4', studentFirstName: 'Kouamé', studentLastName: 'Brou', program: 'Comptabilité', subject: 'Compta OHADA', date: '2025-01-08', status: 'Absent', comment: '' },
  { id: '14', studentId: '5', studentFirstName: 'Marie-Claire', studentLastName: 'Diallo', program: 'Informatique', subject: 'Dev Web', date: '2025-01-08', status: 'Retard', comment: '10 min' },
  { id: '15', studentId: '8', studentFirstName: 'Yves', studentLastName: "N'Guessan", program: 'Informatique', subject: 'Algorithmique', date: '2025-01-09', status: 'Présent', comment: '' },
  { id: '16', studentId: '2', studentFirstName: 'Jean-Baptiste', studentLastName: 'Yao', program: 'Gestion', subject: 'Droit', date: '2025-01-09', status: 'Présent', comment: '' },
  { id: '17', studentId: '6', studentFirstName: 'Emmanuel', studentLastName: 'Aka', program: 'Gestion', subject: 'Compta Générale', date: '2025-01-09', status: 'Absent', comment: 'Non justifié' },
  { id: '18', studentId: '9', studentFirstName: 'Adama', studentLastName: 'Ouattara', program: 'Comptabilité', subject: 'Compta OHADA', date: '2025-01-09', status: 'Présent', comment: '' },
  { id: '19', studentId: '10', studentFirstName: 'Sitan', studentLastName: 'Cissé', program: 'Gestion', subject: 'Droit', date: '2025-01-10', status: 'Présent', comment: '' },
  { id: '20', studentId: '7', studentFirstName: 'Aïssatou', studentLastName: 'Touré', program: 'Marketing', subject: 'Communication', date: '2025-01-10', status: 'Absent', comment: 'Malade' },
  { id: '21', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', subject: 'Base de Données', date: '2025-01-10', status: 'Présent', comment: '' },
  { id: '22', studentId: '3', studentFirstName: 'Fatoumata', studentLastName: 'Coulibaly', program: 'Marketing', subject: 'Marketing Digital', date: '2025-01-10', status: 'Retard', comment: '' },
  { id: '23', studentId: '4', studentFirstName: 'Kouamé', studentLastName: 'Brou', program: 'Comptabilité', subject: 'Compta Générale', date: '2025-01-13', status: 'Absent', comment: 'Non justifié' },
];

const classStudents = [
  { id: '1', firstName: 'Aminata', lastName: 'Koné' },
  { id: '2', firstName: 'Jean-Baptiste', lastName: 'Yao' },
  { id: '3', firstName: 'Fatoumata', lastName: 'Coulibaly' },
  { id: '4', firstName: 'Kouamé', lastName: 'Brou' },
  { id: '5', firstName: 'Marie-Claire', lastName: 'Diallo' },
  { id: '6', firstName: 'Emmanuel', lastName: 'Aka' },
  { id: '7', firstName: 'Aïssatou', lastName: 'Touré' },
  { id: '8', firstName: 'Yves', lastName: "N'Guessan" },
  { id: '9', firstName: 'Adama', lastName: 'Ouattara' },
  { id: '10', firstName: 'Sitan', lastName: 'Cissé' },
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function getStatusBadge(status: AttendanceStatus) {
  switch (status) {
    case 'Présent':
      return <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]">Présent</Badge>;
    case 'Absent':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Absent</Badge>;
    case 'Retard':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Retard</Badge>;
    case 'Excusé':
      return <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100">Excusé</Badge>;
  }
}

function getStatusIcon(status: AttendanceStatus) {
  switch (status) {
    case 'Présent': return <CheckCircle2 className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />;
    case 'Absent': return <XCircle className="h-5 w-5 text-red-500" />;
    case 'Retard': return <Clock className="h-5 w-5 text-amber-500" />;
    case 'Excusé': return <AlertTriangle className="h-5 w-5 text-sky-500" />;
  }
}

export function AttendanceSection() {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [markClass, setMarkClass] = useState('Informatique');
  const [markSubject, setMarkSubject] = useState('Algorithmique');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});

  const globalRate = useMemo(() => {
    const total = mockAttendance.length;
    const present = mockAttendance.filter((r) => r.status === 'Présent' || r.status === 'Excusé').length;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, []);

  const rateByProgram = useMemo(() => {
    const rates: Record<string, { total: number; present: number }> = {};
    mockAttendance.forEach((r) => {
      if (!rates[r.program]) rates[r.program] = { total: 0, present: 0 };
      rates[r.program].total++;
      if (r.status === 'Présent' || r.status === 'Excusé') rates[r.program].present++;
    });
    return Object.entries(rates).map(([prog, data]) => ({
      program: prog,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      total: data.total,
    }));
  }, []);

  const rateBySubject = useMemo(() => {
    const rates: Record<string, { total: number; present: number }> = {};
    mockAttendance.forEach((r) => {
      if (!rates[r.subject]) rates[r.subject] = { total: 0, present: 0 };
      rates[r.subject].total++;
      if (r.status === 'Présent' || r.status === 'Excusé') rates[r.subject].present++;
    });
    return Object.entries(rates).map(([subj, data]) => ({
      subject: subj,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    })).sort((a, b) => b.rate - a.rate);
  }, []);

  const absenceReport = useMemo(() => {
    const counts: Record<string, { name: string; program: string; count: number }> = {};
    mockAttendance.forEach((r) => {
      if (r.status === 'Absent') {
        if (!counts[r.studentId]) {
          counts[r.studentId] = { name: `${r.studentLastName} ${r.studentFirstName}`, program: r.program, count: 0 };
        }
        counts[r.studentId].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, []);

  const filteredHistory = useMemo(() => {
    return mockAttendance.filter((r) => {
      const matchSearch = `${r.studentFirstName} ${r.studentLastName}`.toLowerCase().includes(search.toLowerCase());
      const matchClass = selectedClass === 'all' || r.program === selectedClass;
      const matchSubject = selectedSubject === 'all' || r.subject === selectedSubject;
      return matchSearch && matchClass && matchSubject;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search, selectedClass, selectedSubject]);

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="space-y-6">
      {/* Attendance rate cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-[oklch(0.35_0.08_155)]" />
              <span className="text-xs text-muted-foreground">Taux global d'assiduité</span>
            </div>
            <div className={`text-3xl font-bold ${globalRate >= 80 ? 'text-[oklch(0.35_0.08_155)]' : globalRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {globalRate}%
            </div>
            <Progress value={globalRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Par programme
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {rateByProgram.map((r) => (
              <div key={r.program} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{r.program}</span>
                  <span className={r.rate >= 80 ? 'text-[oklch(0.35_0.08_155)]' : r.rate >= 60 ? 'text-amber-600' : 'text-red-600'}>{r.rate}%</span>
                </div>
                <Progress value={r.rate} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Par matière
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {rateBySubject.slice(0, 5).map((r) => (
              <div key={r.subject} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate mr-2">{r.subject}</span>
                  <span className={r.rate >= 80 ? 'text-[oklch(0.35_0.08_155)]' : r.rate >= 60 ? 'text-amber-600' : 'text-red-600'}>{r.rate}%</span>
                </div>
                <Progress value={r.rate} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="mark">Marquer la présence</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="report">Rapport d'absences</TabsTrigger>
        </TabsList>

        {/* Mark attendance */}
        <TabsContent value="mark" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Appel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-1">
                  <Label>Classe</Label>
                  <Select value={markClass} onValueChange={setMarkClass}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Matière</Label>
                  <Select value={markSubject} onValueChange={setMarkSubject}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} className="w-full sm:w-[160px]" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{student.lastName} {student.firstName}</div>
                    </div>
                    <div className="flex gap-1">
                      {(['Présent', 'Absent', 'Retard', 'Excusé'] as AttendanceStatus[]).map((status) => {
                        const isActive = attendanceState[student.id] === status;
                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className={`h-8 px-2 text-xs ${
                              isActive ? '' : ''
                            } ${
                              status === 'Présent' ? (isActive ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-primary/5') :
                              status === 'Absent' ? (isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-red-600 border-red-200 hover:bg-red-50') :
                              status === 'Retard' ? (isActive ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-amber-600 border-amber-200 hover:bg-amber-50') :
                              (isActive ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'text-sky-600 border-sky-200 hover:bg-sky-50')
                            }`}
                            onClick={() => handleMarkAttendance(student.id, status)}
                          >
                            {status === 'Présent' ? 'P' : status === 'Absent' ? 'A' : status === 'Retard' ? 'R' : 'E'}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Enregistrer l'appel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance history */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
              <Input
                placeholder="Rechercher un étudiant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Matière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden md:table-cell">Matière</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden sm:table-cell">Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucun enregistrement trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {new Date(record.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className="text-sm font-medium">{record.studentLastName} {record.studentFirstName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{record.subject}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{record.comment || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Absence report */}
        <TabsContent value="report" className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Rapport des absences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Rang</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead className="hidden sm:table-cell">Programme</TableHead>
                      <TableHead>Absences</TableHead>
                      <TableHead>Sévérité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absenceReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Aucune absence enregistrée.
                        </TableCell>
                      </TableRow>
                    ) : (
                      absenceReport.map((entry, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              entry.count >= 4 ? 'bg-red-100 text-red-700' :
                              entry.count >= 2 ? 'bg-amber-100 text-amber-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{entry.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{entry.program}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={entry.count >= 4 ? 'text-red-600 border-red-200' : entry.count >= 2 ? 'text-amber-600 border-amber-200' : ''}>
                              {entry.count} absence{entry.count > 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              entry.count >= 4 ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' :
                              entry.count >= 2 ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' :
                              'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }>
                              {entry.count >= 4 ? 'Critique' : entry.count >= 2 ? 'Attention' : 'Normal'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
