import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Ruler, FileText } from "lucide-react";
import heroImage from "@/assets/hero-floor-plan.jpg";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Main Hero Content */}
        <div className="animate-fade-in">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6">
              <Home className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 leading-tight">
              Plantas Baixas
              <br />
              <span className="font-semibold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                Profissionais
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Crie plantas baixas técnicas detalhadas para residências unifamiliares com especificações completas para CAD
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4 group"
            >
              Criar Planta Baixa
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="ghost" className="btn-ghost text-lg px-8 py-4">
              Ver Exemplos
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <FeatureCard
            icon={<Ruler className="w-6 h-6" />}
            title="Precisão Técnica"
            description="Dimensões precisas e conformidade com normas brasileiras (NBR)"
          />
          
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Documentação Completa"
            description="Especificações detalhadas, cotas e memorial descritivo"
          />
          
          <FeatureCard
            icon={<Home className="w-6 h-6" />}
            title="CAD Ready"
            description="Exportação em DWG, DXF e PDF para software profissional"
          />
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="card-glass p-8 text-center hover:shadow-xl transition-all duration-300 animate-scale-in">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-light rounded-2xl mb-4 text-primary">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      
      <p className="text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};