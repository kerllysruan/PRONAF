import { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DbDisbursement } from "@/hooks/useDisbursements";
import { DbProposal } from "@/hooks/useProposals";
import { PROJECT_DESIGNER_LABELS } from "@/types/proposal";

interface DisbursementChartsProps {
    disbursements: DbDisbursement[];
    proposals: DbProposal[];
}

const COLORS = {
    primary: "#0ea5e9", // sky-500
    success: "#22c55e", // green-500
    warning: "#f59e0b", // amber-500
    destructive: "#ef4444", // red-500
    muted: "#94a3b8",   // slate-400
    info: "#3b82f6",    // blue-500
};

const STATUS_COLORS = {
    pendente: COLORS.warning,
    aprovado: COLORS.info,
    liberado: COLORS.success,
    negado: COLORS.destructive,
};

export function DisbursementCharts({ disbursements, proposals }: DisbursementChartsProps) {

    // 1. Dados por Projetista (Solicitado vs Liberado)
    const designerData = useMemo(() => {
        // Mapa inicial com todos os projetistas zerados
        const map = new Map<string, { name: string, requested: number, released: number }>();

        Object.entries(PROJECT_DESIGNER_LABELS).forEach(([key, label]) => {
            map.set(key, { name: label.split(" ")[0], requested: 0, released: 0 }); // Usa primeiro nome
        });

        // Adicionar categoria "Outros/Sistema"
        map.set("others", { name: "Outros", requested: 0, released: 0 });

        disbursements.forEach(d => {
            const proposal = proposals.find(p => p.id === d.proposal_id);
            const designerKey = proposal?.project_designer || "others";
            const key = map.has(designerKey) ? designerKey : "others";

            const entry = map.get(key)!;
            const amount = Number(d.amount);

            // Solicitado (todos exceto negados)
            if (d.status !== 'negado') {
                entry.requested += amount;
            }

            // Liberado (apenas status liberado)
            if (d.status === 'liberado') {
                entry.released += amount;
            }
        });

        return Array.from(map.values()).filter(item => item.requested > 0 || item.released > 0);
    }, [disbursements, proposals]);

    // 2. Dados por Status (Círculo)
    const statusData = useMemo(() => {
        const counts = {
            pendente: 0,
            aprovado: 0,
            liberado: 0,
            negado: 0,
        };

        disbursements.forEach(d => {
            const status = d.status as keyof typeof counts;
            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        return [
            { name: "Pendente", value: counts.pendente, color: STATUS_COLORS.pendente },
            { name: "Aprovado", value: counts.aprovado, color: STATUS_COLORS.pendente }, // Reusing warning/info logic if needed, but lets use specific
            { name: "Liberado", value: counts.liberado, color: STATUS_COLORS.liberado },
            { name: "Negado", value: counts.negado, color: STATUS_COLORS.negado },
        ].filter(d => d.value > 0);
    }, [disbursements]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

    if (disbursements.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">

            {/* Gráfico de Barras - Performance por Projetista */}
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="text-sm font-heading">Performance por Projetista</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={designerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), ""]}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                />
                                <Bar
                                    name="Solicitado"
                                    dataKey="requested"
                                    fill={COLORS.primary}
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                                <Bar
                                    name="Liberado"
                                    dataKey="released"
                                    fill={COLORS.success}
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico de Pizza - Status */}
            <Card className="col-span-1 border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="text-sm font-heading">Status dos Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    layout="horizontal"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Total Label Center */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                            <span className="text-3xl font-bold font-heading text-slate-700 dark:text-slate-200">
                                {disbursements.length}
                            </span>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
