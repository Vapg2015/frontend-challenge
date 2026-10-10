/**
 * Wallet form fields (Figma "Carteiras" form).
 * Shared by the inline primary-wallet form, the "add" dialog and the "edit" dialog.
 */

import type { UseFormReturn } from 'react-hook-form';
import { Field, SelectBox, fieldClass, errorProps, WALLET_PROVIDERS } from '@/components/form/fields';
import { supportedNetworks } from '@/utils/networks';
import type { AddWalletInput } from '@/utils/validation';

interface WalletFormFieldsProps {
  form: UseFormReturn<AddWalletInput>;
  idPrefix: string;
  disabled?: boolean;
  /** Address and network identify the wallet and cannot change after creation */
  lockIdentity?: boolean;
}

export function WalletFormFields({ form, idPrefix, disabled, lockIdentity }: WalletFormFieldsProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = form;
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
      <Field id={id('displayName')} label="Nome de exibição" required error={errors.displayName?.message}>
        <input
          id={id('displayName')}
          className={fieldClass}
          disabled={disabled}
          autoComplete="name"
          {...errorProps(id('displayName'), errors.displayName?.message)}
          {...register('displayName')}
        />
      </Field>

      <Field id={id('name')} label="Apelido da carteira" required error={errors.name?.message}>
        <input
          id={id('name')}
          className={fieldClass}
          disabled={disabled}
          {...errorProps(id('name'), errors.name?.message)}
          {...register('name')}
        />
      </Field>

      <Field id={id('network')} label="Rede" required error={errors.network?.message}>
        <SelectBox
          id={id('network')}
          defaultValue=""
          disabled={disabled || lockIdentity}
          {...errorProps(id('network'), errors.network?.message)}
          {...register('network', {
            onChange: (e) => {
              const network = supportedNetworks.find((n) => n.id === e.target.value);
              if (network) setValue('chainId', network.chainId);
            },
          })}
        >
          <option value="" disabled>
            Selecione uma rede
          </option>
          {supportedNetworks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} ({n.symbol})
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field id={id('profileName')} label="Nome do perfil" required error={errors.profileName?.message}>
        <input
          id={id('profileName')}
          className={fieldClass}
          disabled={disabled}
          {...errorProps(id('profileName'), errors.profileName?.message)}
          {...register('profileName')}
        />
      </Field>

      <Field id={id('address')} label="Endereço da carteira" required error={errors.address?.message}>
        <input
          id={id('address')}
          placeholder="Endereço 0x da carteira"
          className={fieldClass}
          disabled={disabled}
          readOnly={lockIdentity}
          spellCheck={false}
          autoComplete="off"
          {...errorProps(id('address'), errors.address?.message)}
          {...register('address')}
        />
      </Field>

      <Field
        id={id('linkedAddress')}
        label="ENS ou carteira secundária"
        error={errors.linkedAddress?.message}
        className="md:mt-0"
      >
        <input
          id={id('linkedAddress')}
          placeholder="ENS ou carteira secundária (opcional)"
          className={fieldClass}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          {...errorProps(id('linkedAddress'), errors.linkedAddress?.message)}
          {...register('linkedAddress')}
        />
      </Field>

      <Field id={id('provider')} label="Tipo de carteira" required error={errors.provider?.message}>
        <SelectBox
          id={id('provider')}
          defaultValue=""
          disabled={disabled}
          {...errorProps(id('provider'), errors.provider?.message)}
          {...register('provider')}
        >
          <option value="" disabled>
            Selecione uma carteira
          </option>
          {WALLET_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field id={id('referralCode')} label="Código de indicação" required error={errors.referralCode?.message}>
        <input
          id={id('referralCode')}
          className={fieldClass}
          disabled={disabled}
          autoComplete="off"
          {...errorProps(id('referralCode'), errors.referralCode?.message)}
          {...register('referralCode')}
        />
      </Field>

      <Field id={id('email')} label="E-mail" required error={errors.email?.message}>
        <input
          id={id('email')}
          type="email"
          className={fieldClass}
          disabled={disabled}
          autoComplete="email"
          {...errorProps(id('email'), errors.email?.message)}
          {...register('email')}
        />
      </Field>

      <Field id={id('ensName')} label="Nome ENS" required error={errors.ensName?.message}>
        <div className="flex gap-1">
          <div className="w-24 flex-shrink-0">
            <SelectBox aria-label="Domínio ENS" disabled={disabled} {...register('ensDomain')}>
              <option value=".eth">.eth</option>
            </SelectBox>
          </div>
          <input
            id={id('ensName')}
            className={fieldClass}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            {...errorProps(id('ensName'), errors.ensName?.message)}
            {...register('ensName')}
          />
        </div>
      </Field>
    </div>
  );
}
