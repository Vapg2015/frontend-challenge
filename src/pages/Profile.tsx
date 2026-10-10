/**
 * Profile Page
 * Edit profile data, avatar, change password
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Eye, EyeOff, ChevronDown, ImageUp } from 'lucide-react';
import { useState } from 'react';
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@/utils/validation';
import { toastHelpers } from '@/hooks/useToast';

const fieldClass =
  'w-full h-10 bg-surface-card border border-border px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors disabled:opacity-60';
const labelClass = 'block text-xs text-text-primary mb-2';
const primaryBtn =
  'inline-flex items-center justify-center bg-amber hover:bg-amber/90 text-ink font-bold text-xs h-9 px-6 rounded-sm transition-colors disabled:opacity-50 cursor-pointer';

function Required() {
  return <span className="text-primary ml-0.5">*</span>;
}

function PasswordField({ id, label, error, registration, disabled }: {
  id: string;
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordInput>>['register']>;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${fieldClass} pr-10`}
          disabled={disabled}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-dark hover:text-amber"
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}

export function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading: authLoading } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile form
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  // Password form
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleProfileSubmit = async (data: UpdateProfileInput) => {
    try {
      await updateProfile(data);
      toastHelpers.success('Perfil atualizado com sucesso');
    } catch (err: any) {
      toastHelpers.error(err.response?.data?.message || 'Falha ao atualizar o perfil');
    }
  };

  const handlePasswordSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePassword(data);
      toastHelpers.success('Senha alterada com sucesso');
      passwordForm.reset();
    } catch (err: any) {
      toastHelpers.error(err.response?.data?.message || 'Falha ao alterar a senha');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      // In real app, upload to server
    }
  };

  const pwErrors = passwordForm.formState.errors;

  return (
    <div className="space-y-10">
      <h1 className="text-sm font-bold text-text-primary">Perfil do colecionador</h1>

      {/* Profile form */}
      <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className={labelClass}>Nome de exibição<Required /></label>
              <input id="name" className={fieldClass} disabled={authLoading} {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-xs text-error" role="alert">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>E-mail<Required /></label>
              <input id="email" type="email" className={fieldClass} value={user?.email ?? ''} disabled readOnly />
            </div>
            <div>
              <label htmlFor="walletAlias" className={labelClass}>Apelido da carteira<Required /></label>
              <input id="walletAlias" className={fieldClass} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="username" className={labelClass}>Nome de usuário<Required /></label>
              <input id="username" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="ens" className={labelClass}>Nome ENS<Required /></label>
              <div className="flex gap-1">
                <div className="relative w-24 flex-shrink-0">
                  <select
                    aria-label="Domínio ENS"
                    className={`${fieldClass} appearance-none pr-6`}
                    defaultValue=".eth"
                  >
                    <option value=".eth">.eth</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-primary" />
                </div>
                <input id="ens" className={fieldClass} />
              </div>
            </div>
            <div>
              <span className={labelClass}>Avatar</span>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 bg-surface-raised">
                  <AvatarImage src={avatarPreview || user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="bg-surface-raised text-amber">
                    <ImageUp className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <label className={primaryBtn}>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                  Alterar
                </label>
                <button type="button" onClick={() => setAvatarPreview(null)} className="text-xs text-text-primary hover:text-amber">
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className={primaryBtn} disabled={authLoading || profileForm.formState.isSubmitting}>
          {profileForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6 md:max-w-[calc(50%-1rem)]">
        <h2 className="text-sm font-bold text-text-primary">Alterar senha</h2>
        <PasswordField
          id="currentPassword"
          label="Senha atual"
          registration={passwordForm.register('currentPassword')}
          error={pwErrors.currentPassword?.message}
          disabled={authLoading}
        />
        <PasswordField
          id="newPassword"
          label="Nova senha"
          registration={passwordForm.register('newPassword')}
          error={pwErrors.newPassword?.message}
          disabled={authLoading}
        />
        <PasswordField
          id="confirmNewPassword"
          label="Confirmar nova senha"
          registration={passwordForm.register('confirmNewPassword')}
          error={pwErrors.confirmNewPassword?.message}
          disabled={authLoading}
        />
        <button type="submit" className={primaryBtn} disabled={authLoading || passwordForm.formState.isSubmitting}>
          {passwordForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </button>
      </form>
    </div>
  );
}