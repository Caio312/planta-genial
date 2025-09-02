import { useState, useEffect } from 'react';
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { searchFloorPlanReferences } from '@/services/imageSearch';

interface ReferenceImage {
  id: string;
  url: string;
  title: string;
  source: string;
}

interface ReferenceGalleryProps {
  query: string;
  onSelectReference: (image: ReferenceImage) => void;
}

// Corrigindo a declaração do componente funcional
export function ReferenceGallery({ query, onSelectReference }: ReferenceGalleryProps) {
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReferences = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        const results = await searchFloorPlanReferences(query);
        setReferences(results);
      } catch (error) {
        toast.error("Erro ao buscar referências");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [query]);

  if (loading) {
    return <div className="p-4 text-center">Carregando referências...</div>;
  }

  return (
    <Card className="p-4">
      <ScrollArea className="h-[200px]">
        <div className="grid grid-cols-3 gap-4">
          {references.map((ref) => (
            <div 
              key={ref.id}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onSelectReference(ref)}
            >
              <img 
                src={ref.url} 
                alt={ref.title}
                className="w-full h-32 object-cover rounded-md"
              />
              <p className="text-sm mt-1 truncate">{ref.title}</p>
              <p className="text-xs text-muted-foreground">{ref.source}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}