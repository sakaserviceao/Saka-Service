import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

const ConfigError = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4 text-foreground">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Configuração Necessária</h1>
        <p className="mb-8 text-muted-foreground">
          O Saka Service não pôde ser inicializado porque as chaves do Supabase estão ausentes no ambiente de produção.
        </p>

        <div className="space-y-4 rounded-2xl bg-secondary/50 p-6 text-left text-sm">
          <p className="font-semibold text-foreground">Como resolver no Vercel:</p>
          <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
            <li>Aceda às <strong>Settings</strong> do seu projeto no Vercel.</li>
            <li>Vá para <strong>Environment Variables</strong>.</li>
            <li>Adicione os seguintes pares:</li>
          </ol>
          <div className="mt-4 rounded-lg bg-background p-3 font-mono text-[10px] sm:text-xs">
            <p className="text-primary">VITE_SUPABASE_URL</p>
            <p className="text-primary">VITE_SUPABASE_ANON_KEY</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button 
            className="w-full rounded-full" 
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            className="w-full rounded-full" 
            asChild
          >
            <a 
              href="https://vercel.com/docs/projects/environment-variables" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              Documentação do Vercel <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        
        <p className="mt-6 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Saka Service Automation • Assistente de Recuperação
        </p>
      </div>
    </div>
  );
};

export default ConfigError;
