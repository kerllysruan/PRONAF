import React from "react";
import { usePermissions, type UserPermissions } from "@/hooks/usePermissions";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PermissionGateProps {
    children: React.ReactNode;
    permission?: keyof UserPermissions;
    requireAdmin?: boolean;
    requireDeveloper?: boolean;
    fallback?: React.ReactNode;
    showError?: boolean;
    redirectPath?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    permission,
    requireAdmin = false,
    requireDeveloper = false,
    fallback = null,
    showError = false,
    redirectPath,
}) => {
    const { permissions, role, isAdmin, isDeveloper, loading } = usePermissions();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    let hasAccess = true;

    // 1. Check Developer Requirement
    if (requireDeveloper && !isDeveloper) {
        hasAccess = false;
    }

    // 2. Check Admin Requirement
    if (requireAdmin && !isAdmin) {
        hasAccess = false;
    }

    // 3. Check Specific Permission (respecting database value strictly)
    if (permission && !permissions[permission]) {
        hasAccess = false;
    }

    if (!hasAccess) {
        if (redirectPath) {
            return <Navigate to={redirectPath} replace />;
        }

        if (showError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <Card className="max-w-md w-full border-destructive/20 shadow-lg">
                        <CardContent className="pt-8 pb-8 text-center space-y-4">
                            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                                <ShieldAlert className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Acesso Negado</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Você não tem as permissões necessárias para acessar este recurso.
                                    Entre em contato com o administrador se considerar isso um erro.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="mt-4"
                            >
                                Voltar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return fallback as React.ReactElement | null;
    }

    return <>{children}</>;
};
