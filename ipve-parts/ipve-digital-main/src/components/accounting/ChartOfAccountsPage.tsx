'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Lock,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatFCFA, getAccountTypeColor, ACCOUNT_CLASS_LABELS } from '@/types/accounting.types';
import type {
  ChartOfAccountItem,
  ChartOfAccountFlat,
  AccountType,
  NormalBalance,
} from '@/types/accounting.types';
import { useChartOfAccounts, useCreateAccount, useAccountSearch } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ChartOfAccountsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Debounce search
  if (search !== debouncedSearch) {
    setTimeout(() => setDebouncedSearch(search), 300);
  }

  const { data: tree = [], isLoading } = useChartOfAccounts(true, debouncedSearch || undefined);

  const createAccount = useCreateAccount();

  // Filter inactive accounts unless toggled
  const filteredTree = (() => {
    if (showInactive) return tree;
    return tree.map(filterInactive).filter(Boolean) as ChartOfAccountItem[];
  })();

  function filterInactive(node: ChartOfAccountItem): ChartOfAccountItem | null {
    if (!node.isActive && !node.children?.length) return null;
    if (node.children?.length) {
      const filteredChildren = node.children.map(filterInactive).filter(Boolean) as ChartOfAccountItem[];
      if (filteredChildren.length === 0 && !node.isActive) return null;
      return { ...node, children: filteredChildren };
    }
    return node;
  }

  const toggleClass = (cls: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
  };

  // Group top-level items by class
  const classGroups = useMemo(() => {
    const groups: Record<string, ChartOfAccountItem[]> = {};
    for (const item of filteredTree) {
      if (!item.parentId) {
        const cls = item.accountClass;
        if (!groups[cls]) groups[cls] = [];
        groups[cls].push(item);
      }
    }
    return groups;
  }, [filteredTree]);

  const sortedClasses = Object.keys(classGroups).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Plan Comptable</h3>
          <p className="text-sm text-muted-foreground">
            Plan comptable OHADA — hiérarchie des comptes
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-[#1A2B4A] hover:bg-[#1A2B4A]/90 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau compte
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par n° ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(v) => setShowInactive(!!v)}
          />
          <Label htmlFor="show-inactive" className="text-xs cursor-pointer">
            Comptes inactifs
          </Label>
        </div>
      </div>

      {/* Tree view */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : sortedClasses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucun compte trouvé.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedClasses.map((cls) => (
            <ClassTreeNode
              key={cls}
              className={cls}
              items={classGroups[cls]}
              isExpanded={expandedClasses.has(cls)}
              onToggle={() => toggleClass(cls)}
            />
          ))}
        </div>
      )}

      {/* Add account dialog */}
      <CreateAccountDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}

function ClassTreeNode({
  className,
  items,
  isExpanded,
  onToggle,
}: {
  className: string;
  items: ChartOfAccountItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const label = ACCOUNT_CLASS_LABELS[className] || `Classe ${className}`;

  // Recursively collect leaf accounts count
  function countLeaves(node: ChartOfAccountItem): number {
    if (!node.children?.length) return 1;
    return node.children.reduce((s, c) => s + countLeaves(c), 0);
  }

  const leafCount = items.reduce((s, item) => s + countLeaves(item), 0);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-bold text-[#1A2B4A]">{label}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {leafCount} compte{leafCount > 1 ? 's' : ''}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 border-l-2 border-muted pl-3 space-y-1 mt-1 mb-2">
          {items.map((item) => (
            <AccountTreeNode key={item.id} node={item} depth={0} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AccountTreeNode({
  node,
  depth,
}: {
  node: ChartOfAccountItem;
  depth: number;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const [expanded, setExpanded] = useState(false);
  const isStandard = node.accountNumber.length <= 2; // Standard OHADA = class-level or section-level
  const isLeaf = !hasChildren;

  return (
    <div>
      <Collapsible open={expanded} onOpenChange={hasChildren ? setExpanded : undefined}>
        <CollapsibleTrigger asChild disabled={!hasChildren}>
          <div
            className={cn(
              'flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group',
              !node.isActive && 'opacity-50',
              isLeaf && 'ml-2'
            )}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )
            ) : (
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
            )}

            <span className="font-mono text-xs font-semibold text-muted-foreground w-16 shrink-0">
              {node.accountNumber}
            </span>

            <span className={cn('text-xs truncate', isLeaf ? '' : 'font-medium')}>
              {node.accountName}
            </span>

            {isStandard && (
              <Lock className="h-3 w-3 text-muted-foreground shrink-0" title="Compte OHADA standard" />
            )}

            <Badge
              variant="outline"
              className={cn('text-[10px] ml-auto shrink-0', getAccountTypeColor(node.accountType))}
            >
              {node.accountType === 'ASSET' ? 'Actif' :
               node.accountType === 'LIABILITY' ? 'Passif' :
               node.accountType === 'EQUITY' ? 'CP' :
               node.accountType === 'REVENUE' ? 'Prod.' : 'Charges'}
            </Badge>

            <span
              className={cn(
                'font-mono text-xs font-semibold w-28 text-right shrink-0',
                node.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {formatFCFA(node.currentBalance)}
            </span>
          </div>
        </CollapsibleTrigger>
        {hasChildren && (
          <CollapsibleContent>
            <div className="ml-4 border-l border-muted pl-2 space-y-0.5">
              {node.children!.map((child) => (
                <AccountTreeNode key={child.id} node={child} depth={depth + 1} />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAccount = useCreateAccount();

  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountClass, setAccountClass] = useState('1');
  const [accountType, setAccountType] = useState<AccountType>('ASSET');
  const [normalBalance, setNormalBalance] = useState<NormalBalance>('DEBIT');
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<ChartOfAccountFlat | null>(null);

  const { data: parentResults = [] } = useAccountSearch(
    open ? parentSearch : ''
  );

  const handleSubmit = async () => {
    if (!accountNumber.trim() || !accountName.trim()) return;

    try {
      await createAccount.mutateAsync({
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        accountClass,
        accountType,
        normalBalance,
        parentId: selectedParent?.id ?? undefined,
      });

      toast.success('Compte créé avec succès.');
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Erreur lors de la création.';
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setAccountNumber('');
    setAccountName('');
    setAccountClass('1');
    setAccountType('ASSET');
    setNormalBalance('DEBIT');
    setParentSearch('');
    setSelectedParent(null);
  };

  const isValid = accountNumber.trim().length >= 3 && accountName.trim().length >= 2;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau compte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">N° Compte</Label>
              <Input
                placeholder="ex: 512001"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Classe</Label>
              <Select value={accountClass} onValueChange={setAccountClass}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_CLASS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Intitulé du compte</Label>
            <Input
              placeholder="Nom du compte..."
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">Actif</SelectItem>
                  <SelectItem value="LIABILITY">Passif</SelectItem>
                  <SelectItem value="EQUITY">Capitaux Propres</SelectItem>
                  <SelectItem value="REVENUE">Produits</SelectItem>
                  <SelectItem value="EXPENSE">Charges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Solde normal</Label>
              <Select value={normalBalance} onValueChange={(v) => setNormalBalance(v as NormalBalance)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">Débiteur</SelectItem>
                  <SelectItem value="CREDIT">Créditeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Compte parent (optionnel)</Label>
            <Input
              placeholder="Rechercher un compte parent..."
              value={selectedParent ? `${selectedParent.accountNumber} — ${selectedParent.accountName}` : parentSearch}
              onChange={(e) => {
                setSelectedParent(null);
                setParentSearch(e.target.value);
              }}
              onFocus={() => setSelectedParent(null)}
              className="h-9"
            />
            {parentSearch && !selectedParent && parentResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto custom-scrollbar">
                {parentResults.map((acc) => (
                  <button
                    key={acc.id}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => {
                      setSelectedParent(acc);
                      setParentSearch('');
                    }}
                  >
                    <span className="font-mono font-semibold w-16">{acc.accountNumber}</span>
                    <span className="truncate">{acc.accountName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createAccount.isPending}
          >
            {createAccount.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
