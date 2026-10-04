import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { LOGO_MODULE } from "../../modules/logo"
import LogoModuleService from "../../modules/logo/service"

export type UpdateLogoInput = {
  id: string
  name?: string
  url?: string
  alt_text?: string | null
  type?: string
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export const updateLogoStep = createStep(
  "update-logo-step",
  async (input: UpdateLogoInput, { container }) => {
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    const previousData = await logoModuleService.retrieveLogo(input.id)

    const { id, ...data } = input
    const updated = await logoModuleService.updateLogos({ id, ...data })

    return new StepResponse(updated, previousData)
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    await logoModuleService.updateLogos(previousData)
  }
)

export const updateLogoWorkflow = createWorkflow(
  "update-logo",
  (input: UpdateLogoInput) => {
    const logo = updateLogoStep(input)
    return new WorkflowResponse(logo)
  }
)
