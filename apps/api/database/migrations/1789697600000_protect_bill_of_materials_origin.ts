import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      ADD CONSTRAINT bills_of_materials_origin_not_self_check
      CHECK (origin_bill_of_materials_id IS NULL OR origin_bill_of_materials_id <> id)
    `)
    this.schema.raw(`
      CREATE FUNCTION protect_bill_of_materials_origin()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.origin_bill_of_materials_id IS DISTINCT FROM OLD.origin_bill_of_materials_id THEN
          RAISE EXCEPTION 'A Bill of Materials origin is immutable';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(`
      CREATE TRIGGER bills_of_materials_protect_origin
      BEFORE UPDATE OF origin_bill_of_materials_id ON bills_of_materials
      FOR EACH ROW EXECUTE FUNCTION protect_bill_of_materials_origin()
    `)
  }

  async down() {
    this.schema.raw('DROP TRIGGER bills_of_materials_protect_origin ON bills_of_materials')
    this.schema.raw('DROP FUNCTION protect_bill_of_materials_origin()')
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      DROP CONSTRAINT bills_of_materials_origin_not_self_check
    `)
  }
}
