/**
 * Checkout Page
 * Collector data, wallet selection, network selection, review and submit
 * Visual: single page, two columns (Figma)
 */

import { Navigate, useNavigate, Link } from '@tanstack/react-router';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { formatETH, formatAddress } from '@/utils/format';
import { Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { queryKeys } from '@/api/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateIdempotencyKey, storeIdempotencyKey, getIdempotencyKeyData, checkForPendingOrderRecovery, markIdempotencyKeyCompleted } from '@/utils/idempotency';
import { supportedNetworks } from '@/utils/networks';
import type { QuoteResponse, CreateOrderRequest, CollectorInfo, Wallet, Order } from '@/api/contracts';

const fieldClass =
  'w-full h-8 bg-surface-card border border-border px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors';
const labelClass = 'block text-xs text-text-primary mb-1.5';

function Required() {
  return <span className="text-primary ml-0.5">*</span>;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getQuote, isEmpty } = useCart();
  const { user } = useAuth();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [collectorInfo, setCollectorInfo] = useState<CollectorInfo>({
    email: user?.email || '',
    name: user?.name || '',
    address: '',
  });
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [acknowledgedTotal, setAcknowledgedTotal] = useState<string | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);

  // Wallets registered by the collector
  const { data: walletsResponse } = useQuery({
    queryKey: queryKeys.wallets('current'),
    queryFn: ({ signal }) => api.get<Wallet[]>('/wallets', { signal }),
    enabled: !!user,
  });
  const wallets = walletsResponse?.data ?? [];

  // Check for pending order recovery
  useEffect(() => {
    const recovery = checkForPendingOrderRecovery();
    if (recovery) {
      const storedKey = recovery.key;
      const keyData = getIdempotencyKeyData(storedKey);
      if (keyData) {
        setIdempotencyKey(storedKey);
        // Optionally pre-fill form with keyData
      }
    }
  }, []);

  // Fetch quote when cart or wallet changes (the API quote is the reference for the order)
  const cartItemCount = cart?.items.length ?? 0;
  useEffect(() => {
    let cancelled = false;
    const fetchQuote = async () => {
      if (cartItemCount === 0) return;
      const selected = wallets.find((w) => w.id === selectedWalletId);
      const q = selected ? await getQuote(selected.address, selectedNetwork) : await getQuote();
      if (!cancelled) setQuote(q);
    };
    fetchQuote();
    return () => {
      cancelled = true;
    };
  }, [cart, cartItemCount, selectedWalletId, selectedNetwork, wallets, getQuote]);

  // A changed total invalidates a previous acknowledgement: the user must confirm again
  useEffect(() => {
    if (quote && acknowledgedTotal !== null && quote.total !== acknowledgedTotal) {
      setTermsAccepted(false);
      setAcknowledgedTotal(null);
      setPriceChanged(true);
    }
  }, [quote, acknowledgedTotal]);

  // Auto-select first wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      const primaryWallet = wallets.find(w => w.type === 'primary') || wallets[0];
      setSelectedWalletId(primaryWallet.id);
      setSelectedNetwork(primaryWallet.network);
    }
  }, [wallets]);

  // Submit order
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const response = await api.post<Order>('/orders', orderData);
      return response.data;
    },
    onSuccess: (order) => {
      markIdempotencyKeyCompleted(idempotencyKey, order.id);
      // The order page renders pending / confirmed / rejected and follows order.updated
      navigate({ to: '/order/$id', params: { id: order.id } });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Falha ao criar o pedido');
      setSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!quote) {
      setError('Aguarde o carregamento da cotação');
      return;
    }

    if (!selectedWalletId) {
      setError('Selecione uma carteira');
      return;
    }

    if (!termsAccepted) {
      setError('Você precisa aceitar os termos e condições');
      return;
    }

    if (submitting || createOrderMutation.isPending) return; // ignore repeated clicks
    setSubmitting(true);

    // Reuse the key only for the very same quote; a different quote is a different purchase
    const previous = idempotencyKey ? getIdempotencyKeyData(idempotencyKey) : null;
    const key = previous && previous.quoteId === quote.quoteId ? idempotencyKey : generateIdempotencyKey();
    setIdempotencyKey(key);

    // Store idempotency key with order data
    storeIdempotencyKey(key, {
      quoteId: quote.quoteId,
      items: cart?.items.map(item => ({ nftId: item.nftId, quantity: item.quantity })) || [],
      walletAddress: wallets.find(w => w.id === selectedWalletId)?.address || '',
      network: selectedNetwork,
      collectorInfo,
    });

    try {
      await createOrderMutation.mutateAsync({
        idempotencyKey: key,
        quoteId: quote.quoteId,
        walletAddress: wallets.find(w => w.id === selectedWalletId)?.address || '',
        network: selectedNetwork,
        collectorInfo,
      });
    } catch {
      // Error handled by mutation
    }
  };

  if (isEmpty && !submitting) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-12">
      {/* Breadcrumb */}
      <div className="text-xs font-bold text-text-primary mb-6">
        <Link to="/" className="hover:text-amber transition-colors">Início</Link> /{' '}
        <span>Mercado</span> / <span>Pagamento</span>
      </div>

      {priceChanged && (
        <div className="mb-4 flex items-center gap-3 p-3 border border-amber/60 bg-amber/10 text-xs text-amber" role="alert">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>O preço ou a disponibilidade mudou. Revise o novo total e confirme novamente.</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-3 p-3 border border-error/60 bg-error/10 text-xs text-error">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        {/* Left: collector form */}
        <section aria-labelledby="collector-title">
          <h1 id="collector-title" className="text-sm font-bold text-text-primary mb-4">Perfil do colecionador</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Nome de exibição<Required /></label>
              <input
                id="name"
                className={fieldClass}
                value={collectorInfo.name}
                onChange={(e) => setCollectorInfo({ ...collectorInfo, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="username" className={labelClass}>Nome de usuário<Required /></label>
              <input id="username" className={fieldClass} />
            </div>

            <div>
              <label htmlFor="network" className={labelClass}>Rede<Required /></label>
              <div className="relative">
                <select
                  id="network"
                  className={`${fieldClass} appearance-none pr-8`}
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                >
                  {supportedNetworks.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.symbol})</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-primary" />
              </div>
            </div>
            <div>
              <label htmlFor="profileName" className={labelClass}>Nome do perfil<Required /></label>
              <input id="profileName" className={fieldClass} />
            </div>

            <div>
              <label htmlFor="address" className={labelClass}>Endereço da carteira<Required /></label>
              <input
                id="address"
                className={fieldClass}
                placeholder="Endereço 0x da carteira"
                value={collectorInfo.address}
                onChange={(e) => setCollectorInfo({ ...collectorInfo, address: e.target.value })}
              />
            </div>
            <div className="sm:pt-6">
              <input
                aria-label="ENS ou carteira secundária"
                className={fieldClass}
                placeholder="ENS ou carteira secundária (opcional)"
              />
            </div>

            <div>
              <label htmlFor="walletType" className={labelClass}>Tipo de carteira<Required /></label>
              <div className="relative">
                <select id="walletType" className={`${fieldClass} appearance-none pr-8`} defaultValue="">
                  <option value="" disabled>Selecione uma carteira</option>
                  <option value="metamask">MetaMask</option>
                  <option value="walletconnect">WalletConnect</option>
                  <option value="coinbase">Coinbase Wallet</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-primary" />
              </div>
            </div>
            <div>
              <label htmlFor="referral" className={labelClass}>Código de indicação<Required /></label>
              <input id="referral" className={fieldClass} />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>E-mail<Required /></label>
              <input
                id="email"
                type="email"
                className={fieldClass}
                value={collectorInfo.email}
                onChange={(e) => setCollectorInfo({ ...collectorInfo, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="ens" className={labelClass}>Nome ENS<Required /></label>
              <div className="relative w-20">
                <select id="ens" className={`${fieldClass} appearance-none pr-6`} defaultValue=".eth">
                  <option value=".eth">.eth</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-primary" />
              </div>
            </div>
          </div>

          <label className="mt-6 flex items-center gap-2 text-xs text-text-primary cursor-pointer">
            <input type="checkbox" className="accent-amber h-3 w-3" />
            Usar outra carteira?
          </label>

          <div className="mt-6 max-w-xs">
            <label htmlFor="notes" className={labelClass}>Observação do colecionador (opcional)</label>
            <textarea
              id="notes"
              rows={6}
              className="w-full bg-surface-card border border-border p-3 text-xs text-text-primary focus:outline-none focus:border-amber transition-colors resize-none"
            />
          </div>
        </section>

        {/* Right: order summary */}
        <aside aria-labelledby="summary-title">
          <h2 id="summary-title" className="text-xs font-bold text-text-primary mb-2">Seus NFTs</h2>
          <div className="flex justify-between text-xs font-bold text-text-primary pb-1 border-b border-border-soft">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>

          <ul className="mt-3 space-y-2">
            {cart?.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 bg-surface-card pr-3">
                <img src={item.nft.imageUrl} alt={item.nft.name} className="h-12 w-12 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{item.nft.name}</p>
                  <p className="text-[10px] text-primary-dark truncate">ID do token: #{item.nft.tokenId || '0000'}</p>
                </div>
                <span className="text-[10px] text-text-secondary">(x {item.quantity})</span>
                <span className="text-xs font-bold text-amber w-20 text-right">{formatETH(item.totalPrice)}</span>
              </li>
            ))}
          </ul>

          <Link to="/cart" className="block text-center text-[10px] text-text-primary my-3 hover:text-amber">
            Tem um código promocional? Aplique aqui
          </Link>

          {quote && (
            <div className="space-y-2 text-xs text-text-primary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatETH(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto do lançamento</span>
                <span>(-) {formatETH(quote.discount || '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de rede</span>
                <span>{formatETH(quote.networkFee)}</span>
              </div>
              <p className="text-center text-[10px] text-text-coral">Taxa estimada</p>
              <div className="flex justify-between items-center pt-2 border-t border-border-soft font-bold">
                <span>Total</span>
                <span className="text-sm text-amber">{formatETH(quote.total)}</span>
              </div>
            </div>
          )}

          {quote?.warnings && quote.warnings.length > 0 && (
            <ul className="mt-3 space-y-1">
              {quote.warnings.map((warning, i) => (
                <li key={i} className="text-[10px] text-amber flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  {warning.message}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-4 mb-3 text-center text-xs font-bold text-text-primary">Carteira e rede</h3>

          {wallets.length === 0 ? (
            <div className="border border-border p-3 text-center text-xs text-text-secondary">
              Nenhuma carteira conectada.{' '}
              <Link to="/account/wallets" className="text-amber hover:underline">Adicionar carteira</Link>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Carteira" className="space-y-2">
              {wallets.map((wallet) => {
                const selected = selectedWalletId === wallet.id;
                return (
                  <label
                    key={wallet.id}
                    className={cn(
                      'flex items-center gap-3 border px-3 py-3 text-xs text-text-primary cursor-pointer transition-colors',
                      selected ? 'border-amber' : 'border-border hover:border-border-soft'
                    )}
                  >
                    <input
                      type="radio"
                      name="wallet"
                      value={wallet.id}
                      checked={selected}
                      onChange={() => {
                        setSelectedWalletId(wallet.id);
                        setSelectedNetwork(wallet.network);
                      }}
                      className="accent-amber h-3 w-3"
                    />
                    <span className="flex-1 truncate">{wallet.name}</span>
                    <span className="text-[10px] text-text-secondary">{formatAddress(wallet.address)}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(c) => {
                const accepted = c === true;
                setTermsAccepted(accepted);
                setAcknowledgedTotal(accepted && quote ? quote.total : null);
                if (accepted) setPriceChanged(false);
              }}
              aria-describedby="terms-description"
            />
            <label htmlFor="terms" className="text-[10px] leading-relaxed text-text-primary cursor-pointer">
              Concordo com os Termos de Serviço e a Política de Privacidade.{' '}
              <span id="terms-description" className="text-text-secondary">
                Ao confirmar, você autoriza a compra dos NFTs selecionados pelo preço cotado.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !termsAccepted || !quote}
            className="mt-4 flex w-full items-center justify-center h-9 bg-amber hover:bg-amber/90 text-ink font-bold text-xs rounded-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar compra'
            )}
          </button>

          {quote?.validUntil && (
            <p className="mt-2 text-center text-[10px] text-text-muted">
              Cotação válida até {new Date(quote.validUntil).toLocaleTimeString()}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
