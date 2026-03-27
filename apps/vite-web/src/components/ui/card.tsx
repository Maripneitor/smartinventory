import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "blue" | "purple" | "emerald" | "amber" | "secondary"
    interactive?: boolean
    noPadding?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "glass", interactive = false, noPadding = false, ...props }, ref) => {
        const variants: Record<string, string> = {
            default: "bg-zinc-900 border border-white/5 shadow-xl",
            secondary: "bg-zinc-800 border border-white/5 shadow-xl",
            glass: "bg-zinc-900/40 border border-white/5 backdrop-blur-md shadow-inner",
            blue: "bg-blue-500/10 border border-blue-500/20 shadow-blue-500/10",
            purple: "bg-purple-500/10 border border-purple-500/20 shadow-purple-500/10",
            emerald: "bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/10",
            amber: "bg-amber-500/10 border border-amber-500/20 shadow-amber-500/10"
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-[2rem] transition-all overflow-hidden",
                    !noPadding && "p-6",
                    variants[variant as string] || variants.glass,
                    interactive && "active:scale-[0.98] hover:bg-zinc-800/40 transition-transform duration-200 cursor-pointer",
                    className
                )}
                {...props}
            />
        )
    }
)

Card.displayName = "Card"

export { Card }
