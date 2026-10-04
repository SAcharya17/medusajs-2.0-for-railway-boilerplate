import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  BuildingStorefront,
  PencilSquare,
  Trash,
  PlusMini,
  ArrowPath,
  Check,
  Photo,
  ArrowDownTray,
  XMark,
  ArrowUpTray,
  Link,
} from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  StatusBadge,
  Table,
  Drawer,
  Switch,
  Select,
  toast,
  usePrompt,
  Badge,
  IconButton,
  Copy,
  clx,
  Tabs,
} from "@medusajs/ui"
import { useState, useEffect, useCallback, useRef, DragEvent, ChangeEvent } from "react"

type LogoItem = {
  id: string
  name: string
  url: string
  alt_text?: string | null
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type LogoFormData = {
  name: string
  url: string
  alt_text: string
  type: string
  is_active: boolean
}

const DEFAULT_FORM: LogoFormData = {
  name: "",
  url: "",
  alt_text: "",
  type: "primary",
  is_active: true,
}

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]

const StorefrontLogoPage = () => {
  const [logos, setLogos] = useState<LogoItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadTab, setUploadTab] = useState<string>("upload")
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [editingLogo, setEditingLogo] = useState<LogoItem | null>(null)
  const [formData, setFormData] = useState<LogoFormData>(DEFAULT_FORM)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const prompt = usePrompt()

  const fetchLogos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/admin/logos", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch logos")
      }

      const data = await response.json()
      setLogos(data.logos || [])
    } catch (err: any) {
      toast.error("Error loading logos", {
        description: err.message || "An unexpected error occurred while fetching logos.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogos()
  }, [fetchLogos])

  const handleOpenCreate = () => {
    setEditingLogo(null)
    setFormData(DEFAULT_FORM)
    setUploadTab("upload")
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (logo: LogoItem) => {
    setEditingLogo(logo)
    setFormData({
      name: logo.name,
      url: logo.url,
      alt_text: logo.alt_text || "",
      type: logo.type || "primary",
      is_active: logo.is_active,
    })
    setUploadTab("upload")
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setEditingLogo(null)
    setFormData(DEFAULT_FORM)
    setIsUploading(false)
    setIsDragOver(false)
  }

  const handleUploadFile = async (file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error("Invalid file format", {
        description: "Please upload a valid image file (PNG, JPG, SVG, WebP, GIF).",
      })
      return
    }

    // 10MB max
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Image size must be 10MB or less.",
      })
      return
    }

    setIsUploading(true)
    try {
      const body = new FormData()
      body.append("files", file)

      const response = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to upload file")
      }

      const data = await response.json()
      if (data.files && data.files.length > 0) {
        const uploadedUrl = data.files[0].url
        setFormData((prev) => ({
          ...prev,
          url: uploadedUrl,
          name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
        }))
        toast.success("Image uploaded successfully")
      }
    } catch (err: any) {
      toast.error("Upload error", {
        description: err.message || "An error occurred while uploading the file.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadFile(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUploadFile(file)
    }
  }

  const handleToggleActive = async (logo: LogoItem) => {
    try {
      const response = await fetch(`/admin/logos/${logo.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          is_active: !logo.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast.success("Logo status updated", {
        description: `Logo is now ${!logo.is_active ? "active" : "inactive"}.`,
      })
      fetchLogos()
    } catch (err: any) {
      toast.error("Update failed", {
        description: err.message || "Failed to toggle active status.",
      })
    }
  }

  const handleDelete = async (logo: LogoItem) => {
    const confirmed = await prompt({
      title: "Delete Logo",
      description: `Are you sure you want to delete "${logo.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/admin/logos/${logo.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete logo")
      }

      toast.success("Logo deleted", {
        description: `"${logo.name}" was successfully removed.`,
      })
      fetchLogos()
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err.message || "Could not delete logo.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Validation Error", { description: "Logo name is required." })
      return
    }
    if (!formData.url.trim()) {
      toast.error("Validation Error", { description: "Please select or enter an image URL." })
      return
    }

    setIsSubmitting(true)
    try {
      const endpoint = editingLogo ? `/admin/logos/${editingLogo.id}` : "/admin/logos"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          url: formData.url.trim(),
          alt_text: formData.alt_text.trim() || null,
          type: formData.type,
          is_active: formData.is_active,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to save logo")
      }

      toast.success(editingLogo ? "Logo updated" : "Logo created", {
        description: `"${formData.name}" has been successfully ${editingLogo ? "updated" : "created"}.`,
      })

      handleCloseDrawer()
      fetchLogos()
    } catch (err: any) {
      toast.error("Error saving logo", {
        description: err.message || "An unexpected error occurred while saving.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const activePrimaryLogo = logos.find((l) => l.is_active && l.type === "primary") || logos.find((l) => l.is_active)

  return (
    <div className="flex flex-col gap-y-4 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-semibold text-ui-fg-base">
            Storefront Logo
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage your storefront logos, brand icons, and favicons.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button variant="secondary" size="small" onClick={fetchLogos} disabled={isLoading}>
            <ArrowPath className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button variant="primary" size="small" onClick={handleOpenCreate}>
            <PlusMini />
            Add Logo
          </Button>
        </div>
      </div>

      {/* Active Logo Hero Preview */}
      {activePrimaryLogo && (
        <Container className="p-6 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-x-5">
              <div className="h-16 w-32 bg-ui-bg-base border border-ui-border-base rounded-md flex items-center justify-center p-2 overflow-hidden shadow-xs">
                <img
                  src={activePrimaryLogo.url}
                  alt={activePrimaryLogo.alt_text || activePrimaryLogo.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-x-2">
                  <Heading level="h3" className="text-base font-medium text-ui-fg-base">
                    {activePrimaryLogo.name}
                  </Heading>
                  <StatusBadge color="green">Active Primary Logo</StatusBadge>
                  <Badge size="small" color="blue">
                    {activePrimaryLogo.type}
                  </Badge>
                </div>
                <Text className="text-ui-fg-muted text-xs mt-1">
                  Alt text: {activePrimaryLogo.alt_text || "None"} • URL: {activePrimaryLogo.url}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <Button size="small" variant="secondary" onClick={() => handleOpenEdit(activePrimaryLogo)}>
                <PencilSquare />
                Edit
              </Button>
            </div>
          </div>
        </Container>
      )}

      {/* Logos List Table */}
      <Container className="p-0 overflow-hidden border border-ui-border-base rounded-lg">
        <div className="p-4 border-b border-ui-border-base flex items-center justify-between">
          <div>
            <Heading level="h2" className="text-base font-semibold">
              All Logos ({logos.length})
            </Heading>
            <Text className="text-ui-fg-subtle text-xs">
              View and configure all configured logo assets.
            </Text>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-ui-fg-muted flex flex-col items-center justify-center gap-2">
            <ArrowPath className="animate-spin h-6 w-6 text-ui-fg-subtle" />
            <Text>Loading logos...</Text>
          </div>
        ) : logos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-ui-bg-subtle flex items-center justify-center text-ui-fg-muted mb-3">
              <Photo />
            </div>
            <Heading level="h3" className="text-base font-medium">
              No logos added yet
            </Heading>
            <Text className="text-ui-fg-subtle text-sm max-w-sm mt-1 mb-4">
              Add your first storefront logo to brand your online store header, footer, or emails.
            </Text>
            <Button size="small" variant="primary" onClick={handleOpenCreate}>
              <PlusMini />
              Add Logo
            </Button>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-24">Preview</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Image URL</Table.HeaderCell>
                <Table.HeaderCell>Alt Text</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logos.map((logo) => (
                <Table.Row key={logo.id} className="hover:bg-ui-bg-subtle/50 transition-colors">
                  <Table.Cell>
                    <div className="h-10 w-20 bg-ui-bg-subtle border border-ui-border-base rounded flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={logo.url}
                        alt={logo.alt_text || logo.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-ui-fg-base text-sm">{logo.name}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={logo.type === "primary" ? "blue" : "grey"}>
                      {logo.type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-x-1 max-w-[200px]">
                      <span className="text-ui-fg-subtle text-xs truncate" title={logo.url}>
                        {logo.url}
                      </span>
                      <Copy content={logo.url} className="text-ui-fg-muted hover:text-ui-fg-base" />
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-ui-fg-subtle text-xs">
                      {logo.alt_text || <span className="italic text-ui-fg-muted">None</span>}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(logo)}
                      className="cursor-pointer focus:outline-none"
                      title="Click to toggle status"
                    >
                      <StatusBadge color={logo.is_active ? "green" : "grey"}>
                        {logo.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </button>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-x-2">
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => handleOpenEdit(logo)}
                        title="Edit Logo"
                      >
                        <PencilSquare />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        className="text-ui-fg-error hover:bg-ui-bg-error-subtle"
                        onClick={() => handleDelete(logo)}
                        title="Delete Logo"
                      >
                        <Trash />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      {/* Create / Edit Drawer Form */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content className="max-w-lg">
          <Drawer.Header>
            <Drawer.Title>{editingLogo ? "Edit Logo" : "Create Storefront Logo"}</Drawer.Title>
            <Drawer.Description>
              {editingLogo
                ? "Update your logo configuration and appearance."
                : "Add a new logo to be used across your storefront."}
            </Drawer.Description>
          </Drawer.Header>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <Drawer.Body className="flex flex-col gap-y-5 p-6 overflow-y-auto">
              {/* Name Field */}
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="logo-name" className="text-xs font-medium">
                  Logo Name <span className="text-ui-fg-error">*</span>
                </Label>
                <Input
                  id="logo-name"
                  placeholder="e.g. Main Header Logo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Type Field */}
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="logo-type" className="text-xs font-medium">
                  Logo Type / Placement
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val })}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select type" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="primary">Primary (Header)</Select.Item>
                    <Select.Item value="secondary">Secondary</Select.Item>
                    <Select.Item value="footer">Footer</Select.Item>
                    <Select.Item value="favicon">Favicon / Icon</Select.Item>
                    <Select.Item value="dark_mode">Dark Mode Logo</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              {/* Image Selection / Upload Section */}
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Logo Image <span className="text-ui-fg-error">*</span>
                  </Label>
                  <div className="flex items-center gap-x-1">
                    <button
                      type="button"
                      onClick={() => setUploadTab("upload")}
                      className={clx(
                        "text-xs px-2 py-1 rounded transition-colors",
                        uploadTab === "upload"
                          ? "bg-ui-bg-base text-ui-fg-base font-medium shadow-xs border border-ui-border-base"
                          : "text-ui-fg-muted hover:text-ui-fg-base"
                      )}
                    >
                      <span className="flex items-center gap-x-1">
                        <ArrowUpTray />
                        Upload File
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTab("url")}
                      className={clx(
                        "text-xs px-2 py-1 rounded transition-colors",
                        uploadTab === "url"
                          ? "bg-ui-bg-base text-ui-fg-base font-medium shadow-xs border border-ui-border-base"
                          : "text-ui-fg-muted hover:text-ui-fg-base"
                      )}
                    >
                      <span className="flex items-center gap-x-1">
                        <Link />
                        Direct URL
                      </span>
                    </button>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {uploadTab === "upload" ? (
                  <div className="flex flex-col gap-y-3">
                    {formData.url ? (
                      /* Selected / Uploaded Image Preview Box */
                      <div className="relative border border-ui-border-base rounded-lg bg-ui-bg-subtle p-4 flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-x-4 overflow-hidden">
                          <div className="h-16 w-24 rounded border border-ui-border-base bg-ui-bg-base flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                            <img
                              src={formData.url}
                              alt={formData.alt_text || "Uploaded Logo"}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = "none"
                              }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Text size="small" weight="plus" className="text-ui-fg-base truncate">
                              {formData.name || "Selected Logo"}
                            </Text>
                            <Text size="xsmall" className="text-ui-fg-muted truncate max-w-[200px]" title={formData.url}>
                              {formData.url}
                            </Text>
                            <StatusBadge color="green" className="mt-1 w-fit">
                              Ready
                            </StatusBadge>
                          </div>
                        </div>

                        <div className="flex items-center gap-x-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            Replace
                          </Button>
                          <IconButton
                            type="button"
                            variant="transparent"
                            size="small"
                            className="text-ui-fg-muted hover:text-ui-fg-error"
                            onClick={() => setFormData({ ...formData, url: "" })}
                            title="Remove Image"
                          >
                            <Trash />
                          </IconButton>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone like Product Images */
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={clx(
                          "cursor-pointer transition-colors group relative flex flex-col items-center justify-center gap-y-2 rounded-lg border-2 border-dashed p-6 text-center",
                          isDragOver
                            ? "bg-ui-bg-subtle-hover border-ui-border-interactive"
                            : "bg-ui-bg-subtle border-ui-border-strong hover:bg-ui-bg-subtle-hover hover:border-ui-border-interactive"
                        )}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-y-2 py-4">
                            <ArrowPath className="h-7 w-7 animate-spin text-ui-fg-interactive" />
                            <Text size="small" weight="plus" className="text-ui-fg-base">
                              Uploading logo...
                            </Text>
                          </div>
                        ) : (
                          <>
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ui-bg-base border border-ui-border-base shadow-xs text-ui-fg-subtle group-hover:text-ui-fg-interactive transition-colors">
                              <ArrowDownTray />
                            </div>
                            <div className="flex flex-col items-center gap-y-1">
                              <Text size="small" weight="plus" className="text-ui-fg-base">
                                Drop your logo image here, or{" "}
                                <span className="text-ui-fg-interactive underline decoration-ui-fg-interactive">
                                  click to browse
                                </span>
                              </Text>
                              <Text size="xsmall" className="text-ui-fg-muted">
                                Supports PNG, JPG, SVG, WebP, GIF (max 10MB)
                              </Text>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Direct URL Input */
                  <div className="flex flex-col gap-y-2">
                    <Input
                      id="logo-url"
                      placeholder="https://example.com/logo.png or /static/logo.png"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                    />
                    {formData.url && (
                      <div className="h-24 w-full bg-ui-bg-subtle border border-dashed border-ui-border-base rounded-md flex items-center justify-center p-3 overflow-hidden">
                        <img
                          src={formData.url}
                          alt={formData.alt_text || "Preview"}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alt Text Field */}
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="logo-alt" className="text-xs font-medium">
                  Alt Text (Accessibility & SEO)
                </Label>
                <Input
                  id="logo-alt"
                  placeholder="e.g. Brand Store Official Logo"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-ui-border-base">
                <div>
                  <Label htmlFor="logo-active" className="text-xs font-medium">
                    Active Status
                  </Label>
                  <Text className="text-ui-fg-muted text-xs">
                    Enable to display this logo on the storefront.
                  </Text>
                </div>
                <Switch
                  id="logo-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </Drawer.Body>

            <Drawer.Footer className="flex items-center justify-end gap-x-2 border-t border-ui-border-base p-4">
              <Button type="button" variant="secondary" size="small" onClick={handleCloseDrawer} disabled={isSubmitting || isUploading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="small" isLoading={isSubmitting} disabled={isUploading || !formData.url}>
                <Check />
                {editingLogo ? "Save Changes" : "Create Logo"}
              </Button>
            </Drawer.Footer>
          </form>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Storefront - Logo",
  icon: BuildingStorefront,
  rank: 10,
})

export default StorefrontLogoPage
