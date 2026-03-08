import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.svg";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[9999] bg-background blueprint-grid flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/6 rounded-full blur-3xl" />

            {/* Logo */}
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ boxShadow: "0 0 0px hsl(187 80% 48% / 0)" }}
                animate={{
                  boxShadow: [
                    "0 0 0px hsl(187 80% 48% / 0)",
                    "0 0 60px hsl(187 80% 48% / 0.5)",
                    "0 0 30px hsl(187 80% 48% / 0.25)",
                  ],
                }}
                transition={{ duration: 2, delay: 0.3 }}
              />
              <motion.img
                src={logo}
                alt="CiviLogiCore"
                className="w-28 h-28"
                initial={{ filter: "brightness(0) blur(10px)" }}
                animate={{ filter: "brightness(1) blur(0px)" }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 24px hsl(187 80% 48% / 0.35))" }}
              />
              {/* Scan line */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ top: "0%", opacity: 1 }}
                animate={{ top: "100%", opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-wider mt-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <span className="text-gradient-cyan">C</span>IVI
              <span className="text-gradient-cyan">L</span>OGI
              <span className="text-gradient-cyan">C</span>ORE
            </motion.h1>

            <motion.p
              className="font-mono text-xs text-muted-foreground mt-2 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Civil Engineering Intelligence Platform
            </motion.p>

            {/* Loading bar */}
            <motion.div
              className="mt-8 w-48 h-0.5 bg-border rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, delay: 1, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
