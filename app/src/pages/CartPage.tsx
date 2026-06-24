import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { formatNaira, CONFIG } from '@/config';

function buildWhatsAppOrderMessage(): string {
  const { items, subtotal } = useCartStore.getState();
  const lines = items.map((i) => `• ${i.product.name} (Size ${i.size}) ×${i.quantity} — ${formatNaira(i.product.price * i.quantity)}`);
  const total = formatNaira(subtotal());
  return `Hi Havanat, I'd like to place an order:%0A%0A${encodeURIComponent(lines.join('\n'))}%0A%0ATotal: ${total}%0A%0APlease confirm availability and delivery.`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, deliveryFee, total } = useCartStore();

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center bg-white">
        <div className="text-center px-4">
          <ShoppingBag size={64} strokeWidth={1} className="mx-auto mb-6 text-gray-200" />
          <h1 className="font-serif text-2xl sm:text-3xl mb-4">Your Cart is Empty</h1>
          <p className="text-gray-400 text-sm mb-8">Discover our premium collection and find your perfect fit.</p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-black text-white text-xs tracking-[0.15em] font-semibold"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 lg:mb-12">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="flex gap-4 sm:gap-6 py-6 border-b"
              >
                {/* Image */}
                <Link to={`/shop/${item.product.slug}`} className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/shop/${item.product.slug}`}>
                        <h3 className="text-sm sm:text-base font-medium hover:opacity-60 transition-opacity">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-400 mt-1">Size: {item.size}</p>
                      <p className="text-sm text-gray-400">{item.product.category}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.size)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className="w-8 h-8 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 h-8 border-t border-b flex items-center justify-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="w-8 h-8 border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-semibold">
                      {formatNaira(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border p-6 lg:p-8">
              <h2 className="text-xs tracking-[0.15em] font-semibold mb-6 uppercase">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatNaira(subtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span>{deliveryFee() === 0 ? 'Free' : formatNaira(deliveryFee())}</span>
                </div>
                {deliveryFee() === 0 && subtotal() > 0 && (
                  <p className="text-[10px] text-green-600 tracking-wide">You qualify for free delivery!</p>
                )}
              </div>
              <div className="flex justify-between text-base font-semibold py-4 border-t">
                <span>Total</span>
                <span>{formatNaira(total())}</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full py-4 mt-4 bg-black text-white text-center text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors"
              >
                PROCEED TO CHECKOUT
              </Link>
              <a
                href={`https://wa.me/${CONFIG.SOCIAL.WHATSAPP.replace('https://wa.me/', '')}?text=${buildWhatsAppOrderMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 mt-3 text-center text-xs tracking-[0.1em] border border-green-600 text-green-700 hover:bg-green-50 transition-colors font-medium"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Order via WhatsApp
              </a>
              <p className="text-[10px] text-gray-500 text-center mt-2 px-2">
                First-time customer? WhatsApp lets you confirm availability and ask questions before paying.
              </p>
              <Link
                to="/shop"
                className="block w-full py-3 mt-3 text-center text-xs tracking-[0.1em] text-gray-400 hover:text-black transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
