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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
        {/* Modern tab bar */}
        <div className="relative">
          <div className="flex gap-0.5 overflow-x-auto pb-px scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-0.5 min-w-0">
              {erpTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = erpSection === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setErpSection(tab.value)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                      isActive
                        ? 'text-foreground bg-muted shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-[#1B4F72]')} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-border/60" />
        </div>

        {erpTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
