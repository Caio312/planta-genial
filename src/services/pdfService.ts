import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
  projectName: string;
  clientName: string;
  includeSpecifications: boolean;
  includeMaterials: boolean;
  quality: 'standard' | 'high';
  floorPlanImageUrl: string;
  projectData: {
    totalArea: number;
    lotWidth: number;
    lotDepth: number;
    bedrooms: number;
    suites: number;
    bathrooms: number;
    additionalSpaces: string[];
    architecturalStyle: string;
  };
}

class PDFService {
  async generatePDF(options: PDFGenerationOptions): Promise<Blob> {
    const { projectName, clientName, includeSpecifications, includeMaterials, quality, floorPlanImageUrl, projectData } = options;
    
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Header Section
    pdf.setFillColor(59, 130, 246); // Primary blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROJETO ARQUITETÔNICO PRELIMINAR', margin, 20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(projectName || 'Residência Unifamiliar', margin, 30);
    
    yPosition = 50;

    // Project Information Section
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMAÇÕES DO PROJETO', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    const projectInfo = [
      `Cliente: ${clientName || 'Não informado'}`,
      `Área construída: ${projectData.totalArea}m²`,
      `Terreno: ${projectData.lotWidth}m × ${projectData.lotDepth}m`,
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
      `Quartos: ${projectData.bedrooms} (${projectData.suites} suítes)`,
      `Banheiros: ${projectData.bathrooms}`,
      `Estilo: ${projectData.architecturalStyle}`
    ];

    projectInfo.forEach(info => {
      pdf.text(info, margin, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Floor Plan Image Section
    try {
      if (floorPlanImageUrl && floorPlanImageUrl !== 'mock-image') {
        pdf.setFont('helvetica', 'bold');
        pdf.text('PLANTA BAIXA', margin, yPosition);
        yPosition += 10;

        // Load and add the floor plan image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.crossOrigin = 'anonymous';
          img.src = floorPlanImageUrl;
        });

        const maxWidth = contentWidth;
        const maxHeight = 120;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;

        canvas.width = imgWidth;
        canvas.height = imgHeight;
        ctx?.drawImage(img, 0, 0, imgWidth, imgHeight);

        const imgData = canvas.toDataURL('image/jpeg', quality === 'high' ? 0.95 : 0.8);
        
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Planta baixa - Escala 1:100 (aproximada)', margin, yPosition);
        yPosition += 15;
      }
    } catch (error) {
      console.error('Error adding floor plan image:', error);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Erro ao carregar imagem da planta baixa', margin, yPosition);
      yPosition += 15;
    }

    // Room Specifications Section
    if (includeSpecifications && yPosition < pageHeight - 60) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESPECIFICAÇÕES DOS AMBIENTES', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const specifications = [
        'Sala de Estar/Jantar: Ambiente integrado com boa ventilação natural',
        'Cozinha: Equipada com bancada e área para eletrodomésticos',
        `Quartos: ${projectData.bedrooms} dormitórios com iluminação natural`,
        `Suítes: ${projectData.suites} com banheiro privativo`,
        `Banheiros: ${projectData.bathrooms} sociais com ventilação`,
      ];

      if (projectData.additionalSpaces.length > 0) {
        specifications.push(`Espaços adicionais: ${projectData.additionalSpaces.join(', ')}`);
      }

      specifications.forEach(spec => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text('• ' + spec, margin + 5, yPosition);
        yPosition += 7;
      });

      yPosition += 10;
    }

    // Materials Section (if requested)
    if (includeMaterials && yPosition < pageHeight - 60) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESTIMATIVA BÁSICA DE MATERIAIS', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const materials = [
        'Estrutura: Concreto armado, blocos cerâmicos, aço estrutural',
        'Cobertura: Telhas cerâmicas/metálicas, estrutura em madeira/aço',
        'Revestimentos: Pisos cerâmicos, azulejos, tintas acrílicas',
        'Instalações: Sistema hidráulico e elétrico básico',
        'Esquadrias: Portas em madeira, janelas em alumínio',
        'Acabamentos: Gesso, rodapés, louças e metais'
      ];

      materials.forEach(material => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text('• ' + material, margin + 5, yPosition);
        yPosition += 7;
      });

      yPosition += 10;
      pdf.setFont('helvetica', 'italic');
      pdf.text('* Lista apenas orientativa - consulte profissional para orçamento detalhado', margin, yPosition);
    }

    // Technical Notes Section
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTAS TÉCNICAS IMPORTANTES', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    
    const notes = [
      '• Este projeto é uma sugestão preliminar gerada por IA',
      '• Deve ser revisado e aprovado por arquiteto habilitado (CAU)',
      '• As dimensões são aproximadas e devem ser verificadas',
      '• Não substitui projeto executivo profissional',
      '• Consulte normas locais de construção antes da execução',
      '• Verifique aprovação junto aos órgãos competentes'
    ];

    notes.forEach(note => {
      pdf.text(note, margin, yPosition);
      yPosition += 6;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 15);
    pdf.text('Página 1 de 1', pageWidth - margin - 20, pageHeight - 15);

    return pdf.output('blob');
  }

  async downloadPDF(options: PDFGenerationOptions): Promise<void> {
    try {
      const pdfBlob = await this.generatePDF(options);
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `PlantaBaixa_${options.projectName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Erro ao gerar PDF');
    }
  }
}

export const pdfService = new PDFService();