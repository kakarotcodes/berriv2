// dependencies
import React, { useState } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

const MailRestricted: React.FC = () => {
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestGmailPermissions = async () => {
    setIsRequesting(true)
    setError(null)

    try {
      const result = await window.electronAPI.auth.requestGmailPermissions()

      if (!result.success) {
        setError(result.error || 'Failed to request Gmail permissions')
      }
    } catch (err) {
      console.error('Error requesting Gmail permissions:', err)
      setError('Failed to request Gmail permissions')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="h-full w-full overflow-hidden ">
      <div className="p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
          <EnvelopeIcon className="w-8 h-8 text-blue-400" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">Connect Your Gmail</h3>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          Connect your Gmail account to view and manage your emails.
        </p>

        <button
          onClick={handleRequestGmailPermissions}
          disabled={isRequesting}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
        >
          {isRequesting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Connecting...
            </>
          ) : (
            <>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Connect Gmail
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MailRestricted
