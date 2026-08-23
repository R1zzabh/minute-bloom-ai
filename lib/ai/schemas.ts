import { z } from "zod"

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  text: z.string().trim().min(1),
  speaker: z.string().trim().min(1).nullable(),
})

export const meetingSummarySchema = z.object({
  suggestedTitle: z.string().trim().min(1),
  executiveSummary: z.string().trim().min(1),
  keyTopics: z.array(
    z.object({
      topic: z.string().trim().min(1),
      detail: z.string().trim().min(1),
    })
  ),
  decisions: z.array(
    z.object({
      decision: z.string().trim().min(1),
      rationale: z.string().trim().min(1).nullable(),
      timestampSeconds: z.number().min(0).nullable(),
    })
  ),
  actionItems: z.array(
    z.object({
      task: z.string().trim().min(1),
      owner: z.string().trim().min(1).nullable(),
      dueDate: z.string().date().nullable(),
      priority: z.enum(["low", "medium", "high"]),
      timestampSeconds: z.number().min(0).nullable(),
      isInferred: z.boolean(),
    })
  ),
  blockers: z.array(z.string().trim().min(1)),
  openQuestions: z.array(z.string().trim().min(1)),
})

export const groundedAnswerSchema = z.object({
  answer: z.string().trim().min(1),
  citations: z.array(
    z.object({
      timestampSeconds: z.number().min(0).nullable(),
      supportingQuote: z.string().trim().min(1).nullable(),
    })
  ),
})

export type MeetingSummaryShape = z.infer<typeof meetingSummarySchema>
export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>
export type TranscriptSegmentShape = z.infer<typeof transcriptSegmentSchema>
