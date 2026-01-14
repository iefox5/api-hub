import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useProjects } from '@/lib/hooks/useProjects'
import { useCreateApiKey } from '@/lib/hooks/useApiKeys'
import { Copy, Check } from 'lucide-react'

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const { data: projects } = useProjects()
  const createApiKey = useCreateApiKey()

  const [formData, setFormData] = useState({
    name: '',
    created_by: '',
  })

  const [permissions, setPermissions] = useState<Record<string, 'none' | 'read' | 'read_write'>>({})
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Generate API key
    const randomStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const fullKey = `ak_${randomStr}`

    // Hash the key (simple hash for demo - in production use proper crypto)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullKey))
    const hashArray = Array.from(new Uint8Array(hash))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Build permissions array
    const permissionsArray = Object.entries(permissions)
      .filter(([_, access]) => access !== 'none')
      .map(([project, access]) => ({ project, access }))

    try {
      await createApiKey.mutateAsync({
        name: formData.name,
        key_prefix: `ak_${randomStr.substring(0, 8)}`,
        key_hash: hashHex,
        permissions: permissionsArray,
        created_by: formData.created_by || null,
      })

      setGeneratedKey(fullKey)
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', created_by: '' })
    setPermissions({})
    setGeneratedKey(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key with specific project permissions
          </DialogDescription>
        </DialogHeader>

        {generatedKey ? (
          // Show generated key
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Save this key now! You won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {generatedKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          // Show form
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production API Key"
              />
            </div>

            {/* Created By */}
            <div className="space-y-2">
              <Label htmlFor="created_by">Created By</Label>
              <Input
                id="created_by"
                value={formData.created_by}
                onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                placeholder="e.g., E019"
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>Project Permissions</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-2 bg-gray-50 px-4 py-2 text-sm font-medium">
                  <div>Project</div>
                  <div>None</div>
                  <div>Read</div>
                  <div>Read/Write</div>
                </div>
                {projects?.map((project) => (
                  <div key={project.id} className="grid grid-cols-4 gap-2 px-4 py-3 border-t items-center">
                    <div className="text-sm font-medium">{project.name}</div>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`perm-${project.id}`}
                        checked={!permissions[project.name] || permissions[project.name] === 'none'}
                        onChange={() => setPermissions({ ...permissions, [project.name]: 'none' })}
                        className="mr-2"
                      />
                      <span className="text-sm">None</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`perm-${project.id}`}
                        checked={permissions[project.name] === 'read'}
                        onChange={() => setPermissions({ ...permissions, [project.name]: 'read' })}
                        className="mr-2"
                      />
                      <span className="text-sm">Read</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`perm-${project.id}`}
                        checked={permissions[project.name] === 'read_write'}
                        onChange={() => setPermissions({ ...permissions, [project.name]: 'read_write' })}
                        className="mr-2"
                      />
                      <span className="text-sm">Read/Write</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createApiKey.isPending}>
                {createApiKey.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
