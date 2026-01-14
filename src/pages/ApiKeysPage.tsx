import { useState } from 'react'
import { useApiKeys, useRevokeApiKey } from '@/lib/hooks/useApiKeys'
import { CreateApiKeyDialog } from '@/components/CreateApiKeyDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Loader2, Eye, Ban } from 'lucide-react'

export function ApiKeysPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showPermissions, setShowPermissions] = useState<string | null>(null)
  const { data: apiKeys, isLoading } = useApiKeys()
  const revokeKey = useRevokeApiKey()

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      try {
        await revokeKey.mutateAsync(id)
      } catch (error) {
        console.error('Failed to revoke key:', error)
      }
    }
  }

  const formatPermissions = (permissions: any) => {
    if (!permissions || !Array.isArray(permissions)) return 'No permissions'
    return permissions
      .map((p) => `${p.project}: ${p.access}`)
      .join(', ')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-2">
            Manage API keys for external access to your services
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Key
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys?.map((key) => (
              <TableRow key={key.id} className={key.revoked_at ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {key.key_prefix}...
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                      {formatPermissions(key.permissions)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPermissions(showPermissions === key.id ? null : key.id)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                  {showPermissions === key.id && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre>{JSON.stringify(key.permissions, null, 2)}</pre>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{key.created_by || '-'}</TableCell>
                <TableCell className="text-sm">
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleDateString()
                    : 'Never'}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(key.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {key.revoked_at ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!key.revoked_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(key.id)}
                      disabled={revokeKey.isPending}
                    >
                      <Ban className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {apiKeys?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No API keys found</p>
            <p className="text-sm mt-2">Create your first API key to get started</p>
          </div>
        )}
      </div>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
