import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.svg";

interface SplashContextType {
  triggerSplash: () => void;
}

const SplashContext = createContext<SplashContextType>({ triggerSplash: () => {} });

export const useSplash = () => useContext(SplashContext);

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(() => sessionStorage.getItem("civilogicore_splash_seen") !== "true");

  const triggerSplash = useCallback(() => {
    sessionStorage.removeItem("civilogicore_splash_seen");
    setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("civilogicore_splash_seen", "true");
      setShow(false);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [show]);

  return (
    <SplashContext.Provider value={{ triggerSplash }}>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[9999] bg-background blueprint-grid flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.img
              src={logo}
              alt="CiviLogiCore"
              className="w-24 h-24"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 24px hsl(187 80% 48% / 0.35))" }}
            />
            <motion.h1
              className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-wider mt-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <span className="text-gradient-cyan">C</span>IVI
              <span className="text-gradient-cyan">L</span>OGI
              <span className="text-gradient-cyan">C</span>ORE
            </motion.h1>
            <motion.div
              className="mt-7 h-0.5 w-44 overflow-hidden rounded-full bg-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </SplashContext.Provider>
  );
}
