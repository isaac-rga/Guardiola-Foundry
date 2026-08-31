import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { SOURCE_CATALOG_IMPORT_FIXTURE } from '#database/fixtures/source_catalog_import_fixture'
import { importSourceCatalogFromRows } from '#modules/sources/source_catalog_importer'

export default class ImportSourceCatalog extends BaseCommand {
  static commandName = 'source:import-catalog'
  static description = 'Import and report the approved workbook Source catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const result = await importSourceCatalogFromRows(SOURCE_CATALOG_IMPORT_FIXTURE)

    this.logger.log(JSON.stringify(result, null, 2))

    if (!result.successful) {
      this.exitCode = 1
      this.logger.error(
        `Source catalog import completed with ${result.exclusions.length} exclusions`
      )
    }
  }
}
