import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRiderStore } from '@/stores/useRiderStore';
import { useUIStore } from '@/stores/useUIStore';
import StatusBadge from '@/components/admin/StatusBadge';
import { X, MapPin, Phone, ArrowLeft, Camera, Check } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

export default function RiderDeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const delivery = useRiderStore((s) => (id ? s.getDeliveryById(id) : undefined));
  const updateStatus = useRiderStore((s) => s.updateDeliveryStatus);
  const setProof = useRiderStore((s) => s.setDeliveryProof);
  const showToast = useUIStore((s) => s.showToast);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (delivery?.proofOfDelivery?.photoUrl) setPhoto(delivery.proofOfDelivery.photoUrl);
    if (delivery?.proofOfDelivery?.signatureDataUrl) setSignature(delivery.proofOfDelivery.signatureDataUrl);
  }, [delivery?.proofOfDelivery?.photoUrl, delivery?.proofOfDelivery?.signatureDataUrl]);

  if (!delivery) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Delivery not found.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-[10px] uppercase tracking-[0.15em] underline">Back</button>
      </div>
    );
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const markPickedUp = () => {
    if (otp.join('') !== (delivery.pickupOtp ?? '')) {
      showToast('Invalid pickup OTP', 'error');
      return;
    }
    updateStatus(delivery.id, 'picked_up');
    showToast('Marked as picked up', 'success');
  };

  const markInTransit = () => {
    updateStatus(delivery.id, 'in_transit');
    showToast('Marked as in transit', 'success');
  };

  const markDelivered = () => {
    if (otp.join('') !== (delivery.deliveryOtp ?? '')) {
      showToast('Invalid delivery OTP', 'error');
      return;
    }
    if (!photo) {
      showToast('Please upload a delivery photo', 'error');
      return;
    }
    const proof = { photoUrl: photo, signatureDataUrl: signature ?? undefined, timestamp: new Date().toISOString() };
    setProof(delivery.id, proof);
    updateStatus(delivery.id, 'delivered', proof);
    showToast('Delivery completed', 'success');
    navigate('/rider/deliveries');
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-1 hover:opacity-60">
        <ArrowLeft className="h-3 w-3" /> Back to deliveries
      </button>

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">{delivery.type === 'pickup' ? 'Pickup' : 'Delivery'} · {formatTime(delivery.scheduledFor)}</p>
            <p className="font-serif text-2xl font-light mt-1">{delivery.id}</p>
          </div>
          <StatusBadge status={delivery.status} type="delivery" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Customer</p>
            <p className="font-medium">{delivery.customerName}</p>
            <a href={`tel:${delivery.customerPhone}`} className="flex items-center gap-1 text-blue-700 text-xs mt-1">
              <Phone className="h-3 w-3" /> {delivery.customerPhone}
            </a>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Address</p>
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {delivery.address}, {delivery.city}, {delivery.state}</p>
            <button
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${delivery.address}, ${delivery.city}, ${delivery.state}`)}`, '_blank')}
              className="mt-2 text-[10px] uppercase tracking-wider underline underline-offset-4 hover:opacity-60"
            >Open in Maps</button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Items</p>
          <p className="text-sm">{delivery.itemSummary} ({delivery.itemCount})</p>
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white border border-gray-200 p-6 space-y-5">
        <h3 className="font-serif text-xl font-light">Update Status</h3>

        {delivery.status === 'assigned' && (
          <OtpBlock otp={otp} setOtp={handleOtpChange} onSubmit={markPickedUp} submitLabel="Mark Picked Up" submitHint="Get this from the warehouse" />
        )}

        {delivery.status === 'picked_up' && (
          <button onClick={markInTransit} className="w-full py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900">
            Mark In Transit
          </button>
        )}

        {delivery.status === 'in_transit' && (
          <div className="space-y-5">
            <OtpBlock otp={otp} setOtp={handleOtpChange} onSubmit={() => {}} submitLabel="Verify OTP" submitHint="Get this from the customer" />
            <SignatureBlock signature={signature} setSignature={setSignature} />
            <PhotoBlock photo={photo} onUpload={handlePhotoUpload} />
            <button
              onClick={markDelivered}
              className="w-full py-3 bg-green-700 text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-green-800 flex items-center justify-center gap-2"
            >
              <Check className="h-3.5 w-3.5" /> Mark Delivered
            </button>
          </div>
        )}

        {delivery.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 p-4 text-sm">
            <p className="font-medium text-green-800">Delivered</p>
            {delivery.proofOfDelivery && (
              <p className="text-xs text-green-700 mt-1">Completed at {new Date(delivery.proofOfDelivery.timestamp).toLocaleString('en-NG')}</p>
            )}
          </div>
        )}
      </div>

      {delivery.type === 'pickup' && delivery.status === 'assigned' && (
        <OtpBlock otp={otp} setOtp={handleOtpChange} onSubmit={() => { updateStatus(delivery.id, 'picked_up'); showToast('Item collected', 'success'); navigate('/rider/pickups'); }} submitLabel="Mark Picked Up" submitHint="Get this from the customer" />
      )}
    </div>
  );
}

function OtpBlock({ otp, setOtp, onSubmit, submitLabel, submitHint }: { otp: string[]; setOtp: (i: number, v: string) => void; onSubmit: () => void; submitLabel: string; submitHint?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">OTP Verification</p>
      <div className="flex gap-2 justify-start">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => setOtp(i, e.target.value)}
            className="w-12 h-12 text-center border border-gray-300 text-lg focus:border-black focus:outline-none"
          />
        ))}
      </div>
      {submitHint && <p className="text-xs text-gray-500 mt-2">{submitHint}</p>}
      <button
        onClick={onSubmit}
        disabled={otp.some((d) => !d)}
        className="mt-4 px-6 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-gray-900 disabled:opacity-50"
      >{submitLabel}</button>
    </div>
  );
}

function PhotoBlock({ photo, onUpload }: { photo: string | null; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Delivery Photo</p>
      {photo ? (
        <div className="relative">
          <img src={photo} alt="Proof" className="h-48 w-full object-cover bg-gray-100" />
          <button
            onClick={() => onUpload({ target: { files: [] } } as never)}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-600 hover:text-white"
            aria-label="Remove"
          ><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 p-8 text-center hover:border-black transition-colors">
            <Camera className="h-6 w-6 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Tap to take or upload photo</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
          </div>
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      )}
    </div>
  );
}

function SignatureBlock({ signature, setSignature }: { signature: string | null; setSignature: (s: string | null) => void }) {
  const [drawing, setDrawing] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const getCtx = () => canvasRef?.getContext('2d') ?? null;

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = getCtx();
    if (ctx && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = getCtx();
    if (ctx && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const end = () => {
    setDrawing(false);
    if (canvasRef) {
      setSignature(canvasRef.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const ctx = getCtx();
    if (ctx && canvasRef) {
      ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      setSignature(null);
    }
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Customer Signature</p>
      {signature ? (
        <div className="relative">
          <img src={signature} alt="Signature" className="border border-gray-200 w-full bg-white h-32" />
          <button
            onClick={clear}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-600 hover:text-white"
            aria-label="Clear"
          ><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <div>
          <canvas
            ref={(el) => {
              if (el && el.width === 0) {
                el.width = el.offsetWidth;
                el.height = 128;
              }
              setCanvasRef(el);
            }}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
            className="border border-gray-200 w-full h-32 bg-white cursor-crosshair touch-none"
          />
          <button onClick={clear} className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 hover:text-black">Clear</button>
        </div>
      )}
    </div>
  );
}
