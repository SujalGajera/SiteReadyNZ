import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { BrandMark } from './BrandMark'
import { NavLinks } from './NavLinks'

/**
 * Phone navigation: a Vaul bottom sheet (AGENT_RULES: Vaul for mobile drawers).
 * Vaul gives drag-to-dismiss and the native-feeling spring for free.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" strokeWidth={1.75} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="px-5 pb-8 pt-2">
          <DrawerTitle asChild>
            <div className="mb-4">
              <BrandMark />
            </div>
          </DrawerTitle>
          <DrawerDescription className="sr-only">Main navigation</DrawerDescription>
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
