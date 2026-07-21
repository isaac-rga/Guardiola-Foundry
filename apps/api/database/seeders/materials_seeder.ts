import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'

export default class extends BaseSeeder {
  async run() {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  }
}
