import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { LOGO_MODULE } from "../../modules/logo"
import LogoModuleService from "../../modules/logo/service"

export type CreateLogoInput = {
  name: string
  url: string
  alt_text?: string | null
  type?: string
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export const createLogoStep = createStep(
  "create-logo-step",
  async (input: CreateLogoInput, { container }) => {
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    const logo = await logoModuleService.createLogos(input)
    return new StepResponse(logo, logo.id)
  },
  async (id: string, { container }) => {
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    await logoModuleService.deleteLogos(id)
  }
)

export const createLogoWorkflow = createWorkflow(
  "create-logo",
  (input: CreateLogoInput) => {
    const logo = createLogoStep(input)
    return new WorkflowResponse(logo)
  }
)
