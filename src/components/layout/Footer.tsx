import { Shield, Sparkles, Database, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/20 py-8 text-xs text-muted-foreground backdrop-blur-sm">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="font-medium text-foreground">AI Study Companion</span>
          <span>&copy; {new Date().getFullYear()} — Production-Minded Full-Stack AI Platform</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 text-zinc-400">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            MongoDB Atlas Vector Search
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            Google Gemini API
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            Isolated Server-Side Ownership
          </span>
        </div>
      </div>
    </footer>
  );
}
