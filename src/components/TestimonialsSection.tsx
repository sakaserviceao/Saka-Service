import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const defaultTestimonials = [
  {
    name: "Ana Paula",
    role: "Cliente",
    text: "Encontrei um eletricista em menos de 10 minutos. O serviço foi excelente e o profissional muito educado. Recomendo a todos!",
    avatar: "AP"
  },
  {
    name: "Carlos Manuel",
    role: "Profissional (Canalizador)",
    text: "A Saka Service mudou a forma como recebo clientes. Agora tenho pedidos constantes e consigo gerir a minha agenda facilmente.",
    avatar: "CM"
  },
  {
    name: "Maria José",
    role: "Cliente",
    text: "Adoro a facilidade de ver as avaliações de outros clientes antes de contratar. Dá muito mais segurança.",
    avatar: "MJ"
  }
];

export const TestimonialsSection = () => {
  const { getSetting } = useSettings();
  const [api, setApi] = useState<CarouselApi>();
  
  const showTestimonials = getSetting('show_testimonials', 'true') === 'true';
  const testimonialsJson = getSetting('testimonials_json', '');
  
  let testimonials = defaultTestimonials;
  try {
    if (testimonialsJson) {
      const parsed = JSON.parse(testimonialsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        testimonials = parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao processar depoimentos:", e);
  }

  useEffect(() => {
    if (!api) return;
    
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [api]);

  if (!showTestimonials) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-primary/5 overflow-hidden border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] text-sm font-bold mb-4 uppercase tracking-wider border border-[#14b8a6]/20"
          >
            <Quote className="h-4 w-4" /> Testemunhos
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900"
          >
            O que dizem de nós
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600"
          >
            A confiança dos nossos utilizadores é a nossa maior conquista. Veja as experiências de quem já usa a Saka Service.
          </motion.p>
        </div>

        <div className="relative max-w-6xl mx-auto px-12">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="h-full bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-[#14b8a6]/30 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex-1">
                      <Quote className="h-8 w-8 text-[#14b8a6]/20 mb-6" />
                      <p className="text-slate-700 italic leading-relaxed mb-8 line-clamp-6">
                        "{item.text}"
                      </p>
                    </div>
                    <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                      <div className="h-12 w-12 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 flex items-center justify-center font-bold text-[#14b8a6] shrink-0 uppercase">
                        {item.avatar || item.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 leading-tight truncate">{item.name}</h4>
                        <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider truncate">{item.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
