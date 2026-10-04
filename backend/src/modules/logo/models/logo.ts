import { model } from "@medusajs/framework/utils"

export const Logo = model.define("logo", {
  id: model.id({ prefix: "logo" }).primaryKey(),
  name: model.text().searchable(),
  url: model.text(),
  alt_text: model.text().nullable(),
  type: model.text().default("primary"),
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),
})
