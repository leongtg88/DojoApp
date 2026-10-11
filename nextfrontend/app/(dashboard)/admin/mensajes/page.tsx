import { auth } from '@/auth'
import { AdminMessages } from '@/components/dashboard/admin/AdminMessages'
import { getAdminWhatsAppConversations, getAdminWhatsAppThread } from '@/lib/dashboard/whatsapp-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminMessagesPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const conversations = await getAdminWhatsAppConversations(userId)

    if (!conversations) {
        redirect('/no-autorizado')
    }

    const initialThread = conversations[0] ? await getAdminWhatsAppThread(userId, conversations[0].id) : null

    return <AdminMessages conversations={conversations} initialThread={initialThread} />
}
