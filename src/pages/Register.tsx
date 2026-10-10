/**
 * Register Page
 * Account creation form with validation
 */

import { useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { registerSchema, type RegisterInput } from '@/utils/validation';

const fieldClass =
  'w-full h-10 bg-surface-dark border border-border-soft px-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/50 transition-all rounded-sm disabled:opacity-60';

export function RegisterPage() {
  const { register: registerUser, isLoading: authLoading } = useAuth();
  // Kept so the `redirect` search param stays validated by the router
  useSearch({ strict: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      // Terms are accepted implicitly by creating an account (no checkbox in the design)
      terms: true,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      await registerUser(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha no cadastro. Tente novamente.');
    }
  };

  const busy = isSubmitting || authLoading;

  return (
    <div className="w-full">
      <h1 className="sr-only">Criar conta</h1>
      <p className="text-center text-[10px] leading-relaxed text-text-primary mb-5 px-2">
        Crie seu perfil de colecionador e conecte uma carteira quando quiser.
      </p>

      {error && (
        <div role="alert" className="mb-4 p-3 border border-error/60 bg-error/10 text-[11px] text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Nome de usuário</label>
          <input
            id="name"
            placeholder="Seu nome de usuário"
            {...register('name')}
            className={cn(fieldClass, errors.name && 'border-error focus:border-error focus:ring-error/50')}
            disabled={busy}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="mt-1 text-[10px] text-error" role="alert">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="contato@exemplo.com"
            {...register('email')}
            className={cn(fieldClass, errors.email && 'border-error focus:border-error focus:ring-error/50')}
            disabled={busy}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="mt-1 text-[10px] text-error" role="alert">{errors.email.message}</p>}
        </div>

        {/* Campos visuais mencionados pelo usuário */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ens" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Nome ENS <span className="text-[9px] text-text-muted/50">(Visual)</span></label>
            <input
              id="ens"
              placeholder="ex: kurio.eth"
              className={fieldClass}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="referral" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Cód. Indicação</label>
            <input
              id="referral"
              placeholder="Opcional"
              className={fieldClass}
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              {...register('password')}
              className={cn(fieldClass, 'pr-9', errors.password && 'border-error')}
              disabled={busy}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-dark hover:text-amber"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          {errors.password && <p id="password-error" className="mt-1 text-[10px] text-error" role="alert">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">Confirmar senha</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar senha"
              {...register('confirmPassword')}
              className={cn(fieldClass, 'pr-9', errors.confirmPassword && 'border-error')}
              disabled={busy}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-dark hover:text-amber"
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmPassword ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-[10px] text-error" role="alert">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center h-12 bg-amber hover:bg-amber/90 text-ink font-extrabold text-sm uppercase tracking-widest rounded-sm transition-all shadow-[0_4px_14px_rgba(227,164,78,0.3)] hover:shadow-[0_6px_20px_rgba(227,164,78,0.5)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}