import { Link, useNavigate } from '@tanstack/react-router';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { formatETH } from '@/utils/format';
import { Trash2, Loader2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { CartItem } from '@/api/contracts';

export function CartPage() {
  const { cart, updateQuantity, removeItem, applyCoupon, removeCoupon, subtotal, total, discount, networkFee, getQuote, isLoading } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      await applyCoupon(couponCode.toUpperCase());
      setCouponCode('');
    } catch (error: any) {
      setCouponError(error.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 0) return;
    setUpdatingQuantities(prev => new Set(prev).add(item.id));
    try {
      await updateQuantity(item.id, newQuantity);
    } finally {
      setUpdatingQuantities(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    try {
      await removeItem(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    const quote = await getQuote();
    if (quote) {
      navigate({ to: '/checkout' });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Carregando carrinho...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 mb-24">
      {/* Breadcrumb */}
      <div className="text-sm font-bold text-text-primary mb-6">
        <Link to="/" className="hover:text-amber transition-colors">Início</Link> / <span className="text-text-muted">Mercado</span> / <span className="text-text-muted">Carrinho</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Side - Cart Items Table */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          <div className="grid grid-cols-12 pb-4 border-b border-border-soft text-sm font-bold text-text-primary">
            <div className="col-span-6 sm:col-span-5">NFTs</div>
            <div className="col-span-3 sm:col-span-2 text-center">Preço</div>
            <div className="hidden sm:block col-span-2 text-center">Edições</div>
            <div className="col-span-3 sm:col-span-2 text-right">Total</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {cart?.items.length === 0 ? (
            <div className="py-12 text-center text-text-muted">Seu carrinho está vazio.</div>
          ) : (
            cart?.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                quantity={item.quantity}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                isUpdating={updatingQuantities.has(item.id)}
              />
            ))
          )}
        </div>

        {/* Right Side - Summary */}
        <div className="lg:w-1/3">
          <div className="bg-transparent space-y-6">
            <h2 className="text-base font-bold text-text-primary border-b border-border-soft pb-3">Resumo da carteira</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">Código promocional</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Digite o código promocional..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-surface-card border border-border rounded-none px-4 py-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors"
                />
                <Button 
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="bg-amber hover:bg-amber/90 text-ink font-bold rounded-none px-6 h-auto text-xs"
                >
                  {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
              {couponError && <div className="text-error text-xs mt-1">{couponError}</div>}
              {cart?.coupon && (
                <div className="flex items-center justify-between mt-2 text-sm text-success">
                  <span>{cart.coupon.code} aplicado</span>
                  <button onClick={handleRemoveCoupon} className="text-error hover:underline text-xs">Remover</button>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 font-mono text-sm border-t border-transparent">
              <div className="flex justify-between items-center">
                <span className="text-text-primary font-sans">Subtotal</span>
                <span className="text-text-primary font-bold">{formatETH(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-primary font-sans">Desconto do lançamento</span>
                <span className="text-text-primary font-bold">(-) {formatETH(discount)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-text-primary font-sans">Taxa de rede</span>
                <div className="text-right">
                  <div className="text-text-primary font-bold">{formatETH(networkFee)}</div>
                  <div className="text-text-coral text-xs mt-1 font-sans">Taxa estimada</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 font-bold text-sm border-t border-border-soft">
              <span>Total</span>
              <span className="text-amber">{formatETH(total)}</span>
            </div>

            <Button 
              className="w-full bg-amber hover:bg-amber/90 text-ink font-bold text-xs py-5 mt-2 rounded-sm"
              onClick={handleCheckout}
              disabled={cart?.items.length === 0}
            >
              Conectar e finalizar
            </Button>
            
            <div className="text-center mt-6">
              <Link to="/" className="text-amber hover:text-amber/80 font-medium transition-colors text-sm border-b border-transparent hover:border-amber pb-0.5">
                Continuar explorando
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Colecionadores também viram section (mockup) */}
      <div className="mt-24">
        <h3 className="text-amber font-bold text-sm mb-6 pb-2 border-b border-border-soft">Colecionadores também viram</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 118, name: "Cosmic Bloom", price: "1.29 ETH", img: "/src/assets/NFT Artwork 05.svg" },
            { id: 314, name: "Violet Nomad", price: "1.39 ETH", img: "/src/assets/NFT Artwork 04.svg" },
            { id: 808, name: "Ivory Baron", price: "1.79 ETH", img: "/src/assets/NFT Artwork 08.svg" },
            { id: 287, name: "Golden Beat", price: "0.99 ETH", img: "/src/assets/NFT Artwork 06.svg" },
            { id: 160, name: "Golden Signal", price: "0.39 ETH", img: "/src/assets/NFT Artwork 06.svg" }
          ].map((mock, i) => (
             <div key={i} className="bg-transparent space-y-3">
               <div className="aspect-square bg-surface-card p-3 overflow-hidden">
                 <img src={mock.img} alt={mock.name} className="w-full h-full object-cover rounded-lg" />
               </div>
               <div>
                 <p className="font-bold text-sm">{mock.name} #{mock.id}</p>
                 <p className="text-amber font-bold text-sm mt-1">{mock.price}</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  quantity: number;
  onUpdateQuantity: (item: CartItem, quantity: number) => Promise<void>;
  onRemove: (item: CartItem) => Promise<void>;
  isUpdating: boolean;
}

function CartItemRow({ item, quantity, onUpdateQuantity, onRemove, isUpdating }: CartItemRowProps) {
  return (
    <div className="grid grid-cols-12 items-center py-3 px-3 mb-2 bg-surface-card rounded-sm gap-2">
      <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-surface-raised flex-shrink-0">
          <img src={item.nft.imageUrl} alt={item.nft.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-text-primary truncate">{item.nft.name}</div>
          <div className="text-xs text-text-muted mt-1 truncate">ID do token: #{item.nft.tokenId || '0000'}</div>
        </div>
      </div>
      <div className="col-span-3 sm:col-span-2 text-center font-mono text-sm font-bold text-text-primary">
        {formatETH(item.unitPrice)}
      </div>
      <div className="hidden sm:flex col-span-2 items-center justify-center gap-3">
        <button 
          onClick={() => onUpdateQuantity(item, quantity - 1)}
          disabled={quantity <= 1 || isUpdating}
          className="w-5 h-5 rounded-full bg-amber text-ink flex items-center justify-center hover:bg-amber/90 disabled:opacity-50 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="font-bold w-4 text-center text-sm">{quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(item, quantity + 1)}
          disabled={quantity >= item.nft.edition.available || isUpdating}
          className="w-5 h-5 rounded-full bg-amber text-ink flex items-center justify-center hover:bg-amber/90 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="col-span-3 sm:col-span-2 text-right font-bold font-mono text-amber text-sm">
        {formatETH(item.totalPrice)}
      </div>
      <div className="col-span-1 flex justify-end">
        <button 
          onClick={() => onRemove(item)}
          className="text-text-muted hover:text-error transition-colors p-2"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}