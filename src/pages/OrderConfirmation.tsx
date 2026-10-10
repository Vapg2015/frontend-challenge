/**
 * Order Confirmation Page
 * Transaction result, items, fees, total, explorer links
 * Visual: "Thank you" receipt modal (Figma)
 */

import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatETH, formatDate, formatAddress } from '@/utils/format';
import { Loader2, MailOpen, X } from 'lucide-react';
import { api } from '@/api/axios';
import { queryKeys } from '@/api/queryClient';
import { useOrderRealTime } from '@/hooks/useSocket';
import type { Order } from '@/api/contracts';

export function OrderConfirmationPage() {
  const { id } = useParams({ from: '/order/$id' });

  // Real-time order updates
  useOrderRealTime(id, () => {
    // Order will be refreshed by query invalidation
  });

  // Fetch order
  const { data: orderResponse, isLoading, error } = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const order = query.state.data?.data;
      if (order && (order.status === 'pending' || order.status === 'confirming')) {
        return 5000; // Poll every 5 seconds for pending orders
      }
      return false;
    },
  });

  const order = orderResponse?.data;
  const isPending = order?.status === 'pending' || order?.status === 'confirming';
  const isRejected = order?.status === 'rejected';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface-card p-8 space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface-card p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Pedido não encontrado</h2>
          <p className="text-sm text-text-muted">Este pedido não existe ou você não tem permissão para visualizá-lo.</p>
          <Link to="/" className="inline-block">
            <Button className="bg-amber hover:bg-amber/90 text-ink font-bold text-xs rounded-sm">Voltar ao mercado</Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = isRejected
    ? order.failureReason || 'Seu pedido foi rejeitado. Tente novamente ou fale com o suporte.'
    : isPending
      ? 'Seu pedido está sendo processado'
      : 'Seus NFTs agora estão na sua carteira';

  const wallet = order.payment.network
    ? order.payment.network.charAt(0).toUpperCase() + order.payment.network.slice(1)
    : 'MetaMask';

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-16">
      <section
        aria-labelledby="order-title"
        className="relative w-full max-w-md bg-surface-card border-b-8 border-amber shadow-xl"
      >
        <Link
          to="/"
          aria-label="Fechar"
          className="absolute top-3 right-3 text-primary-dark hover:text-amber transition-colors"
        >
          <X className="h-4 w-4" />
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-5 text-center">
          {isPending ? (
            <Loader2 className="h-14 w-14 text-amber animate-spin" />
          ) : (
            <MailOpen className="h-14 w-14 text-amber" strokeWidth={1.25} />
          )}
          <h1 id="order-title" className="text-sm font-medium text-text-secondary">
            {title}
          </h1>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-primary-dark/70 text-[10px] divide-x divide-primary-dark/70">
          <div className="px-3 py-2">
            <p className="font-bold text-text-secondary">ID da transação</p>
            <p className="text-text-secondary">{order.transactionHash ? formatAddress(order.transactionHash) : `#${order.id.slice(-8).toUpperCase()}`}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-text-secondary">Data</p>
            <p className="text-text-secondary">{formatDate(order.confirmedAt || order.createdAt)}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-text-secondary">Total</p>
            <p className="text-text-secondary">{formatETH(order.quote.total)}</p>
          </div>
          <div className="px-3 py-2">
            <p className="font-bold text-text-secondary">Carteira</p>
            <p className="text-text-secondary">{wallet}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-surface-card px-6 py-5 text-xs">
          <h2 className="font-bold text-text-primary mb-2">Detalhes da transação</h2>

          <div className="grid grid-cols-12 pb-2 border-b border-border-soft font-bold text-text-primary">
            <span className="col-span-6">NFTs</span>
            <span className="col-span-3 text-center">Edições</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>

          <ul>
            {order.items.map((item, index) => (
              <li key={index} className="grid grid-cols-12 items-center gap-2 py-3">
                <div className="col-span-6 flex items-center gap-2 min-w-0">
                  <img
                    src={item.nft.imageUrl}
                    alt={item.nft.name}
                    className="h-11 w-11 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-text-primary truncate">{item.nft.name}</p>
                    <p className="text-[10px] text-primary-dark truncate">ID do token: #{item.nft.tokenId || '0000'}</p>
                  </div>
                </div>
                <span className="col-span-3 text-center text-text-secondary">(x {item.quantity})</span>
                <span className="col-span-3 text-right font-bold text-amber">{formatETH(item.totalPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 pt-1">
            {parseFloat(order.quote.discount) > 0 && (
              <div className="flex justify-end gap-8 text-success">
                <span>Desconto</span>
                <span>-{formatETH(order.quote.discount)}</span>
              </div>
            )}
            <div className="flex justify-end items-center gap-8 text-text-secondary">
              <span>Taxa de rede</span>
              <span className="text-sm text-text-primary">{formatETH(order.quote.networkFee)}</span>
            </div>
            <div className="flex justify-end items-center gap-8 pt-1 border-t border-border-soft font-bold">
              <span className="text-text-primary">Total</span>
              <span className="text-sm text-amber">{formatETH(order.quote.total)}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-text-secondary">
            {isRejected
              ? 'Não foi possível concluir a transação. Você pode tentar novamente pelo carrinho.'
              : isPending
                ? 'Aguardando confirmação na Ethereum. Esta página será atualizada automaticamente.'
                : 'Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.'}
          </p>

          <div className="mt-5 mb-3 flex justify-center gap-3">
            {isRejected ? (
              <Link to="/cart">
                <Button className="bg-amber hover:bg-amber/90 text-ink font-bold text-xs rounded-sm h-9 px-5">
                  Tentar novamente
                </Button>
              </Link>
            ) : order.explorerUrl ? (
              <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-amber hover:bg-amber/90 text-ink font-bold text-xs rounded-sm h-9 px-5">
                  Ver no Etherscan
                </Button>
              </a>
            ) : (
              <Link to="/">
                <Button className="bg-amber hover:bg-amber/90 text-ink font-bold text-xs rounded-sm h-9 px-5">
                  Continuar explorando
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}