import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { formatNaira } from '@/config';

export default function CartDrawer() {
  const {
    items, isOpen, closeCart, removeItem, updateQuantity, subtotal, deliveryFee, total, clearCart
  } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const { zoneFeeByState } = useDeliveryZones();

  if (!isOpen) return null;
  const tier = user?.membershipTier ?? 'standard';

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="text-sm tracking-[0.1em] font-medium">YOUR CART ({items.length})</span>
          </div>
          <button onClick={closeCart} className="p-1 hover:opacity-60 transition-opacity">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} strokeWidth={1} className="text-gray-300 mb-4" />
              <p className="text-gray-400 text-sm tracking-wide">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={closeCart}
                className="mt-4 px-6 py-2 bg-black text-white text-xs tracking-[0.15em] hover:bg-black/80 transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>
                    <p className="text-sm font-medium mt-2">{formatNaira(item.product.price)}</p>
                    {/* Quantity */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className="w-7 h-7 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="w-7 h-7 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id, item.size)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatNaira(subtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span>{formatNaira(deliveryFee(zoneFeeByState))}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatNaira(total(tier, zoneFeeByState))}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full py-3 bg-black text-white text-center text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
            >
              PROCEED TO CHECKOUT
            </Link>
            <button
              onClick={clearCart}
              className="block w-full py-2 text-center text-xs tracking-[0.1em] text-gray-500 hover:text-black transition-colors"
            >
              CLEAR CART
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
