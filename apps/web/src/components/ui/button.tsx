import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
            secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
            ghost: 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white',
            outline: 'bg-transparent border border-white/10 hover:border-white/20 text-white'
        }

        return (
            <button
                className={cn(
                    "flex items-center justify-center rounded-xl px-4 py-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
