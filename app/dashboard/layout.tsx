
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Home, FileText, User, Calculator } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const role = cookieStore.get('user_role')?.value
  const email = cookieStore.get('user_email')?.value

  if (!role || !email) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            BBMB Arrears
          </h1>
          <p className="text-xs text-slate-400 mt-1">{email}</p>
          <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300 mt-2 inline-block">
            {role}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Home size={20} />
            <span>Overview</span>
          </Link>
          
          {(role === 'CLERK' || role === 'SUPERINTENDENT') && (
            <Link href="/requests/new" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
              <FileText size={20} />
              <span>New Request</span>
            </Link>
          )}

          <div className="pt-4 mt-4 border-t border-slate-800">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              System
            </h3>
            <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
              <User size={20} />
              <span>Profile</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={async () => {
            'use server'
            const c = await cookies()
            c.delete('user_role')
            c.delete('user_email')
            redirect('/login')
          }}>
            <button type="submit" className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors">
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
