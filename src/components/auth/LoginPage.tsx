'use client';

import { useState, useEffect, useCallback, useRef, type FormEvent, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ArrowLeft,
  GraduationCap,
  Globe,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldOff,
  ServerCrash,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRAND = {
  bordeau: '#8B1C2D',
  bordeauHover: '#6B1522',
  navy: '#1A2B4A',
  or: '#FFA500',
  argent: '#C0C0C0',
} as const;

const YEAR = new Date().getFullYear();
const IPVE_LOGO_URL = 'https://ik.imagekit.io/damts929ip/IPVE/log_ipve';

// ---------------------------------------------------------------------------
// Zod Schema with detailed validation
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Veuillez saisir votre adresse email')
    .email('Format d\'email invalide (ex: nom@ipve.edu.ci)'),
  password: z
    .string()
    .min(1, 'Veuillez saisir votre mot de passe')
    .min(4, 'Le mot de passe doit contenir au moins 4 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Real-time validation helpers
// ---------------------------------------------------------------------------

function validateEmailRealtime(value: string): { valid: boolean; hint: string } {
  if (!value || value.length === 0) return { valid: false, hint: '' };
  if (value.length < 3) return { valid: false, hint: 'Email trop court' };
  if (!value.includes('@')) return { valid: false, hint: 'Il manque le @' };
  const domain = value.split('@')[1];
  if (!domain) return { valid: false, hint: 'Il manque le domaine' };
  if (!domain.includes('.')) return { valid: false, hint: 'Domaine incomplet' };
  if (domain.endsWith('.')) return { valid: false, hint: 'Domaine invalide' };
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(value)) return { valid: false, hint: 'Format d\'email invalide' };
  return { valid: true, hint: 'Email valide' };
}

function validatePasswordRealtime(value: string): { strength: number; hints: string[] } {
  if (!value || value.length === 0) return { strength: 0, hints: [] };

  const hints: string[] = [];
  let score = 0;

  if (value.length >= 4) score += 1;
  if (value.length >= 8) {
    score += 1;
    hints.push('8+ caractères');
  }
  if (/[A-Z]/.test(value)) {
    score += 1;
    hints.push('Majuscule');
  }
  if (/[0-9]/.test(value)) {
    score += 1;
    hints.push('Chiffre');
  }
  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1;
    hints.push('Caractère spécial');
  }

  return { strength: score, hints };
}

const strengthLabels = ['', 'Faible', 'Passable', 'Bon', 'Fort', 'Très fort'];
const strengthColors = [
  '',
  'bg-red-400',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-emerald-400',
  'bg-emerald-500',
];
const strengthTextColors = [
  '',
  'text-red-500',
  'text-orange-500',
  'text-yellow-600',
  'text-emerald-600',
  'text-emerald-700',
];

// ---------------------------------------------------------------------------
// Error banner component with contextual icon
// ---------------------------------------------------------------------------

type ErrorType = 'credentials' | 'inactive' | 'rate_limit' | 'server' | 'generic';

function getErrorType(message: string): ErrorType {
  if (!message) return 'generic';
  const lower = message.toLowerCase();
  if (lower.includes('email ou mot de passe') || lower.includes('incorrect') || lower.includes('identifiant'))
    return 'credentials';
  if (lower.includes('désactivé') || lower.includes('inactif')) return 'inactive';
  if (lower.includes('tentatives') || lower.includes('réessayez') || lower.includes('minutes'))
    return 'rate_limit';
  if (lower.includes('serveur') || lower.includes('interne')) return 'server';
  return 'generic';
}

function ErrorBanner({ message }: { message: string }) {
  const errorType = getErrorType(message);

  const config = {
    credentials: {
      icon: XCircle,
      borderColor: 'border-red-300',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      title: 'Identifiants incorrects',
      advice: 'Vérifiez votre email et votre mot de passe, puis réessayez.',
    },
    inactive: {
      icon: ShieldOff,
      borderColor: 'border-amber-300',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      title: 'Compte désactivé',
      advice: 'Votre compte a été désactivé. Contactez l\'administration.',
    },
    rate_limit: {
      icon: Clock,
      borderColor: 'border-orange-300',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      title: 'Trop de tentatives',
      advice: 'Patientez quelques minutes avant de réessayer.',
    },
    server: {
      icon: ServerCrash,
      borderColor: 'border-slate-300',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      title: 'Erreur serveur',
      advice: 'Un problème technique est survenu. Réessayez plus tard.',
    },
    generic: {
      icon: AlertCircle,
      borderColor: 'border-red-300',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      title: 'Erreur',
      advice: message,
    },
  }[errorType];

  const Icon = config.icon;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={cn('rounded-xl border p-4', config.borderColor, config.bgColor)}>
        <div className="flex gap-3">
          <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.textColor)} />
          <div className="flex flex-col gap-1 min-w-0">
            <p className={cn('text-sm font-semibold', config.textColor)}>{config.title}</p>
            <p className={cn('text-xs leading-relaxed', config.textColor, 'opacity-80')}>
              {config.advice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left Branding Panel
// ---------------------------------------------------------------------------

function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col items-center justify-between text-white overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${BRAND.bordeau} 0%, ${BRAND.navy} 60%, #0f1d35 100%)`,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 h-[28rem] w-[28rem] rounded-full opacity-[0.06]"
          style={{ background: BRAND.or }}
        />
        <div
          className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-[0.04]"
          style={{ background: 'white' }}
        />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${BRAND.or}, transparent)` }} />
      </div>

      {/* Top: Logo + School name */}
      <div className="relative z-10 flex flex-col items-center pt-12 xl:pt-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-lg">
          <img src="/logo-ipve.png" alt="IPVE" className="h-12 w-auto" />
        </div>
        <div className="mt-4 space-y-2">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight">IPVE Digital</h1>
          <div className="mx-auto h-1 w-12 rounded-full" style={{ background: BRAND.or }} />
          <p className="text-sm xl:text-base font-light tracking-wide text-white/75">
            Institut Polytechnique Vase d'Élites
          </p>
        </div>
      </div>

      {/* Center: Illustration */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-6 my-4">
        <img
          src={IPVE_LOGO_URL}
          alt="Étudiants IPVE"
          className="h-full w-full max-w-md xl:max-w-lg object-contain drop-shadow-2xl"
          style={{ filter: 'brightness(1.05) contrast(1.05)' }}
        />
      </div>

      {/* Bottom: Feature highlights + copyright */}
      <div className="relative z-10 w-full max-w-sm xl:max-w-md px-8 pb-12 xl:pb-16">
        <div className="space-y-2.5 text-left text-sm text-white/70">
          {[
            { icon: GraduationCap, label: 'Gestion scolaire complète' },
            { icon: Shield, label: 'Sécurité avancée avec 2FA' },
            { icon: Globe, label: 'Accessible depuis ipve.edu.ci' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${BRAND.or}20` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: BRAND.or }} />
              </div>
              <span className="text-xs xl:text-sm">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[11px] text-white/30">
          © {YEAR} IPVE Digital — ipve.edu.ci
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Form (Step 1)
// ---------------------------------------------------------------------------

function LoginForm() {
  const requires2FA = useAuthStore((s) => s.requires2FA);
  const { login, loginError, clearError, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const watchedEmail = useWatch({ control, name: 'email' }) ?? '';
  const watchedPassword = useWatch({ control, name: 'password' }) ?? '';

  // Real-time email validation
  const emailValidation = useMemo(() => validateEmailRealtime(watchedEmail), [watchedEmail]);

  // Real-time password validation
  const passwordValidation = useMemo(() => validatePasswordRealtime(watchedPassword), [watchedPassword]);

  // Show validation hints only after user starts typing
  const showEmailValidation = emailTouched && watchedEmail.length > 0;
  const showPasswordValidation = passwordTouched && watchedPassword.length > 0;

  // Show toast on login error — only when login form is visible
  const prevLoginErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (requires2FA) {
      prevLoginErrorRef.current = null;
      return;
    }
    if (loginError && loginError !== prevLoginErrorRef.current) {
      prevLoginErrorRef.current = loginError;
      const errorType = getErrorType(loginError);
      const toastConfig: Record<ErrorType, { title: string; description: string }> = {
        credentials: { title: 'Identifiants incorrects', description: 'Vérifiez votre email et votre mot de passe.' },
        inactive: { title: 'Compte désactivé', description: 'Contactez l\'administration.' },
        rate_limit: { title: 'Trop de tentatives', description: 'Patientez quelques minutes avant de réessayer.' },
        server: { title: 'Erreur serveur', description: 'Un problème technique est survenu.' },
        generic: { title: 'Erreur', description: loginError },
      };
      const cfg = toastConfig[errorType];
      toast.error(`${cfg.title} : ${cfg.description}`);
    }
    if (!loginError) prevLoginErrorRef.current = null;
  }, [loginError, requires2FA]);

  // Clear server error when user modifies fields
  useEffect(() => {
    if (loginError) clearError();
  }, [watchedEmail, watchedPassword, loginError, clearError]);

  // Trigger validation on blur
  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    trigger('email');
  }, [trigger]);

  const handlePasswordBlur = useCallback(() => {
    setPasswordTouched(true);
    trigger('password');
  }, [trigger]);

  const onSubmit = async (data: LoginFormData) => {
    setEmailTouched(true);
    setPasswordTouched(true);
    await login(data.email, data.password);
  };

  // Field border color logic
  const emailFieldState = errors.email
    ? 'border-red-400 focus-visible:ring-red-400/30'
    : showEmailValidation && emailValidation.valid
      ? 'border-emerald-400 focus-visible:ring-emerald-400/30'
      : showEmailValidation && !emailValidation.valid
        ? 'border-amber-400 focus-visible:ring-amber-400/30'
        : '';

  const passwordFieldState = errors.password
    ? 'border-red-400 focus-visible:ring-red-400/30'
    : showPasswordValidation && passwordValidation.strength >= 3
      ? 'border-emerald-400 focus-visible:ring-emerald-400/30'
      : showPasswordValidation && passwordValidation.strength > 0 && passwordValidation.strength < 3
        ? 'border-amber-400 focus-visible:ring-amber-400/30'
        : '';

  return (
    <div className="flex w-full flex-col items-center">
      {/* Mobile logo */}
      <div className="flex flex-col items-center space-y-2 mb-6 lg:hidden">
        <img src="/logo-ipve.png" alt="IPVE" className="h-14 w-auto" />
        <h1 className="text-xl font-bold" style={{ color: BRAND.bordeau }}>IPVE Digital</h1>
      </div>

      <Card className="w-full border border-border/60 shadow-xl rounded-2xl">
        <CardHeader className="space-y-2 pb-4 text-center px-6 pt-6">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            Connexion
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Accédez à votre espace IPVE Digital
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@ipve.edu.ci"
                  disabled={isLoading}
                  autoComplete="email"
                  className={cn('pl-10 h-11 text-sm transition-colors', emailFieldState)}
                  {...register('email', { onBlur: handleEmailBlur })}
                />
                {/* Validation indicator */}
                {showEmailValidation && !errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-in fade-in zoom-in duration-200">
                      {emailValidation.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Email validation hints */}
              {showEmailValidation && !errors.email && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className={cn(
                    'text-xs transition-colors',
                    emailValidation.valid ? 'text-emerald-600' : 'text-amber-600',
                  )}>
                    {emailValidation.hint}
                  </p>
                </div>
              )}
              {/* Zod validation error */}
              {errors.email && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
                </div>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className={cn('pl-10 pr-10 h-11 text-sm transition-colors', passwordFieldState)}
                  {...register('password', { onBlur: handlePasswordBlur })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password strength bar */}
              {showPasswordValidation && !errors.password && watchedPassword.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          level <= passwordValidation.strength
                            ? strengthColors[passwordValidation.strength]
                            : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  {passwordValidation.strength > 0 && (
                    <div className="flex items-center justify-between">
                      <p className={cn('text-xs font-medium', strengthTextColors[passwordValidation.strength])}>
                        {strengthLabels[passwordValidation.strength]}
                      </p>
                      {passwordValidation.hints.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {passwordValidation.hints.join(' · ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Zod validation error */}
              {errors.password && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
                </div>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Se souvenir de moi
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-white transition-all rounded-lg mt-1 font-medium"
              style={{ backgroundColor: BRAND.bordeau }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget.style.backgroundColor = BRAND.bordeauHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.bordeau;
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-0 border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            © {YEAR} IPVE Digital — ipve.edu.ci
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2FA Form (Step 2)
// ---------------------------------------------------------------------------

function TwoFAForm() {
  const requires2FA = useAuthStore((s) => s.requires2FA);
  const { verify2FA, loginError, clearError, isLoading } = useAuthStore();
  const [otp, setOtp] = useState('');

  // Show toast on 2FA error — only when 2FA form is actually visible
  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requires2FA) {
      prevErrorRef.current = null;
      return;
    }
    if (loginError && loginError !== prevErrorRef.current) {
      prevErrorRef.current = loginError;
      toast.error(`Code invalide : ${loginError}`);
    }
    if (!loginError) prevErrorRef.current = null;
  }, [loginError, requires2FA]);

  const handleBack = useCallback(() => {
    clearError();
    useAuthStore.setState({ requires2FA: false, pending2FA: null });
    setOtp('');
  }, [clearError]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length === 6 && !isLoading) {
        await verify2FA(code);
      }
    },
    [verify2FA, isLoading],
  );

  const handleChange = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      setOtp(digits);
      if (digits.length === 6) {
        handleVerify(digits);
      }
    },
    [handleVerify],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleVerify(otp);
    },
    [handleVerify, otp],
  );

  return (
    <div className="flex w-full flex-col items-center">
      {/* Mobile logo */}
      <div className="flex flex-col items-center space-y-2 mb-6 lg:hidden">
        <img src="/logo-ipve.png" alt="IPVE" className="h-14 w-auto" />
      </div>

      <Card className="w-full border border-border/60 shadow-xl rounded-2xl">
        <CardHeader className="space-y-2 pb-4 text-center px-6 pt-6">
          {/* Desktop-only logo */}
          <div className="mb-2 hidden lg:flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${BRAND.bordeau}10` }}
            >
              <Shield className="h-7 w-7" style={{ color: BRAND.bordeau }} />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            Double Authentification
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Saisissez le code à 6 chiffres de votre application
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div className="flex justify-center py-3">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleChange}
                disabled={isLoading}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Hint */}
            <p className="text-center text-xs text-muted-foreground">
              Le code se rafraîchit automatiquement toutes les 30 secondes
            </p>

            {/* Verify button */}
            <Button
              type="submit"
              disabled={otp.length < 6 || isLoading}
              className="w-full h-11 text-white transition-all rounded-lg font-medium"
              style={{ backgroundColor: BRAND.bordeau }}
              onMouseEnter={(e) => {
                if (!isLoading && otp.length >= 6)
                  (e.currentTarget.style.backgroundColor = BRAND.bordeauHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.bordeau;
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification en cours…
                </>
              ) : (
                'Vérifier'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3 border-t px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>

          <p className="text-xs text-muted-foreground">
            © {YEAR} IPVE Digital — ipve.edu.ci
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main LoginPage Component
// ---------------------------------------------------------------------------

export function LoginPage() {
  const requires2FA = useAuthStore((s) => s.requires2FA);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 lg:flex-row">
      {/* Left branding panel — desktop only */}
      <BrandingPanel />

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
        {/* Animated transition between steps */}
        <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
          {/* Step 1: Login Form */}
          <div
            className={cn(
              'w-full transition-all duration-300 ease-in-out',
              requires2FA
                ? 'pointer-events-none absolute inset-0 scale-95 opacity-0'
                : 'relative scale-100 opacity-100',
            )}
          >
            <LoginForm />
          </div>

          {/* Step 2: 2FA Form */}
          <div
            className={cn(
              'w-full transition-all duration-300 ease-in-out',
              requires2FA
                ? 'relative scale-100 opacity-100'
                : 'pointer-events-none absolute inset-0 scale-95 opacity-0',
            )}
          >
            <TwoFAForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
