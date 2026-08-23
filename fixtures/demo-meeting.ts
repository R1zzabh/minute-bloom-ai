import type { MeetingRecord } from "@/types/meeting"

export const demoMeeting: MeetingRecord = {
  id: "demo-meeting",
  title: "Launch sync: research summary rollout",
  description:
    "Deterministic product demo fixture. This workspace is static and does not call live transcription or summarization APIs.",
  language: "en",
  storagePath: "demo/demo-meeting/demo-launch-sync.m4a",
  status: "completed",
  progress: 100,
  originalFileName: "launch-sync-demo.m4a",
  mimeType: "audio/m4a",
  sizeBytes: 12_842_318,
  durationSeconds: 1456,
  transcriptText:
    "[00:00] Speaker 1: We need the research summary rollout to feel dependable on day one.\n[00:18] Speaker 2: The main blocker is still unclear ownership for the QA checklist.\n[00:52] Speaker 1: Let's ship the workspace first and keep calendar integration out of scope.\n[01:32] Speaker 3: Priya can send the final onboarding copy by Friday.\n[02:04] Speaker 2: We should keep an eye on audio uploads above twenty megabytes.",
  transcriptSegments: [
    {
      id: "seg-1",
      startSeconds: 0,
      endSeconds: 18,
      speaker: "Speaker 1",
      text: "We need the research summary rollout to feel dependable on day one.",
    },
    {
      id: "seg-2",
      startSeconds: 18,
      endSeconds: 52,
      speaker: "Speaker 2",
      text: "The main blocker is still unclear ownership for the QA checklist.",
    },
    {
      id: "seg-3",
      startSeconds: 52,
      endSeconds: 92,
      speaker: "Speaker 1",
      text: "Let's ship the workspace first and keep calendar integration out of scope.",
    },
    {
      id: "seg-4",
      startSeconds: 92,
      endSeconds: 124,
      speaker: "Speaker 3",
      text: "Priya can send the final onboarding copy by Friday.",
    },
    {
      id: "seg-5",
      startSeconds: 124,
      endSeconds: 148,
      speaker: "Speaker 2",
      text: "We should keep an eye on audio uploads above twenty megabytes.",
    },
  ],
  summary: {
    suggestedTitle: "Research summary rollout launch sync",
    executiveSummary:
      "The team aligned on shipping the meeting workspace first, keeping the first release tight, and monitoring upload constraints before broad rollout. Ownership on the QA checklist remains unresolved and still needs assignment.",
    keyTopics: [
      {
        topic: "Release scope",
        detail:
          "The initial launch should focus on the workspace rather than stretching into calendar integrations.",
      },
      {
        topic: "Launch quality",
        detail:
          "The experience needs to feel dependable on day one, especially around uploads and output clarity.",
      },
      {
        topic: "Operational risk",
        detail:
          "Uploads near the supported size cap need explicit monitoring and messaging.",
      },
    ],
    decisions: [
      {
        decision: "Ship the workspace before exploring calendar integration.",
        rationale:
          "The team wants a tighter first release with less launch risk.",
        timestampSeconds: 52,
      },
    ],
    actionItems: [
      {
        task: "Send the final onboarding copy.",
        owner: "Priya",
        dueDate: "2026-08-28",
        priority: "high",
        timestampSeconds: 92,
        isInferred: false,
      },
      {
        task: "Assign ownership for the QA checklist.",
        owner: null,
        dueDate: null,
        priority: "high",
        timestampSeconds: 18,
        isInferred: true,
      },
      {
        task: "Add stronger guidance around the 25 MB upload limit.",
        owner: null,
        dueDate: null,
        priority: "medium",
        timestampSeconds: 124,
        isInferred: true,
      },
    ],
    blockers: ["No clear owner is assigned to the QA checklist yet."],
    openQuestions: [
      "Who should own the QA checklist before rollout?",
      "What monitoring should trigger follow-up on large-file uploads?",
    ],
  },
  processingError: null,
  actionItems: [
    {
      id: "action-1",
      task: "Send the final onboarding copy.",
      owner: "Priya",
      dueDate: "2026-08-28",
      priority: "high",
      status: "in_progress",
      sourceTimestampSeconds: 92,
      isInferred: false,
    },
    {
      id: "action-2",
      task: "Assign ownership for the QA checklist.",
      owner: null,
      dueDate: null,
      priority: "high",
      status: "open",
      sourceTimestampSeconds: 18,
      isInferred: true,
    },
    {
      id: "action-3",
      task: "Add stronger guidance around the 25 MB upload limit.",
      owner: "Jordan",
      dueDate: null,
      priority: "medium",
      status: "done",
      sourceTimestampSeconds: 124,
      isInferred: true,
    },
  ],
  createdAt: "2026-08-21T13:10:00.000Z",
  updatedAt: "2026-08-21T13:42:00.000Z",
}
