// views
import ClipboardHoverView from '@/features/clipboard/views/ClipboardHoverView'

// feature key
import { FeatureKey } from '@/types/feature'

// Each map is keyed by feature name
export const hoverViewMap: Record<FeatureKey, React.FC> = {
  clipboard: ClipboardHoverView
}
