import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        👋 Welcome to Agentic ChatBot!
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-slate-500 md:text-2xl dark:text-slate-300"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        🤖 Your friendly test bot for experimenting with AI SDK&apos;s agent class
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-base text-slate-600 md:text-lg dark:text-slate-400"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        ✨ Equipped with powerful tools:
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 space-y-1 text-sm text-slate-600 md:text-base dark:text-slate-400"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8 }}
      >
        <div>🔍 <span className="font-medium">Brave Search</span> - Real-time web searches</div>
        <div>🧮 <span className="font-medium">Calculator</span> - Complex computations</div>
        <div>🌤️ <span className="font-medium">Weather API</span> - Live weather data</div>
        <div>🎫 <span className="font-medium">Zapier Integration</span> - Create support tickets</div>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-sm text-slate-600 md:text-base dark:text-slate-400"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.9 }}
      >
        Go ahead, test my agentic capabilities and see what I can do! 🚀
      </motion.div>
    </div>
  );
};
