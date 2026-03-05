"use client"
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    // Esc key to close
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-zinc-950 border border-white/10 p-8 shadow-2xl",
                            className
                        )}
                    >
                        <div className="flex items-center justify-between mb-6">
                            {title && <h3 className="text-xl font-black text-white">{title}</h3>}
                            <button
                                onClick={onClose}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
