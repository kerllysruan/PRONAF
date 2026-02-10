import { ReactNode, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Erro capturado:", event.error);
      setState({
        hasError: true,
        error: event.error,
      });
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (state.hasError) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-12 w-12 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h1 className="text-lg font-bold text-destructive mb-2">Algo deu errado</h1>
                <p className="text-sm text-muted-foreground mb-4">
                  {state.error?.message || "Um erro inesperado ocorreu"}
                </p>
                <div className="space-y-2 text-xs bg-muted p-3 rounded mb-4 max-h-32 overflow-auto">
                  <p className="font-mono text-destructive">{state.error?.stack}</p>
                </div>
                <Button
                  onClick={() => {
                    setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Recarregar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
