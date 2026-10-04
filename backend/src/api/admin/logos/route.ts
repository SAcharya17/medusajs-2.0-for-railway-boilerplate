import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { LOGO_MODULE } from "../../../modules/logo"
import LogoModuleService from "../../../modules/logo/service"
import { createLogoWorkflow } from "../../../workflows/logo"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logoModuleService: LogoModuleService = req.scope.resolve(LOGO_MODULE)

  const [logos, count] = await logoModuleService.listAndCountLogos(
    {},
    {
      order: { created_at: "DESC" },
    }
  )

  res.status(200).json({
    logos,
    count,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { name, url, alt_text, type, is_active, metadata } = req.body as {
    name: string
    url: string
    alt_text?: string
    type?: string
    is_active?: boolean
    metadata?: Record<string, unknown>
  }

  if (!name || !url) {
    return res.status(400).json({
      message: "Both 'name' and 'url' are required to create a logo.",
    })
  }

  const { result: logo } = await createLogoWorkflow(req.scope).run({
    input: {
      name,
      url,
      alt_text: alt_text || null,
      type: type || "primary",
      is_active: is_active !== undefined ? is_active : true,
      metadata: metadata || null,
    },
  })

  res.status(201).json({ logo })
}
