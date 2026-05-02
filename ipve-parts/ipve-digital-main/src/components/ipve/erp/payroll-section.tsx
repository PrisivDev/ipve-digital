'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Plus,
  FileText,
  Banknote,
  Users,
  Shield,
  Wallet,
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

// --- Types ---
interface Payslip {
  id: string;
  employee: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  socialCharges: number;
  netSalary: number;
  status: string;
  details: {
    heures: number;
    tauxHoraire: number;
    primeResponsabilite: number;
    cnpsEmploye: number;
    cnpsEmployeur: number;
    impot: number;
    transport: number;
  };
}

// --- Mock Data ---
const mockPayslips: Payslip[] = [
  {
    id: '1', employee: 'Dr. Konan Kouadio', period: 'Mars 2025', baseSalary: 600000, bonuses: 100000, socialCharges: 72000, netSalary: 628000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3750, primeResponsabilite: 100000, cnpsEmploye: 36000, cnpsEmployeur: 72000, impot: 36000, transport: 20000 },
  },
  {
    id: '2', employee: 'Mme Touré Aminata', period: 'Mars 2025', baseSalary: 500000, bonuses: 50000, socialCharges: 60000, netSalary: 490000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3125, primeResponsabilite: 50000, cnpsEmploye: 30000, cnpsEmployeur: 60000, impot: 30000, transport: 15000 },
  },
  {
    id: '3', employee: 'M. Yao Serge', period: 'Mars 2025', baseSalary: 450000, bonuses: 0, socialCharges: 54000, netSalary: 396000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 2813, primeResponsabilite: 0, cnpsEmploye: 27000, cnpsEmployeur: 54000, impot: 27000, transport: 15000 },
  },
  {
    id: '4', employee: 'M. Diallo Ibrahim', period: 'Mars 2025', baseSalary: 400000, bonuses: 25000, socialCharges: 48000, netSalary: 377000, status: 'En attente',
    details: { heures: 160, tauxHoraire: 2500, primeResponsabilite: 25000, cnpsEmploye: 24000, cnpsEmployeur: 48000, impot: 24000, transport: 15000 },
  },
  {
    id: '5', employee: 'Dr. Konan Kouadio', period: 'Février 2025', baseSalary: 600000, bonuses: 100000, socialCharges: 72000, netSalary: 628000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3750, primeResponsabilite: 100000, cnpsEmploye: 36000, cnpsEmployeur: 72000, impot: 36000, transport: 20000 },
  },
  {
    id: '6', employee: 'Mme Touré Aminata', period: 'Février 2025', baseSalary: 500000, bonuses: 50000, socialCharges: 60000, netSalary: 490000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3125, primeResponsabilite: 50000, cnpsEmploye: 30000, cnpsEmployeur: 60000, impot: 30000, transport: 15000 },
  },
  {
    id: '7', employee: 'M. Yao Serge', period: 'Février 2025', baseSalary: 450000, bonuses: 0, socialCharges: 54000, netSalary: 396000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 2813, primeResponsabilite: 0, cnpsEmploye: 27000, cnpsEmployeur: 54000, impot: 27000, transport: 15000 },
  },
  {
    id: '8', employee: 'M. Diallo Ibrahim', period: 'Février 2025', baseSalary: 400000, bonuses: 25000, socialCharges: 48000, netSalary: 377000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 2500, primeResponsabilite: 25000, cnpsEmploye: 24000, cnpsEmployeur: 48000, impot: 24000, transport: 15000 },
  },
  {
    id: '9', employee: 'Dr. Konan Kouadio', period: 'Janvier 2025', baseSalary: 600000, bonuses: 100000, socialCharges: 72000, netSalary: 628000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3750, primeResponsabilite: 100000, cnpsEmploye: 36000, cnpsEmployeur: 72000, impot: 36000, transport: 20000 },
  },
  {
    id: '10', employee: 'Mme Touré Aminata', period: 'Janvier 2025', baseSalary: 500000, bonuses: 50000, socialCharges: 60000, netSalary: 490000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 3125, primeResponsabilite: 50000, cnpsEmploye: 30000, cnpsEmployeur: 60000, impot: 30000, transport: 15000 },
  },
  {
    id: '11', employee: 'M. Yao Serge', period: 'Janvier 2025', baseSalary: 450000, bonuses: 0, socialCharges: 54000, netSalary: 396000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 2813, primeResponsabilite: 0, cnpsEmploye: 27000, cnpsEmployeur: 54000, impot: 27000, transport: 15000 },
  },
  {
    id: '12', employee: 'M. Diallo Ibrahim', period: 'Janvier 2025', baseSalary: 400000, bonuses: 25000, socialCharges: 48000, netSalary: 377000, status: 'Payé',
    details: { heures: 160, tauxHoraire: 2500, primeResponsabilite: 25000, cnpsEmploye: 24000, cnpsEmployeur: 48000, impot: 24000, transport: 15000 },
  },
];

const periods = ['Mars 2025', 'Février 2025', 'Janvier 2025'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Payé':
      return <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)] text-xs">Payé</Badge>;
    case 'En attente':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">En attente</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export function PayrollSection() {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const filteredPayslips = useMemo(() => {
    return mockPayslips.filter((p) => {
      const matchSearch = p.employee.toLowerCase().includes(search.toLowerCase());
      const matchPeriod = periodFilter === 'all' || p.period === periodFilter;
      return matchSearch && matchPeriod;
    });
  }, [search, periodFilter]);

  // Summary
  const latestPeriod = 'Mars 2025';
  const latestPayslips = mockPayslips.filter((p) => p.period === latestPeriod);
  const totalSalaries = latestPayslips.reduce((s, p) => s + p.baseSalary + p.bonuses, 0);
  const totalCharges = latestPayslips.reduce((s, p) => s + p.socialCharges, 0);
  const totalNet = latestPayslips.reduce((s, p) => s + p.netSalary, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total salaires bruts</p>
                <p className="text-lg font-bold text-[oklch(0.35_0.08_155)]">{formatCurrency(totalSalaries)}</p>
                <p className="text-xs text-muted-foreground">{latestPeriod} - {latestPayslips.length} employés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Shield className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total charges sociales</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(totalCharges)}</p>
                <p className="text-xs text-muted-foreground">CNPS + Impôts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Wallet className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total salaires nets</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(totalNet)}</p>
                <p className="text-xs text-muted-foreground">À verser</p>
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
            placeholder="Rechercher par nom d'employé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Générer la paie</span>
          <span className="sm:hidden">Générer</span>
        </Button>
      </div>

      {/* Payroll table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Bulletins de paie</CardTitle>
              <CardDescription>{filteredPayslips.length} bulletin{filteredPayslips.length > 1 ? 's' : ''}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Employé</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">Période</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden md:table-cell">Salaire base</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden lg:table-cell">Primes</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden lg:table-cell">Charges</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Salaire net</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun bulletin trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="text-sm font-medium">{payslip.employee}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{payslip.period}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-right whitespace-nowrap">{formatCurrency(payslip.baseSalary)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-right whitespace-nowrap">
                        {payslip.bonuses > 0 ? (
                          <span className="text-[oklch(0.35_0.08_155)]">+{formatCurrency(payslip.bonuses)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-right whitespace-nowrap text-red-700">{formatCurrency(payslip.socialCharges)}</TableCell>
                      <TableCell className="text-sm text-right font-semibold whitespace-nowrap">{formatCurrency(payslip.netSalary)}</TableCell>
                      <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => { setSelectedPayslip(payslip); setPayslipOpen(true); }}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
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

      {/* Generate payroll dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
              Générer la paie
            </DialogTitle>
            <DialogDescription>Sélectionnez la période pour générer les bulletins de paie.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avril 2025">Avril 2025</SelectItem>
                  <SelectItem value="Mai 2025">Mai 2025</SelectItem>
                  <SelectItem value="Juin 2025">Juin 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                La génération créera les bulletins de paie pour les 4 enseignants de la période sélectionnée.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setGenerateOpen(false)}>
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip detail dialog */}
      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedPayslip && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
                  Bulletin de paie - {selectedPayslip.employee}
                </DialogTitle>
                <DialogDescription>Période : {selectedPayslip.period}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]">{selectedPayslip.period}</Badge>
                  {getStatusBadge(selectedPayslip.status)}
                </div>

                <Separator />

                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[oklch(0.35_0.08_155)]">Éléments du salaire</h4>
                  <div className="space-y-1.5 bg-primary/5/50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Heures travaillées</span>
                      <span className="font-medium">{selectedPayslip.details.heures}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taux horaire</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.details.tauxHoraire)}/h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Salaire de base</span>
                      <span className="font-semibold">{formatCurrency(selectedPayslip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prime de responsabilité</span>
                      <span className="font-semibold text-[oklch(0.35_0.08_155)]">+{formatCurrency(selectedPayslip.details.primeResponsabilite)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Indemnité transport</span>
                      <span className="font-semibold text-[oklch(0.35_0.08_155)]">+{formatCurrency(selectedPayslip.details.transport)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-700">Retenues sociales et fiscales</h4>
                  <div className="space-y-1.5 bg-red-50/50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CNPS Employé (6%)</span>
                      <span className="font-semibold text-red-700">-{formatCurrency(selectedPayslip.details.cnpsEmploye)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CNPS Employeur (12%)</span>
                      <span className="font-semibold text-red-700">-{formatCurrency(selectedPayslip.details.cnpsEmployeur)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impôt sur salaire</span>
                      <span className="font-semibold text-red-700">-{formatCurrency(selectedPayslip.details.impot)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total brut</span>
                    <span className="font-semibold">{formatCurrency(selectedPayslip.baseSalary + selectedPayslip.bonuses + selectedPayslip.details.transport)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total retenues</span>
                    <span className="font-semibold text-red-700">-{formatCurrency(selectedPayslip.details.cnpsEmploye + selectedPayslip.details.impot)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Net à payer</span>
                    <span className="text-[oklch(0.35_0.08_155)]">{formatCurrency(selectedPayslip.netSalary)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
