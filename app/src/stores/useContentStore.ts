// Content management store (homepage, lookbook, testimonials, banners, branding, membership tiers)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ContentHomepage,
  LookbookImage,
  DashboardTestimonial,
  Banner,
  Branding,
} from '@/types/dashboard';
import { logAuditAction } from '@/utils/auditLogger';
import { apiConfig, apiGet } from '@/lib/api';

interface ContentActor {
  id: string;
  name: string;
  role: 'admin' | 'moderator';
}

interface ContentState {
  fetchContent: () => Promise<void>;
  homepage: ContentHomepage;
  lookbook: LookbookImage[];
  testimonials: DashboardTestimonial[];
  banners: Banner[];
  branding: Branding;
  saveHomepage: (next: ContentHomepage, actor: ContentActor) => void;
  saveLookbook: (next: LookbookImage[], actor: ContentActor) => void;
  addLookbookImage: (image: Omit<LookbookImage, 'id' | 'order'>, actor: ContentActor) => void;
  removeLookbookImage: (id: string, actor: ContentActor) => void;
  addTestimonial: (t: Omit<DashboardTestimonial, 'id'>, actor: ContentActor) => void;
  updateTestimonial: (id: string, t: Partial<DashboardTestimonial>, actor: ContentActor) => void;
  approveTestimonial: (id: string, approved: boolean, actor: ContentActor) => void;
  removeTestimonial: (id: string, actor: ContentActor) => void;
  addBanner: (b: Omit<Banner, 'id'>, actor: ContentActor) => void;
  updateBanner: (id: string, b: Partial<Banner>, actor: ContentActor) => void;
  removeBanner: (id: string, actor: ContentActor) => void;
  saveBranding: (next: Branding, actor: ContentActor) => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      homepage: {
        heroImage: '',
        headline: 'Where Style Meets Elegance',
        tagline: 'Hand-tailored luxury for the modern Nigerian',
        featuredCollectionIds: [],
        updatedAt: new Date().toISOString(),
      },
      lookbook: [],
      testimonials: [],
      banners: [],
      branding: {
        logoLight: '/brand/logo-light.svg',
        logoDark: '/brand/logo-dark.svg',
        favicon: '/favicon.ico',
        primaryGray: '#6b6b6b',
        accentGray: '#e5e5e5',
        updatedAt: new Date().toISOString(),
      },
      fetchContent: async () => {
        if (!apiConfig.useBackend) return;
        try {
          const [homepage, lookbook, testimonials, banners, branding] = await Promise.all([
            apiGet<any>('/api/content/homepage', true).catch(() => null),
            apiGet<any>('/api/content/lookbook', true).catch(() => null),
            apiGet<any>('/api/content/testimonials', true).catch(() => null),
            apiGet<any>('/api/content/banners', true).catch(() => null),
            apiGet<any>('/api/content/branding', true).catch(() => null),
          ]);
          set((s) => ({
            ...(homepage ? { homepage: homepage.items ?? homepage ?? s.homepage } : {}),
            ...(lookbook ? { lookbook: lookbook.items ?? lookbook ?? s.lookbook } : {}),
            ...(testimonials ? { testimonials: testimonials.items ?? testimonials ?? s.testimonials } : {}),
            ...(banners ? { banners: banners.items ?? banners ?? s.banners } : {}),
            ...(branding ? { branding: branding.items ?? branding ?? s.branding } : {}),
          }));
        } catch (err) {
          console.error('fetchContent failed', err);
        }
      },
      saveHomepage: (next, actor) => {
        const before = get().homepage;
        set({ homepage: { ...next, updatedAt: new Date().toISOString() } });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'homepage', entityId: 'home', entityLabel: 'Homepage',
          summary: 'Updated homepage content',
          changes: { before: { ...before }, after: { ...next } },
        });
      },
      saveLookbook: (next, actor) => {
        const before = get().lookbook;
        set({ lookbook: next });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'lookbook', entityId: 'lookbook', entityLabel: 'Lookbook',
          summary: 'Reordered lookbook images',
          changes: { before: { count: before.length }, after: { count: next.length } },
        });
      },
      addLookbookImage: (image, actor) => {
        const id = `lb-${Date.now()}`;
        const order = get().lookbook.length + 1;
        const next: LookbookImage = { ...image, id, order };
        set({ lookbook: [...get().lookbook, next] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'lookbook', entityId: id, entityLabel: `Lookbook image "${image.caption}"`,
          summary: 'Added lookbook image',
          changes: { before: null, after: { caption: image.caption } },
        });
      },
      removeLookbookImage: (id, actor) => {
        const target = get().lookbook.find((i) => i.id === id);
        if (!target) return;
        set({ lookbook: get().lookbook.filter((i) => i.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'lookbook', entityId: id, entityLabel: `Lookbook image "${target.caption}"`,
          summary: 'Removed lookbook image',
          changes: { before: { caption: target.caption }, after: null },
        });
      },
      addTestimonial: (t, actor) => {
        const id = `tst-${Date.now()}`;
        set({ testimonials: [...get().testimonials, { ...t, id }] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${t.name}`,
          summary: `Added new ${t.rating}-star testimonial`,
          changes: { before: null, after: { name: t.name, rating: t.rating } },
        });
      },
      updateTestimonial: (id, t, actor) => {
        const before = get().testimonials.find((x) => x.id === id);
        if (!before) return;
        set({ testimonials: get().testimonials.map((x) => (x.id === id ? { ...x, ...t } : x)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${before.name}`,
          summary: 'Edited testimonial',
          changes: { before: { ...before }, after: { ...before, ...t } },
        });
      },
      approveTestimonial: (id, approved, actor) => {
        const before = get().testimonials.find((x) => x.id === id);
        if (!before) return;
        set({ testimonials: get().testimonials.map((x) => (x.id === id ? { ...x, approved } : x)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${before.name}`,
          summary: approved ? 'Approved testimonial' : 'Un-approved testimonial',
          changes: { before: { approved: before.approved }, after: { approved } },
        });
      },
      removeTestimonial: (id, actor) => {
        const t = get().testimonials.find((x) => x.id === id);
        if (!t) return;
        set({ testimonials: get().testimonials.filter((x) => x.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'testimonial', entityId: id, entityLabel: `Testimonial: ${t.name}`,
          summary: 'Removed testimonial',
          changes: { before: { name: t.name }, after: null },
        });
      },
      addBanner: (b, actor) => {
        const id = `bnr-${Date.now()}`;
        set({ banners: [...get().banners, { ...b, id }] });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'create', entityType: 'banner', entityId: id, entityLabel: `Banner: ${b.title}`,
          summary: 'Created new banner',
          changes: { before: null, after: { title: b.title } },
        });
      },
      updateBanner: (id, b, actor) => {
        const before = get().banners.find((x) => x.id === id);
        if (!before) return;
        set({ banners: get().banners.map((x) => (x.id === id ? { ...x, ...b } : x)) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'banner', entityId: id, entityLabel: `Banner: ${before.title}`,
          summary: 'Updated banner',
          changes: { before: { ...before }, after: { ...before, ...b } },
        });
      },
      removeBanner: (id, actor) => {
        const b = get().banners.find((x) => x.id === id);
        if (!b) return;
        set({ banners: get().banners.filter((x) => x.id !== id) });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'delete', entityType: 'banner', entityId: id, entityLabel: `Banner: ${b.title}`,
          summary: 'Removed banner',
          changes: { before: { title: b.title }, after: null },
        });
      },
      saveBranding: (next, actor) => {
        const before = get().branding;
        set({ branding: { ...next, updatedAt: new Date().toISOString() } });
        logAuditAction({
          userId: actor.id, userName: actor.name, userRole: actor.role,
          action: 'update', entityType: 'branding', entityId: 'brand', entityLabel: 'Brand assets',
          summary: 'Updated brand assets',
          changes: { before: { ...before }, after: { ...next } },
        });
      },
    }),
    { name: 'havanat-content' }
  )
);