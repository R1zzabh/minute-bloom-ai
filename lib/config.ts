const canonicalAppUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:3000"

export const appConfig = {
  name: "MinuteBloom",
  tagline: "Meetings end. Momentum starts.",
  description:
    "Upload a meeting recording and leave with a timestamped transcript, clear decisions, and action items your team can actually use.",
  repositoryTarget: "R1zzabh/minute-bloom-ai",
  externalUrls: {
    production: canonicalAppUrl,
    github: "https://github.com/R1zzabh/minute-bloom-ai",
  },
  navigation: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Output", href: "#output" },
    { label: "Security", href: "#security" },
    { label: "FAQ", href: "#faq" },
  ],
  capabilityStrip: [
    "Timestamped",
    "Searchable",
    "Action-first",
    "Export-ready",
  ],
  workflow: [
    {
      step: "01",
      title: "Upload",
      body: "Validate audio, create an owned record, and move the file into private storage with visible progress.",
    },
    {
      step: "02",
      title: "Transcribe",
      body: "Turn the recording into a timestamped transcript and preserve speaker labels only when the provider exposes them reliably.",
    },
    {
      step: "03",
      title: "Distill",
      body: "Summarize topics, decisions, blockers, and follow-up questions without inventing unsupported details.",
    },
    {
      step: "04",
      title: "Act",
      body: "Edit action items, assign owners, export notes, or ask a grounded follow-up question from the same meeting.",
    },
  ],
  audiences: [
    {
      title: "Project teams",
      body: "Convert standups, sprint reviews, and planning sessions into accountable next steps.",
    },
    {
      title: "Student groups",
      body: "Keep research meetings and study sessions organized without replaying the whole recording.",
    },
    {
      title: "Client calls",
      body: "Capture decisions, deliverables, and open questions before the next follow-up lands.",
    },
    {
      title: "Research interviews",
      body: "Search what was said, review speaker turns, and export a clean record for synthesis.",
    },
  ],
  faq: [
    {
      question: "What files can MinuteBloom handle today?",
      answer:
        "MinuteBloom accepts mp3, mp4, mpeg, mpga, m4a, wav, and webm uploads up to 25 MB. The limit is explicit in both the UI and the docs.",
    },
    {
      question: "Does MinuteBloom invent decisions or owners?",
      answer:
        "No. The summary layer is instructed to use only facts found in the transcript or the user-provided context, and nullable fields stay null when support is missing.",
    },
    {
      question: "How is meeting data protected?",
      answer:
        "Uploads live in a private bucket, meeting rows are guarded by row-level security, and every mutation checks authenticated ownership server-side.",
    },
    {
      question: "Can reviewers inspect the product without an account?",
      answer:
        "Yes. A deterministic public demo fixture shows the full workspace UI without calling paid APIs or exposing another user's data.",
    },
  ],
  suggestedQuestions: [
    "What decision was made about the rollout sequence?",
    "Which risks are still unresolved?",
    "What should Priya send before Friday?",
  ],
} as const
