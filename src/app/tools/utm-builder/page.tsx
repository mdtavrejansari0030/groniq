import GuidedBuilder from '@/components/tools/utm/GuidedBuilder';

export const metadata = {
  title: 'UTM Builder | Free Campaign URL Generator by Groniq',
  description: 'Build clean, consistent campaign URLs without memorizing UTM conventions.',
};

export default function UtmBuilderPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          Campaign <span className="text-[#39FF14]">URL Builder</span>
        </h1>
        <p className="text-[#9E9E9E] max-w-2xl mx-auto text-sm md:text-base">
          Generate clean, consistent tracking URLs for your marketing campaigns. 
          We handle the conventions so you can focus on the growth.
        </p>
      </div>
      <GuidedBuilder />
    </main>
  );
}
