"use client"

import { Upload } from "tus-js-client"
import {
  FileAudio,
  LoaderCircle,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MAX_AUDIO_FILE_SIZE_BYTES,
  RESUMABLE_UPLOAD_THRESHOLD_BYTES,
} from "@/lib/constants"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { validateAudioFile } from "@/lib/meetings/validators"
import { formatBytes } from "@/lib/utils"

const steps = ["Uploading", "Uploaded", "Transcribing", "Summarizing"] as const
const bucketName = "meeting-audio"

function UploadStep({
  active,
  complete,
  label,
}: {
  active: boolean
  complete: boolean
  label: (typeof steps)[number]
}) {
  return (
    <div
      className={[
        "rounded-md border-2 px-3 py-2 font-mono text-[11px] tracking-[0.22em] uppercase",
        complete
          ? "border-border bg-primary text-primary-foreground"
          : active
            ? "border-border bg-secondary text-secondary-foreground"
            : "border-border bg-card text-card-foreground",
      ].join(" ")}
    >
      {label}
    </div>
  )
}

export function MeetingUploadForm({
  liveUploadsEnabled,
}: {
  liveUploadsEnabled: boolean
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("auto")
  const [description, setDescription] = useState("")
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] =
    useState<(typeof steps)[number]>("Uploading")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!pending) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [pending])

  function handleFileSelection(nextFile: File | null) {
    if (!nextFile) {
      setFile(null)
      return
    }

    const validation = validateAudioFile(nextFile)

    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    setFile(nextFile)
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, ""))
    }
  }

  async function uploadResumable(storagePath: string, nextFile: File) {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error("Your session expired before the upload started.")
    }

    const uploadUrl = new URL(
      "/storage/v1/upload/resumable",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    )

    await new Promise<void>((resolve, reject) => {
      const upload = new Upload(nextFile, {
        endpoint: uploadUrl.toString(),
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        retryDelays: [0, 1_000, 3_000, 5_000],
        chunkSize: 6 * 1024 * 1024,
        metadata: {
          bucketName,
          objectName: storagePath,
          contentType: nextFile.type,
          cacheControl: "3600",
        },
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "x-upsert": "false",
        },
        onError(error) {
          reject(error)
        },
        onProgress(bytesUploaded, bytesTotal) {
          setProgress(
            Math.max(5, Math.round((bytesUploaded / bytesTotal) * 100))
          )
        },
        onSuccess() {
          resolve()
        },
      })

      upload.start()
    })
  }

  async function uploadStandard(storagePath: string, nextFile: File) {
    const supabase = createBrowserSupabaseClient()
    let animatedProgress = 0
    const timer = window.setInterval(() => {
      animatedProgress = Math.min(animatedProgress + 12, 88)
      setProgress(animatedProgress)
    }, 180)

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, nextFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        throw error
      }
    } finally {
      window.clearInterval(timer)
    }

    setProgress(100)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      toast.error("Choose an audio file before starting the upload.")
      return
    }

    const validation = validateAudioFile(file)

    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    if (!liveUploadsEnabled) {
      setPending(true)
      setProgress(100)
      setActiveStep("Summarizing")
      toast.message(
        "Fixture mode is active. Connect Supabase and OpenAI to enable live uploads."
      )
      window.setTimeout(() => {
        router.push("/app/meetings/demo-meeting")
      }, 600)
      return
    }

    setPending(true)
    setProgress(0)
    setActiveStep("Uploading")

    let meetingId: string | null = null

    try {
      const createResponse = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          language,
          originalFileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      })

      const createPayload = (await createResponse.json()) as {
        error?: string
        meeting?: { id: string; storagePath: string }
      }

      if (!createResponse.ok || !createPayload.meeting) {
        throw new Error(createPayload.error ?? "Unable to create meeting.")
      }

      meetingId = createPayload.meeting.id

      if (file.size > RESUMABLE_UPLOAD_THRESHOLD_BYTES) {
        await uploadResumable(createPayload.meeting.storagePath, file)
      } else {
        await uploadStandard(createPayload.meeting.storagePath, file)
      }

      setActiveStep("Uploaded")

      const updateResponse = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "uploaded",
          progress: 25,
        }),
      })

      if (!updateResponse.ok) {
        const updatePayload = (await updateResponse.json()) as {
          error?: string
        }
        throw new Error(
          updatePayload.error ?? "Unable to mark the meeting as uploaded."
        )
      }

      setActiveStep("Transcribing")

      const processResponse = await fetch(
        `/api/meetings/${meetingId}/process`,
        {
          method: "POST",
        }
      )

      if (!processResponse.ok && processResponse.status !== 202) {
        const processPayload = (await processResponse.json()) as {
          error?: string
        }
        throw new Error(
          processPayload.error ?? "Unable to start meeting processing."
        )
      }

      toast.success("Upload complete. MinuteBloom is processing the meeting.")
      router.push(`/app/meetings/${meetingId}`)
      router.refresh()
    } catch (error) {
      if (meetingId) {
        await fetch(`/api/meetings/${meetingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "failed",
            processingError:
              error instanceof Error ? error.message : "Upload failed.",
          }),
        })
      }

      toast.error(error instanceof Error ? error.message : "Upload failed.")
      setProgress(0)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="surface-dash p-8 text-center">
        <UploadCloud className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Drop an audio file here</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Supports mp3, mp4, mpeg, mpga, m4a, wav, and webm up to 25 MB.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,audio/*,video/mp4"
              className="sr-only"
              onChange={(event) =>
                handleFileSelection(event.target.files?.[0] ?? null)
              }
              disabled={pending}
            />
            <span className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow)]">
              Browse files
            </span>
          </label>
          {file ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleFileSelection(null)}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        {file ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border-2 border-border bg-background px-4 py-4 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <FileAudio className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {file.type || "Unknown type"} · {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {file.size > RESUMABLE_UPLOAD_THRESHOLD_BYTES
                  ? "Resumable"
                  : "Standard"}
              </Badge>
            </div>
            {pending ? (
              <div className="mt-4">
                <div className="h-3 rounded-full border-2 border-border bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload progress: {progress}%
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="meeting-title"
          >
            Meeting title
          </label>
          <Input
            id="meeting-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Weekly launch sync"
            maxLength={160}
          />
          <label
            className="mt-4 mb-2 block text-sm font-medium"
            htmlFor="language"
          >
            Language
          </label>
          <Input
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            placeholder="auto"
            maxLength={24}
          />
        </Card>
        <Card>
          <label className="mb-2 block text-sm font-medium" htmlFor="context">
            Optional context
          </label>
          <Textarea
            id="context"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell MinuteBloom what this meeting is about, or leave blank."
            maxLength={600}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <UploadStep
                key={step}
                label={step}
                active={activeStep === step}
                complete={steps.indexOf(activeStep) > index}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={!file || pending}>
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Start upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setFile(null)
                setProgress(0)
                setTitle("")
                setDescription("")
                setLanguage("auto")
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          {!liveUploadsEnabled ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Live upload is disabled until public Supabase and OpenAI
              environment variables are configured. The demo route remains
              available for review.
            </p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            The maximum supported file size is{" "}
            {formatBytes(MAX_AUDIO_FILE_SIZE_BYTES)}.
          </p>
        </Card>
      </div>
    </form>
  )
}
