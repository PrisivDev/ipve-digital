'use client';

import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type EnrollmentStatus = 'Confirmée' | 'En attente' | 'Annulée';

interface Enrollment {
  id: string;
  studentFirstName: string;
  studentLastName: string;
  program: string;
  level: string;
  academicYear: string;
  status: EnrollmentStatus;
  date: string;
}

const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    studentFirstName: 'Aminata',
    studentLastName: 'Koné',
    program: 'Informatique',
    level: 'Licence 2',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-10',
  },
  {
    id: '2',
    studentFirstName: 'Jean-Baptiste',
    studentLastName: 'Yao',
    program: 'Gestion',
    level: 'Licence 3',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-12',
  },
  {
    id: '3',
    studentFirstName: 'Fatoumata',
    studentLastName: 'Coulibaly',
    program: 'Marketing',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-10',
  },
  {
    id: '4',
    studentFirstName: 'Kouamé',
    studentLastName: 'Brou',
    program: 'Comptabilité',
    level: 'Licence 3',
    academicYear: '2024-2025',
    status: 'En attente',
    date: '2024-09-15',
  },
  {
    id: '5',
    studentFirstName: 'Marie-Claire',
    studentLastName: 'Diallo',
    program: 'Informatique',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-10',
  },
  {
    id: '6',
    studentFirstName: 'Emmanuel',
    studentLastName: 'Aka',
    program: 'Gestion',
    level: 'Licence 2',
    academicYear: '2024-2025',
    status: 'Annulée',
    date: '2024-09-15',
  },
  {
    id: '7',
    studentFirstName: 'Aïssatou',
    studentLastName: 'Touré',
    program: 'Marketing',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'En attente',
    date: '2024-09-10',
  },
  {
    id: '8',
    studentFirstName: 'Yves',
    studentLastName: 'N\'Guessan',
    program: 'Informatique',
    level: 'Licence 3',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-15',
  },
  {
    id: '9',
    studentFirstName: 'Adama',
    studentLastName: 'Ouattara',
    program: 'Comptabilité',
    level: 'Licence 2',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-15',
  },
  {
    id: '10',
    studentFirstName: 'Sitan',
    studentLastName: 'Cissé',
    program: 'Gestion',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-09-10',
  },
  {
    id: '11',
    studentFirstName: 'Djenaba',
    studentLastName: 'Traoré',
    program: 'Marketing',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-12-01',
  },
  {
    id: '12',
    studentFirstName: 'Seydou',
    studentLastName: 'Bamba',
    program: 'Gestion',
    level: 'Licence 1',
    academicYear: '2024-2025',
    status: 'Confirmée',
    date: '2024-11-25',
  },
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function getStatusBadge(status: EnrollmentStatus) {
  switch (status) {
    case 'Confirmée':
      return (
        <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)] gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Confirmée
        </Badge>
      );
    case 'En attente':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1">
          <Clock className="h-3 w-3" />
          En attente
        </Badge>
      );
    case 'Annulée':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
          <XCircle className="h-3 w-3" />
          Annulée
        </Badge>
      );
  }
}

const programColors: Record<string, string> = {
  Informatique: 'text-[oklch(0.35_0.08_155)] bg-primary/5 border-[oklch(0.85_0.03_155)]',
  Gestion: 'bg-amber-50 text-amber-700 border-amber-200',
  Marketing: 'bg-rose-50 text-rose-700 border-rose-200',
  Comptabilité: 'bg-violet-50 text-violet-700 border-violet-200',
};

export function EnrollmentsSection() {
  // Calculate statistics
  const totalEnrollments = mockEnrollments.length;
  const confirmedEnrollments = mockEnrollments.filter((e) => e.status === 'Confirmée').length;
  const pendingEnrollments = mockEnrollments.filter((e) => e.status === 'En attente').length;

  const programStats = mockEnrollments.reduce<Record<string, number>>((acc, e) => {
    acc[e.program] = (acc[e.program] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEnrollments}</p>
              <p className="text-xs text-muted-foreground">Total inscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedEnrollments}</p>
              <p className="text-xs text-muted-foreground">Confirmées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingEnrollments}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program breakdown */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Répartition par programme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(programStats).map(([program, count]) => (
            <Card key={program} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={`h-4 w-4 ${programColors[program]?.split(' ')[0] || ''}`} />
                  <span className="text-xs font-medium">{program}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((count / totalEnrollments) * 100)}%)
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      program === 'Informatique'
                        ? 'bg-primary/50'
                        : program === 'Gestion'
                          ? 'bg-amber-500'
                          : program === 'Marketing'
                            ? 'bg-rose-500'
                            : 'bg-violet-500'
                    }`}
                    style={{ width: `${(count / totalEnrollments) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enrollments table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Liste des inscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead className="hidden sm:table-cell">Niveau</TableHead>
                <TableHead className="hidden md:table-cell">Année académique</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(enrollment.studentFirstName, enrollment.studentLastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {enrollment.studentLastName} {enrollment.studentFirstName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${programColors[enrollment.program] || ''}`}>
                      {enrollment.program}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {enrollment.level}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {enrollment.academicYear}
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {new Date(enrollment.date).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
