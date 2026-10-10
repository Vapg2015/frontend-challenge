/**
 * Shared form primitives for the Kurio forms (profile, wallets, checkout).
 * Visual language follows the Figma: dark inputs, 1px brown border, amber focus.
 */

import type { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export const fieldClass =
  'w-full h-8 bg-surface-card border border-border px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors disabled:opacity-60 read-only:opacity-70 aria-[invalid=true]:border-error';

export const labelClass = 'block text-xs text-text-primary mb-1.5';

/** a11y wiring between an input and its error message rendered by <Field /> */
export const errorProps = (id: string, error?: string) => ({
  'aria-invalid': error ? (true as const) : (false as const),
  'aria-describedby': error ? `${id}-error` : undefined,
});

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && (
          <span className="text-primary ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[10px] text-text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Native <select> with the Figma chevron (keeps keyboard + mobile behaviour for free) */
export function SelectBox({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(fieldClass, 'appearance-none pr-8 cursor-pointer', className)}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-text-primary"
        aria-hidden="true"
      />
    </div>
  );
}

export const primaryButtonClass =
  'inline-flex items-center justify-center bg-amber hover:bg-amber/90 text-ink font-bold text-xs h-9 px-6 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const WALLET_PROVIDERS = [
  { value: 'metamask', label: 'MetaMask' },
  { value: 'walletconnect', label: 'WalletConnect' },
  { value: 'coinbase', label: 'Coinbase Wallet' },
] as const;
