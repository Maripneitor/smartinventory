import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLOrSVGElement> {
    size?: "sm" | "md" | "lg"
    className?: string
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
    const sizes = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    }

    return (
        <Loader2
            className={cn("animate-spin text-blue-500", sizes[size], className)}
            {...props}
        />
    )
}
