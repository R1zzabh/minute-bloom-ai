import Link from "next/link"
import {
  ArrowRight,
  FileAudio,
  ListChecks,
  Lock,
  Search,
  Sparkles,
} from "lucide-react"

import { WorkspacePreview } from "@/components/meetings/workspace-preview"
import { SiteFooter } from "@/components/shared/site-footer"
import { SiteHeader } from "@/components/shared/site-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { appConfig } from "@/lib/config"

const featureCards = [
  {
    icon: FileAudio,
    title: "Transcription that keeps context intact",
    body: "MinuteBloom is built around timestamped, speaker-aware meeting records so the notes stay anchored to what was actually said.",
  },
  {
    icon: ListChecks,
    title: "Structured notes that stay useful after the meeting",
    body: "Decisions, blockers, action items, and follow-up questions are separated into the views teams actually need.",
  },
]

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="section-padding">
          <div className="content-width grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <Badge variant="accent">TRANSCRIPT → DECISIONS → DONE</Badge>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Meetings end. Momentum starts.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Upload a recording and leave with a speaker-aware transcript,
                clear decisions, and action items your team can actually use.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app/meetings/new"
                  className={buttonVariants({ size: "lg" })}
                >
                  Summarize a meeting
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/demo"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  View sample workspace
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Private uploads</span>
                <span>·</span>
                <span>Speaker-aware notes</span>
                <span>·</span>
                <span>Export-ready</span>
              </div>
            </div>
            <WorkspacePreview />
          </div>
        </section>

        <section className="section-padding pt-0" id="features">
          <div className="content-width grid gap-4 md:grid-cols-4">
            {appConfig.capabilityStrip.map((item) => (
              <Card key={item} className="bg-card/80 py-4 text-center">
                <p className="font-semibold">{item}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-padding border-y-2 border-border/60 bg-card/40">
          <div className="content-width grid gap-6 lg:grid-cols-2">
            <Card className="bg-background/90">
              <p className="mono-label">
                everything useful, after the conversation
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                The transcript becomes decisions, and the decisions become work.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                MinuteBloom keeps the entire path visible: upload, transcript,
                summary, action items, and grounded follow-up. The UI is
                designed for teams who need to move straight from recap to
                execution.
              </p>
            </Card>
            <div className="grid gap-6">
              {featureCards.map((feature) => (
                <Card key={feature.title}>
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {feature.body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding" id="how-it-works">
          <div className="content-width grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="mono-label">numbered walkthrough</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Four steps from audio to action
              </h2>
            </div>
            <div className="grid gap-4">
              {appConfig.workflow.map((step, index) => (
                <Card
                  key={step.step}
                  className={index % 2 === 0 ? "bg-card" : "bg-secondary/35"}
                >
                  <div className="grid gap-4 md:grid-cols-[96px_1fr]">
                    <div className="flex items-start">
                      <Badge variant={index === 2 ? "accent" : "primary"}>
                        {step.step}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section-padding border-y-2 border-border/60 bg-card/50"
          id="output"
        >
          <div className="content-width space-y-8">
            <div className="max-w-2xl">
              <p className="mono-label">workspace preview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Search the conversation, verify the decision, update the task.
              </h2>
            </div>
            <WorkspacePreview compact />
          </div>
        </section>

        <section className="section-padding">
          <div className="content-width grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {appConfig.audiences.map((audience) => (
              <Card key={audience.title}>
                <h3 className="text-xl font-semibold">{audience.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {audience.body}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section
          className="section-padding border-y-2 border-border/60 bg-card/40"
          id="security"
        >
          <div className="content-width grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card>
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Security claims that match the implementation
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                MinuteBloom only claims what the code can actually enforce:
                authenticated storage paths, row-level security, ownership
                checks, deletion controls, and no client-side API key exposure.
              </p>
            </Card>
            <div className="grid gap-4">
              <Card className="bg-background/90">
                <Sparkles className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Files live in a private storage bucket and are addressed by
                  user and meeting identifiers.
                </p>
              </Card>
              <Card className="bg-background/90">
                <Search className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Every API mutation validates auth and ownership in addition to
                  database policies.
                </p>
              </Card>
              <Card className="bg-background/90">
                <ListChecks className="h-5 w-5 text-secondary-foreground" />
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Users can retry failed processing, delete results, and export
                  their notes without exposing provider internals.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="section-padding" id="faq">
          <div className="content-width">
            <div className="max-w-2xl">
              <p className="mono-label">faq</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Straight answers before you upload anything
              </h2>
            </div>
            <div className="mt-8 grid gap-4">
              {appConfig.faq.map((item) => (
                <Card key={item.question}>
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding pt-0">
          <div className="content-width">
            <Card className="bg-primary text-primary-foreground">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mono-label text-primary-foreground/80">
                    final cta
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Upload one recording. Leave with a usable record.
                  </h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/app/meetings/new"
                    className={buttonVariants({
                      variant: "accent",
                      size: "lg",
                    })}
                  >
                    Summarize a meeting
                  </Link>
                  <Link
                    href="/demo"
                    className={buttonVariants({ variant: "ghost", size: "lg" })}
                  >
                    Open the sample workspace
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
