'use client';

import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  PiggyBank,
  Calculator,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type ErpSection } from '@/store/app-store';
import { FinanceDashboard } from '@/components/ipve/erp/finance-dashboard';
import { PaymentsSection } from '@/components/ipve/erp/payments-section';
import { ExpensesSection } from '@/components/ipve/erp/expenses-section';
import { BudgetsSection } from '@/components/ipve/erp/budgets-section';
import { AccountingSection } from '@/components/ipve/erp/accounting-section';
import { PayrollSection } from '@/components/ipve/erp/payroll-section';
import { UnpaidSection } from '@/components/ipve/erp/unpaid-section';

const erpTabs = [
  { value: 'finance', label: 'Tableau financier', icon: LayoutDashboard },
  { value: 'payments', label: 'Paiements', icon: CreditCard },
  { value: 'expenses', label: 'Dépenses', icon: Receipt },
  { value: 'budgets', label: 'Budgets', icon: PiggyBank },
  { value: 'accounting', label: 'Comptabilité', icon: Calculator },
  { value: 'payroll', label: 'Paie', icon: Banknote },
  { value: 'unpaid', label: 'Impayés', icon: AlertTriangle },
] as const;

function SectionRenderer({ section }: { section: ErpSection }) {
  switch (section) {
    case 'finance':
      return <FinanceDashboard />;
    case 'payments':
      return <PaymentsSection />;
    case 'expenses':
      return <ExpensesSection />;
    case 'budgets':
      return <BudgetsSection />;
    case 'accounting':
      return <AccountingSection />;
    case 'payroll':
      return <PayrollSection />;
    case 'unpaid':
      return <UnpaidSection />;
  }
}

export function ErpView() {
  const { erpSection, setErpSection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ERP</h2>
        <p className="text-sm text-muted-foreground">Gestion financière et comptable</p>
      </div>

      <Tabs value={erpSection} onValueChange={(v) => setErpSection(v as ErpSection)}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {erpTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {erpTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
