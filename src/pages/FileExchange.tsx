import { useState } from "react";
import { useFileExchange, ExchangeFile } from "@/hooks/useFileExchange";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  ShieldAlert, 
  Share2, 
  Clock, 
  Zap,
  Info,
  FileIcon,
  HardDrive
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function FileExchange() {
  const { files, loading, uploadFile, downloadAndDestroy } = useFileExchange();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await uploadFile(file);
    setIsUploading(false);
    // Clear input
    e.target.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-3 md:p-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto w-full pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-3">
            <Share2 className="h-6 w-6 md:h-8 md:h-8 text-amber-500" />
            Troca de Arquivos
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
            Válido até o download. Após baixar, o arquivo some.
          </p>
        </div>

        <div className="md:relative">
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button 
            asChild
            disabled={isUploading}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-wide shadow-lg shadow-amber-200 h-12 md:h-10"
          >
            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
              {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5 md:h-4 md:w-4" />}
              Enviar Novo Arquivo
            </label>
          </Button>
        </div>
      </div>

      {/* Warning Card - Simplified on small mobile */}
      <Card className="bg-amber-50 border-amber-200 overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none">
          <ShieldAlert className="h-12 w-12 md:h-24 md:w-24 -mr-2 -mt-2 text-amber-900" />
        </div>
        <CardContent className="p-4 md:p-6 flex gap-3 md:gap-4 items-start relative z-10">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-600">
            <Info className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-sm md:text-base">Como funciona?</h3>
            <p className="text-[11px] md:text-sm text-amber-800/80 mt-1 leading-relaxed">
              Ao clicar em baixar, o arquivo é removido do servidor **imediatamente**.
              Nada fica registrado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-md border-slate-200 min-h-[300px] flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 md:h-5 md:w-5 text-slate-500" />
              <CardTitle className="text-base md:text-lg">Disponíveis</CardTitle>
            </div>
            <Badge variant="outline" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white">
              {files.length} {files.length === 1 ? 'Doc' : 'Docs'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          {loading ? (
            <div className="flex justify-center items-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Nada por aqui</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                A caixa de troca está vazia no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-3 md:p-6">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="group flex flex-col p-4 border border-slate-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all duration-300 bg-white shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-amber-50 flex-shrink-0 flex items-center justify-center text-amber-500 transition-transform">
                      <FileIcon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate pr-2 group-hover:text-amber-600 transition-colors text-sm md:text-base" title={file.file_name}>
                        {file.file_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] md:text-xs font-semibold text-slate-500">{formatSize(file.file_size)}</span>
                        <span className="text-slate-300 hidden md:block">•</span>
                        <span className="flex items-center gap-1 text-[10px] md:text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(file.created_at), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-50">
                    <Button 
                      onClick={() => downloadAndDestroy(file)}
                      className="w-full bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border-0 font-bold rounded-lg transition-all h-10 text-xs"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar e Destruir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          PRONAF Secure Transfer • Agência Protegida • Zero Logs
        </p>
      </div>
    </div>
  );
}
