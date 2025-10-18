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

      {/* Knowledge Base Features */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card p-6 shadow-md"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <div className="mb-4 font-space text-base font-bold uppercase tracking-wide text-accent">
          📚 What I Know About
        </div>
        <div className="space-y-2 text-sm text-card-foreground md:text-base">
          <div className="flex items-start gap-2">
            <span className="text-accent">👥</span>
            <span><span className="font-semibold">Mentors & Organizers</span> - Meet the team guiding your journey</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🎯</span>
            <span><span className="font-semibold">Themes & Challenges</span> - AI for Science, Agentic Commerce & more</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🏆</span>
            <span><span className="font-semibold">Prizes & Judging</span> - What you can win and how projects are evaluated</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
