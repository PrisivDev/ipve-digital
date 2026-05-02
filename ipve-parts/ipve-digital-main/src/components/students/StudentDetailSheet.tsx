'use client';

import { useState } from 'react';

import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Globe,
  Baby,
  GraduationCap,
  BookOpen,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileBadge,
  ClipboardList,
  IdCard,
  History,
  CircleDot,
  Loader2,
  Pencil,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useStudent,
  useStudentFinancialSummary,
  useStudentGrades,
  useStudentAttendance,
} from '@/hooks/useStudents';
import { useInstitutionSettings } from '@/hooks/useInstitutionSettings';
import { useStudentCards } from '@/hooks/useStudentCards';
import { DocumentEditorDialog, type DocumentType } from '@/components/documents/DocumentEditorDialog';
import { StudentCardPrint } from '@/components/documents/StudentCardPrint';

// ─── helpers ───────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[100px]">{label}</span>
      <span className="font-medium truncate">{value ?? '—'}</span>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

// ─── component ─────────────────────────────────────────────
interface StudentDetailSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailSheet({
  studentId,
  open,
  onOpenChange,
}: StudentDetailSheetProps) {
  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: financial, isLoading: financialLoading } =
    useStudentFinancialSummary(studentId);
  const { data: grades, isLoading: gradesLoading } = useStudentGrades(
    studentId
  );
  const { data: attendance, isLoading: attendanceLoading } =
    useStudentAttendance(studentId);
  const { data: institutionSettings } = useInstitutionSettings();
  const { data: studentCardsData } = useStudentCards(
    studentId ? { studentId, limit: 1 } : { limit: 0 }
  );

  // Get the active student card if any
  const studentCardData = studentCardsData?.data?.[0] ?? null;

  const [documentDialog, setDocumentDialog] = useState<DocumentType | null>(null);

  const s = student?.data ?? student;
  const f = financial?.data ?? financial;
  const g = grades?.data ?? grades;
  const a = attendance?.data ?? attendance;

  const initials = s
    ? `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase()
    : '??';
  const isFemale = s?.gender === 'FEMALE' || s?.gender === 'F';

  // Attendance percentage for circular gauge
  const attendanceRate = a?.rate ?? a?.percentage ?? 0;
  const attendanceBreakdown = a?.breakdown ?? {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  };
  const attendanceRecords = a?.records ?? [];

  // Mock timeline data
  const timeline = [
    {
      date: s?.createdAt ?? new Date().toISOString(),
      label: 'Inscription creee',
      icon: CircleDot,
      color: 'text-emerald-500',
    },
    {
      date: s?.enrollmentDate ?? null,
      label: 'Enrollment confirme',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-0 border-b shrink-0">
          {studentLoading ? (
            <>
              <SheetTitle className="sr-only">Chargement...</SheetTitle>
              <SheetDescription className="sr-only">Chargement du profil etudiant</SheetDescription>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </>
          ) : s ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback
                  className={`text-sm font-semibold ${
                    isFemale
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base truncate">
                  {s.lastName} {s.firstName}
                </SheetTitle>
                <SheetDescription className="text-xs font-mono">
                  {s.studentNumber}
                </SheetDescription>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <StatusBadge status={s.status} />
              </div>
            </div>
          ) : (
            <>
              <SheetTitle className="sr-only">Aucun etudiant selectionne</SheetTitle>
              <SheetDescription className="sr-only">Selectionnez un etudiant pour voir ses details</SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="profil" className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-3 shrink-0">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="profil" className="text-xs">
                Profil
              </TabsTrigger>
              <TabsTrigger value="academique" className="text-xs">
                Academique
              </TabsTrigger>
              <TabsTrigger value="financier" className="text-xs">
                Financier
              </TabsTrigger>
              <TabsTrigger value="carte" className="text-xs">
                Carte
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">
                Documents
              </TabsTrigger>
              <TabsTrigger value="presences" className="text-xs">
                Presences
              </TabsTrigger>
              <TabsTrigger value="historique" className="text-xs">
                Historique
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              {/* ─── Profil ─── */}
              <TabsContent value="profil">
                {studentLoading ? (
                  <div className="space-y-4">
                    <TabSkeleton />
                    <TabSkeleton />
                  </div>
                ) : s ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoRow icon={User} label="Prenom" value={s.firstName} />
                      <InfoRow icon={User} label="Nom" value={s.lastName} />
                      <InfoRow
                        icon={Calendar}
                        label="Date de naiss."
                        value={
                          s.dateOfBirth
                            ? fmtDate(s.dateOfBirth)
                            : undefined
                        }
                      />
                      <InfoRow
                        icon={Baby}
                        label="Sexe"
                        value={
                          s.gender === 'MALE' || s.gender === 'M'
                            ? 'Masculin'
                            : s.gender === 'FEMALE' || s.gender === 'F'
                              ? 'Feminin'
                              : s.gender
                        }
                      />
                      <InfoRow
                        icon={Globe}
                        label="Nationalite"
                        value={s.nationality}
                      />
                      <InfoRow icon={MapPin} label="Adresse" value={s.address} />
                      <InfoRow icon={Phone} label="Telephone" value={s.phone} />
                      <InfoRow icon={Mail} label="Email" value={s.email} />
                    </div>

                    <Separator />

                    {/* Photo placeholder */}
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        <User className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Photo non renseignee</p>
                        <p className="mt-1">Cliquez pour ajouter une photo</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Contacts */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        Contacts d'urgence
                      </h4>
                      <div className="space-y-2 text-sm">
                        {s.parentName && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Parent :
                            </span>
                            <span className="font-medium">{s.parentName}</span>
                          </div>
                        )}
                        {s.parentPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Tel parent :
                            </span>
                            <span>{s.parentPhone}</span>
                          </div>
                        )}
                        {s.parentEmail && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Email parent :
                            </span>
                            <span>{s.parentEmail}</span>
                          </div>
                        )}
                        {s.emergencyContact && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Urgence :
                            </span>
                            <span>{s.emergencyContact}</span>
                          </div>
                        )}
                        {s.medicalNotes && (
                          <div className="mt-2 bg-amber-50 text-amber-800 p-2 rounded-md text-xs">
                            <strong>Notes medicales :</strong>{' '}
                            {s.medicalNotes}
                          </div>
                        )}
                        {!s.parentName &&
                          !s.parentPhone &&
                          !s.parentEmail &&
                          !s.emergencyContact && (
                            <p className="text-muted-foreground text-xs">
                              Aucun contact renseigne
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              {/* ─── Academique ─── */}
              <TabsContent value="academique">
                {studentLoading || gradesLoading ? (
                  <div className="space-y-4">
                    <TabSkeleton />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : s ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" /> Filiere
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {s.filiere?.name ?? s.filiereName ?? '—'}
                        </p>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Classe
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {s.class?.name ?? s.className ?? '—'}
                        </p>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Niveau
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {s.level?.name ?? s.levelName ?? '—'}
                        </p>
                      </Card>
                    </div>

                    <Separator />

                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Notes recentes
                    </h4>

                    {g && Array.isArray(g) && g.length > 0 ? (
                      <div className="rounded-md border overflow-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Matiere</TableHead>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs text-center">
                                Note
                              </TableHead>
                              <TableHead className="text-xs text-center">
                                Coeff.
                              </TableHead>
                              <TableHead className="text-xs text-right">
                                Note ponderee
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {g.slice(0, 10).map((gr: any, i: number) => (
                              <TableRow key={gr.id ?? i}>
                                <TableCell className="text-xs font-medium">
                                  {gr.subjectName ?? gr.subject?.name ?? '—'}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {gr.evaluationType ?? '—'}
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  <GradeBadge
                                    score={Number(gr.score ?? 0)}
                                    max={Number(gr.maxScore ?? 20)}
                                  />
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  {gr.coefficient ?? 1}
                                </TableCell>
                                <TableCell className="text-xs text-right font-medium">
                                  {(
                                    (Number(gr.score ?? 0) /
                                      Number(gr.maxScore ?? 20)) *
                                    20 *
                                    Number(gr.coefficient ?? 1)
                                  ).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune note enregistree pour le moment.
                      </p>
                    )}
                  </div>
                ) : null}
              </TabsContent>

              {/* ─── Financier ─── */}
              <TabsContent value="financier">
                {studentLoading || financialLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Total du
                        </div>
                        <p className="text-lg font-bold text-red-600">
                          {fmtCurrency(f?.totalDue ?? 0)}
                        </p>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Total paye
                        </div>
                        <p className="text-lg font-bold text-emerald-600">
                          {fmtCurrency(f?.totalPaid ?? 0)}
                        </p>
                      </Card>
                      <Card className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Restant
                        </div>
                        <p className="text-lg font-bold text-amber-600">
                          {fmtCurrency(
                            (f?.totalDue ?? 0) - (f?.totalPaid ?? 0)
                          )}
                        </p>
                      </Card>
                    </div>

                    <Separator />

                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" />
                      Tranches de paiement
                    </h4>

                    {f?.tranches && f.tranches.length > 0 ? (
                      <div className="rounded-md border overflow-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Tranche</TableHead>
                              <TableHead className="text-xs">Montant</TableHead>
                              <TableHead className="text-xs">Echeance</TableHead>
                              <TableHead className="text-xs text-right">
                                Statut
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {f.tranches.map((t: any, i: number) => (
                              <TableRow key={t.id ?? i}>
                                <TableCell className="text-xs font-medium">
                                  {t.name ?? `Tranche ${i + 1}`}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {fmtCurrency(t.amount ?? 0)}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {t.dueDate ? fmtDate(t.dueDate) : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-right">
                                  <TrancheStatusBadge status={t.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune tranche de paiement definie.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ─── Carte étudiante ─── */}
              <TabsContent value="carte">
                {studentLoading ? (
                  <div className="flex justify-center py-8">
                    <Skeleton className="h-[300px] w-[220px] rounded-xl" />
                  </div>
                ) : s ? (
                  <div className="space-y-4">
                    {/* Card Preview */}
                    <div className="flex justify-center">
                      <StudentCardPrint
                        student={{
                          firstName: s.firstName ?? '',
                          lastName: s.lastName ?? '',
                          studentNumber: s.studentNumber ?? '',
                          dateOfBirth: s.dateOfBirth ?? null,
                          gender: s.gender ?? null,
                          photoUrl: s.photoUrl ?? null,
                          filiereName: s.filiere?.name ?? s.filiereName ?? null,
                          levelName: s.level?.name ?? s.levelName ?? null,
                          className: s.class?.name ?? s.className ?? null,
                          enrollmentDate: s.enrollmentDate ?? null,
                        }}
                        status={studentCardData?.status ?? s.status}
                        cardNumber={studentCardData?.cardNumber}
                        institutionSettings={institutionSettings}
                        showPrintButton={false}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Carte d&apos;identité étudiante — {s.lastName} {s.firstName}
                    </p>

                    {/* Card actions */}
                    <div className="flex gap-2 justify-center">
                      <DocCard
                        icon={Pencil}
                        colorClass="text-[#1B4F72] bg-blue-50"
                        title="Modifier la carte"
                        desc="Éditer les informations et imprimer"
                        onClick={() => setDocumentDialog('carte-etudiant')}
                      />
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              {/* ─── Documents ─── */}
              <TabsContent value="documents">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocCard
                    icon={FileBadge}
                    colorClass="text-emerald-600 bg-emerald-50"
                    title="Attestation d'inscription"
                    desc="Document officiel d'inscription"
                    onClick={() => setDocumentDialog('attestation-inscription')}
                  />
                  <DocCard
                    icon={GraduationCap}
                    colorClass="text-blue-600 bg-blue-50"
                    title="Certificat de scolarite"
                    desc="Certificat en cours de scolarite"
                    onClick={() => setDocumentDialog('certificat-scolarite')}
                  />
                  <DocCard
                    icon={ClipboardList}
                    colorClass="text-purple-600 bg-purple-50"
                    title="Releve de notes"
                    desc="Releve detaille des notes"
                    onClick={() => setDocumentDialog('releve-notes')}
                  />
                  <DocCard
                    icon={Clock}
                    colorClass="text-amber-600 bg-amber-50"
                    title="Attestation de presence"
                    desc="Attestation de frequentation"
                    onClick={() => setDocumentDialog('attestation-presence')}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Cliquez sur un document pour modifier et imprimer.
                </p>
              </TabsContent>

              {/* ─── Presences ─── */}
              <TabsContent value="presences">
                {studentLoading || attendanceLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                    <TabSkeleton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Circular gauge */}
                    <div className="flex flex-col items-center">
                      <div className="relative h-32 w-32">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-full w-full -rotate-90"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            className="text-muted/30"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            className={
                              attendanceRate >= 80
                                ? 'text-emerald-500'
                                : attendanceRate >= 60
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(attendanceRate / 100) * 264} 264`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">
                            {Math.round(attendanceRate)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Taux
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="text-center p-2 rounded-md bg-emerald-50">
                        <p className="text-lg font-bold text-emerald-700">
                          {attendanceBreakdown.present ?? 0}
                        </p>
                        <p className="text-[10px] text-emerald-600">Presents</p>
                      </div>
                      <div className="text-center p-2 rounded-md bg-red-50">
                        <p className="text-lg font-bold text-red-700">
                          {attendanceBreakdown.absent ?? 0}
                        </p>
                        <p className="text-[10px] text-red-600">Absents</p>
                      </div>
                      <div className="text-center p-2 rounded-md bg-amber-50">
                        <p className="text-lg font-bold text-amber-700">
                          {attendanceBreakdown.late ?? 0}
                        </p>
                        <p className="text-[10px] text-amber-600">Retards</p>
                      </div>
                      <div className="text-center p-2 rounded-md bg-blue-50">
                        <p className="text-lg font-bold text-blue-700">
                          {attendanceBreakdown.excused ?? 0}
                        </p>
                        <p className="text-[10px] text-blue-600">Excuses</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Recent records */}
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Enregistrements recents
                    </h4>

                    {attendanceRecords.length > 0 ? (
                      <div className="rounded-md border overflow-auto max-h-48">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Matiere</TableHead>
                              <TableHead className="text-xs text-right">
                                Statut
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceRecords.slice(0, 10).map((r: any, i: number) => (
                              <TableRow key={r.id ?? i}>
                                <TableCell className="text-xs">
                                  {r.date ? fmtDate(r.date) : '—'}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {r.subjectName ??
                                    r.subject?.name ??
                                    '—'}
                                </TableCell>
                                <TableCell className="text-xs text-right">
                                  <AttendanceStatusBadge status={r.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun enregistrement de presence.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ─── Historique ─── */}
              <TabsContent value="historique">
                {studentLoading ? (
                  <div className="space-y-4">
                    <TabSkeleton />
                    <TabSkeleton />
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-6">
                      {timeline
                        .filter((t) => t.date)
                        .map((item, i) => (
                          <div key={i} className="relative flex gap-4">
                            <div
                              className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.color} bg-white border-2 border-current`}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {fmtDate(item.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                      L'historique des modifications sera complete lors de
                      l'integration avec l'API.
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>

      {/* ─── Document Editor Dialog ─── */}
      {documentDialog && s && (
        <DocumentEditorDialog
          open={true}
          onOpenChange={(open) => !open && setDocumentDialog(null)}
          documentType={documentDialog}
          initialData={{
            firstName: s.firstName ?? '',
            lastName: s.lastName ?? '',
            studentNumber: s.studentNumber ?? '',
            dateOfBirth: s.dateOfBirth ?? null,
            gender: s.gender ?? '',
            photoUrl: s.photoUrl ?? null,
            filiereName: s.filiere?.name ?? s.filiereName ?? null,
            levelName: s.level?.name ?? s.levelName ?? null,
            className: s.class?.name ?? s.className ?? null,
            enrollmentDate: s.enrollmentDate ?? null,
          }}
          grades={Array.isArray(g) ? g.map((gr: any) => ({
            subjectName: gr.subjectName ?? gr.subject?.name ?? '',
            evaluationType: gr.evaluationType ?? '',
            score: Number(gr.score ?? 0),
            maxScore: Number(gr.maxScore ?? 20),
            coefficient: Number(gr.coefficient ?? 1),
            periodName: gr.periodName ?? '',
          })) : undefined}
          attendance={a?.breakdown ? {
            totalSessions: a.breakdown.total ?? a.breakdown.present + a.breakdown.absent + a.breakdown.late ?? 0,
            present: a.breakdown.present ?? 0,
            absent: a.breakdown.absent ?? 0,
            late: a.breakdown.late ?? 0,
            rate: a.rate ?? a.percentage ?? 0,
          } : undefined}
          cardNumber={studentCardData?.cardNumber}
          cardStatus={studentCardData?.status ?? s.status}
        />
      )}
    </Sheet>
  );
}

// ─── sub-components ─────────────────────────────────────────

function DocCard({
  icon: Icon,
  colorClass,
  title,
  desc,
  onClick,
}: {
  icon: React.ElementType;
  colorClass: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Actif
        </Badge>
      );
    case 'ENROLLED':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Inscrit
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
          Suspendu
        </Badge>
      );
    case 'GRADUATED':
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Diplome
        </Badge>
      );
    case 'DROPPED':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Abandon
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function GradeBadge({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100;
  let cls =
    'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  if (pct >= 80)
    cls = 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  else if (pct >= 60)
    cls = 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
  else if (pct >= 50)
    cls = 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
  else
    cls = 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';

  return <Badge className={cls}>{score.toFixed(1)}/{max}</Badge>;
}

function TrancheStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'PAID':
    case 'paid':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Paye
        </Badge>
      );
    case 'PARTIAL':
    case 'partial':
    case 'PARTIALLY_PAID':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Partiel
        </Badge>
      );
    case 'OVERDUE':
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          En retard
        </Badge>
      );
    case 'PENDING':
    case 'pending':
    default:
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          En attente
        </Badge>
      );
  }
}

function AttendanceStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'PRESENT':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Present
        </Badge>
      );
    case 'ABSENT':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Absent
        </Badge>
      );
    case 'LATE':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Retard
        </Badge>
      );
    case 'EXCUSED':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Excuse
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
          Exclu
        </Badge>
      );
    default:
      return <Badge variant="outline">{status ?? '—'}</Badge>;
  }
}
