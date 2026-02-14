import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number;
    onChange: (value: number) => void;
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
    // Use local state to handle the input value
    // We format the value prop on render

    const formatValue = (val: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
        }).format(val);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-numeric characters
        const rawValue = e.target.value.replace(/\D/g, "");

        // Convert to number (cents)
        const numberValue = Number(rawValue) / 100;

        onChange(numberValue);
    };

    return (
        <Input
            {...props}
            value={formatValue(value)}
            onChange={handleChange}
            className={className}
            placeholder="R$ 0,00"
        />
    );
}
