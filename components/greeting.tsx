import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      {/* AI Engine Logo Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl bg-primary p-8 text-center shadow-lg"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-3">
          <p className="text-primary-foreground text-sm uppercase tracking-[0.2em]">
            [BUILD / CONNECT / INNOVATE]
          </p>
          <h1 className="font-space text-5xl text-primary-foreground md:text-6xl">
            AI ENGINE
          </h1>
          <p className="text-primary-foreground text-sm tracking-wide">
            Warsaw Edition · Hackathon Assistant
          </p>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-space text-2xl font-bold uppercase text-primary md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Welcome to AI Engine Bot
      </motion.div>
      
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-lg text-muted-foreground md:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        🚀 Your intelligent assistant for the AI Engine Warsaw Edition Hackathon
      </motion.div>

      {/* Features Card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-xl bg-card p-6 shadow-md"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <div className="mb-4 font-space text-base font-bold uppercase tracking-wide text-primary">
          🔧 Powered by Advanced Tools
        </div>
        <div className="space-y-2 text-sm text-card-foreground md:text-base">
          <div className="flex items-start gap-2">
            <span className="text-accent">📚</span>
            <span><span className="font-semibold">Knowledge Base Search</span> - Instant access to hackathon wiki</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🔍</span>
            <span><span className="font-semibold">Web Search</span> - Real-time information from the web</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🧮</span>
            <span><span className="font-semibold">Calculator</span> - Complex computations on demand</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🌤️</span>
            <span><span className="font-semibold">Weather API</span> - Live weather data for Warsaw</span>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-xl bg-accent/10 p-4 text-center"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-foreground md:text-base">
          <span className="font-semibold">Try asking:</span> &quot;Who are the mentors?&quot; • &quot;What are the themes?&quot; • &quot;Tell me about judging criteria&quot;
        </p>
      </motion.div>
    </div>
  );
};
