'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Textarea } from '@/components/ui/textarea';

interface ProgramSubject {
  code: string;
  name: string;
  coefficient: number;
  creditHours: number;
}

interface Program {
  id: string;
  name: string;
  code: string;
  degree: string;
  duration: string;
  description: string;
  studentsEnrolled: number;
  levels: string[];
  subjects: ProgramSubject[];
}

const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Informatique',
    code: 'INFO-BTS',
    degree: 'BTS',
    duration: '2 ans',
    description: 'Formation en informatique couvrant la programmation, les bases de données, les réseaux et le développement web.',
    studentsEnrolled: 8,
    levels: ['Licence 1', 'Licence 2', 'Licence 3'],
    subjects: [
      { code: 'ALG101', name: 'Algorithmique', coefficient: 4, creditHours: 60 },
      { code: 'BDD102', name: 'Base de Données', coefficient: 3, creditHours: 45 },
      { code: 'DEV103', name: 'Développement Web', coefficient: 3, creditHours: 50 },
      { code: 'RES104', name: 'Réseaux Informatiques', coefficient: 3, creditHours: 45 },
      { code: 'ANG105', name: 'Anglais', coefficient: 2, creditHours: 30 },
    ],
  },
  {
    id: '2',
    name: 'Gestion',
    code: 'GEST-LIC',
    degree: 'Licence',
    duration: '3 ans',
    description: 'Formation en gestion des entreprises, comptabilité, droit et management.',
    studentsEnrolled: 6,
    levels: ['Licence 1', 'Licence 2', 'Licence 3'],
    subjects: [
      { code: 'CGE201', name: 'Comptabilité Générale', coefficient: 4, creditHours: 60 },
      { code: 'DRO202', name: 'Droit des Affaires', coefficient: 3, creditHours: 45 },
      { code: 'MKT203', name: 'Marketing', coefficient: 3, creditHours: 45 },
      { code: 'ANG204', name: 'Anglais', coefficient: 2, creditHours: 30 },
      { code: 'COM205', name: 'Communication', coefficient: 2, creditHours: 30 },
    ],
  },
  {
    id: '3',
    name: 'Marketing',
    code: 'MKT-LIC',
    degree: 'Licence',
    duration: '3 ans',
    description: 'Formation spécialisée en marketing digital, communication et stratégie commerciale.',
    studentsEnrolled: 4,
    levels: ['Licence 1', 'Licence 2', 'Licence 3'],
    subjects: [
      { code: 'MDI301', name: 'Marketing Digital', coefficient: 4, creditHours: 60 },
      { code: 'COM302', name: 'Communication', coefficient: 3, creditHours: 45 },
      { code: 'MKT303', name: 'Stratégie Marketing', coefficient: 3, creditHours: 45 },
      { code: 'GPA304', name: 'Gestion de Projet', coefficient: 2, creditHours: 30 },
      { code: 'ANG305', name: 'Anglais', coefficient: 2, creditHours: 30 },
    ],
  },
  {
    id: '4',
    name: 'Comptabilité',
    code: 'CPT-BTS',
    degree: 'BTS',
    duration: '2 ans',
    description: 'Formation en comptabilité générale et analytique, fiscalité et normes OHADA.',
    studentsEnrolled: 5,
    levels: ['Licence 1', 'Licence 2', 'Licence 3'],
    subjects: [
      { code: 'CGE401', name: 'Comptabilité Générale', coefficient: 4, creditHours: 60 },
      { code: 'COH402', name: 'Compta OHADA', coefficient: 4, creditHours: 60 },
      { code: 'FIS403', name: 'Fiscalité', coefficient: 3, creditHours: 45 },
      { code: 'ANG404', name: 'Anglais', coefficient: 2, creditHours: 30 },
      { code: 'DRO405', name: 'Droit des Affaires', coefficient: 3, creditHours: 45 },
    ],
  },
];

const degreeBadgeColors: Record<string, string> = {
  'BTS': 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  'Licence': 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]',
  'Master': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
};

export function ProgramsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    degree: 'BTS',
    duration: '2 ans',
    description: '',
  });

  const handleEdit = (program: Program) => {
    setEditProgram(program);
    setForm({
      name: program.name,
      code: program.code,
      degree: program.degree,
      duration: program.duration,
      description: program.description,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditProgram(null);
    setForm({ name: '', code: '', degree: 'BTS', duration: '2 ans', description: '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  const toggleExpand = (programId: string) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau programme</span>
        </Button>
      </div>

      {/* Program cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockPrograms.map((program) => {
          const isExpanded = expandedProgram === program.id;
          return (
            <Card key={program.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{program.name}</CardTitle>
                      <Badge className={degreeBadgeColors[program.degree] || ''}>{program.degree}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{program.code}</span>
                      <span>•</span>
                      <span>{program.duration}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(program)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{program.description}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{program.studentsEnrolled} étudiants</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{program.levels.length} niveaux</span>
                  </div>
                </div>

                {/* Levels */}
                <div className="flex flex-wrap gap-1.5">
                  {program.levels.map((level) => (
                    <Badge key={level} variant="outline" className="text-xs">{level}</Badge>
                  ))}
                </div>

                <Separator />

                {/* Expandable subjects */}
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                  onClick={() => toggleExpand(program.id)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="flex-1">{program.subjects.length} matière{program.subjects.length > 1 ? 's' : ''}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="space-y-2 pl-1">
                    {program.subjects.map((subject) => (
                      <div key={subject.code} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-xs text-muted-foreground">{subject.code}</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-foreground">Coeff. {subject.coefficient}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {subject.creditHours}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit program dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProgram ? 'Modifier le programme' : 'Nouveau programme'}</DialogTitle>
            <DialogDescription>
              {editProgram ? 'Modifiez les informations du programme.' : 'Créez un nouveau programme de formation.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du programme</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Informatique"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ex: INFO-BTS"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diplôme</Label>
                <Select value={form.degree} onValueChange={(v) => setForm({ ...form, degree: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTS">BTS</SelectItem>
                    <SelectItem value="Licence">Licence</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durée</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 an">1 an</SelectItem>
                    <SelectItem value="2 ans">2 ans</SelectItem>
                    <SelectItem value="3 ans">3 ans</SelectItem>
                    <SelectItem value="4 ans">4 ans</SelectItem>
                    <SelectItem value="5 ans">5 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description du programme..."
                rows={3}
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
