import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE material_sources
        ALTER COLUMN legacy_source_id DROP NOT NULL;

      WITH ranked_sources AS (
        SELECT id, row_number() OVER (ORDER BY id) AS sequence_number
        FROM material_sources
      )
      UPDATE material_sources AS source
      SET public_id = 'S-' || lpad(ranked_sources.sequence_number::text, 4, '0')
      FROM ranked_sources
      WHERE source.id = ranked_sources.id;

      CREATE SEQUENCE material_source_public_id_seq;

      SELECT setval(
        'material_source_public_id_seq',
        COALESCE(MAX(substring(public_id FROM 3)::bigint), 1),
        COUNT(*) > 0
      )
      FROM material_sources;

      ALTER TABLE material_sources
        ALTER COLUMN public_id SET DEFAULT (
          'S-' || lpad(nextval('material_source_public_id_seq')::text, 4, '0')
        );

      CREATE UNIQUE INDEX material_source_links_one_preferred_per_material
        ON material_source_links (material_id)
        WHERE is_preferred = true;

      CREATE FUNCTION protect_material_source_identity()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.public_id IS DISTINCT FROM OLD.public_id
          OR (
            OLD.legacy_source_id IS NOT NULL
            AND NEW.legacy_source_id IS DISTINCT FROM OLD.legacy_source_id
          ) THEN
          RAISE EXCEPTION 'Source identity fields are immutable';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER material_sources_protect_identity
        BEFORE UPDATE ON material_sources
        FOR EACH ROW
        EXECUTE FUNCTION protect_material_source_identity();
    `)
  }

  async down() {
    this.schema.raw(`
      DROP TRIGGER material_sources_protect_identity ON material_sources;
      DROP FUNCTION protect_material_source_identity();
      DROP INDEX material_source_links_one_preferred_per_material;

      ALTER TABLE material_sources
        ALTER COLUMN public_id DROP DEFAULT;

      DROP SEQUENCE material_source_public_id_seq;

      UPDATE material_sources
      SET public_id = 'MS-' || substring(public_id FROM 3)
      WHERE public_id LIKE 'S-%';
    `)
  }
}
