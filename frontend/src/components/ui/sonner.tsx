import { Toaster as SonnerToaster } from "sonner"

// Sonner (Emil Kowalski's toast library) styled with our palette.
// Positioned bottom-right on desktop and top-centre on phones by Sonner itself.
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !text-foreground !border !border-border !shadow-md !rounded-lg !font-sans",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-ok",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  )
}
