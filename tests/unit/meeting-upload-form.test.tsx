// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  createBrowserSupabaseClient: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}))

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: mocks.createBrowserSupabaseClient,
}))

import { MeetingUploadForm } from "@/components/meetings/meeting-upload-form"

describe("meeting upload form", () => {
  beforeEach(() => {
    mocks.push.mockReset()
    mocks.refresh.mockReset()
    mocks.toastError.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.createBrowserSupabaseClient.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows a clear error when the create-meeting response omits storagePath", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          meeting: {
            id: "meeting-1",
            storage_path: "user-1/meeting-1/demo.mp4",
            status: "uploading",
          },
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    )

    const user = userEvent.setup()
    const { container } = render(
      <MeetingUploadForm
        liveUploadsEnabled
        availabilityMessage="Live processing is ready."
      />
    )

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null

    expect(fileInput).not.toBeNull()

    fireEvent.change(fileInput!, {
      target: {
        files: [new File(["mp4"], "demo.mp4", { type: "video/mp4" })],
      },
    })

    await user.click(screen.getByRole("button", { name: "Start upload" }))

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Upload setup failed because the server did not return a storage path."
      )
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(mocks.createBrowserSupabaseClient).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
