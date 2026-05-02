'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Globe,
  Baby,
  GraduationCap,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  StickyNote,
  MessageSquare,
  MessageCircle,
  Plus,
  FileBadge,
  ClipboardList,
  Receipt,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useProspect,
  useUpdateProspectStatus,
  useAddInteraction,
} from '@/hooks/useProspects';
import {
  PROSPECT_STATUS_LABELS as statusLabels,
  PROSPECT_SOURCE_LABELS as sourceLabels,
  PROSPECT_TRANSITIONS,
} from '@/types/prospect.types';
import type {
  ProspectStatus,
  InteractionType,
  InteractionDirection,
} from '@/types/prospect.types';

// ─── helpers ───────────────────────────────────────────────

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const fmtDateTime = (d: string) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[110px]">{label}</span>
      <span className="font-medium truncate">{value ?? '—'}</span>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

// ─── status badge ──────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<ProspectStatus, string> = {
  NOUVEAU: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
  CONTACTE: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100',
  INTERESSE: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  DOSSIER_RECU: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  ADMIS: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  CONVERTI: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
  ABANDONNE: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
};

function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status]}>
      {statusLabels[status]}
    </Badge>
  );
}

// ─── interaction type icon ─────────────────────────────────

function InteractionTypeIcon({ type }: { type: InteractionType }) {
  switch (type) {
    case 'APPEL':
      return <Phone className="h-4 w-4" />;
    case 'EMAIL':
      return <Mail className="h-4 w-4" />;
    case 'VISITE':
      return <MapPin className="h-4 w-4" />;
    case 'SMS':
      return <MessageSquare className="h-4 w-4" />;
    case 'WHATSAPP_MSG':
      return <MessageCircle className="h-4 w-4" />;
    case 'NOTE':
      return <StickyNote className="h-4 w-4" />;
    case 'RENDEZ_VOUS':
      return <Calendar className="h-4 w-4" />;
    default:
      return <StickyNote className="h-4 w-4" />;
  }
}

const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  APPEL: 'Appel',
  EMAIL: 'E-mail',
  VISITE: 'Visite',
  SMS: 'SMS',
  WHATSAPP_MSG: 'WhatsApp',
  NOTE: 'Note',
  RENDEZ_VOUS: 'Rendez-vous',
};

const INTERACTION_TYPE_COLORS: Record<InteractionType, string> = {
  APPEL: 'bg-emerald-100 text-emerald-700',
  EMAIL: 'bg-sky-100 text-sky-700',
  VISITE: 'bg-orange-100 text-orange-700',
  SMS: 'bg-violet-100 text-violet-700',
  WHATSAPP_MSG: 'bg-green-100 text-green-700',
  NOTE: 'bg-gray-100 text-gray-700',
  RENDEZ_VOUS: 'bg-pink-100 text-pink-700',
};

// ─── component ─────────────────────────────────────────────

interface ProspectDetailSheetProps {
  prospectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert?: (prospect: any) => void;
}

export function ProspectDetailSheet({
  prospectId,
  open,
  onOpenChange,
  onConvert,
}: ProspectDetailSheetProps) {
  const { data: prospectData, isLoading } = useProspect(prospectId);
  const updateStatus = useUpdateProspectStatus();
  const addInteraction = useAddInteraction();


  // Interaction dialog state
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState<{
    type: InteractionType | '';
    direction: InteractionDirection;
    subject: string;
    content: string;
  }>({
    type: '',
    direction: 'OUTGOING',
    subject: '',
    content: '',
  });

  // Pipeline transition notes
  const [transitionNotes, setTransitionNotes] = useState('');

  // Notes editing state
  const [notesValue, setNotesValue] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);

  const p = prospectData?.data ?? prospectData;

  // Sync notes when prospect loads
  if (p?.notes && !notesEditing && notesValue !== p.notes) {
    setNotesValue(p.notes);
  }

  const initials = p
    ? `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase()
    : '??';

  const currentStatus = p?.status ?? 'NOUVEAU';
  const validTransitions = PROSPECT_TRANSITIONS[currentStatus] ?? [];

  // ─── handlers ──────────────────────────────────────────

  const handleStatusTransition = (newStatus: ProspectStatus) => {
    if (!prospectId) return;
    updateStatus.mutate(
      { id: prospectId, status: newStatus, notes: transitionNotes || undefined },
      {
        onSuccess: () => {
          toast.success(`Statut mis à jour: Le prospect est passé à "${statusLabels[newStatus]}".`);
          setTransitionNotes('');
        },
        onError: () => {
          toast.error('Erreur: Impossible de mettre à jour le statut.');
        },
      },
    );
  };

  const handleAddInteraction = () => {
    if (!prospectId || !interactionForm.type || !interactionForm.content.trim()) return;
    addInteraction.mutate(
      {
        prospectId,
        data: {
          type: interactionForm.type as InteractionType,
          direction: interactionForm.direction,
          subject: interactionForm.subject || undefined,
          content: interactionForm.content.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(`Interaction ajoutée: L'interaction "${INTERACTION_TYPE_LABELS[interactionForm.type as InteractionType]}" a été enregistrée.`);
          setInteractionDialogOpen(false);
          setInteractionForm({ type: '', direction: 'OUTGOING', subject: '', content: '' });
        },
        onError: () => {
          toast.error("Erreur: Impossible d'ajouter l'interaction.");
        },
      },
    );
  };

  // ─── pipeline progress indicator ───────────────────────

  const activePipeline = ['NOUVEAU', 'CONTACTE', 'INTERESSE', 'DOSSIER_RECU', 'ADMIS', 'CONVERTI'];
  const currentStepIdx = activePipeline.indexOf(currentStatus);
  const isAbandonne = currentStatus === 'ABANDONNE';

  // ─── render ────────────────────────────────────────────

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl w-full p-0 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="p-4 pb-0 border-b shrink-0">
            {isLoading ? (
              <>
                <SheetTitle className="sr-only">Chargement...</SheetTitle>
                <SheetDescription className="sr-only">
                  Chargement du profil prospect
                </SheetDescription>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </>
            ) : p ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="text-sm font-semibold bg-violet-100 text-violet-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-base truncate">
                      {p.firstName} {p.lastName}
                    </SheetTitle>
                    {currentStatus === 'ADMIS' && onConvert && (
                      <Button
                        size="sm"
                        className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        onClick={() => onConvert(p)}
                      >
                        Convertir en étudiant
                      </Button>
                    )}
                  </div>
                  <SheetDescription className="text-xs flex items-center gap-2 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {p.phone}
                    {p.assigneeName && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <Users className="h-3 w-3" />
                        {p.assigneeName}
                      </>
                    )}
                  </SheetDescription>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={currentStatus} />
                </div>
              </div>
            ) : (
              <>
                <SheetTitle className="sr-only">Aucun prospect sélectionné</SheetTitle>
                <SheetDescription className="sr-only">
                  Sélectionnez un prospect pour voir ses détails
                </SheetDescription>
              </>
            )}
          </SheetHeader>

          {/* Tabs */}
          <Tabs defaultValue="profil" className="flex flex-col flex-1 min-h-0">
            <div className="px-4 pt-3 shrink-0">
              <TabsList className="w-full overflow-x-auto">
                <TabsTrigger value="profil" className="text-xs">
                  Profil
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="text-xs">
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="interactions" className="text-xs">
                  Interactions
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="historique" className="text-xs">
                  Historique
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4">
                {/* ─── Tab 1: Profil ─── */}
                <TabsContent value="profil">
                  {isLoading ? (
                    <div className="space-y-4">
                      <TabSkeleton />
                      <TabSkeleton />
                    </div>
                  ) : p ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoRow icon={User} label="Prénom" value={p.firstName} />
                        <InfoRow icon={User} label="Nom" value={p.lastName} />
                        <InfoRow icon={Mail} label="Email" value={p.email} />
                        <InfoRow icon={Phone} label="Téléphone" value={p.phone} />
                        <InfoRow
                          icon={Globe}
                          label="Source"
                          value={sourceLabels[p.source] ?? p.source}
                        />
                        <InfoRow
                          icon={BookOpen}
                          label="Filière visée"
                          value={p.filiereInterest}
                        />
                        <InfoRow
                          icon={GraduationCap}
                          label="Niveau visé"
                          value={p.levelInterest}
                        />
                        <InfoRow
                          icon={Calendar}
                          label="Date d'ajout"
                          value={fmtDate(p.createdAt)}
                        />
                        <InfoRow icon={Globe} label="Nationalité" value={p.nationality} />
                        <InfoRow icon={MapPin} label="Adresse" value={p.address} />
                        <InfoRow
                          icon={Baby}
                          label="Date de naissance"
                          value={p.dateOfBirth ? fmtDate(p.dateOfBirth) : undefined}
                        />
                      </div>

                      <Separator />

                      {/* Contact d'urgence */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          Contact d'urgence
                        </h4>
                        <div className="space-y-2 text-sm">
                          {p.parentName && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Parent :</span>
                              <span className="font-medium">{p.parentName}</span>
                            </div>
                          )}
                          {p.parentPhone && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Tél parent :</span>
                              <span>{p.parentPhone}</span>
                            </div>
                          )}
                          {p.parentEmail && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Email parent :
                              </span>
                              <span>{p.parentEmail}</span>
                            </div>
                          )}
                          {!p.parentName && !p.parentPhone && !p.parentEmail && (
                            <p className="text-muted-foreground text-xs">
                              Aucun contact d'urgence renseigné
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Notes libres */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <StickyNote className="h-4 w-4" />
                            Notes libres
                          </h4>
                          {!notesEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setNotesEditing(true);
                                setNotesValue(p.notes ?? '');
                              }}
                            >
                              Modifier
                            </Button>
                          )}
                        </div>
                        {notesEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Ajouter des notes sur ce prospect..."
                              className="min-h-[100px] text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setNotesEditing(false)}
                              >
                                Sauvegarder
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setNotesEditing(false);
                                  setNotesValue(p.notes ?? '');
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {p.notes ?? 'Aucune note.'}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                {/* ─── Tab 2: Pipeline ─── */}
                <TabsContent value="pipeline">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <TabSkeleton />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : p ? (
                    <div className="space-y-5">
                      {/* Current status */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Statut actuel :</span>
                        <StatusBadge status={currentStatus} />
                      </div>

                      {/* Pipeline progress indicator */}
                      {!isAbandonne && (
                        <div className="relative">
                          <div className="flex items-center justify-between overflow-x-auto gap-1 pb-2">
                            {activePipeline.map((status, idx) => {
                              const isCompleted = idx < currentStepIdx;
                              const isCurrent = idx === currentStepIdx;
                              const isPending = idx > currentStepIdx;

                              return (
                                <div
                                  key={status}
                                  className="flex items-center flex-1 min-w-[80px]"
                                >
                                  <div className="flex flex-col items-center flex-1">
                                    <div
                                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                                        isCompleted
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : isCurrent
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </div>
                                    <span
                                      className={`text-[10px] mt-1 text-center leading-tight ${
                                        isCurrent
                                          ? 'font-semibold text-primary'
                                          : isCompleted
                                            ? 'text-emerald-600'
                                            : 'text-muted-foreground'
                                      }`}
                                    >
                                      {statusLabels[status]}
                                    </span>
                                  </div>
                                  {idx < activePipeline.length - 1 && (
                                    <div
                                      className={`h-0.5 flex-1 mt-[-16px] ${
                                        idx < currentStepIdx
                                          ? 'bg-emerald-400'
                                          : 'bg-muted-foreground/20'
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isAbandonne && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          Ce prospect a été marqué comme abandonné.
                        </div>
                      )}

                      <Separator />

                      {/* Status transitions */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                          <ArrowRight className="h-4 w-4" />
                          Transitions disponibles
                        </h4>
                        {validTransitions.length > 0 ? (
                          <div className="space-y-3">
                            {validTransitions.map((nextStatus) => (
                              <div key={nextStatus} className="space-y-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 w-full justify-start"
                                  disabled={updateStatus.isPending}
                                  onClick={() =>
                                    handleStatusTransition(nextStatus)
                                  }
                                >
                                  {statusLabels[currentStatus]}
                                  <ArrowRight className="h-3 w-3" />
                                  {statusLabels[nextStatus]}
                                </Button>
                              </div>
                            ))}

                            {/* Optional transition notes */}
                            <div className="space-y-1.5 pt-1">
                              <Label className="text-xs text-muted-foreground">
                                Notes (optionnel)
                              </Label>
                              <Textarea
                                value={transitionNotes}
                                onChange={(e) => setTransitionNotes(e.target.value)}
                                placeholder="Ajoutez une note pour cette transition..."
                                className="min-h-[60px] text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Aucune transition disponible depuis ce statut.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                {/* ─── Tab 3: Interactions ─── */}
                <TabsContent value="interactions">
                  {isLoading ? (
                    <div className="space-y-4">
                      <TabSkeleton />
                      <TabSkeleton />
                      <TabSkeleton />
                    </div>
                  ) : p ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          Historique des interactions
                        </h4>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setInteractionDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3" />
                          Ajouter une interaction
                        </Button>
                      </div>

                      {p.interactions && p.interactions.length > 0 ? (
                        <div className="space-y-0 relative">
                          {/* Vertical timeline line */}
                          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

                          <div className="space-y-4">
                            {[...p.interactions]
                              .sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() -
                                  new Date(a.createdAt).getTime(),
                              )
                              .map((interaction) => (
                                <div
                                  key={interaction.id}
                                  className="relative flex gap-3"
                                >
                                  {/* Type icon */}
                                  <div
                                    className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${INTERACTION_TYPE_COLORS[interaction.type]} border-2 border-white`}
                                  >
                                    <InteractionTypeIcon type={interaction.type} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium">
                                        {INTERACTION_TYPE_LABELS[interaction.type]}
                                      </span>
                                      {interaction.direction && (
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] px-1.5 py-0 h-4 ${
                                            interaction.direction === 'INCOMING'
                                              ? 'border-sky-300 text-sky-600 bg-sky-50'
                                              : 'border-emerald-300 text-emerald-600 bg-emerald-50'
                                          }`}
                                        >
                                          {interaction.direction === 'INCOMING'
                                            ? 'Entrant'
                                            : 'Sortant'}
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                                        {fmtDateTime(interaction.createdAt)}
                                      </span>
                                    </div>
                                    {interaction.subject && (
                                      <p className="text-sm font-medium mt-0.5">
                                        {interaction.subject}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                      {interaction.content}
                                    </p>
                                    {interaction.conductorName && (
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        Par {interaction.conductorName}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Aucune interaction enregistrée
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cliquez sur "Ajouter une interaction" pour commencer.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </TabsContent>

                {/* ─── Tab 4: Documents (placeholder) ─── */}
                <TabsContent value="documents">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          icon: ClipboardList,
                          title: 'Dossier de candidature',
                          desc: 'Formulaire de candidature complet',
                          color: 'text-amber-600 bg-amber-50',
                        },
                        {
                          icon: FileBadge,
                          title: "Lettre d'admission",
                          desc: "Lettre officielle d'admission",
                          color: 'text-emerald-600 bg-emerald-50',
                        },
                        {
                          icon: Receipt,
                          title: "Reçu d'inscription",
                          desc: "Reçu de paiement d'inscription",
                          color: 'text-sky-600 bg-sky-50',
                        },
                        {
                          icon: GraduationCap,
                          title: 'Attestation',
                          desc: 'Attestation de scolarité ou inscription',
                          color: 'text-purple-600 bg-purple-50',
                        },
                      ].map((doc) => (
                        <Card
                          key={doc.title}
                          className="hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${doc.color}`}
                            >
                              <doc.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                {doc.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {doc.desc}
                              </p>
                            </div>
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Bientôt disponible — les documents pourront être générés automatiquement.
                    </p>
                  </div>
                </TabsContent>

                {/* ─── Tab 5: Historique ─── */}
                <TabsContent value="historique">
                  {isLoading ? (
                    <div className="space-y-4">
                      <TabSkeleton />
                      <TabSkeleton />
                    </div>
                  ) : p && p.interactions && p.interactions.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-5">
                        {/* Prospect creation */}
                        <div className="relative flex gap-4">
                          <div className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-emerald-500 bg-white border-2 border-current">
                            <CircleDot className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium">
                              Prospect créé — {statusLabels[p.status]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDateTime(p.createdAt)}
                            </p>
                            {p.source && (
                              <p className="text-xs text-muted-foreground">
                                Source : {sourceLabels[p.source]}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status-related interactions timeline */}
                        {[...p.interactions]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )
                          .map((interaction) => (
                            <div key={interaction.id} className="relative flex gap-4">
                              <div
                                className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white border-2 border-current ${INTERACTION_TYPE_COLORS[interaction.type]}`}
                              >
                                <InteractionTypeIcon type={interaction.type} />
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="text-sm font-medium">
                                  {INTERACTION_TYPE_LABELS[interaction.type]}
                                  {interaction.subject ? ` — ${interaction.subject}` : ''}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {fmtDateTime(interaction.createdAt)}
                                </p>
                                {interaction.conductorName && (
                                  <p className="text-xs text-muted-foreground">
                                    Par {interaction.conductorName}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : p ? (
                    <div className="relative">
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-5">
                        <div className="relative flex gap-4">
                          <div className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-emerald-500 bg-white border-2 border-current">
                            <CircleDot className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium">
                              Prospect créé — {statusLabels[p.status]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDateTime(p.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-6">
                        Aucun historique de modification disponible pour le moment.
                      </p>
                    </div>
                  ) : null}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* ─── Add Interaction Dialog ─── */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une interaction</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle interaction avec ce prospect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type */}
            <div className="space-y-2">
              <Label className="text-sm">Type *</Label>
              <Select
                value={interactionForm.type}
                onValueChange={(val) =>
                  setInteractionForm((prev) => ({
                    ...prev,
                    type: val as InteractionType,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(INTERACTION_TYPE_LABELS) as [
                      InteractionType,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label className="text-sm">Direction *</Label>
              <Select
                value={interactionForm.direction}
                onValueChange={(val) =>
                  setInteractionForm((prev) => ({
                    ...prev,
                    direction: val as InteractionDirection,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTGOING">Sortant</SelectItem>
                  <SelectItem value="INCOMING">Entrant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label className="text-sm">Objet (optionnel)</Label>
              <Input
                value={interactionForm.subject}
                onChange={(e) =>
                  setInteractionForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="Objet de l'interaction..."
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-sm">Contenu *</Label>
              <Textarea
                value={interactionForm.content}
                onChange={(e) =>
                  setInteractionForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Décrivez l'interaction..."
                className="min-h-[100px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInteractionDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddInteraction}
              disabled={
                !interactionForm.type ||
                !interactionForm.content.trim() ||
                addInteraction.isPending
              }
            >
              {addInteraction.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
