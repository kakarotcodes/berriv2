// views
import ClipboardHoverView from '@/features/clipboard/views/ClipboardHoverView'

// feature key
import { FeatureKey } from '@/types/feature'

// Direct component registry without any indirection that could cause transitions
export const hoverViewMap: Record<FeatureKey, React.FC> = {
  clipboard: ClipboardHoverView
}

export const defaultViewMap: Record<FeatureKey, React.FC> = {
  clipboard: ClipboardHoverView
}
