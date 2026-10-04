import { MedusaService } from "@medusajs/framework/utils"
import { Logo } from "./models/logo"

class LogoModuleService extends MedusaService({
  Logo,
}) {
  declare createLogos: (data: any, sharedContext?: any) => Promise<any>
  declare updateLogos: (data: any, sharedContext?: any) => Promise<any>
  declare deleteLogos: (idOrSelector: any, sharedContext?: any) => Promise<any>
  declare listLogos: (filters?: any, config?: any, sharedContext?: any) => Promise<any[]>
  declare listAndCountLogos: (filters?: any, config?: any, sharedContext?: any) => Promise<[any[], number]>
  declare retrieveLogo: (id: string, config?: any, sharedContext?: any) => Promise<any>
}

export default LogoModuleService
