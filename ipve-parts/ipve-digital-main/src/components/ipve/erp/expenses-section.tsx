'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Receipt,
  TrendingDown,
  Building2,
  Banknote,
  Smartphone,
  ShoppingBag,
  Wrench,
  Megaphone,
  Home,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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

// --- Types ---
interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  method: string;
  supplier: string;
  status: string;
  invoice: string;
}

// --- Mock Data ---
const mockExpenses: Expense[] = [
  { id: '1', date: '2025-03-15', description: 'Salaires enseignants - Mars 2025', category: 'Salaires', amount: 3200000, method: 'Virement', supplier: 'IPVE', status: 'Payé', invoice: 'INV-2025-001' },
  { id: '2', date: '2025-03-14', description: 'Loyer bureau - Mars 2025', category: 'Loyer', amount: 450000, method: 'Virement', supplier: 'SCI Abidjan Immo', status: 'Payé', invoice: 'INV-2025-002' },
  { id: '3', date: '2025-03-12', description: 'Fournitures de bureau', category: 'Fournitures', amount: 85000, method: 'Espèces', supplier: 'Maison du Bureau', status: 'Payé', invoice: 'INV-2025-003' },
  { id: '4', date: '2025-03-10', description: 'Campagne pub Facebook/Instagram', category: 'Marketing', amount: 150000, method: 'Mobile Money', supplier: 'Meta Ads', status: 'Payé', invoice: 'INV-2025-004' },
  { id: '5', date: '2025-03-08', description: 'Facture électricité - Mars 2025', category: 'Charges', amount: 120000, method: 'Virement', supplier: 'CI-ENERGIE', status: 'Payé', invoice: 'INV-2025-005' },
  { id: '6', date: '2025-03-05', description: 'Internet fibre - Mars 2025', category: 'Charges', amount: 45000, method: 'Mobile Money', supplier: 'Orange Business', status: 'Payé', invoice: 'INV-2025-006' },
  { id: '7', date: '2025-03-03', description: 'Réparation imprimante', category: 'Maintenance', amount: 35000, method: 'Espèces', supplier: 'TechFix CI', status: 'Payé', invoice: 'INV-2025-007' },
  { id: '8', date: '2025-03-01', description: 'Achat manuels scolaires', category: 'Fournitures', amount: 125000, method: 'Espèces', supplier: 'Librairie Universitaire', status: 'Payé', invoice: 'INV-2025-008' },
  { id: '9', date: '2025-02-28', description: 'Salaires enseignants - Fév 2025', category: 'Salaires', amount: 3200000, method: 'Virement', supplier: 'IPVE', status: 'Payé', invoice: 'INV-2025-009' },
  { id: '10', date: '2025-02-25', description: 'Flyers et affiches promotionnelles', category: 'Marketing', amount: 75000, method: 'Espèces', supplier: 'Print CI', status: 'Payé', invoice: 'INV-2025-010' },
  { id: '11', date: '2025-02-20', description: 'Loyer bureau - Fév 2025', category: 'Loyer', amount: 450000, method: 'Virement', supplier: 'SCI Abidjan Immo', status: 'Payé', invoice: 'INV-2025-011' },
  { id: '12', date: '2025-02-15', description: 'Entretien climatisation', category: 'Maintenance', amount: 60000, method: 'Espèces', supplier: 'Clima Service CI', status: 'En attente', invoice: 'INV-2025-012' },
  { id: '13', date: '2025-02-10', description: 'Cartouches encre imprimante', category: 'Fournitures', amount: 48000, method: 'Espèces', supplier: 'Maison du Bureau', status: 'Payé', invoice: 'INV-2025-013' },
];

const categories = ['Salaires', 'Loyer', 'Fournitures', 'Marketing', 'Charges', 'Maintenance'];
const methods = ['Espèces', 'Mobile Money', 'Virement'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Salaires': return <TrendingDown className="h-3.5 w-3.5" />;
    case 'Loyer': return <Home className="h-3.5 w-3.5" />;
    case 'Fournitures': return <ShoppingBag className="h-3.5 w-3.5" />;
    case 'Marketing': return <Megaphone className="h-3.5 w-3.5" />;
    case 'Charges': return <Zap className="h-3.5 w-3.5" />;
    case 'Maintenance': return <Wrench className="h-3.5 w-3.5" />;
    default: return <Receipt className="h-3.5 w-3.5" />;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'Salaires': return 'text-red-700 bg-red-100';
    case 'Loyer': return 'text-orange-700 bg-orange-100';
    case 'Fournitures': return 'text-amber-700 bg-amber-100';
    case 'Marketing': return 'text-purple-700 bg-purple-100';
    case 'Charges': return 'text-sky-700 bg-sky-100';
    case 'Maintenance': return 'text-gray-700 bg-gray-100';
    default: return 'text-gray-700 bg-gray-100';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Payé':
      return <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)] text-xs">Payé</Badge>;
    case 'En attente':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">En attente</Badge>;
    case 'Annulé':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">Annulé</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export function ExpensesSection() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [form, setForm] = useState({
    description: '',
    category: 'Fournitures',
    amount: '',
    date: '',
    method: 'Espèces',
    supplier: '',
    invoice: '',
  });

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((e) => {
      const matchSearch = `${e.description} ${e.supplier} ${e.invoice}`.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [search, categoryFilter]);

  const totalExpenses = filteredExpenses.filter((e) => e.status === 'Payé').reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    mockExpenses.filter((e) => e.status === 'Payé').forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return categories
      .map((cat) => ({ category: cat, amount: map[cat] || 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par description, fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter dépense</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une dépense</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle dépense.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expDesc">Description</Label>
                <Input
                  id="expDesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description de la dépense"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expAmount">Montant (FCFA)</Label>
                  <Input
                    id="expAmount"
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expDate">Date</Label>
                  <Input
                    id="expDate"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expSupplier">Fournisseur</Label>
                  <Input
                    id="expSupplier"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    placeholder="Nom du fournisseur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expInvoice">N° Facture</Label>
                  <Input
                    id="expInvoice"
                    value={form.invoice}
                    onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                    placeholder="INV-2025-XXX"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddOpen(false)}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Results count + total */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          <Filter className="inline h-3.5 w-3.5 mr-1" />
          {filteredExpenses.length} dépense{filteredExpenses.length > 1 ? 's' : ''} trouvée{filteredExpenses.length > 1 ? 's' : ''}
        </div>
        <div className="text-sm font-semibold text-red-700">
          Total : {formatCurrency(totalExpenses)}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expenses table */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold hidden md:table-cell">Catégorie</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                    <TableHead className="text-xs font-semibold hidden sm:table-cell">Mode</TableHead>
                    <TableHead className="text-xs font-semibold hidden xl:table-cell">Fournisseur</TableHead>
                    <TableHead className="text-xs font-semibold">Statut</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Aucune dépense trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-sm font-medium max-w-[200px] truncate">{expense.description}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={cn('text-xs gap-1', getCategoryColor(expense.category))}>
                            {getCategoryIcon(expense.category)}
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-red-700 text-right whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{expense.method}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{expense.supplier}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => { setSelectedExpense(expense); setDetailOpen(true); }}
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

        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryBreakdown.map((item) => {
              const pct = totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md', getCategoryColor(item.category))}>
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{formatCurrency(item.amount)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-red-600" />
                  Détail de la dépense
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description</span>
                    <p className="font-medium">{selectedExpense.description}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Catégorie</span>
                    <p className="font-medium">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant</span>
                    <p className="font-semibold text-red-700">{formatCurrency(selectedExpense.amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode de paiement</span>
                    <p className="font-medium">{selectedExpense.method}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fournisseur</span>
                    <p className="font-medium">{selectedExpense.supplier}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">N° Facture</span>
                    <p className="font-mono text-xs">{selectedExpense.invoice}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut</span>
                    <div className="mt-0.5">{getStatusBadge(selectedExpense.status)}</div>
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

function cn(...inputs: (string | boolean | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
