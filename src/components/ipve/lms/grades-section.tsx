'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Trophy,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type ExamType = 'Devoir' | 'Interrogation' | 'Examen';
type Period = 'Semestre 1' | 'Semestre 2';

interface GradeRecord {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  program: string;
  level: string;
  subject: string;
  examType: ExamType;
  score: number;
  coefficient: number;
  period: Period;
}

const programs = ['Informatique', 'Gestion', 'Marketing', 'Comptabilité'];
const levels = ['Licence 1', 'Licence 2', 'Licence 3'];
const subjects = [
  'Algorithmique', 'Base de Données', 'Compta Générale', 'Droit',
  'Marketing Digital', 'Communication', 'Compta OHADA', 'Dev Web',
  'Réseaux', 'Anglais',
];
const examTypes: ExamType[] = ['Devoir', 'Interrogation', 'Examen'];
const periods: Period[] = ['Semestre 1', 'Semestre 2'];

const mockGrades: GradeRecord[] = [
  { id: '1', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', level: 'Licence 2', subject: 'Algorithmique', examType: 'Devoir', score: 16, coefficient: 3, period: 'Semestre 1' },
  { id: '2', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', level: 'Licence 2', subject: 'Base de Données', examType: 'Examen', score: 14.5, coefficient: 4, period: 'Semestre 1' },
  { id: '3', studentId: '2', studentFirstName: 'Jean-Baptiste', studentLastName: 'Yao', program: 'Gestion', level: 'Licence 3', subject: 'Compta Générale', examType: 'Devoir', score: 12, coefficient: 3, period: 'Semestre 1' },
  { id: '4', studentId: '2', studentFirstName: 'Jean-Baptiste', studentLastName: 'Yao', program: 'Gestion', level: 'Licence 3', subject: 'Droit', examType: 'Examen', score: 11, coefficient: 2, period: 'Semestre 1' },
  { id: '5', studentId: '3', studentFirstName: 'Fatoumata', studentLastName: 'Coulibaly', program: 'Marketing', level: 'Licence 1', subject: 'Marketing Digital', examType: 'Interrogation', score: 17, coefficient: 2, period: 'Semestre 1' },
  { id: '6', studentId: '4', studentFirstName: 'Kouamé', studentLastName: 'Brou', program: 'Comptabilité', level: 'Licence 3', subject: 'Compta OHADA', examType: 'Examen', score: 8.5, coefficient: 4, period: 'Semestre 1' },
  { id: '7', studentId: '5', studentFirstName: 'Marie-Claire', studentLastName: 'Diallo', program: 'Informatique', level: 'Licence 1', subject: 'Dev Web', examType: 'Devoir', score: 15, coefficient: 3, period: 'Semestre 1' },
  { id: '8', studentId: '8', studentFirstName: 'Yves', studentLastName: "N'Guessan", program: 'Informatique', level: 'Licence 3', subject: 'Réseaux', examType: 'Examen', score: 18, coefficient: 4, period: 'Semestre 1' },
  { id: '9', studentId: '9', studentFirstName: 'Adama', studentLastName: 'Ouattara', program: 'Comptabilité', level: 'Licence 2', subject: 'Compta Générale', examType: 'Devoir', score: 10, coefficient: 3, period: 'Semestre 1' },
  { id: '10', studentId: '10', studentFirstName: 'Sitan', studentLastName: 'Cissé', program: 'Gestion', level: 'Licence 1', subject: 'Droit', examType: 'Interrogation', score: 13.5, coefficient: 2, period: 'Semestre 1' },
  { id: '11', studentId: '7', studentFirstName: 'Aïssatou', studentLastName: 'Touré', program: 'Marketing', level: 'Licence 1', subject: 'Communication', examType: 'Devoir', score: 14, coefficient: 2, period: 'Semestre 1' },
  { id: '12', studentId: '3', studentFirstName: 'Fatoumata', studentLastName: 'Coulibaly', program: 'Marketing', level: 'Licence 1', subject: 'Marketing Digital', examType: 'Examen', score: 15.5, coefficient: 4, period: 'Semestre 1' },
  { id: '13', studentId: '5', studentFirstName: 'Marie-Claire', studentLastName: 'Diallo', program: 'Informatique', level: 'Licence 1', subject: 'Algorithmique', examType: 'Interrogation', score: 16.5, coefficient: 2, period: 'Semestre 1' },
  { id: '14', studentId: '1', studentFirstName: 'Aminata', studentLastName: 'Koné', program: 'Informatique', level: 'Licence 2', subject: 'Dev Web', examType: 'Examen', score: 17, coefficient: 4, period: 'Semestre 1' },
  { id: '15', studentId: '8', studentFirstName: 'Yves', studentLastName: "N'Guessan", program: 'Informatique', level: 'Licence 3', subject: 'Algorithmique', examType: 'Devoir', score: 19, coefficient: 3, period: 'Semestre 1' },
  { id: '16', studentId: '4', studentFirstName: 'Kouamé', studentLastName: 'Brou', program: 'Comptabilité', level: 'Licence 3', subject: 'Compta Générale', examType: 'Interrogation', score: 9, coefficient: 2, period: 'Semestre 1' },
  { id: '17', studentId: '6', studentFirstName: 'Emmanuel', studentLastName: 'Aka', program: 'Gestion', level: 'Licence 2', subject: 'Compta OHADA', examType: 'Devoir', score: 11.5, coefficient: 3, period: 'Semestre 1' },
  { id: '18', studentId: '10', studentFirstName: 'Sitan', studentLastName: 'Cissé', program: 'Gestion', level: 'Licence 1', subject: 'Marketing Digital', examType: 'Devoir', score: 12.5, coefficient: 2, period: 'Semestre 1' },
];

function getScoreColor(score: number) {
  if (score >= 14) return 'text-[oklch(0.35_0.08_155)] font-semibold';
  if (score >= 10) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const students = [
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

export function GradesSection() {
  const [programFilter, setProgramFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGrade, setEditGrade] = useState<GradeRecord | null>(null);

  const [form, setForm] = useState({
    studentId: '1',
    subject: 'Algorithmique',
    period: 'Semestre 1' as Period,
    examType: 'Devoir' as ExamType,
    score: '',
    coefficient: '3',
  });

  const filteredGrades = useMemo(() => {
    return mockGrades.filter((g) => {
      const matchSearch = `${g.studentFirstName} ${g.studentLastName}`.toLowerCase().includes(search.toLowerCase());
      const matchProgram = programFilter === 'all' || g.program === programFilter;
      const matchLevel = levelFilter === 'all' || g.level === levelFilter;
      const matchSubject = subjectFilter === 'all' || g.subject === subjectFilter;
      const matchPeriod = periodFilter === 'all' || g.period === periodFilter;
      const matchExam = examTypeFilter === 'all' || g.examType === examTypeFilter;
      return matchSearch && matchProgram && matchLevel && matchSubject && matchPeriod && matchExam;
    });
  }, [search, programFilter, levelFilter, subjectFilter, periodFilter, examTypeFilter]);

  const stats = useMemo(() => {
    if (filteredGrades.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0 };
    const scores = filteredGrades.map((g) => g.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 10).length;
    const passRate = (passCount / scores.length) * 100;
    return { avg, highest, lowest, passRate };
  }, [filteredGrades]);

  const rankings = useMemo(() => {
    const studentAverages: Record<string, { name: string; totalWeighted: number; totalCoeff: number }> = {};
    filteredGrades.forEach((g) => {
      const key = g.studentId;
      if (!studentAverages[key]) {
        studentAverages[key] = { name: `${g.studentLastName} ${g.studentFirstName}`, totalWeighted: 0, totalCoeff: 0 };
      }
      studentAverages[key].totalWeighted += g.score * g.coefficient;
      studentAverages[key].totalCoeff += g.coefficient;
    });
    return Object.entries(studentAverages)
      .map(([id, data]) => ({
        id,
        name: data.name,
        average: data.totalCoeff > 0 ? data.totalWeighted / data.totalCoeff : 0,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
  }, [filteredGrades]);

  const handleEdit = (grade: GradeRecord) => {
    setEditGrade(grade);
    setForm({
      studentId: grade.studentId,
      subject: grade.subject,
      period: grade.period,
      examType: grade.examType,
      score: String(grade.score),
      coefficient: String(grade.coefficient),
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditGrade(null);
    setForm({
      studentId: '1',
      subject: 'Algorithmique',
      period: 'Semestre 1',
      examType: 'Devoir',
      score: '',
      coefficient: '3',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Programme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Matière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Type examen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {examTypes.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Moyenne</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(stats.avg)}`}>
              {stats.avg.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">/20</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[oklch(0.35_0.08_155)]" />
              <span className="text-xs text-muted-foreground">Meilleure note</span>
            </div>
            <div className="text-2xl font-bold text-[oklch(0.35_0.08_155)]">
              {stats.highest.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">/20</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Plus basse</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowest.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">/20</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Taux de réussite</span>
            </div>
            <div className={`text-2xl font-bold ${stats.passRate >= 70 ? 'text-[oklch(0.35_0.08_155)]' : stats.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {stats.passRate.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Grades table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes des étudiants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead className="hidden md:table-cell">Matière</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="hidden sm:table-cell">Coeff.</TableHead>
                    <TableHead className="hidden md:table-cell">Pondérée</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucune note trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {getInitials(grade.studentFirstName, grade.studentLastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{grade.studentLastName} {grade.studentFirstName}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{grade.subject}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{grade.subject}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{grade.examType}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getScoreColor(grade.score)}>
                            {grade.score}/20
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{grade.coefficient}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className={getScoreColor(grade.score * grade.coefficient)}>
                            {(grade.score * grade.coefficient).toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(grade)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Class ranking panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Classement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun classement disponible.</p>
            ) : (
              rankings.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Moyenne pondérée
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getScoreColor(r.average)}`}>
                      {r.average.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">/20</div>
                  </div>
                  {i < 3 && <TrendingUp className="h-3.5 w-3.5 text-[oklch(0.35_0.08_155)]" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit grade dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editGrade ? 'Modifier la note' : 'Ajouter une note'}</DialogTitle>
            <DialogDescription>
              {editGrade ? 'Modifiez les informations de la note.' : 'Saisissez une nouvelle note pour un étudiant.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Étudiant</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.lastName} {s.firstName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matière</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Période</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as Period })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'examen</Label>
                <Select value={form.examType} onValueChange={(v) => setForm({ ...form, examType: v as ExamType })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coefficient</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.coefficient}
                  onChange={(e) => setForm({ ...form, coefficient: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note /20</Label>
              <Input
                type="number"
                min="0"
                max="20"
                step="0.5"
                placeholder="0 - 20"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
