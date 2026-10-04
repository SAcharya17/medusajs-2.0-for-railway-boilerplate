import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { LOGO_MODULE } from "../../../modules/logo"
import LogoModuleService from "../../../modules/logo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logoModuleService: LogoModuleService = req.scope.resolve(LOGO_MODULE)

  const { type } = req.query as { type?: string }

  const filters: Record<string, unknown> = {
    is_active: true,
  }

  if (type) {
    filters.type = type
  }

  const logos = await logoModuleService.listLogos(filters, {
    order: { created_at: "DESC" },
  })

  res.status(200).json({
    logos,
  })
}
