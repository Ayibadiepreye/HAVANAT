import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { CONFIG } from '@/config';
import { useUIStore } from '@/stores/useUIStore';

export default function ContactPage() {
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showToast('Message sent successfully!', 'success');
    e.currentTarget.reset();
  };

  const inputClass = "w-full px-4 py-3.5 border text-sm focus:outline-none focus:border-black transition-colors bg-white";

  return (
    <main className="min-h-screen pt-20 lg:pt-24 bg-white">
      {/* Hero */}
      <section className="bg-[#f0f3f5] py-16 lg:py-24 text-center px-4">
        <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-4">Get in Touch</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">Contact Us</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          We are here to help. Reach out for inquiries, support, or just to say hello.
        </p>
      </section>

      <div className="px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
          {/* Form */}
          <div>
            <h2 className="font-serif text-2xl mb-8">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Name</label>
                  <input type="text" required className={inputClass} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Email</label>
                  <input type="email" required className={inputClass} placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Subject</label>
                <select required className={inputClass}>
                  <option value="">Select a subject</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Question</option>
                  <option value="bespoke">Bespoke Request</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.1em] text-gray-400 mb-2 uppercase">Message</label>
                <textarea required className={`${inputClass} h-32 resize-none`} placeholder="How can we help you?" />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 bg-black text-white text-xs tracking-[0.15em] font-semibold hover:bg-black/80 transition-colors inline-flex items-center gap-2"
              >
                <Send size={14} />
                SEND MESSAGE
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-serif text-2xl mb-8">Contact Information</h2>
            <div className="space-y-6 mb-10">
              {[
                { icon: Phone, label: 'Phone', value: CONFIG.CONTACT.PHONE },
                { icon: Mail, label: 'Email', value: CONFIG.CONTACT.EMAIL },
                { icon: MapPin, label: 'Address', value: CONFIG.CONTACT.ADDRESS },
                { icon: Clock, label: 'Business Hours', value: 'Mon – Fri: 9:00 AM – 6:00 PM WAT' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 border flex items-center justify-center flex-shrink-0">
                    <Icon size={16} strokeWidth={1.5} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.15em] text-gray-400 uppercase mb-1">{label}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="border bg-gray-100 h-64 overflow-hidden">
              <img
                src="https://maps.googleapis.com/maps/api/staticmap?center=Victoria+Island,Lagos,Nigeria&zoom=14&size=600x400&style=feature:all|saturation:-100&key=YOUR_API_KEY"
                alt="Lagos Map"
                className="w-full h-full object-cover opacity-50"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/community/event-1.jpg';
                  target.style.opacity = '0.3';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={24} className="mx-auto mb-2" />
                  <p className="text-xs tracking-wide">Victoria Island, Lagos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
