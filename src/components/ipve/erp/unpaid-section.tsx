'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Users,
  Clock,
  Send,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// --- Types ---
interface UnpaidStudent {
  id: string;
  student: string;
  program: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  overdueDays: number;
  lastReminder: string;
  phone: string;
}

// --- Mock Data ---
const mockUnpaid: UnpaidStudent[] = [
  { id: '1', student: 'Brou Kouamé', program: 'Comptabilité', totalFees: 350000, amountPaid: 150000, balance: 200000, overdueDays: 45, lastReminder: '2025-02-28', phone: '+225 07 98 12 45' },
  { id: '2', student: 'Aka Emmanuel', program: 'Gestion', totalFees: 300000, amountPaid: 150000, balance: 150000, overdueDays: 30, lastReminder: '2025-03-10', phone: '+225 01 23 45 67' },
  { id: '3', student: 'Ouattara Adama', program: 'Comptabilité', totalFees: 350000, amountPaid: 200000, balance: 150000, overdueDays: 22, lastReminder: '2025-03-05', phone: '+225 07 11 22 33' },
  { id: '4', student: 'Touré Aïssatou', program: 'Marketing', totalFees: 175000, amountPaid: 100000, balance: 75000, overdueDays: 15, lastReminder: '2025-03-08', phone: '+225 07 34 56 78' },
  { id: '5', student: 'Konaté Moussa', program: 'Informatique', totalFees: 350000, amountPaid: 175000, balance: 175000, overdueDays: 60, lastReminder: '2025-02-15', phone: '+225 05 44 33 22' },
  { id: '6', student: 'Bamba Koffi', program: 'Marketing', totalFees: 350000, amountPaid: 0, balance: 350000, overdueDays: 90, lastReminder: '2025-01-20', phone: '+225 01 66 77 88' },
  { id: '7', student: 'Diabaté Mariam', program: 'Comptabilité', totalFees: 175000, amountPaid: 100000, balance: 75000, overdueDays: 10, lastReminder: '2025-03-12', phone: '+225 05 22 11 00' },
  { id: '8', student: 'Traoré Awa', program: 'Gestion', totalFees: 350000, amountPaid: 150000, balance: 200000, overdueDays: 35, lastReminder: '2025-03-01', phone: '+225 07 99 88 77' },
  { id: '9', student: 'Diallo Fanta', program: 'Comptabilité', totalFees: 300000, amountPaid: 150000, balance: 150000, overdueDays: 50, lastReminder: '2025-02-20', phone: '+225 01 33 44 55' },
  { id: '10', student: 'Koné Brahima', program: 'Informatique', totalFees: 350000, amountPaid: 250000, balance: 100000, overdueDays: 8, lastReminder: '-', phone: '+225 05 55 66 77' },
];

const programs = ['Informatique', 'Gestion', 'Marketing', 'Comptabilité'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function getOverdueBadge(days: number) {
  if (days >= 60) {
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">Critique</Badge>;
  }
  if (days >= 30) {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">Urgent</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 text-xs">En retard</Badge>;
}

export function UnpaidSection() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [overdueFilter, setOverdueFilter] = useState('all');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [bulkReminderOpen, setBulkReminderOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UnpaidStudent | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [markAmount, setMarkAmount] = useState('');

  const filteredUnpaid = useMemo(() => {
    return mockUnpaid.filter((u) => {
      const matchSearch = `${u.student} ${u.phone}`.toLowerCase().includes(search.toLowerCase());
      const matchProgram = programFilter === 'all' || u.program === programFilter;
      let matchOverdue = true;
      if (overdueFilter === 'critical') matchOverdue = u.overdueDays >= 60;
      else if (overdueFilter === 'urgent') matchOverdue = u.overdueDays >= 30 && u.overdueDays < 60;
      else if (overdueFilter === 'late') matchOverdue = u.overdueDays < 30;
      return matchSearch && matchProgram && matchOverdue;
    });
  }, [search, programFilter, overdueFilter]);

  // Summary
  const totalUnpaid = mockUnpaid.reduce((s, u) => s + u.balance, 0);
  const avgDelay = Math.round(mockUnpaid.reduce((s, u) => s + u.overdueDays, 0) / mockUnpaid.length);
  const criticalCount = mockUnpaid.filter((u) => u.overdueDays >= 60).length;

  const handleSendReminder = (student: UnpaidStudent) => {
    setSelectedStudent(student);
    setReminderMessage(`Bonjour ${student.student}, nous vous rappelons que vous avez un solde impayé de ${formatCurrency(student.balance)} pour le programme ${student.program}. Veuillez régulariser votre situation dans les plus brefs délais.`);
    setReminderOpen(true);
  };

  const handleMarkPaid = (student: UnpaidStudent) => {
    setSelectedStudent(student);
    setMarkAmount('');
    setMarkPaidOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montant total impayé</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(totalUnpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Étudiants avec impayés</p>
                <p className="text-lg font-bold text-amber-700">{mockUnpaid.length}</p>
                <p className="text-xs text-muted-foreground">{criticalCount} en situation critique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <Clock className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Retard moyen</p>
                <p className="text-lg font-bold text-orange-700">{avgDelay} jours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone..."
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
            <SelectItem value="all">Tous les programmes</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={overdueFilter} onValueChange={setOverdueFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Retard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les retards</SelectItem>
            <SelectItem value="critical">Critique (60j+)</SelectItem>
            <SelectItem value="urgent">Urgent (30-60j)</SelectItem>
            <SelectItem value="late">En retard (&lt;30j)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          onClick={() => {
            setBulkMessage(`Cher(e) étudiant(e), ceci est un rappel concernant vos frais de scolarité impayés. Veuillez régulariser votre situation dans les plus brefs délais pour éviter tout désagrément. Merci de votre compréhension.`);
            setBulkReminderOpen(true);
          }}
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Rappels groupés</span>
          <span className="sm:hidden">Rappels</span>
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        <Filter className="inline h-3.5 w-3.5 mr-1" />
        {filteredUnpaid.length} étudiant{filteredUnpaid.length > 1 ? 's' : ''} avec impayés
      </div>

      {/* Unpaid students table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Étudiant</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">Programme</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden lg:table-cell">Frais totaux</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden sm:table-cell">Payé</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Reste à payer</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Jours retard</TableHead>
                  <TableHead className="text-xs font-semibold hidden xl:table-cell">Dernier rappel</TableHead>
                  <TableHead className="text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnpaid.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun impayé trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnpaid.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-sm font-medium">{student.student}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{student.program}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-right whitespace-nowrap">{formatCurrency(student.totalFees)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-right whitespace-nowrap text-[oklch(0.35_0.08_155)]">{formatCurrency(student.amountPaid)}</TableCell>
                      <TableCell className="text-sm text-right font-semibold text-red-700 whitespace-nowrap">
                        {formatCurrency(student.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getOverdueBadge(student.overdueDays)}
                        <span className="block text-xs text-muted-foreground mt-0.5">{student.overdueDays}j</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {student.lastReminder === '-' ? '-' : new Date(student.lastReminder).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleSendReminder(student)}
                            title="Envoyer rappel"
                          >
                            <Send className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleMarkPaid(student)}
                            title="Marquer comme payé"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.35_0.08_155)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Individual reminder dialog */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-amber-600" />
                  Envoyer un rappel
                </DialogTitle>
                <DialogDescription>
                  Rappel à {selectedStudent.student} - {formatCurrency(selectedStudent.balance)} impayés
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <p className="text-sm"><span className="text-muted-foreground">Programme :</span> {selectedStudent.program}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Téléphone :</span> {selectedStudent.phone}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Retard :</span> {selectedStudent.overdueDays} jours</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderMsg">Message</Label>
                  <Textarea
                    id="reminderMsg"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReminderOpen(false)}>Annuler</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={() => setReminderOpen(false)}>
                  <Send className="h-4 w-4" />
                  Envoyer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk reminder dialog */}
      <Dialog open={bulkReminderOpen} onOpenChange={setBulkReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Rappels groupés
            </DialogTitle>
            <DialogDescription>
              Envoyer un rappel à {filteredUnpaid.length} étudiant{filteredUnpaid.length > 1 ? 's' : ''} avec impayés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkMsg">Message de rappel</Label>
              <Textarea
                id="bulkMsg"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Le message sera envoyé par SMS et/ou email à tous les étudiants sélectionnés ci-dessus.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkReminderOpen(false)}>Annuler</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={() => setBulkReminderOpen(false)}>
              <Send className="h-4 w-4" />
              Envoyer à tous ({filteredUnpaid.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as paid dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
                  Marquer comme payé
                </DialogTitle>
                <DialogDescription>
                  Enregistrer un paiement pour {selectedStudent.student}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reste à payer</span>
                    <span className="font-semibold text-red-700">{formatCurrency(selectedStudent.balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Programme</span>
                    <span>{selectedStudent.program}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="markAmount">Montant du paiement (FCFA)</Label>
                  <Input
                    id="markAmount"
                    type="number"
                    value={markAmount}
                    onChange={(e) => setMarkAmount(e.target.value)}
                    placeholder={selectedStudent.balance.toString()}
                    max={selectedStudent.balance}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>Annuler</Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setMarkPaidOpen(false)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Valider
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
