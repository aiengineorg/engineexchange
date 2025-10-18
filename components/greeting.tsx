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
        <div className="mb-4 font-space text-base font-bold uppercase tracking-wide text-primary">
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
          <div className="flex items-start gap-2">
            <span className="text-accent">📅</span>
            <span><span className="font-semibold">Schedule & Logistics</span> - Timing, venue details, and event flow</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent">🤝</span>
            <span><span className="font-semibold">Tech Partners</span> - Anthropic, Vercel, ElevenLabs, Deepnote & more</span>
          </div>
        </div>
      </motion.div>

      {/* Example Questions */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-xl bg-accent/10 p-4"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <p className="mb-3 text-center font-semibold text-foreground text-sm md:text-base">
          💡 Example Questions
        </p>
        <div className="space-y-2 text-foreground text-xs md:text-sm">
          <div className="rounded-lg bg-card/50 p-2 text-center">&quot;Tell me about the AI for Science theme and what kind of projects I can build&quot;</div>
          <div className="rounded-lg bg-card/50 p-2 text-center">&quot;Who is Mikayel Harutyunyan and what&apos;s his expertise?&quot;</div>
          <div className="rounded-lg bg-card/50 p-2 text-center">&quot;What are the judging criteria and how will projects be evaluated?&quot;</div>
          <div className="rounded-lg bg-card/50 p-2 text-center">&quot;What resources and APIs do tech partners like Anthropic provide?&quot;</div>
          <div className="rounded-lg bg-card/50 p-2 text-center">&quot;When does the hackathon start and what&apos;s the full schedule?&quot;</div>
        </div>
      </motion.div>
    </div>
  );
};
