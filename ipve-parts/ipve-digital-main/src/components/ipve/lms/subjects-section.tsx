'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Subject {
  id: string;
  code: string;
  name: string;
  program: string;
  level: string;
  coefficient: number;
  creditHours: number;
  teacher: string;
  enrolledStudents: number;
}

const programs = ['Informatique', 'Gestion', 'Marketing', 'Comptabilité'];
const levels = ['Licence 1', 'Licence 2', 'Licence 3'];
const teachers = [
  'M. Konan Pascal',
  'Mme Tra Béatrice',
  'M. Bamba Moussa',
  'Mme Diop Aïda',
  'M. Coulibaly Drissa',
  'Mme Yao Akissi',
  "M. N'Guessan Aimé",
];

const mockSubjects: Subject[] = [
  { id: '1', code: 'ALG101', name: 'Algorithmique', program: 'Informatique', level: 'Licence 1', coefficient: 4, creditHours: 60, teacher: 'M. Konan Pascal', enrolledStudents: 8 },
  { id: '2', code: 'BDD102', name: 'Base de Données', program: 'Informatique', level: 'Licence 2', coefficient: 3, creditHours: 45, teacher: 'Mme Tra Béatrice', enrolledStudents: 5 },
  { id: '3', code: 'DEV103', name: 'Développement Web', program: 'Informatique', level: 'Licence 1', coefficient: 3, creditHours: 50, teacher: "M. N'Guessan Aimé", enrolledStudents: 8 },
  { id: '4', code: 'RES104', name: 'Réseaux Informatiques', program: 'Informatique', level: 'Licence 2', coefficient: 3, creditHours: 45, teacher: 'M. Konan Pascal', enrolledStudents: 5 },
  { id: '5', code: 'CGE201', name: 'Comptabilité Générale', program: 'Gestion', level: 'Licence 1', coefficient: 4, creditHours: 60, teacher: 'M. Bamba Moussa', enrolledStudents: 6 },
  { id: '6', code: 'DRO202', name: 'Droit des Affaires', program: 'Gestion', level: 'Licence 2', coefficient: 3, creditHours: 45, teacher: 'Mme Diop Aïda', enrolledStudents: 4 },
  { id: '7', code: 'MKT203', name: 'Marketing', program: 'Gestion', level: 'Licence 3', coefficient: 3, creditHours: 45, teacher: 'M. Coulibaly Drissa', enrolledStudents: 3 },
  { id: '8', code: 'MDI301', name: 'Marketing Digital', program: 'Marketing', level: 'Licence 1', coefficient: 4, creditHours: 60, teacher: 'M. Coulibaly Drissa', enrolledStudents: 4 },
  { id: '9', code: 'COM302', name: 'Communication', program: 'Marketing', level: 'Licence 1', coefficient: 3, creditHours: 45, teacher: 'Mme Yao Akissi', enrolledStudents: 4 },
  { id: '10', code: 'COH401', name: 'Compta OHADA', program: 'Comptabilité', level: 'Licence 2', coefficient: 4, creditHours: 60, teacher: 'M. Bamba Moussa', enrolledStudents: 5 },
  { id: '11', code: 'FIS402', name: 'Fiscalité', program: 'Comptabilité', level: 'Licence 3', coefficient: 3, creditHours: 45, teacher: 'Mme Diop Aïda', enrolledStudents: 3 },
  { id: '12', code: 'ANG105', name: 'Anglais', program: 'Informatique', level: 'Licence 1', coefficient: 2, creditHours: 30, teacher: 'Mme Yao Akissi', enrolledStudents: 8 },
];

const programBadgeColors: Record<string, string> = {
  'Informatique': 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  'Gestion': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  'Marketing': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
  'Comptabilité': 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]',
};

export function SubjectsSection() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    program: 'Informatique',
    level: 'Licence 1',
    coefficient: '3',
    creditHours: '45',
    teacher: 'M. Konan Pascal',
  });

  const filteredSubjects = useMemo(() => {
    return mockSubjects.filter((s) => {
      const matchSearch = `${s.code} ${s.name}`.toLowerCase().includes(search.toLowerCase());
      const matchProgram = programFilter === 'all' || s.program === programFilter;
      const matchLevel = levelFilter === 'all' || s.level === levelFilter;
      const matchTeacher = teacherFilter === 'all' || s.teacher === teacherFilter;
      return matchSearch && matchProgram && matchLevel && matchTeacher;
    });
  }, [search, programFilter, levelFilter, teacherFilter]);

  const handleEdit = (subject: Subject) => {
    setEditSubject(subject);
    setForm({
      code: subject.code,
      name: subject.name,
      program: subject.program,
      level: subject.level,
      coefficient: String(subject.coefficient),
      creditHours: String(subject.creditHours),
      teacher: subject.teacher,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditSubject(null);
    setForm({
      code: '',
      name: '',
      program: 'Informatique',
      level: 'Licence 1',
      coefficient: '3',
      creditHours: '45',
      teacher: 'M. Konan Pascal',
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
            placeholder="Rechercher par code ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
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
        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Enseignant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {teachers.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {filteredSubjects.length} matière{filteredSubjects.length > 1 ? 's' : ''} trouvée{filteredSubjects.length > 1 ? 's' : ''}
      </div>

      {/* Subjects table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Programme</TableHead>
                  <TableHead className="hidden sm:table-cell">Niveau</TableHead>
                  <TableHead className="hidden lg:table-cell">Coeff.</TableHead>
                  <TableHead className="hidden lg:table-cell">Heures</TableHead>
                  <TableHead className="hidden md:table-cell">Enseignant</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Aucune matière trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((subject) => {
                    const isExpanded = expandedSubject === subject.id;
                    return (
                      <Fragment key={subject.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{subject.code}</TableCell>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={programBadgeColors[subject.program] || ''}>
                              {subject.program}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{subject.level}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{subject.coefficient}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{subject.creditHours}h</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{subject.teacher}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(subject);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30 px-6 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Étudiants inscrits</div>
                                    <div className="font-semibold">{subject.enrolledStudents}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Heures de crédit</div>
                                    <div className="font-semibold">{subject.creditHours}h</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Programme</div>
                                  <Badge className={programBadgeColors[subject.program] || ''}>
                                    {subject.program} — {subject.level}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit subject dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSubject ? 'Modifier la matière' : 'Nouvelle matière'}</DialogTitle>
            <DialogDescription>
              {editSubject ? 'Modifiez les informations de la matière.' : 'Ajoutez une nouvelle matière au programme.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ex: ALG101"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom de la matière</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Algorithmique"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Programme</Label>
                <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Heures de crédit</Label>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  value={form.creditHours}
                  onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Select value={form.teacher} onValueChange={(v) => setForm({ ...form, teacher: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
