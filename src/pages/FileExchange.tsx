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
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-3">
            <Share2 className="h-8 w-8 text-amber-500" />
            Troca de Arquivos
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            Sistema efêmero: o arquivo é destruído permanentemente após o download.
          </p>
        </div>

        <div className="relative">
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
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-wide shadow-md shadow-amber-200"
          >
            <label htmlFor="file-upload" className="cursor-pointer flex items-center">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Enviar Arquivo
            </label>
          </Button>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="bg-amber-50 border-amber-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldAlert className="h-24 w-24 -mr-4 -mt-4 text-amber-900" />
        </div>
        <CardContent className="p-6 flex gap-4 items-start relative z-10">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-600">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Como funciona a Troca Efêmera?</h3>
            <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">
              Este espaço foi projetado para transferência rápida de documentos entre a equipe. 
              <strong> Ao clicar em baixar, o arquivo é removido do servidor e do banco de dados imediatamente.</strong> 
              Isso garante que informações sensíveis não permaneçam no sistema e economiza espaço de armazenamento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-md border-slate-200 min-h-[400px]">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg">Arquivos Disponíveis</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white">
              {files.length} {files.length === 1 ? 'Arquivo' : 'Arquivos'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Nenhum arquivo para troca</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                A caixa de troca está limpa. Envie um arquivo para que outros membros da agência possam baixá-lo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="group flex flex-col p-4 border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <FileIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate pr-2 group-hover:text-amber-600 transition-colors" title={file.file_name}>
                        {file.file_name}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
                        <span>{formatSize(file.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(file.created_at), "HH:mm")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Disponível na Agência
                    </span>
                    <Button 
                      onClick={() => downloadAndDestroy(file)}
                      size="sm"
                      className="bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border-0 font-bold rounded-lg transition-all"
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
