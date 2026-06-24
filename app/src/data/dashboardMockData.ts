// Toggle USE_MOCK = false in .env (VITE_USE_MOCK=false) to switch to live API calls
import type {
  DashboardOrder,
  ReturnRequest,
  Rider,
  Delivery,
  Payout,
  AuditLogEntry,
  SalesDataPoint,
  Member,
  ActivityItem,
  ContentHomepage,
  LookbookImage,
  DashboardTestimonial,
  Banner,
  Branding,
  DeliveryZone,
  EmailTemplate,
  AdminAccount,
} from '@/types/dashboard';

export const ORDERS: DashboardOrder[] = [
  {
    id: 'ORD-2026-1148',
    customerId: 'usr_204', customerName: 'Chioma Okafor', customerEmail: 'chioma.ok@gmail.com', customerPhone: '+234 803 111 2233',
    date: '2026-06-23T09:14:00Z',
    items: [
      { productId: 1, name: 'The Architect Oversized Suit', image: '/images/products/suit-oversized-blazer.jpg', size: 'L', quantity: 1, price: 250000 },
    ],
    subtotal: 250000, deliveryFee: 0, total: 250000,
    status: 'processing',
    shippingAddress: { street: 'Plot 132 Old Aba Road', city: 'Old Old GRA', state: '' },
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-23T09:14:00Z', note: 'Order placed' },
      { status: 'processing', timestamp: '2026-06-23T11:02:00Z', note: 'Payment confirmed' },
    ],
  },
  {
    id: 'ORD-2026-1147',
    customerId: 'usr_088', customerName: 'David Okonkwo', customerEmail: 'd.okonkwo@yahoo.com', customerPhone: '+234 805 442 9911',
    date: '2026-06-23T08:01:00Z',
    items: [
      { productId: 3, name: 'The Statesman Double-Breasted Blazer', image: '/images/products/suit-double-breasted.jpg', size: 'XL', quantity: 1, price: 195000 },
      { productId: 9, name: 'The Pinstripe Power Suit', image: '/images/products/suit-pinstripe.jpg', size: 'M', quantity: 1, price: 275000 },
    ],
    subtotal: 470000, deliveryFee: 0, total: 470000,
    status: 'processing',
    shippingAddress: { street: '24 Gana Street', city: 'Maitama', state: 'FCT Abuja' },
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-23T08:01:00Z' },
      { status: 'processing', timestamp: '2026-06-23T08:34:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1146',
    customerId: 'usr_312', customerName: 'Aisha Bello', customerEmail: 'aishabello@outlook.com', customerPhone: '+234 706 882 4400',
    date: '2026-06-22T16:42:00Z',
    items: [
      { productId: 5, name: 'The Gala Tuxedo Jacket', image: '/images/products/tuxedo-jacket.jpg', size: 'M', quantity: 1, price: 220000 },
    ],
    subtotal: 220000, deliveryFee: 3500, total: 223500,
    status: 'processing',
    shippingAddress: { street: '12 Gwani Street', city: 'Wuse Zone 5', state: 'Abuja' },
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-22T16:42:00Z' },
      { status: 'processing', timestamp: '2026-06-22T17:15:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1145',
    customerId: 'usr_412', customerName: 'Tunde Bakare', customerEmail: 'tunde.bakare@gmail.com', customerPhone: '+234 802 318 0099',
    date: '2026-06-22T12:20:00Z',
    items: [
      { productId: 8, name: 'The Heritage Three-Piece Suit', image: '/images/products/suit-three-piece.jpg', size: 'L', quantity: 1, price: 380000 },
    ],
    subtotal: 380000, deliveryFee: 0, total: 380000,
    status: 'shipped',
    shippingAddress: { street: '45 Aba Road', city: 'Old Old GRA', state: '' },
    riderId: 'rider_01',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-22T12:20:00Z' },
      { status: 'processing', timestamp: '2026-06-22T12:55:00Z' },
      { status: 'shipped', timestamp: '2026-06-22T18:00:00Z', note: 'Out for delivery - Tunde Adewale' },
    ],
  },
  {
    id: 'ORD-2026-1144',
    customerId: 'usr_119', customerName: 'Ngozi Eze', customerEmail: 'ngozi.eze@gmail.com', customerPhone: '+234 909 661 2200',
    date: '2026-06-21T10:10:00Z',
    items: [
      { productId: 6, name: 'The Metropolitan Wool Overcoat', image: '/images/products/overcoat-wool.jpg', size: 'XL', quantity: 1, price: 320000 },
      { productId: 4, name: 'The Vanguard Tailored Vest', image: '/images/products/vest-tailored.jpg', size: 'L', quantity: 1, price: 75000 },
    ],
    subtotal: 395000, deliveryFee: 0, total: 395000,
    status: 'shipped',
    shippingAddress: { street: '88 Aba Road', city: 'Port Harcourt', state: 'Rivers' },
    riderId: 'rider_02',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-21T10:10:00Z' },
      { status: 'processing', timestamp: '2026-06-21T10:45:00Z' },
      { status: 'shipped', timestamp: '2026-06-22T09:30:00Z', note: 'En route - Kunle Bello' },
    ],
  },
  {
    id: 'ORD-2026-1143',
    customerId: 'usr_231', customerName: 'Ifeanyi Umeh', customerEmail: 'ifeanyi.umeh@protonmail.com', customerPhone: '+234 813 700 1144',
    date: '2026-06-20T14:30:00Z',
    items: [
      { productId: 2, name: 'The Executive Wide-Leg Trousers', image: '/images/products/trousers-wide-leg.jpg', size: 'M', quantity: 2, price: 95000 },
    ],
    subtotal: 190000, deliveryFee: 3500, total: 193500,
    status: 'shipped',
    shippingAddress: { street: '5A Independence Avenue', city: 'Central Business District', state: 'FCT Abuja' },
    riderId: 'rider_03',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-20T14:30:00Z' },
      { status: 'processing', timestamp: '2026-06-20T15:00:00Z' },
      { status: 'shipped', timestamp: '2026-06-21T11:15:00Z', note: 'En route - Musa Ibrahim' },
    ],
  },
  {
    id: 'ORD-2026-1142',
    customerId: 'usr_058', customerName: 'Folake Adesanya', customerEmail: 'folake.a@icloud.com', customerPhone: '+234 706 555 8800',
    date: '2026-06-19T09:50:00Z',
    items: [
      { productId: 7, name: 'The Modernist Cropped Blazer', image: '/images/products/blazer-cropped.jpg', size: 'S', quantity: 1, price: 165000 },
      { productId: 10, name: 'The Pleated Grandeur Trousers', image: '/images/products/trousers-pleated.jpg', size: 'S', quantity: 1, price: 88000 },
    ],
    subtotal: 253000, deliveryFee: 0, total: 253000,
    status: 'shipped',
    shippingAddress: { street: 'Plot 24 Independence Avenue', city: 'Wuse Zone 5', state: '' },
    riderId: 'rider_04',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-19T09:50:00Z' },
      { status: 'processing', timestamp: '2026-06-19T10:20:00Z' },
      { status: 'shipped', timestamp: '2026-06-19T17:00:00Z', note: 'En route - Femi Akinola' },
    ],
  },
  {
    id: 'ORD-2026-1141',
    customerId: 'usr_077', customerName: 'Kelechi Nwosu', customerEmail: 'knwosu@gmail.com', customerPhone: '+234 802 991 4477',
    date: '2026-06-18T11:25:00Z',
    items: [
      { productId: 1, name: 'The Architect Oversized Suit', image: '/images/products/suit-oversized-blazer.jpg', size: 'XL', quantity: 1, price: 250000 },
      { productId: 11, name: 'The Slim Profile Trousers', image: '/images/products/trousers-slim-fit.jpg', size: 'L', quantity: 1, price: 82000 },
    ],
    subtotal: 332000, deliveryFee: 0, total: 332000,
    status: 'delivered',
    shippingAddress: { street: '4 Leventis Square', city: 'Ogunpa', state: 'Ibadan, Oyo' },
    riderId: 'rider_05',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-18T11:25:00Z' },
      { status: 'processing', timestamp: '2026-06-18T12:00:00Z' },
      { status: 'shipped', timestamp: '2026-06-18T19:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-19T15:42:00Z', note: 'Signed for by K. Nwosu' },
    ],
  },
  {
    id: 'ORD-2026-1140',
    customerId: 'usr_165', customerName: 'Bisi Lawal', customerEmail: 'bisi.lawal@gmail.com', customerPhone: '+234 708 330 9988',
    date: '2026-06-17T08:09:00Z',
    items: [
      { productId: 12, name: 'The Noir Evening Set', image: '/images/products/tuxedo-jacket.jpg', size: 'L', quantity: 1, price: 295000 },
    ],
    subtotal: 295000, deliveryFee: 0, total: 295000,
    status: 'delivered',
    shippingAddress: { street: '7 Rivers State Secretariat Road', city: 'Old Old GRA', state: '' },
    riderId: 'rider_01',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-17T08:09:00Z' },
      { status: 'processing', timestamp: '2026-06-17T08:35:00Z' },
      { status: 'shipped', timestamp: '2026-06-17T16:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-18T11:30:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1139',
    customerId: 'usr_288', customerName: 'Emeka Obi', customerEmail: 'e.obi@yahoo.com', customerPhone: '+234 803 220 1188',
    date: '2026-06-16T15:11:00Z',
    items: [
      { productId: 8, name: 'The Heritage Three-Piece Suit', image: '/images/products/suit-three-piece.jpg', size: 'XL', quantity: 1, price: 380000 },
    ],
    subtotal: 380000, deliveryFee: 0, total: 380000,
    status: 'delivered',
    shippingAddress: { street: 'Plot 5 Aba Road', city: 'Trans Amadi', state: '' },
    riderId: 'rider_02',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-16T15:11:00Z' },
      { status: 'processing', timestamp: '2026-06-16T15:40:00Z' },
      { status: 'shipped', timestamp: '2026-06-17T10:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-17T16:20:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1138',
    customerId: 'usr_033', customerName: 'Zainab Mohammed', customerEmail: 'zainab.m@protonmail.com', customerPhone: '+234 809 117 0044',
    date: '2026-06-15T10:00:00Z',
    items: [
      { productId: 6, name: 'The Metropolitan Wool Overcoat', image: '/images/products/overcoat-wool.jpg', size: 'L', quantity: 1, price: 320000 },
    ],
    subtotal: 320000, deliveryFee: 0, total: 320000,
    status: 'delivered',
    shippingAddress: { street: '1 Ahmadu Bello Way', city: 'Garki II', state: 'FCT Abuja' },
    riderId: 'rider_03',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-15T10:00:00Z' },
      { status: 'processing', timestamp: '2026-06-15T10:30:00Z' },
      { status: 'shipped', timestamp: '2026-06-15T18:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-16T14:00:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1137',
    customerId: 'usr_401', customerName: 'Adaeze Igwe', customerEmail: 'adaeze.i@gmail.com', customerPhone: '+234 706 991 0033',
    date: '2026-06-14T13:45:00Z',
    items: [
      { productId: 3, name: 'The Statesman Double-Breasted Blazer', image: '/images/products/suit-double-breasted.jpg', size: 'M', quantity: 1, price: 195000 },
    ],
    subtotal: 195000, deliveryFee: 3500, total: 198500,
    status: 'delivered',
    shippingAddress: { street: '88 Old Market Road', city: 'Onitsha', state: 'Anambra' },
    riderId: 'rider_04',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-14T13:45:00Z' },
      { status: 'processing', timestamp: '2026-06-14T14:20:00Z' },
      { status: 'shipped', timestamp: '2026-06-15T08:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-15T18:30:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1136',
    customerId: 'usr_512', customerName: 'Yusuf Abdullahi', customerEmail: 'yusuf.a@gmail.com', customerPhone: '+234 805 882 1100',
    date: '2026-06-13T09:20:00Z',
    items: [
      { productId: 9, name: 'The Pinstripe Power Suit', image: '/images/products/suit-pinstripe.jpg', size: 'L', quantity: 1, price: 275000 },
    ],
    subtotal: 275000, deliveryFee: 0, total: 275000,
    status: 'delivered',
    shippingAddress: { street: '6B Ahmadu Bello Way', city: 'Old GRA', state: 'Kano' },
    riderId: 'rider_05',
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-13T09:20:00Z' },
      { status: 'processing', timestamp: '2026-06-13T10:00:00Z' },
      { status: 'shipped', timestamp: '2026-06-14T08:00:00Z' },
      { status: 'delivered', timestamp: '2026-06-14T19:30:00Z' },
    ],
  },
  {
    id: 'ORD-2026-1135',
    customerId: 'usr_098', customerName: 'Funke Ogundimu', customerEmail: 'funke.o@outlook.com', customerPhone: '+234 813 661 2299',
    date: '2026-06-12T16:30:00Z',
    items: [
      { productId: 5, name: 'The Gala Tuxedo Jacket', image: '/images/products/tuxedo-jacket.jpg', size: 'XL', quantity: 1, price: 220000 },
    ],
    subtotal: 220000, deliveryFee: 0, total: 220000,
    status: 'cancelled',
    shippingAddress: { street: '32 Forces Avenue', city: 'Old GRA', state: 'Abuja' },
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-12T16:30:00Z' },
      { status: 'cancelled', timestamp: '2026-06-12T18:00:00Z', note: 'Customer request' },
    ],
  },
  {
    id: 'ORD-2026-1134',
    customerId: 'usr_440', customerName: 'Chinedu Okoro', customerEmail: 'c.okoro@gmail.com', customerPhone: '+234 706 442 9911',
    date: '2026-06-11T11:55:00Z',
    items: [
      { productId: 2, name: 'The Executive Wide-Leg Trousers', image: '/images/products/trousers-wide-leg.jpg', size: 'L', quantity: 1, price: 95000 },
    ],
    subtotal: 95000, deliveryFee: 3500, total: 98500,
    status: 'cancelled',
    shippingAddress: { street: '3A King Peregrine Street', city: 'Trans Amadi', state: 'Port Harcourt' },
    trackingHistory: [
      { status: 'pending', timestamp: '2026-06-11T11:55:00Z' },
      { status: 'cancelled', timestamp: '2026-06-11T14:00:00Z', note: 'Out of stock' },
    ],
  },
];

export const RETURNS: ReturnRequest[] = [
  {
    id: 'RET-901',
    orderId: 'ORD-2026-1140', customerId: 'usr_165', customerName: 'Bisi Lawal', customerPhone: '+234 708 330 9988',
    items: [{ productId: 12, name: 'The Noir Evening Set', image: '/images/products/tuxedo-jacket.jpg', size: 'L', quantity: 1 }],
    reason: 'Wrong size',
    description: 'The jacket runs smaller than expected. Need an XL instead.',
    images: ['/images/products/tuxedo-jacket.jpg'],
    status: 'pending', date: '2026-06-23T07:00:00Z',
    pickupAddress: { street: '7 Rivers State Secretariat Road', city: 'Old Old GRA', state: '' },
  },
  {
    id: 'RET-902',
    orderId: 'ORD-2026-1141', customerId: 'usr_077', customerName: 'Kelechi Nwosu', customerPhone: '+234 802 991 4477',
    items: [{ productId: 11, name: 'The Slim Profile Trousers', image: '/images/products/trousers-slim-fit.jpg', size: 'L', quantity: 1 }],
    reason: 'Damaged on arrival',
    description: 'There is a tear along the left back seam.',
    images: ['/images/products/trousers-slim-fit.jpg'],
    status: 'pending', date: '2026-06-22T15:20:00Z',
    pickupAddress: { street: '4 Leventis Square', city: 'Ogunpa', state: 'Ibadan, Oyo' },
  },
  {
    id: 'RET-903',
    orderId: 'ORD-2026-1138', customerId: 'usr_033', customerName: 'Zainab Mohammed', customerPhone: '+234 809 117 0044',
    items: [{ productId: 6, name: 'The Metropolitan Wool Overcoat', image: '/images/products/overcoat-wool.jpg', size: 'L', quantity: 1 }],
    reason: 'Changed mind',
    description: 'Bought a different color elsewhere. Unworn with tags intact.',
    images: ['/images/products/overcoat-wool.jpg'],
    status: 'approved', date: '2026-06-22T09:00:00Z',
    pickupAddress: { street: '1 Ahmadu Bello Way', city: 'Garki II', state: 'FCT Abuja' },
  },
  {
    id: 'RET-904',
    orderId: 'ORD-2026-1137', customerId: 'usr_401', customerName: 'Adaeze Igwe', customerPhone: '+234 706 991 0033',
    items: [{ productId: 3, name: 'The Statesman Double-Breasted Blazer', image: '/images/products/suit-double-breasted.jpg', size: 'M', quantity: 1 }],
    reason: 'Quality issue',
    description: 'Loose thread on lapel. Looks imperfect for the price.',
    images: ['/images/products/suit-double-breasted.jpg'],
    status: 'approved', date: '2026-06-21T14:10:00Z',
    pickupAddress: { street: '88 Old Market Road', city: 'Onitsha', state: 'Anambra' },
  },
  {
    id: 'RET-905',
    orderId: 'ORD-2026-1136', customerId: 'usr_512', customerName: 'Yusuf Abdullahi', customerPhone: '+234 805 882 1100',
    items: [{ productId: 9, name: 'The Pinstripe Power Suit', image: '/images/products/suit-pinstripe.jpg', size: 'L', quantity: 1 }],
    reason: 'Wrong size',
    description: 'Need a size M instead of L.',
    images: ['/images/products/suit-pinstripe.jpg'],
    status: 'rider_scheduled', date: '2026-06-20T11:00:00Z',
    pickupAddress: { street: '6B Ahmadu Bello Way', city: 'Old GRA', state: 'Kano' },
    riderId: 'rider_05',
  },
  {
    id: 'RET-906',
    orderId: 'ORD-2026-1139', customerId: 'usr_288', customerName: 'Emeka Obi', customerPhone: '+234 803 220 1188',
    items: [{ productId: 8, name: 'The Heritage Three-Piece Suit', image: '/images/products/suit-three-piece.jpg', size: 'XL', quantity: 1 }],
    reason: 'Color mismatch',
    description: 'Image online looks charcoal but actual is jet black.',
    images: ['/images/products/suit-three-piece.jpg'],
    status: 'rider_scheduled', date: '2026-06-19T08:00:00Z',
    pickupAddress: { street: 'Plot 5 Aba Road', city: 'Trans Amadi', state: '' },
    riderId: 'rider_02',
  },
  {
    id: 'RET-907',
    orderId: 'ORD-2026-1135', customerId: 'usr_098', customerName: 'Funke Ogundimu', customerPhone: '+234 813 661 2299',
    items: [{ productId: 5, name: 'The Gala Tuxedo Jacket', image: '/images/products/tuxedo-jacket.jpg', size: 'XL', quantity: 1 }],
    reason: 'Refund',
    description: 'Order was cancelled but refund not processed.',
    images: ['/images/products/tuxedo-jacket.jpg'],
    status: 'completed', date: '2026-06-15T10:00:00Z',
    pickupAddress: { street: '32 Forces Avenue', city: 'Old GRA', state: 'Abuja' },
    adminNote: 'Refund issued on 2026-06-15 via Paystack.',
  },
  {
    id: 'RET-908',
    orderId: 'ORD-2026-1134', customerId: 'usr_440', customerName: 'Chinedu Okoro', customerPhone: '+234 706 442 9911',
    items: [{ productId: 2, name: 'The Executive Wide-Leg Trousers', image: '/images/products/trousers-wide-leg.jpg', size: 'L', quantity: 1 }],
    reason: 'Late delivery',
    description: 'Delivery took 14 days. Requesting compensation.',
    images: ['/images/products/trousers-wide-leg.jpg'],
    status: 'rejected', date: '2026-06-14T13:00:00Z',
    pickupAddress: { street: '3A King Peregrine Street', city: 'Trans Amadi', state: 'Port Harcourt' },
    adminNote: 'Out of our control. Compensation declined per policy.',
  },
];

export const RIDERS: Rider[] = [
  {
    id: 'rider_01', name: 'Tunde Adewale', email: 'tunde.a@havanat.com', phone: '+234 803 111 0001',
    address: '12 Allen Avenue, Abuja',
    vehicleType: 'Bike', plateNumber: 'LSD-123-AB',
    status: 'active', idVerified: true, rating: 4.9, totalDeliveries: 142, totalEarnings: 284000,
    joinedAt: '2025-08-12T00:00:00Z',
    bank: { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Tunde Adewale' },
  },
  {
    id: 'rider_02', name: 'Kunle Bello', email: 'kunle.b@havanat.com', phone: '+234 805 222 0002',
    address: 'Plot 8 Wuse Zone 6, Abuja',
    vehicleType: 'Car', plateNumber: 'EKY-441-CD',
    status: 'active', idVerified: true, rating: 4.8, totalDeliveries: 98, totalEarnings: 215000,
    joinedAt: '2025-09-04T00:00:00Z',
    bank: { bankName: 'Zenith Bank', accountNumber: '2233445566', accountName: 'Kunle Bello' },
  },
  {
    id: 'rider_03', name: 'Musa Ibrahim', email: 'musa.i@havanat.com', phone: '+234 706 333 0003',
    address: '4 Wuse Zone 5, Abuja',
    vehicleType: 'Bike', plateNumber: 'ABJ-220-EF',
    status: 'active', idVerified: true, rating: 4.7, totalDeliveries: 76, totalEarnings: 168000,
    joinedAt: '2025-10-21T00:00:00Z',
    bank: { bankName: 'UBA', accountNumber: '9988776655', accountName: 'Musa Ibrahim' },
  },
  {
    id: 'rider_04', name: 'Femi Akinola', email: 'femi.a@havanat.com', phone: '+234 813 444 0004',
    address: '22 Awolowo Road, Old Old GRA, ',
    vehicleType: 'Van', plateNumber: 'LSR-998-GH',
    status: 'active', idVerified: true, rating: 5.0, totalDeliveries: 54, totalEarnings: 142000,
    joinedAt: '2026-01-15T00:00:00Z',
    bank: { bankName: 'Access Bank', accountNumber: '1122334455', accountName: 'Femi Akinola' },
  },
  {
    id: 'rider_05', name: 'Chika Eze', email: 'chika.e@havanat.com', phone: '+234 909 555 0005',
    address: '7 Independence Avenue, CBD, Abuja',
    vehicleType: 'Car', plateNumber: 'KNA-110-IJ',
    status: 'active', idVerified: true, rating: 4.6, totalDeliveries: 39, totalEarnings: 88000,
    joinedAt: '2026-03-02T00:00:00Z',
    bank: { bankName: 'First Bank', accountNumber: '5566778899', accountName: 'Chika Eze' },
  },
];

export const DELIVERIES: Delivery[] = [
  // Today's
  { id: 'DLV-7001', orderId: 'ORD-2026-1145', riderId: 'rider_01', type: 'delivery', status: 'in_transit', customerName: 'Tunde Bakare', customerPhone: '+234 802 318 0099', address: '45 Aba Road', city: 'Old Old GRA', state: '', itemSummary: 'Heritage Three-Piece Suit', itemCount: 1, scheduledFor: '2026-06-23T10:00:00Z', deliveryFee: 2500, pickupOtp: '4821', deliveryOtp: '9173' },
  { id: 'DLV-7002', orderId: 'ORD-2026-1146', riderId: 'rider_02', type: 'delivery', status: 'assigned', customerName: 'Aisha Bello', customerPhone: '+234 706 882 4400', address: '12 Gwani Street', city: 'Wuse Zone 5', state: 'Abuja', itemSummary: 'Gala Tuxedo Jacket', itemCount: 1, scheduledFor: '2026-06-23T13:00:00Z', deliveryFee: 2000, pickupOtp: '5512', deliveryOtp: '3360' },
  { id: 'DLV-7003', returnId: 'RET-905', riderId: 'rider_05', type: 'pickup', status: 'picked_up', customerName: 'Yusuf Abdullahi', customerPhone: '+234 805 882 1100', address: '6B Ahmadu Bello Way', city: 'Old GRA', state: 'Kano', itemSummary: 'Pinstripe Power Suit', itemCount: 1, scheduledFor: '2026-06-23T09:00:00Z', deliveryFee: 3500 },
  { id: 'DLV-7004', returnId: 'RET-906', riderId: 'rider_02', type: 'pickup', status: 'assigned', customerName: 'Emeka Obi', customerPhone: '+234 803 220 1188', address: 'Plot 5 Aba Road', city: 'Trans Amadi', state: '', itemSummary: 'Heritage Three-Piece Suit', itemCount: 1, scheduledFor: '2026-06-23T15:30:00Z', deliveryFee: 2000 },
  { id: 'DLV-7005', orderId: 'ORD-2026-1148', riderId: 'rider_03', type: 'delivery', status: 'assigned', customerName: 'Chioma Okafor', customerPhone: '+234 803 111 2233', address: 'Plot 132 Old Aba Road', city: 'Old Old GRA', state: '', itemSummary: 'Architect Oversized Suit', itemCount: 1, scheduledFor: '2026-06-23T16:00:00Z', deliveryFee: 2500, pickupOtp: '7129', deliveryOtp: '2248' },
  // Yesterday
  { id: 'DLV-6998', orderId: 'ORD-2026-1144', riderId: 'rider_02', type: 'delivery', status: 'delivered', customerName: 'Ngozi Eze', customerPhone: '+234 909 661 2200', address: '88 Aba Road', city: 'Port Harcourt', state: 'Rivers', itemSummary: 'Metropolitan Overcoat + Vanguard Vest', itemCount: 2, scheduledFor: '2026-06-22T10:00:00Z', deliveryFee: 4000, completedAt: '2026-06-22T15:42:00Z', proofOfDelivery: { timestamp: '2026-06-22T15:42:00Z' } },
  { id: 'DLV-6997', orderId: 'ORD-2026-1143', riderId: 'rider_03', type: 'delivery', status: 'delivered', customerName: 'Ifeanyi Umeh', customerPhone: '+234 813 700 1144', address: '5A Independence Avenue', city: 'CBD', state: 'FCT Abuja', itemSummary: 'Executive Wide-Leg Trousers x2', itemCount: 2, scheduledFor: '2026-06-21T11:00:00Z', deliveryFee: 3500, completedAt: '2026-06-21T17:30:00Z' },
  { id: 'DLV-6996', orderId: 'ORD-2026-1142', riderId: 'rider_04', type: 'delivery', status: 'delivered', customerName: 'Folake Adesanya', customerPhone: '+234 706 555 8800', address: 'Plot 24 Independence Avenue', city: 'Wuse Zone 5', state: '', itemSummary: 'Modernist Cropped Blazer + Pleated Trousers', itemCount: 2, scheduledFor: '2026-06-19T14:00:00Z', deliveryFee: 2500, completedAt: '2026-06-19T18:10:00Z' },
];

export const PAYOUTS: Payout[] = [
  { id: 'PAY-501', riderId: 'rider_01', amount: 32000, date: '2026-06-20T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-9988' },
  { id: 'PAY-502', riderId: 'rider_02', amount: 28500, date: '2026-06-20T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-9989' },
  { id: 'PAY-503', riderId: 'rider_03', amount: 21000, date: '2026-06-20T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-9990' },
  { id: 'PAY-504', riderId: 'rider_04', amount: 18000, date: '2026-06-20T00:00:00Z', status: 'pending', method: 'Bank Transfer' },
  { id: 'PAY-505', riderId: 'rider_05', amount: 12500, date: '2026-06-20T00:00:00Z', status: 'pending', method: 'Bank Transfer' },
  { id: 'PAY-506', riderId: 'rider_01', amount: 27500, date: '2026-06-13T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-7711' },
  { id: 'PAY-507', riderId: 'rider_02', amount: 22000, date: '2026-06-13T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-7712' },
  { id: 'PAY-508', riderId: 'rider_03', amount: 19500, date: '2026-06-13T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-7713' },
  { id: 'PAY-509', riderId: 'rider_04', amount: 14200, date: '2026-06-13T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-7714' },
  { id: 'PAY-510', riderId: 'rider_05', amount: 9800, date: '2026-06-13T00:00:00Z', status: 'paid', method: 'Bank Transfer', reference: 'TRF-7715' },
];

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: 'log-1', timestamp: '2026-06-23T08:14:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'update', entityType: 'homepage', entityId: 'home', entityLabel: 'Homepage hero', summary: 'Updated hero headline copy', changes: { before: { headline: 'Where Style Meets Elegance' }, after: { headline: 'Tailored for the Modern Nigerian' } } },
  { id: 'log-2', timestamp: '2026-06-23T07:42:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'create', entityType: 'testimonial', entityId: 'tst-08', entityLabel: 'Testimonial: Oluwaseun A.', summary: 'Added new 5-star testimonial', changes: { before: null, after: { name: 'Oluwaseun A.', rating: 5, text: 'Exquisite tailoring.' } } },
  { id: 'log-3', timestamp: '2026-06-22T19:30:00Z', userId: 'usr_mod02', userName: 'Chinedu Okafor', userRole: 'moderator', action: 'update', entityType: 'lookbook', entityId: 'lb-img-04', entityLabel: 'Lookbook image 4', summary: 'Reordered lookbook images', changes: { before: { order: 4 }, after: { order: 2 } } },
  { id: 'log-4', timestamp: '2026-06-22T17:10:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'create', entityType: 'banner', entityId: 'bnr-04', entityLabel: 'Banner: Mid-Year Sale', summary: 'Created new promotional banner', changes: { before: null, after: { title: 'Mid-Year Sale', startDate: '2026-06-25', endDate: '2026-07-05' } } },
  { id: 'log-5', timestamp: '2026-06-22T14:05:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'status_change', entityType: 'order', entityId: 'ORD-2026-1145', entityLabel: 'Order ORD-2026-1145', summary: 'Marked as Shipped and assigned rider', changes: { before: { status: 'processing' }, after: { status: 'shipped', riderId: 'rider_01' } } },
  { id: 'log-6', timestamp: '2026-06-22T13:50:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'update', entityType: 'membership_tier', entityId: 'tier-deluxe', entityLabel: 'Membership tier: Deluxe', summary: 'Adjusted Deluxe monthly price', changes: { before: { price: 15000 }, after: { price: 17500 } } },
  { id: 'log-7', timestamp: '2026-06-22T11:24:00Z', userId: 'usr_mod02', userName: 'Chinedu Okafor', userRole: 'moderator', action: 'update', entityType: 'branding', entityId: 'brand', entityLabel: 'Brand colors', summary: 'Updated accent gray value', changes: { before: { accentGray: '#6b6b6b' }, after: { accentGray: '#5a5a5a' } } },
  { id: 'log-8', timestamp: '2026-06-22T09:00:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'delete', entityType: 'testimonial', entityId: 'tst-04', entityLabel: 'Testimonial: Anonymous', summary: 'Removed unverified testimonial', changes: { before: { name: 'Anonymous', rating: 3 }, after: null } },
  { id: 'log-9', timestamp: '2026-06-21T18:42:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'update', entityType: 'product', entityId: 'prd-1', entityLabel: 'Product: The Architect Oversized Suit', summary: 'Updated price and stock', changes: { before: { price: 250000, stock: 12 }, after: { price: 245000, stock: 18 } } },
  { id: 'log-10', timestamp: '2026-06-21T16:18:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'create', entityType: 'product', entityId: 'prd-13', entityLabel: 'Product: The Diplomat Three-Piece', summary: 'Added new product to catalog', changes: { before: null, after: { name: 'The Diplomat Three-Piece', price: 410000, category: 'Suits' } } },
  { id: 'log-11', timestamp: '2026-06-21T14:00:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'assign', entityType: 'return', entityId: 'RET-905', entityLabel: 'Return RET-905', summary: 'Assigned rider for return pickup', changes: { before: { riderId: null }, after: { riderId: 'rider_05' } } },
  { id: 'log-12', timestamp: '2026-06-21T11:30:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'create', entityType: 'lookbook', entityId: 'lb-img-09', entityLabel: 'Lookbook image 9', summary: 'Added new lookbook image', changes: { before: null, after: { caption: 'Heritage Tailoring' } } },
  { id: 'log-13', timestamp: '2026-06-20T19:50:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'update', entityType: 'homepage', entityId: 'home', entityLabel: 'Homepage featured collection', summary: 'Updated featured products', changes: { before: { featuredCollectionIds: [1, 3] }, after: { featuredCollectionIds: [1, 3, 8] } } },
  { id: 'log-14', timestamp: '2026-06-20T16:14:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'revert', entityType: 'homepage', entityId: 'home', entityLabel: 'Homepage hero', summary: 'Reverted hero headline to previous version', changes: { before: { headline: 'Where Style Meets Elegance' }, after: { headline: 'Crafted for Nigerian Power' } } },
  { id: 'log-15', timestamp: '2026-06-20T10:00:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'status_change', entityType: 'order', entityId: 'ORD-2026-1141', entityLabel: 'Order ORD-2026-1141', summary: 'Marked as Delivered', changes: { before: { status: 'shipped' }, after: { status: 'delivered' } } },
  { id: 'log-16', timestamp: '2026-06-19T15:24:00Z', userId: 'usr_mod02', userName: 'Chinedu Okafor', userRole: 'moderator', action: 'update', entityType: 'testimonial', entityId: 'tst-02', entityLabel: 'Testimonial: David Okonkwo', summary: 'Edited testimonial text', changes: { before: { text: 'Great suits' }, after: { text: 'As someone who wears suits daily, I have finally found my brand.' } } },
  { id: 'log-17', timestamp: '2026-06-19T11:00:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'create', entityType: 'rider', entityId: 'rider_05', entityLabel: 'Rider: Chika Eze', summary: 'Onboarded new rider', changes: { before: null, after: { name: 'Chika Eze', vehicleType: 'Car' } } },
  { id: 'log-18', timestamp: '2026-06-18T17:00:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'update', entityType: 'banner', entityId: 'bnr-02', entityLabel: 'Banner: Free Delivery Promo', summary: 'Extended banner end date', changes: { before: { endDate: '2026-06-20' }, after: { endDate: '2026-07-01' } } },
  { id: 'log-19', timestamp: '2026-06-18T12:30:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'update', entityType: 'member', entityId: 'usr_088', entityLabel: 'Member: David Okonkwo', summary: 'Upgraded member to Elite tier', changes: { before: { tier: 'deluxe' }, after: { tier: 'elite' } } },
  { id: 'log-20', timestamp: '2026-06-17T20:00:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'create', entityType: 'testimonial', entityId: 'tst-07', entityLabel: 'Testimonial: Amina Ibrahim', summary: 'Added new Elite testimonial', changes: { before: null, after: { name: 'Amina Ibrahim', rating: 5, text: 'Personal stylist is a game changer.' } } },
  { id: 'log-21', timestamp: '2026-06-17T14:00:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'delete', entityType: 'product', entityId: 'prd-099', entityLabel: 'Product: Draft Linen Blazer', summary: 'Removed draft product', changes: { before: { name: 'Draft Linen Blazer', status: 'draft' }, after: null } },
  { id: 'log-22', timestamp: '2026-06-16T09:30:00Z', userId: 'usr_mod02', userName: 'Chinedu Okafor', userRole: 'moderator', action: 'update', entityType: 'lookbook', entityId: 'lb-img-01', entityLabel: 'Lookbook image 1', summary: 'Replaced lookbook image', changes: { before: { image: '/images/community/event-1.jpg' }, after: { image: '/images/community/professional-1.jpg' } } },
  { id: 'log-23', timestamp: '2026-06-15T16:42:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'status_change', entityType: 'return', entityId: 'RET-907', entityLabel: 'Return RET-907', summary: 'Marked return as Completed and issued refund', changes: { before: { status: 'rider_scheduled' }, after: { status: 'completed' } } },
  { id: 'log-24', timestamp: '2026-06-14T11:00:00Z', userId: 'usr_mod01', userName: 'Folake Adetunji', userRole: 'moderator', action: 'update', entityType: 'homepage', entityId: 'home', entityLabel: 'Homepage tagline', summary: 'Updated hero tagline', changes: { before: { tagline: 'Where Style Meets Elegance' }, after: { tagline: 'Where Style Meets Elegance' } } },
  { id: 'log-25', timestamp: '2026-06-13T13:15:00Z', userId: 'usr_admin01', userName: 'Adaeze Nwosu', userRole: 'admin', action: 'update', entityType: 'settings', entityId: 'site-config', entityLabel: 'Site contact phone', summary: 'Updated contact phone', changes: { before: { phone: '+234 802 000 0000' }, after: { phone: '+234 812 345 6789' } } },
];

export const SALES_DATA: SalesDataPoint[] = (() => {
  const points: SalesDataPoint[] = [];
  const baseDate = new Date('2026-05-24T00:00:00Z');
  const revenues = [
    1820000, 1540000, 1980000, 1750000, 2210000, 2640000, 1980000,
    1430000, 1620000, 1890000, 2110000, 2450000, 2680000, 2540000,
    1780000, 1320000, 1560000, 1830000, 2050000, 2380000, 2620000, 2110000,
    1670000, 1890000, 2140000, 2350000, 2580000, 2820000, 2240000, 1980000,
  ];
  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(baseDate.getUTCDate() + i);
    points.push({
      date: d.toISOString().slice(0, 10),
      revenue: revenues[i],
      orders: Math.floor(revenues[i] / 250000),
    });
  }
  return points;
})();

export const MEMBERS: Member[] = [
  { id: 'usr_088', name: 'David Okonkwo', email: 'd.okonkwo@yahoo.com', phone: '+234 805 442 9911', tier: 'elite', billingCycle: 'yearly', startDate: '2025-12-01', nextBillingDate: '2026-12-01', status: 'active', totalSpent: 1240000, joinedAt: '2025-12-01T00:00:00Z' },
  { id: 'usr_165', name: 'Bisi Lawal', email: 'bisi.lawal@gmail.com', phone: '+234 708 330 9988', tier: 'deluxe', billingCycle: 'monthly', startDate: '2026-02-15', nextBillingDate: '2026-07-15', status: 'active', totalSpent: 412000, joinedAt: '2026-02-15T00:00:00Z' },
  { id: 'usr_288', name: 'Emeka Obi', email: 'e.obi@yahoo.com', phone: '+234 803 220 1188', tier: 'deluxe', billingCycle: 'quarterly', startDate: '2026-01-20', nextBillingDate: '2026-07-20', status: 'active', totalSpent: 580000, joinedAt: '2026-01-20T00:00:00Z' },
  { id: 'usr_033', name: 'Zainab Mohammed', email: 'zainab.m@protonmail.com', phone: '+234 809 117 0044', tier: 'standard', billingCycle: 'monthly', startDate: '2025-11-10', nextBillingDate: '2026-07-10', status: 'active', totalSpent: 320000, joinedAt: '2025-11-10T00:00:00Z' },
  { id: 'usr_512', name: 'Yusuf Abdullahi', email: 'yusuf.a@gmail.com', phone: '+234 805 882 1100', tier: 'elite', billingCycle: 'yearly', startDate: '2025-10-05', nextBillingDate: '2026-10-05', status: 'active', totalSpent: 2150000, joinedAt: '2025-10-05T00:00:00Z' },
  { id: 'usr_401', name: 'Adaeze Igwe', email: 'adaeze.i@gmail.com', phone: '+234 706 991 0033', tier: 'deluxe', billingCycle: 'monthly', startDate: '2026-03-12', nextBillingDate: '2026-07-12', status: 'active', totalSpent: 198000, joinedAt: '2026-03-12T00:00:00Z' },
  { id: 'usr_077', name: 'Kelechi Nwosu', email: 'knwosu@gmail.com', phone: '+234 802 991 4477', tier: 'standard', billingCycle: 'monthly', startDate: '2025-09-22', nextBillingDate: '2026-07-22', status: 'paused', totalSpent: 332000, joinedAt: '2025-09-22T00:00:00Z' },
  { id: 'usr_204', name: 'Chioma Okafor', email: 'chioma.ok@gmail.com', phone: '+234 803 111 2233', tier: 'deluxe', billingCycle: 'monthly', startDate: '2026-04-01', nextBillingDate: '2026-07-01', status: 'active', totalSpent: 250000, joinedAt: '2026-04-01T00:00:00Z' },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'order', message: 'New order placed: ORD-2026-1148 (₦250,000)', timestamp: '2026-06-23T09:14:00Z', userName: 'Chioma Okafor' },
  { id: 'a2', type: 'member', message: 'New Deluxe subscription: Chioma Okafor', timestamp: '2026-06-23T09:14:00Z', userName: 'Chioma Okafor' },
  { id: 'a3', type: 'return', message: 'Return requested: RET-901 (Wrong size)', timestamp: '2026-06-23T07:00:00Z', userName: 'Bisi Lawal' },
  { id: 'a4', type: 'order', message: 'Order ORD-2026-1145 marked as Shipped', timestamp: '2026-06-22T18:00:00Z', userName: 'Adaeze Nwosu' },
  { id: 'a5', type: 'product', message: 'New product added: The Diplomat Three-Piece', timestamp: '2026-06-22T16:18:00Z', userName: 'Adaeze Nwosu' },
  { id: 'a6', type: 'order', message: 'Order ORD-2026-1144 marked as Shipped', timestamp: '2026-06-22T09:30:00Z', userName: 'Adaeze Nwosu' },
  { id: 'a7', type: 'return', message: 'Return RET-905 assigned to rider Chika Eze', timestamp: '2026-06-21T14:00:00Z', userName: 'Adaeze Nwosu' },
  { id: 'a8', type: 'member', message: 'David Okonkwo upgraded to Elite tier', timestamp: '2026-06-18T12:30:00Z', userName: 'Adaeze Nwosu' },
  { id: 'a9', type: 'order', message: 'Order ORD-2026-1141 delivered', timestamp: '2026-06-19T15:42:00Z', userName: 'Kelechi Nwosu' },
  { id: 'a10', type: 'product', message: 'Product updated: The Architect Oversized Suit (price change)', timestamp: '2026-06-21T18:42:00Z', userName: 'Adaeze Nwosu' },
];

export const HOMEPAGE_CONTENT: ContentHomepage = {
  heroImage: '/images/hero/fabric-hero.jpg',
  headline: 'Tailored for the Modern Nigerian',
  tagline: 'Where Style Meets Elegance',
  featuredCollectionIds: [1, 3, 8],
  updatedAt: '2026-06-22T19:30:00Z',
};

export const LOOKBOOK: LookbookImage[] = [
  { id: 'lb-img-01', url: '/images/community/professional-1.jpg', caption: 'Boardroom Authority', order: 1 },
  { id: 'lb-img-02', url: '/images/community/professional-2.jpg', caption: 'Modern Power Dressing', order: 2 },
  { id: 'lb-img-03', url: '/images/community/event-1.jpg', caption: 'Evening Presence', order: 3 },
  { id: 'lb-img-04', url: '/images/products/suit-oversized-blazer.jpg', caption: 'The Architect Series', order: 4 },
  { id: 'lb-img-05', url: '/images/products/suit-double-breasted.jpg', caption: 'Heritage Tailoring', order: 5 },
  { id: 'lb-img-06', url: '/images/products/overcoat-wool.jpg', caption: 'Winter Collection', order: 6 },
];

export const TESTIMONIALS: DashboardTestimonial[] = [
  { id: 'tst-01', name: 'Chioma Okafor', avatar: '/images/community/professional-2.jpg', rating: 5, text: 'The Architect Suit completely transformed my presence in the boardroom. The quality is unmatched and the fit is impeccable.', date: '2026-06-18', approved: true },
  { id: 'tst-02', name: 'David Okonkwo', avatar: '/images/community/professional-1.jpg', rating: 5, text: 'As someone who wears suits daily, I have finally found my brand. The attention to detail and fabric quality is exceptional.', date: '2026-06-15', approved: true },
  { id: 'tst-07', name: 'Amina Ibrahim', avatar: '/images/community/event-1.jpg', rating: 5, text: 'The Elite membership is a game changer. My personal stylist helped me build a wardrobe that works for every occasion.', date: '2026-06-10', approved: true },
  { id: 'tst-08', name: 'Oluwaseun A.', avatar: '/images/community/professional-2.jpg', rating: 5, text: 'Exquisite tailoring. Worth every naira.', date: '2026-06-22', approved: true },
  { id: 'tst-09', name: 'Kelechi Nwosu', avatar: '/images/community/professional-1.jpg', rating: 4, text: 'Solid build quality. Delivery was a day late but otherwise great.', date: '2026-06-20', approved: false },
];

export const BANNERS: Banner[] = [
  { id: 'bnr-01', image: '/images/hero/fabric-hero.jpg', title: 'New Season Collection', link: '/shop', startDate: '2026-06-01', endDate: '2026-07-15', status: 'active' },
  { id: 'bnr-02', image: '/images/products/suit-oversized-blazer.jpg', title: 'Free Delivery Promo', link: '/shop', startDate: '2026-06-15', endDate: '2026-07-01', status: 'active' },
  { id: 'bnr-03', image: '/images/products/overcoat-wool.jpg', title: 'Winter Pre-Order', link: '/shop', startDate: '2026-08-01', endDate: '2026-09-30', status: 'scheduled' },
  { id: 'bnr-04', image: '/images/products/suit-double-breasted.jpg', title: 'Mid-Year Sale', link: '/shop', startDate: '2026-06-25', endDate: '2026-07-05', status: 'scheduled' },
];

export const BRANDING: Branding = {
  logoLight: '/images/hero/fabric-hero.jpg',
  logoDark: '/images/hero/fabric-hero.jpg',
  favicon: '/images/hero/fabric-hero.jpg',
  primaryGray: '#0a0a0a',
  accentGray: '#5a5a5a',
  updatedAt: '2026-06-22T11:24:00Z',
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'zone-01', state: '', fee: 2500, eta: '1-2 business days' },
  { id: 'zone-02', state: 'FCT Abuja', fee: 3500, eta: '2-3 business days' },
  { id: 'zone-03', state: 'Rivers', fee: 4000, eta: '3-4 business days' },
  { id: 'zone-04', state: 'Oyo', fee: 3500, eta: '2-3 business days' },
  { id: 'zone-05', state: 'Kano', fee: 5000, eta: '4-5 business days' },
  { id: 'zone-06', state: 'Anambra', fee: 4500, eta: '3-5 business days' },
  { id: 'zone-07', state: 'Other States', fee: 5500, eta: '5-7 business days' },
];

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'tmpl-01', name: 'Order Confirmation', subject: 'Your Havanat order is confirmed', preview: 'Thank you for your order. We will notify you once it ships.' },
  { id: 'tmpl-02', name: 'Shipping Update', subject: 'Your order is on its way', preview: 'Your order has been dispatched and is on its way to you.' },
  { id: 'tmpl-03', name: 'Return Approval', subject: 'Your return has been approved', preview: 'We have approved your return request. A rider will be assigned for pickup.' },
];

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  { id: 'usr_admin01', name: 'Adaeze Nwosu', email: 'admin@havanat.com', role: 'admin', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'usr_mod01', name: 'Folake Adetunji', email: 'moderator@havanat.com', role: 'moderator', createdAt: '2024-03-22T00:00:00Z' },
  { id: 'usr_mod02', name: 'Chinedu Okafor', email: 'moderator2@havanat.com', role: 'moderator', createdAt: '2025-02-10T00:00:00Z' },
];
