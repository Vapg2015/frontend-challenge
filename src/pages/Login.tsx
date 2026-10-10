/**
 * Login Page
 * Authentication form with validation
 */

import { useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { loginSchema, type LoginInput } from '@/utils/validation';

const fieldClass =
  'w-full h-10 bg-surface-dark border border-border-soft px-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/50 transition-all rounded-sm disabled:opacity-60';

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  // Kept so the `redirect` search param stays validated by the router
  useSearch({ strict: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data);
      // Redirect handled by login function
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha no login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="w-full">
      <h1 className="sr-only">Entrar</h1>
      <p className="text-center text-[10px] leading-relaxed text-text-primary mb-5 px-2">
        Entre para gerenciar sua carteira, coleção e perfil de criador.
      </p>

      {error && (
        <div role="alert" className="mb-4 p-3 border border-error/60 bg-error/10 text-[11px] text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="contato@exemplo.com"
            {...register('email')}
            className={cn(fieldClass, errors.email && 'border-error focus:border-error focus:ring-error/50')}
            disabled={isSubmitting || authLoading}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-[10px] text-error" role="alert">{errors.email.message}</p>
          )}
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
              disabled={isSubmitting || authLoading}
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
          {errors.password && (
            <p id="password-error" className="mt-1 text-[10px] text-error" role="alert">{errors.password.message}</p>
          )}
        </div>

        <div className="text-right">
          <a href="/auth/forgot-password" className="text-[10px] text-amber hover:underline">
            Esqueceu a senha?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="mt-6 flex w-full items-center justify-center h-12 bg-amber hover:bg-amber/90 text-ink font-extrabold text-sm uppercase tracking-widest rounded-sm transition-all shadow-[0_4px_14px_rgba(227,164,78,0.3)] hover:shadow-[0_6px_20px_rgba(227,164,78,0.5)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isSubmitting || authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
        </button>
      </form>
    </div>
  );
}