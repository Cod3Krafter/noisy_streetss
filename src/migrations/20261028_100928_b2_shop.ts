import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_history_from" AS ENUM('awaiting-payment', 'expired', 'paid', 'courier-booked', 'in-transit', 'delivered', 'returned', 'refunded');
  CREATE TYPE "public"."enum_orders_history_to" AS ENUM('awaiting-payment', 'expired', 'paid', 'courier-booked', 'in-transit', 'delivered', 'returned', 'refunded');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('awaiting-payment', 'expired', 'paid', 'courier-booked', 'in-transit', 'delivered', 'returned', 'refunded');
  CREATE TYPE "public"."enum_orders_address_state" AS ENUM('abia', 'adamawa', 'akwa-ibom', 'anambra', 'bauchi', 'bayelsa', 'benue', 'borno', 'cross-river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu', 'fct', 'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara');
  CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('courier', 'flat');
  CREATE TYPE "public"."enum_shop_settings_flat_delivery_prices_states" AS ENUM('abia', 'adamawa', 'akwa-ibom', 'anambra', 'bauchi', 'bayelsa', 'benue', 'borno', 'cross-river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu', 'fct', 'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara');
  CREATE TYPE "public"."enum_shop_settings_pickup_address_state" AS ENUM('abia', 'adamawa', 'akwa-ibom', 'anambra', 'bauchi', 'bayelsa', 'benue', 'borno', 'cross-river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu', 'fct', 'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'shop';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'sendShopEmail' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'expireOrder' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'removeExpiredDetails' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'sendShopEmail' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'expireOrder' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'removeExpiredDetails' BEFORE 'schedulePublish';
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"option_name" varchar,
  	"option_id" varchar,
  	"unit_price_n_g_n" numeric,
  	"quantity" numeric,
  	"weight_grams" numeric
  );
  
  CREATE TABLE "orders_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"from" "enum_orders_history_from",
  	"to" "enum_orders_history_to",
  	"by" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"status" "enum_orders_status" DEFAULT 'awaiting-payment' NOT NULL,
  	"customer_name" varchar,
  	"customer_email" varchar,
  	"customer_phone" varchar,
  	"address_line1" varchar,
  	"address_line2" varchar,
  	"address_city" varchar,
  	"address_state" "enum_orders_address_state",
  	"address_postcode" varchar,
  	"address_country" varchar DEFAULT 'Nigeria',
  	"delivery_method" "enum_orders_delivery_method",
  	"delivery_carrier_name" varchar,
  	"delivery_carrier_slug" varchar,
  	"delivery_estimate" varchar,
  	"delivery_price_n_g_n" numeric,
  	"delivery_flat_area" varchar,
  	"items_n_g_n" numeric,
  	"delivery_n_g_n" numeric,
  	"total_n_g_n" numeric,
  	"paystack_fee_n_g_n" numeric,
  	"charged_n_g_n" numeric,
  	"payment_reference" varchar,
  	"payment_channel" varchar,
  	"payment_paid_at" timestamp(3) with time zone,
  	"payment_paid_late" boolean,
  	"payment_problem" varchar,
  	"payment_last_checked_at" timestamp(3) with time zone,
  	"shipment_carrier_name" varchar,
  	"shipment_tracking_number" varchar,
  	"shipment_tracking_url" varchar,
  	"shipment_label_url" varchar,
  	"shipment_courier_cost_n_g_n" numeric,
  	"shipment_booked_at" timestamp(3) with time zone,
  	"shipment_booked_by" varchar,
  	"shipment_terminal_shipment_id" varchar,
  	"shipment_booking_started_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"details_removed_at" timestamp(3) with time zone,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer,
  	"merch_id" integer
  );
  
  CREATE TABLE "merch_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"in_stock" boolean DEFAULT true
  );
  
  CREATE TABLE "_merch_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"in_stock" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "webhook_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"received_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_settings_flat_delivery_prices_states" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_shop_settings_flat_delivery_prices_states",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "shop_settings" ALTER COLUMN "pickup_address_state" SET DATA TYPE "public"."enum_shop_settings_pickup_address_state" USING "pickup_address_state"::"public"."enum_shop_settings_pickup_address_state";
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "webhook_events_id" integer;
  ALTER TABLE "shop_settings" ADD COLUMN "pickup_address_postcode" varchar;
  ALTER TABLE "shop_settings" ADD COLUMN "elsewhere_price_n_g_n" numeric NOT NULL;
  ALTER TABLE "shop_settings" ADD COLUMN "terminal_packaging_id" varchar DEFAULT 'PA-PT95DUJGH8FRKSO0';
  ALTER TABLE "shop_settings" ADD COLUMN "box_weight_grams" numeric DEFAULT 100;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_history" ADD CONSTRAINT "orders_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_merch_fk" FOREIGN KEY ("merch_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "merch_options" ADD CONSTRAINT "merch_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_merch_v_version_options" ADD CONSTRAINT "_merch_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_merch_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_settings_flat_delivery_prices_states" ADD CONSTRAINT "shop_settings_flat_delivery_prices_states_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_settings_flat_delivery_prices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_history_order_idx" ON "orders_history" USING btree ("_order");
  CREATE INDEX "orders_history_parent_id_idx" ON "orders_history" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE UNIQUE INDEX "orders_payment_payment_reference_idx" ON "orders" USING btree ("payment_reference");
  CREATE INDEX "orders_shipment_shipment_terminal_shipment_id_idx" ON "orders" USING btree ("shipment_terminal_shipment_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX "orders_rels_books_id_idx" ON "orders_rels" USING btree ("books_id");
  CREATE INDEX "orders_rels_merch_id_idx" ON "orders_rels" USING btree ("merch_id");
  CREATE INDEX "merch_options_order_idx" ON "merch_options" USING btree ("_order");
  CREATE INDEX "merch_options_parent_id_idx" ON "merch_options" USING btree ("_parent_id");
  CREATE INDEX "_merch_v_version_options_order_idx" ON "_merch_v_version_options" USING btree ("_order");
  CREATE INDEX "_merch_v_version_options_parent_id_idx" ON "_merch_v_version_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "webhook_events_key_idx" ON "webhook_events" USING btree ("key");
  CREATE INDEX "webhook_events_updated_at_idx" ON "webhook_events" USING btree ("updated_at");
  CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");
  CREATE INDEX "shop_settings_flat_delivery_prices_states_order_idx" ON "shop_settings_flat_delivery_prices_states" USING btree ("order");
  CREATE INDEX "shop_settings_flat_delivery_prices_states_parent_idx" ON "shop_settings_flat_delivery_prices_states" USING btree ("parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_webhook_events_fk" FOREIGN KEY ("webhook_events_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_webhook_events_id_idx" ON "payload_locked_documents_rels" USING btree ("webhook_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "merch_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_merch_v_version_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "webhook_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shop_settings_flat_delivery_prices_states" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_history" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "orders_rels" CASCADE;
  DROP TABLE "merch_options" CASCADE;
  DROP TABLE "_merch_v_version_options" CASCADE;
  DROP TABLE "webhook_events" CASCADE;
  DROP TABLE "shop_settings_flat_delivery_prices_states" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_webhook_events_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_webhook_events_id_idx";
  ALTER TABLE "shop_settings" ALTER COLUMN "pickup_address_state" SET DATA TYPE varchar;
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "webhook_events_id";
  ALTER TABLE "shop_settings" DROP COLUMN "pickup_address_postcode";
  ALTER TABLE "shop_settings" DROP COLUMN "elsewhere_price_n_g_n";
  ALTER TABLE "shop_settings" DROP COLUMN "terminal_packaging_id";
  ALTER TABLE "shop_settings" DROP COLUMN "box_weight_grams";
  DROP TYPE "public"."enum_orders_history_from";
  DROP TYPE "public"."enum_orders_history_to";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_address_state";
  DROP TYPE "public"."enum_orders_delivery_method";
  DROP TYPE "public"."enum_shop_settings_flat_delivery_prices_states";
  DROP TYPE "public"."enum_shop_settings_pickup_address_state";`)
}
