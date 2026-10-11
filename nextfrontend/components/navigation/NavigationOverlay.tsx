'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useNavigationLoading } from './NavigationLoadingProvider'
import { KatakanaLoader } from './KatakanaLoader'

export function NavigationOverlay() {
  const { isLoading } = useNavigationLoading()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <KatakanaLoader />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
