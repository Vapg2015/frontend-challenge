/**
 * Wallets Page
 * Manage primary and secondary wallets (Figma "Carteiras")
 */

import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WalletFormFields } from '@/components/wallet/WalletFormFields';
import { primaryButtonClass, WALLET_PROVIDERS } from '@/components/form/fields';
import { useAuth } from '@/hooks/useAuth';
import { formatAddress } from '@/utils/format';
import { api } from '@/api/axios';
import { queryKeys, invalidationHelpers } from '@/api/queryClient';
import { addWalletSchema, updateWalletSchema, type AddWalletInput, type UpdateWalletInput } from '@/utils/validation';
import { toastHelpers } from '@/hooks/useToast';
import type { Wallet, UpdateWalletRequest } from '@/api/contracts';

const EMPTY_VALUES: AddWalletInput = {
  type: 'secondary',
  address: '',
  network: '' as AddWalletInput['network'],
  chainId: 1,
  name: '',
  displayName: '',
  profileName: '',
  email: '',
  provider: '' as AddWalletInput['provider'],
  referralCode: '',
  ensName: '',
  ensDomain: '.eth',
  linkedAddress: '',
};

const providerLabel = (value?: string) => WALLET_PROVIDERS.find((p) => p.value === value)?.label;

/** Wallet -> form values (empty strings for missing optional data) */
function walletToFormValues(wallet: Wallet): AddWalletInput {
  return {
    type: wallet.type,
    address: wallet.address,
    network: wallet.network,
    chainId: wallet.chainId,
    name: wallet.name,
    displayName: wallet.displayName ?? '',
    profileName: wallet.profileName ?? '',
    email: wallet.email ?? '',
    provider: (wallet.provider ?? '') as AddWalletInput['provider'],
    referralCode: wallet.referralCode ?? '',
    ensName: wallet.ensName ?? '',
    ensDomain: wallet.ensDomain ?? '.eth',
    linkedAddress: wallet.linkedAddress ?? '',
  };
}

/** Only mutable data is sent when editing: address, network and type identify the wallet */
function toUpdatePayload(values: UpdateWalletInput): UpdateWalletRequest {
  return {
    name: values.name,
    isConnected: values.isConnected,
    displayName: values.displayName,
    profileName: values.profileName,
    email: values.email,
    provider: values.provider,
    referralCode: values.referralCode,
    ensName: values.ensName,
    ensDomain: values.ensDomain,
    linkedAddress: values.linkedAddress || undefined,
  };
}

export function WalletsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [sameAsPrimary, setSameAsPrimary] = useState(false);

  // Fetch wallets
  const { data: walletsResponse } = useQuery({
    queryKey: queryKeys.wallets('current'),
    queryFn: () => api.get<Wallet[]>('/wallets'),
  });

  const wallets = walletsResponse?.data || [];
  const primaryWallet = wallets.find((w) => w.type === 'primary');
  const secondaryWallets = wallets.filter((w) => w.type === 'secondary');

  const apiMessage = (err: any, fallback: string) => {
    const details = err.response?.data?.details as Record<string, string[]> | undefined;
    const first = details && Object.values(details).flat()[0];
    return first || err.response?.data?.message || fallback;
  };

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: (data: AddWalletInput) => api.post<Wallet>('/wallets', data),
    onSuccess: () => {
      invalidationHelpers.wallets(queryClient, 'current');
      setAddDialogOpen(false);
      toastHelpers.success('Carteira adicionada com sucesso');
    },
    onError: (err: any) => toastHelpers.error(apiMessage(err, 'Falha ao adicionar a carteira')),
  });

  // Update wallet mutation
  const updateWalletMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletRequest }) => api.patch<Wallet>(`/wallets/${id}`, data),
    onSuccess: () => {
      invalidationHelpers.wallets(queryClient, 'current');
      setEditDialogOpen(false);
      setWalletToEdit(null);
      toastHelpers.success('Carteira atualizada com sucesso');
    },
    onError: (err: any) => toastHelpers.error(apiMessage(err, 'Falha ao atualizar a carteira')),
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/wallets/${id}`),
    onSuccess: () => {
      invalidationHelpers.wallets(queryClient, 'current');
      toastHelpers.success('Carteira removida com sucesso');
    },
    onError: (err: any) => toastHelpers.error(apiMessage(err, 'Falha ao remover a carteira')),
  });

  // Forms ------------------------------------------------------------
  // Primary wallet: inline form. Creates the wallet when missing, edits it otherwise.
  const primaryForm = useForm<AddWalletInput>({
    resolver: zodResolver(addWalletSchema),
    defaultValues: { ...EMPTY_VALUES, type: 'primary' },
  });

  // Secondary wallet: add dialog
  const addForm = useForm<AddWalletInput>({
    resolver: zodResolver(addWalletSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Edit dialog (secondary wallets)
  const editForm = useForm<UpdateWalletInput>({
    resolver: zodResolver(updateWalletSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Keep the inline form in sync with the stored primary wallet; when there is none,
  // pre-fill what is already known from the collector profile.
  const primaryId = primaryWallet?.id;
  const primaryUpdatedAt = primaryWallet?.updatedAt;
  useEffect(() => {
    if (primaryWallet) {
      primaryForm.reset(walletToFormValues(primaryWallet));
    } else if (user && !primaryForm.formState.isDirty) {
      primaryForm.reset({
        ...EMPTY_VALUES,
        type: 'primary',
        displayName: user.name ?? '',
        profileName: user.username ?? '',
        email: user.email ?? '',
        ensName: user.ensName ?? '',
        ensDomain: user.ensDomain ?? '.eth',
        name: user.walletAlias ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, primaryUpdatedAt, user?.id]);

  const handlePrimarySubmit = (data: AddWalletInput) => {
    if (primaryWallet) {
      updateWalletMutation.mutate({ id: primaryWallet.id, data: toUpdatePayload(data) });
    } else {
      addWalletMutation.mutate({ ...data, type: 'primary', linkedAddress: data.linkedAddress || undefined });
    }
  };

  const handleAddSubmit = (data: AddWalletInput) => {
    addWalletMutation.mutate({ ...data, type: 'secondary', linkedAddress: data.linkedAddress || undefined });
  };

  const handleEditSubmit = (data: UpdateWalletInput) => {
    if (walletToEdit) {
      updateWalletMutation.mutate({ id: walletToEdit.id, data: toUpdatePayload(data) });
    }
  };

  const openAddSecondary = () => {
    // "Igual à carteira principal": reuse the collector data of the primary wallet
    const base: AddWalletInput =
      sameAsPrimary && primaryWallet
        ? { ...walletToFormValues(primaryWallet), type: 'secondary', address: '', name: '', linkedAddress: '' }
        : { ...EMPTY_VALUES, type: 'secondary' };
    addForm.reset(base);
    setAddDialogOpen(true);
  };

  const openEdit = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    editForm.reset({ ...walletToFormValues(wallet), isConnected: wallet.isConnected });
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza de que deseja remover esta carteira? Esta ação não pode ser desfeita.')) {
      deleteWalletMutation.mutate(id);
    }
  };

  const savingPrimary = primaryWallet ? updateWalletMutation.isPending : addWalletMutation.isPending;

  return (
    <div className="space-y-10">
      {/* Primary Wallet */}
      <section aria-labelledby="primary-wallet-title">
        <div className="flex items-start justify-between">
          <div>
            <h1 id="primary-wallet-title" className="text-sm font-bold text-text-primary">Carteira principal</h1>
            <p className="mt-1 text-[11px] text-text-secondary">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
          </div>
          {!primaryWallet && (
            <button
              type="button"
              onClick={() => primaryForm.setFocus('displayName')}
              className="text-xs font-bold text-amber hover:underline"
            >
              Adicionar
            </button>
          )}
        </div>

        <form onSubmit={primaryForm.handleSubmit(handlePrimarySubmit)} className="mt-6 space-y-6" noValidate>
          <WalletFormFields
            form={primaryForm}
            idPrefix="primary"
            disabled={savingPrimary}
            lockIdentity={!!primaryWallet}
          />
          <button type="submit" className={primaryButtonClass} disabled={savingPrimary}>
            {savingPrimary ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar carteira'}
          </button>
        </form>
      </section>

      {/* Secondary Wallets */}
      <section aria-labelledby="secondary-wallet-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="secondary-wallet-title" className="text-sm font-bold text-text-primary">Carteira secundária</h2>
            {secondaryWallets.length === 0 && (
              <p className="mt-1 text-[11px] text-text-secondary">Você ainda não adicionou uma carteira secundária.</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-primary">
            <label
              className={`flex items-center gap-2 ${primaryWallet ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              title={primaryWallet ? undefined : 'Cadastre a carteira principal primeiro'}
            >
              <input
                type="checkbox"
                className="h-3 w-3 accent-amber"
                checked={sameAsPrimary}
                disabled={!primaryWallet}
                onChange={(e) => setSameAsPrimary(e.target.checked)}
              />
              Igual à carteira principal
            </label>
            <button type="button" onClick={openAddSecondary} className="text-xs font-bold text-amber hover:underline">
              Adicionar
            </button>
          </div>
        </div>

        {secondaryWallets.length > 0 && (
          <ul className="mt-4 space-y-2">
            {secondaryWallets.map((wallet) => (
              <li key={wallet.id} className="flex items-center justify-between gap-4 bg-surface-card px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-text-primary">{wallet.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                    {formatAddress(wallet.address)}
                    <span className="capitalize">· {wallet.network}</span>
                    {providerLabel(wallet.provider) && <span>· {providerLabel(wallet.provider)}</span>}
                    {wallet.isConnected && <span className="text-success">· Conectada</span>}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button type="button" onClick={() => openEdit(wallet)} aria-label={`Editar ${wallet.name}`} className="p-2 text-amber hover:text-primary-light">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(wallet.id)} aria-label={`Remover ${wallet.name}`} className="p-2 text-text-muted hover:text-error">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add secondary wallet */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-surface-card border-b-8 border-amber">
          <DialogHeader>
            <DialogTitle>Adicionar carteira secundária</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-6" noValidate>
            <WalletFormFields form={addForm} idPrefix="add" disabled={addWalletMutation.isPending} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={addWalletMutation.isPending}>
                Cancelar
              </Button>
              <button type="submit" className={primaryButtonClass} disabled={addWalletMutation.isPending}>
                {addWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar carteira'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit secondary wallet */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-surface-card border-b-8 border-amber">
          <DialogHeader>
            <DialogTitle>Editar carteira</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6" noValidate>
            {/* UpdateWalletInput is AddWalletInput + isConnected, so the field set is the same */}
            <WalletFormFields
              form={editForm as unknown as UseFormReturn<AddWalletInput>}
              idPrefix="edit"
              disabled={updateWalletMutation.isPending}
              lockIdentity
            />
            <label className="flex cursor-pointer items-center gap-2 text-xs text-text-primary">
              <input type="checkbox" className="h-3 w-3 accent-amber" {...editForm.register('isConnected')} />
              Carteira conectada
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={updateWalletMutation.isPending}>
                Cancelar
              </Button>
              <button type="submit" className={primaryButtonClass} disabled={updateWalletMutation.isPending}>
                {updateWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}