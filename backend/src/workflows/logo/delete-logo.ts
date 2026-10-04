import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { LOGO_MODULE } from "../../modules/logo"
import LogoModuleService from "../../modules/logo/service"

export type DeleteLogoInput = {
  id: string
}

export const deleteLogoStep = createStep(
  "delete-logo-step",
  async (input: DeleteLogoInput, { container }) => {
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    const logo = await logoModuleService.retrieveLogo(input.id)

    await logoModuleService.deleteLogos(input.id)

    return new StepResponse({ id: input.id }, logo)
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const logoModuleService: LogoModuleService = container.resolve(LOGO_MODULE)
    await logoModuleService.createLogos(previousData)
  }
)

export const deleteLogoWorkflow = createWorkflow(
  "delete-logo",
  (input: DeleteLogoInput) => {
    const result = deleteLogoStep(input)
    return new WorkflowResponse(result)
  }
)
