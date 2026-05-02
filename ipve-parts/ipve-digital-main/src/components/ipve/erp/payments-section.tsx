'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentDashboard } from '@/components/payments/PaymentDashboard';
import { RecordPaymentView } from '@/components/payments/RecordPaymentView';
import { PaymentHistoryView } from '@/components/payments/PaymentHistoryView';
import { UnpaidListView } from '@/components/payments/UnpaidListView';
import { PaymentPlanManager } from '@/components/payments/PaymentPlanManager';

const subViews = [
  { value: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { value: 'record', label: 'Enregistrer', icon: PlusCircle },
  { value: 'history', label: 'Historique', icon: History },
  { value: 'unpaid', label: 'Impayés', icon: AlertTriangle },
  { value: 'plans', label: 'Plans', icon: ClipboardList },
] as const;

type SubView = (typeof subViews)[number]['value'];

export function PaymentsSection() {
  const [activeView, setActiveView] = useState<SubView>('dashboard');

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

        <TabsContent value="dashboard">
          <PaymentDashboard />
        </TabsContent>

        <TabsContent value="record">
          <RecordPaymentView />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistoryView />
        </TabsContent>

        <TabsContent value="unpaid">
          <UnpaidListView />
        </TabsContent>

        <TabsContent value="plans">
          <PaymentPlanManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
