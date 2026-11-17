import { Toaster as SonnerToaster } from "sonner"

// Sonner (Emil Kowalski's toast library) styled with our palette.
// Bottom-centre so a toast never covers the right-aligned Edit / Delete buttons in the table.
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
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
