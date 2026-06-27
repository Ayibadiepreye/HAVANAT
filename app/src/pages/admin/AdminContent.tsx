import { useEffect, useState } from 'react';
import { useContentStore } from '@/stores/useContentStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import HomepageEditor from './content-editors/HomepageEditor';
import LookbookEditor from './content-editors/LookbookEditor';
import TestimonialsEditor from './content-editors/TestimonialsEditor';
import BannersEditor from './content-editors/BannersEditor';
import BrandingEditor from './content-editors/BrandingEditor';

export default function AdminContent() {
  const [tab, setTab] = useState('homepage');
  const fetchContent = useContentStore((s) => s.fetchContent);
  useEffect(() => { void fetchContent(); }, [fetchContent]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light">Content</h2>
        <p className="text-sm text-gray-500 mt-1">Edit homepage, lookbook, testimonials, banners, and branding.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none p-0 gap-0">
          {[
            ['homepage', 'Homepage'],
            ['lookbook', 'Lookbook'],
            ['testimonials', 'Testimonials'],
            ['banners', 'Banners'],
            ['branding', 'Branding'],
          ].map(([k, l]) => (
            <TabsTrigger
              key={k}
              value={k}
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-black text-gray-500 border-b-2 border-transparent data-[state=active]:border-black rounded-none px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-medium"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="pt-6">
          <TabsContent value="homepage" className="m-0"><HomepageEditor /></TabsContent>
          <TabsContent value="lookbook" className="m-0"><LookbookEditor /></TabsContent>
          <TabsContent value="testimonials" className="m-0"><TestimonialsEditor /></TabsContent>
          <TabsContent value="banners" className="m-0"><BannersEditor /></TabsContent>
          <TabsContent value="branding" className="m-0"><BrandingEditor /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
