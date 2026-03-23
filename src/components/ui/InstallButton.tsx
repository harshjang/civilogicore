import { useEffect, useState } from "react";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      setPrompt(e);
    });
  }, []);

  const installApp = () => {
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => setPrompt(null));
    }
  };

  if (!prompt) return null;

  return (
    <button
      onClick={installApp}
      className="px-3 py-2 bg-primary text-white rounded text-xs font-mono"
    >
      Install App
    </button>
  );
}