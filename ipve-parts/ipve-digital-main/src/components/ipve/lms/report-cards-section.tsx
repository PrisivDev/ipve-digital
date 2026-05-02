'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Printer,
  Download,
  FileBarChart,
  GraduationCap,
  Award,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Period = 'Semestre 1' | 'Semestre 2' | 'Annuel';

interface StudentInfo {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  program: string;
  level: string;
  dateOfBirth: string;
  enrollDate: string;
  classAdvisor: string;
}

interface SubjectGrade {
  subject: string;
  coefficient: number;
  devoir: number;
  interro: number;
  examen: number;
  weightedAverage: number;
}

interface ReportCard {
  student: StudentInfo;
  period: Period;
  grades: SubjectGrade[];
  overallAverage: number;
  rank: number;
  classSize: number;
  appreciation: string;
}

const students: StudentInfo[] = [
  { id: '1', matricule: 'IPVE-2024-001', firstName: 'Aminata', lastName: 'Koné', program: 'Informatique', level: 'Licence 2', dateOfBirth: '2002-03-15', enrollDate: '2023-09-15', classAdvisor: 'M. Konan Pascal' },
  { id: '2', matricule: 'IPVE-2024-002', firstName: 'Jean-Baptiste', lastName: 'Yao', program: 'Gestion', level: 'Licence 3', dateOfBirth: '2001-07-22', enrollDate: '2022-09-12', classAdvisor: 'M. Bamba Moussa' },
  { id: '3', matricule: 'IPVE-2024-003', firstName: 'Fatoumata', lastName: 'Coulibaly', program: 'Marketing', level: 'Licence 1', dateOfBirth: '2003-01-10', enrollDate: '2024-09-10', classAdvisor: 'M. Coulibaly Drissa' },
  { id: '4', matricule: 'IPVE-2024-004', firstName: 'Kouamé', lastName: 'Brou', program: 'Comptabilité', level: 'Licence 3', dateOfBirth: '2000-11-30', enrollDate: '2022-09-12', classAdvisor: 'Mme Diop Aïda' },
  { id: '5', matricule: 'IPVE-2024-005', firstName: 'Marie-Claire', lastName: 'Diallo', program: 'Informatique', level: 'Licence 1', dateOfBirth: '2002-06-18', enrollDate: '2024-09-10', classAdvisor: 'M. Konan Pascal' },
  { id: '8', matricule: 'IPVE-2024-008', firstName: 'Yves', lastName: "N'Guessan", program: 'Informatique', level: 'Licence 3', dateOfBirth: '2000-12-25', enrollDate: '2022-09-12', classAdvisor: 'M. Konan Pascal' },
];

const mockReportCards: ReportCard[] = [
  {
    student: students[0],
    period: 'Semestre 1',
    grades: [
      { subject: 'Algorithmique', coefficient: 4, devoir: 15, interro: 16, examen: 17, weightedAverage: 16.00 },
      { subject: 'Base de Données', coefficient: 3, devoir: 13, interro: 14, examen: 16, weightedAverage: 14.33 },
      { subject: 'Développement Web', coefficient: 3, devoir: 16, interro: 15, examen: 18, weightedAverage: 16.33 },
      { subject: 'Réseaux Informatiques', coefficient: 3, devoir: 12, interro: 14, examen: 13, weightedAverage: 13.00 },
      { subject: 'Anglais', coefficient: 2, devoir: 14, interro: 15, examen: 16, weightedAverage: 15.00 },
    ],
    overallAverage: 15.08,
    rank: 2,
    classSize: 8,
    appreciation: 'Très bon travail, continuez ainsi !',
  },
  {
    student: students[1],
    period: 'Semestre 1',
    grades: [
      { subject: 'Comptabilité Générale', coefficient: 4, devoir: 11, interro: 12, examen: 13, weightedAverage: 12.00 },
      { subject: 'Droit des Affaires', coefficient: 3, devoir: 10, interro: 11, examen: 12, weightedAverage: 11.00 },
      { subject: 'Marketing', coefficient: 3, devoir: 13, interro: 12, examen: 14, weightedAverage: 13.00 },
      { subject: 'Anglais', coefficient: 2, devoir: 12, interro: 11, examen: 13, weightedAverage: 12.00 },
      { subject: 'Communication', coefficient: 2, devoir: 14, interro: 13, examen: 15, weightedAverage: 14.00 },
    ],
    overallAverage: 12.36,
    rank: 4,
    classSize: 6,
    appreciation: 'Peut mieux faire, plus d\'efforts nécessaires.',
  },
  {
    student: students[2],
    period: 'Semestre 1',
    grades: [
      { subject: 'Marketing Digital', coefficient: 4, devoir: 16, interro: 17, examen: 18, weightedAverage: 17.00 },
      { subject: 'Communication', coefficient: 3, devoir: 14, interro: 15, examen: 14, weightedAverage: 14.33 },
      { subject: 'Stratégie Marketing', coefficient: 3, devoir: 15, interro: 16, examen: 16, weightedAverage: 15.67 },
      { subject: 'Anglais', coefficient: 2, devoir: 13, interro: 14, examen: 15, weightedAverage: 14.00 },
    ],
    overallAverage: 15.42,
    rank: 1,
    classSize: 4,
    appreciation: 'Excellent travail, félicitations !',
  },
  {
    student: students[3],
    period: 'Semestre 1',
    grades: [
      { subject: 'Comptabilité Générale', coefficient: 4, devoir: 8, interro: 9, examen: 10, weightedAverage: 9.00 },
      { subject: 'Compta OHADA', coefficient: 4, devoir: 7, interro: 8, examen: 9, weightedAverage: 8.00 },
      { subject: 'Fiscalité', coefficient: 3, devoir: 9, interro: 10, examen: 8, weightedAverage: 9.00 },
      { subject: 'Anglais', coefficient: 2, devoir: 10, interro: 11, examen: 12, weightedAverage: 11.00 },
    ],
    overallAverage: 9.18,
    rank: 5,
    classSize: 5,
    appreciation: 'Résultats insuffisants, un rattrapage est nécessaire.',
  },
  {
    student: students[4],
    period: 'Semestre 1',
    grades: [
      { subject: 'Algorithmique', coefficient: 4, devoir: 15, interro: 16, examen: 17, weightedAverage: 16.00 },
      { subject: 'Développement Web', coefficient: 3, devoir: 14, interro: 15, examen: 16, weightedAverage: 15.00 },
      { subject: 'Anglais', coefficient: 2, devoir: 13, interro: 14, examen: 14, weightedAverage: 13.67 },
    ],
    overallAverage: 15.07,
    rank: 3,
    classSize: 8,
    appreciation: 'Bon travail, continuez sur cette lancée !',
  },
  {
    student: students[5],
    period: 'Semestre 1',
    grades: [
      { subject: 'Algorithmique', coefficient: 4, devoir: 18, interro: 19, examen: 19, weightedAverage: 18.67 },
      { subject: 'Base de Données', coefficient: 3, devoir: 17, interro: 18, examen: 18, weightedAverage: 17.67 },
      { subject: 'Développement Web', coefficient: 3, devoir: 16, interro: 17, examen: 17, weightedAverage: 16.67 },
      { subject: 'Réseaux Informatiques', coefficient: 3, devoir: 15, interro: 16, examen: 17, weightedAverage: 16.00 },
      { subject: 'Anglais', coefficient: 2, devoir: 14, interro: 15, examen: 16, weightedAverage: 15.00 },
    ],
    overallAverage: 16.93,
    rank: 1,
    classSize: 8,
    appreciation: 'Excellent travail ! Mention très bien.',
  },
];

const periods: Period[] = ['Semestre 1', 'Semestre 2', 'Annuel'];

function getScoreColor(score: number) {
  if (score >= 14) return 'text-[oklch(0.35_0.08_155)] font-semibold';
  if (score >= 10) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function getOverallColor(avg: number) {
  if (avg >= 16) return { bg: 'bg-primary/5', border: 'border-[oklch(0.85_0.03_155)]', text: 'text-[oklch(0.35_0.08_155)]', label: 'Excellent' };
  if (avg >= 14) return { bg: 'bg-primary/5', border: 'border-[oklch(0.85_0.03_155)]', text: 'text-[oklch(0.35_0.08_155)]', label: 'Très bien' };
  if (avg >= 12) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Bien' };
  if (avg >= 10) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Assez bien' };
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Insuffisant' };
}

export function ReportCardsSection() {
  const [selectedStudentId, setSelectedStudentId] = useState('1');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Semestre 1');
  const [search, setSearch] = useState('');

  const reportCard = useMemo(() => {
    return mockReportCards.find(
      (rc) => rc.student.id === selectedStudentId && rc.period === selectedPeriod
    ) || mockReportCards.find((rc) => rc.student.id === selectedStudentId) || null;
  }, [selectedStudentId, selectedPeriod]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const overallColors = reportCard ? getOverallColor(reportCard.overallAverage) : null;

  return (
    <div className="space-y-4">
      {/* Student and period selector */}
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
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Sélectionner un étudiant" />
          </SelectTrigger>
          <SelectContent>
            {filteredStudents.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.lastName} {s.firstName} ({s.matricule})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report card */}
      {reportCard ? (
        <Card className="border-border/50 shadow-sm print:shadow-none">
          <CardContent className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-[oklch(0.35_0.08_155)]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">IPVE</h3>
                  <p className="text-xs text-muted-foreground">Institut Polytechnique Vase d'Élites</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">Bulletin de notes</div>
                <Badge className="mt-1 bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]">
                  {reportCard.period}
                </Badge>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Student info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(reportCard.student.firstName, reportCard.student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{reportCard.student.lastName} {reportCard.student.firstName}</div>
                  <div className="text-xs text-muted-foreground">{reportCard.student.matricule}</div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Programme :</span> <span className="font-medium">{reportCard.student.program}</span></div>
                <div><span className="text-muted-foreground">Niveau :</span> <span className="font-medium">{reportCard.student.level}</span></div>
                <div><span className="text-muted-foreground">Prof. principal :</span> <span className="font-medium">{reportCard.student.classAdvisor}</span></div>
              </div>
            </div>

            {/* Grades table */}
            <div className="rounded-lg border overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Matière</TableHead>
                    <TableHead className="text-center font-semibold">Coeff.</TableHead>
                    <TableHead className="text-center font-semibold hidden sm:table-cell">Devoir</TableHead>
                    <TableHead className="text-center font-semibold hidden sm:table-cell">Interro</TableHead>
                    <TableHead className="text-center font-semibold">Examen</TableHead>
                    <TableHead className="text-center font-semibold">Moy. pond.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCard.grades.map((grade) => (
                    <TableRow key={grade.subject}>
                      <TableCell className="font-medium text-sm">{grade.subject}</TableCell>
                      <TableCell className="text-center text-sm">{grade.coefficient}</TableCell>
                      <TableCell className={`text-center hidden sm:table-cell ${getScoreColor(grade.devoir)}`}>
                        {grade.devoir}
                      </TableCell>
                      <TableCell className={`text-center hidden sm:table-cell ${getScoreColor(grade.interro)}`}>
                        {grade.interro}
                      </TableCell>
                      <TableCell className={`text-center ${getScoreColor(grade.examen)}`}>
                        {grade.examen}
                      </TableCell>
                      <TableCell className={`text-center ${getScoreColor(grade.weightedAverage)}`}>
                        {grade.weightedAverage.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`rounded-lg border-2 p-4 text-center ${overallColors?.bg} ${overallColors?.border}`}>
                <div className="text-xs text-muted-foreground mb-1">Moyenne générale</div>
                <div className={`text-3xl font-bold ${overallColors?.text}`}>
                  {reportCard.overallAverage.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">/20</div>
              </div>
              <div className="rounded-lg border-2 p-4 text-center bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Rang dans la classe</div>
                <div className="text-3xl font-bold text-foreground">
                  {reportCard.rank}<span className="text-base text-muted-foreground">/{reportCard.classSize}</span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">
                    {reportCard.rank === 1 ? 'Major de la classe' : reportCard.rank <= 3 ? 'Excellent' : 'Bon classement'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border-2 p-4 text-center bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Appréciation</div>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Star className={`h-4 w-4 ${overallColors?.text}`} />
                  <span className={`text-sm font-semibold ${overallColors?.text}`}>
                    {reportCard.appreciation}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Footer with signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Professeur principal</div>
                <div className="text-xs text-muted-foreground">{reportCard.student.classAdvisor}</div>
                <div className="mt-8 border-b border-dashed border-muted-foreground/30 w-40 mx-auto" />
                <div className="text-xs text-muted-foreground mt-1">Date : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Directeur</div>
                <div className="text-xs text-muted-foreground">Dr. Konan Michel</div>
                <div className="mt-8 border-b border-dashed border-muted-foreground/30 w-40 mx-auto" />
                <div className="text-xs text-muted-foreground mt-1">Cachet et signature</div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileBarChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Aucun bulletin disponible</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Aucun bulletin de notes n'a été généré pour cet étudiant et cette période.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
