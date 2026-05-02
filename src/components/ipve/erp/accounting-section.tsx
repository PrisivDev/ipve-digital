'use client';

import { useState } from 'react';
import {
  ScrollText,
  BookOpen,
  Scale,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JournalPage } from '@/components/accounting/JournalPage';
import { LedgerPage } from '@/components/accounting/LedgerPage';
import { TrialBalancePage } from '@/components/accounting/TrialBalancePage';
import { IncomeStatementPage } from '@/components/accounting/IncomeStatementPage';
import { ChartOfAccountsPage } from '@/components/accounting/ChartOfAccountsPage';

const subViews = [
  { value: 'journal', label: 'Journal', icon: ScrollText },
  { value: 'ledger', label: 'Grand Livre', icon: BookOpen },
  { value: 'trial-balance', label: 'Balance Générale', icon: Scale },
  { value: 'income-statement', label: 'Compte de Résultat', icon: TrendingUp },
  { value: 'chart', label: 'Plan Comptable', icon: FileText },
] as const;

type SubView = (typeof subViews)[number]['value'];

export function AccountingSection() {
  const [activeView, setActiveView] = useState<SubView>('journal');

  return (
    <div className="space-y-4">
      {/* Sub-view tabs */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as SubView)}
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {subViews.map((view) => {
            const Icon = view.icon;
            return (
              <TabsTrigger
                key={view.value}
                value={view.value}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{view.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="journal">
          <JournalPage />
        </TabsContent>

        <TabsContent value="ledger">
          <LedgerPage />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalancePage />
        </TabsContent>

        <TabsContent value="income-statement">
          <IncomeStatementPage />
        </TabsContent>

        <TabsContent value="chart">
          <ChartOfAccountsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
