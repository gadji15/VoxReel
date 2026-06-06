import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

/**
 * `/app/create` is an alias for the first step of the create flow. It redirects
 * to the upload step so the flow has a single canonical entry page.
 */
export default function CreateIndexPage() {
  redirect(ROUTES.CREATE_UPLOAD)
}
