'use client';

import { useState } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

type MessageType = 'Email' | 'SMS' | 'Notification';
type MessageStatus = 'Envoyé' | 'En attente' | 'Échoué';

interface Message {
  id: string;
  date: string;
  recipient: string;
  subject: string;
  type: MessageType;
  status: MessageStatus;
  preview: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    date: '2025-01-20 14:30',
    recipient: 'Tous les étudiants',
    subject: 'Reprise des cours - Semestre 2',
    type: 'Notification',
    status: 'Envoyé',
    preview: 'Chers étudiants, nous vous informons que les cours du 2ème semestre reprendront le 3 février 2025...',
  },
  {
    id: '2',
    date: '2025-01-18 10:15',
    recipient: 'Kouamé Brou',
    subject: 'Relance - Frais de scolarité impayés',
    type: 'Email',
    status: 'Envoyé',
    preview: 'Bonjour, nous vous rappelons que vos frais de scolarité pour l\'année 2024-2025 restent impayés...',
  },
  {
    id: '3',
    date: '2025-01-15 16:45',
    recipient: 'Parents L2 Informatique',
    subject: 'Réunion parents-professeurs',
    type: 'Email',
    status: 'Envoyé',
    preview: 'Madame, Monsieur, une réunion parents-professeurs est prévue le 25 janvier à 10h...',
  },
  {
    id: '4',
    date: '2025-01-12 09:00',
    recipient: 'Jean-Baptiste Yao',
    subject: 'Rappel - Document manquant',
    type: 'SMS',
    status: 'Envoyé',
    preview: 'Bonjour, merci de fournir votre certificat de scolarité précédent au secrétariat...',
  },
  {
    id: '5',
    date: '2025-01-10 11:30',
    recipient: 'Enseignants Licence 3',
    subject: 'Calendrier des examens',
    type: 'Notification',
    status: 'Envoyé',
    preview: 'Chers collègues, voici le calendrier des examens de fin de semestre pour la Licence 3...',
  },
  {
    id: '6',
    date: '2025-01-08 15:00',
    recipient: 'Emmanuel Aka',
    subject: 'Confirmation de réinscription',
    type: 'Email',
    status: 'Échoué',
    preview: 'Bonjour, nous vous invitons à confirmer votre réinscription pour le semestre 2...',
  },
  {
    id: '7',
    date: '2025-01-05 08:30',
    recipient: 'Tous les parents',
    subject: 'Bulletin du 1er semestre',
    type: 'Notification',
    status: 'Envoyé',
    preview: 'Madame, Monsieur, les bulletins du 1er semestre sont disponibles sur la plateforme...',
  },
  {
    id: '8',
    date: '2025-01-03 14:00',
    recipient: 'Prospects L1',
    subject: 'Journée portes ouvertes IPVE',
    type: 'Email',
    status: 'En attente',
    preview: 'Vous êtes invités à notre journée portes ouvertes le 20 janvier 2025 de 9h à 16h...',
  },
];

const recipientOptions = [
  { value: 'all-students', label: 'Tous les étudiants' },
  { value: 'all-parents', label: 'Tous les parents' },
  { value: 'all-teachers', label: 'Tous les enseignants' },
  { value: 'l1-informatique', label: 'L1 Informatique' },
  { value: 'l2-informatique', label: 'L2 Informatique' },
  { value: 'l3-informatique', label: 'L3 Informatique' },
  { value: 'parents-l2-informatique', label: 'Parents L2 Informatique' },
  { value: 'teachers-l3', label: 'Enseignants Licence 3' },
  { value: 'prospects-l1', label: 'Prospects L1' },
];

function getTypeIcon(type: MessageType) {
  switch (type) {
    case 'Email':
      return <Mail className="h-4 w-4 text-[oklch(0.35_0.08_155)]" />;
    case 'SMS':
      return <MessageSquare className="h-4 w-4 text-amber-600" />;
    case 'Notification':
      return <Bell className="h-4 w-4 text-sky-600" />;
  }
}

function getTypeBadge(type: MessageType) {
  switch (type) {
    case 'Email':
      return <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)] gap-1"><Mail className="h-3 w-3" />Email</Badge>;
    case 'SMS':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1"><MessageSquare className="h-3 w-3" />SMS</Badge>;
    case 'Notification':
      return <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100 gap-1"><Bell className="h-3 w-3" />Notification</Badge>;
  }
}

function getStatusIcon(status: MessageStatus) {
  switch (status) {
    case 'Envoyé':
      return <CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.35_0.08_155)]" />;
    case 'En attente':
      return <Clock className="h-3.5 w-3.5 text-amber-600" />;
    case 'Échoué':
      return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
  }
}

export function CommunicationsSection() {
  const [formType, setFormType] = useState<MessageType>('Email');
  const [formRecipient, setFormRecipient] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormRecipient('');
      setFormSubject('');
      setFormBody('');
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Message composer */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              Nouveau message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de message</Label>
              <div className="flex gap-2">
                {(['Email', 'SMS', 'Notification'] as MessageType[]).map((type) => (
                  <Button
                    key={type}
                    variant={formType === type ? 'default' : 'outline'}
                    size="sm"
                    className={
                      formType === type
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5'
                        : 'gap-1.5'
                    }
                    onClick={() => setFormType(type)}
                  >
                    {type === 'Email' && <Mail className="h-3.5 w-3.5" />}
                    {type === 'SMS' && <MessageSquare className="h-3.5 w-3.5" />}
                    {type === 'Notification' && <Bell className="h-3.5 w-3.5" />}
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Destinataire</Label>
              <Select value={formRecipient} onValueChange={setFormRecipient}>
                <SelectTrigger className="w-full" id="recipient">
                  <SelectValue placeholder="Sélectionner un destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {recipientOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                placeholder="Sujet du message..."
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Rédigez votre message..."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={6}
              />
            </div>

            {sent && (
              <div className="flex items-center gap-2 text-sm text-[oklch(0.35_0.08_155)] bg-primary/5 p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                Message envoyé avec succès !
              </div>
            )}

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={handleSend}
              disabled={!formRecipient || !formSubject || !formBody || sent}
            >
              <Send className="h-4 w-4" />
              {sent ? 'Envoyé !' : 'Envoyer'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Message history */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique des messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead className="hidden sm:table-cell">Sujet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {message.date}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate max-w-[140px]">{message.recipient}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm truncate block max-w-[200px]">{message.subject}</span>
                    </TableCell>
                    <TableCell>{getTypeBadge(message.type)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(message.status)}
                        <span className="text-xs">{message.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
