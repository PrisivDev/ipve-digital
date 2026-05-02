'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type PaymentStatusLabel = 'up_to_date' | 'partial' | 'overdue';

interface StudentCardProps {
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: 'MALE' | 'FEMALE' | 'M' | 'F';
  filiereName: string | null;
  levelName: string | null;
  status: string;
  paymentStatus: { label: string; status: PaymentStatusLabel } | null;
  onClick?: () => void;
}

function getPaymentBadge(status: PaymentStatusLabel) {
  switch (status) {
    case 'up_to_date':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          A jour
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Partiel
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          En retard
        </Badge>
      );
  }
}

function getStatusBadge(status: string) {
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

export function StudentCard({
  firstName,
  lastName,
  studentNumber,
  gender,
  filiereName,
  levelName,
  status,
  paymentStatus,
  onClick,
}: StudentCardProps) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  const isFemale = gender === 'FEMALE' || gender === 'F';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback
              className={`text-xs font-semibold ${
                isFemale
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {lastName} {firstName}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {studentNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filiereName ?? '—'} &bull; {levelName ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {getStatusBadge(status)}
          {paymentStatus && getPaymentBadge(paymentStatus.status)}
        </div>
      </CardContent>
    </Card>
  );
}
