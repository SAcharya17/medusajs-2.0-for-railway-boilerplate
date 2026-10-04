import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { LOGO_MODULE } from "../../../../modules/logo"
import LogoModuleService from "../../../../modules/logo/service"
import { updateLogoWorkflow, deleteLogoWorkflow } from "../../../../workflows/logo"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const logoModuleService: LogoModuleService = req.scope.resolve(LOGO_MODULE)

  const logo = await logoModuleService.retrieveLogo(id)

  if (!logo) {
    return res.status(404).json({ message: `Logo with id: ${id} was not found` })
  }

  res.status(200).json({ logo })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { name, url, alt_text, type, is_active, metadata } = req.body as {
    name?: string
    url?: string
    alt_text?: string
    type?: string
    is_active?: boolean
    metadata?: Record<string, unknown>
  }

  const { result: logo } = await updateLogoWorkflow(req.scope).run({
    input: {
      id,
      name,
      url,
      alt_text,
      type,
      is_active,
      metadata,
    },
  })

  res.status(200).json({ logo })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  await deleteLogoWorkflow(req.scope).run({
    input: {
      id,
    },
  })

  res.status(200).json({
    id,
    object: "logo",
    deleted: true,
  })
}
